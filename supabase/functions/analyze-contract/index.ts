import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { searchLegalContext } from '../_shared/rag.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'claude-opus-4-6';

const BASE_SYSTEM_PROMPT = `Analise o contrato e retorne SOMENTE JSON válido, sem texto extra:
{"risk_level":"high"|"medium"|"low","summary":"2 frases diretas","clauses":[{"id":"slug-curto","risk":"high"|"medium"|"low","title":"até 6 palavras","explanation":"(1) O QUE É: 1 frase. (2) IMPACTO: 1-2 frases. (3) ATENÇÃO: 1 frase.","affects_both_parties":true,"severity_note":"só para high, 1 frase"}],"recommendations":["até 10 palavras"]}
REGRAS: CC/2002 como base. Omita cláusulas triviais. Máx 8 cláusulas. Linguagem neutra. high=ilegal/abusiva, medium=atenção, low=normal.`;

function buildSystemPrompt(legalContext: string): string {
  if (!legalContext) return BASE_SYSTEM_PROMPT;
  return `${BASE_SYSTEM_PROMPT}

LEGISLAÇÃO RELEVANTE RECUPERADA (use como referência na análise):
${legalContext}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { mode, payload } = await req.json();

    let messages: object[];
    if (mode === 'text') {
      messages = [{ role: 'user', content: `Contrato:\n\n${payload}` }];
    } else if (mode === 'images') {
      const imgs = payload as string[];
      messages = [{
        role: 'user',
        content: [
          ...imgs.map((data: string) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } })),
          { type: 'text', text: imgs.length > 1 ? `Contrato com ${imgs.length} páginas.` : 'Contrato.' },
        ],
      }];
    } else if (mode === 'pdf') {
      messages = [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: payload } },
          { type: 'text', text: 'Contrato.' },
        ],
      }];
    } else {
      return new Response(JSON.stringify({ error: 'Modo inválido' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada');

    // Busca contexto legal relevante via RAG (falha silenciosa)
    const queryText = mode === 'text' ? (payload as string) : 'análise de contrato';
    const legalContext = await searchLegalContext(supabase, queryText);
    const systemPrompt = buildSystemPrompt(legalContext);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 140_000); // 140s

    let res: Response;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: MODEL, max_tokens: 2500, system: systemPrompt, messages }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }

    const json = await res.json();
    const text = json.content?.[0]?.text;
    if (!text) throw new Error('Resposta vazia da IA.');

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let report;
    try {
      report = JSON.parse(cleaned);
    } catch (e: any) {
      console.error('JSON parse error:', e.message, '| texto:', text.substring(0, 200));
      throw new Error(`Resposta inválida da IA: ${e.message}`);
    }

    return new Response(JSON.stringify({ report }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('analyze-contract error:', err);
    return new Response(JSON.stringify({ error: err.message ?? 'Erro interno' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
