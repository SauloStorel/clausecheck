import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'claude-haiku-4-5-20251001';

// Prompt enxuto: menos tokens de instrução = mais velocidade + menos custo
const SYSTEM_PROMPT = `Analise o contrato e retorne SOMENTE JSON válido, sem texto extra:
{"risk_level":"high"|"medium"|"low","summary":"2 frases diretas","clauses":[{"id":"slug-curto","risk":"high"|"medium"|"low","title":"até 6 palavras","explanation":"(1) O QUE É: 1 frase. (2) IMPACTO: 1-2 frases. (3) ATENÇÃO: 1 frase.","affects_both_parties":true,"severity_note":"só para high, 1 frase"}],"recommendations":["até 10 palavras"]}
REGRAS: CC/2002 como base. Omita cláusulas triviais. Máx 8 cláusulas. Linguagem neutra. high=ilegal/abusiva, medium=atenção, low=normal.`;

async function callAnthropic(body: object): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.content?.[0];
  if (content?.type !== 'text') throw new Error('Resposta inesperada da IA');
  return content.text;
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
      const imageContent = (payload as string[]).map((data: string) => ({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data },
      }));
      const count = (payload as string[]).length;
      messages = [{
        role: 'user',
        content: [
          ...imageContent,
          { type: 'text', text: count > 1 ? `Contrato com ${count} páginas.` : 'Contrato.' },
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

    const responseText = await callAnthropic({
      model: MODEL,
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages,
    });

    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let report;
    try {
      report = JSON.parse(cleaned);
    } catch (parseErr: any) {
      console.error('JSON parse error:', parseErr.message, '| texto:', responseText.substring(0, 300));
      throw new Error(`Resposta inválida da IA: ${parseErr.message}`);
    }

    return new Response(JSON.stringify({ report }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error in analyze-contract:', err);
    return new Response(JSON.stringify({ error: err.message ?? 'Erro interno' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
