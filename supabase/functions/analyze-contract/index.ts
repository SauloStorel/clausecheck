import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'claude-sonnet-4-6';

const ANALYSIS_SYSTEM_PROMPT = `Você é um assistente jurídico brasileiro especializado em análise de contratos.
Analise o contrato fornecido e retorne APENAS um JSON válido, sem texto adicional, com a seguinte estrutura:
{
  "risk_level": "high" | "medium" | "low",
  "summary": "resumo em 2-3 frases em linguagem simples sobre os pontos principais",
  "clauses": [
    {
      "id": "identificação da cláusula",
      "risk": "high" | "medium" | "low",
      "title": "título curto do ponto importante",
      "explanation": "Explicação em 3 partes: (1) O QUE É (2) IMPACTO (3) ATENÇÃO",
      "affects_both_parties": true,
      "severity_note": "(opcional, apenas para high)"
    }
  ],
  "recommendations": ["sugestão 1", "sugestão 2"]
}
NEUTRALIDADE: Explique de forma que qualquer parte entenda. Não assuma que o usuário é a parte forte.
BASE LEGAL: Use o Código Civil de 2002 (CC/2002) como referência primária.
CLASSIFICAÇÃO: high = ilegal/abusiva, medium = merece atenção, low = normal e equilibrada.`;

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
      messages = [{ role: 'user', content: `Analise este contrato:\n\n${payload}` }];
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
          { type: 'text', text: count > 1 ? `Analise este contrato. São ${count} páginas fornecidas em ordem.` : 'Analise este contrato.' },
        ],
      }];
    } else if (mode === 'pdf') {
      messages = [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: payload } },
          { type: 'text', text: 'Analise este contrato.' },
        ],
      }];
    } else {
      return new Response(JSON.stringify({ error: 'Modo inválido' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const responseText = await callAnthropic({
      model: MODEL,
      max_tokens: 4096,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages,
    });

    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const report = JSON.parse(cleaned);

    return new Response(JSON.stringify({ report }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'Erro interno' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
