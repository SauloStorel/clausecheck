import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'claude-haiku-4-5-20251001';

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

// Milestones de progresso baseados em caracteres recebidos da IA
const PROGRESS_MILESTONES = [
  { chars: 50,   pct: 40, step: 'Identificando cláusulas…' },
  { chars: 200,  pct: 55, step: 'Avaliando riscos jurídicos…' },
  { chars: 600,  pct: 70, step: 'Verificando base legal…' },
  { chars: 1200, pct: 85, step: 'Preparando o relatório…' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

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

  let mode: string, payload: unknown;
  try {
    ({ mode, payload } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: 'Payload inválido' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

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

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const send = async (data: object) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // Processar em background e fazer stream para o cliente
  (async () => {
    try {
      await send({ type: 'progress', pct: 15, step: 'Lendo o contrato…' });

      const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada');

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 8192,
          system: ANALYSIS_SYSTEM_PROMPT,
          messages,
          stream: true,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic API error ${res.status}: ${err}`);
      }

      await send({ type: 'progress', pct: 25, step: 'Identificando cláusulas…' });

      const reader = res.body!.getReader();
      const textDecoder = new TextDecoder();
      let fullText = '';
      let charCount = 0;
      let lastPct = 25;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = textDecoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            const event = JSON.parse(raw);
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              fullText += event.delta.text;
              charCount += event.delta.text.length;

              // Emitir progresso apenas quando cruzar um milestone
              for (const m of PROGRESS_MILESTONES) {
                if (charCount >= m.chars && lastPct < m.pct) {
                  lastPct = m.pct;
                  await send({ type: 'progress', pct: m.pct, step: m.step });
                  break;
                }
              }
            }
          } catch { /* ignorar eventos inválidos */ }
        }
      }

      await send({ type: 'progress', pct: 93, step: 'Preparando o relatório…' });

      const cleaned = fullText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let report;
      try {
        report = JSON.parse(cleaned);
      } catch (parseErr: any) {
        console.error('JSON parse error:', parseErr.message, '| texto:', fullText.substring(0, 300));
        throw new Error(`Resposta inválida da IA: ${parseErr.message}`);
      }

      await send({ type: 'result', report });
    } catch (err: any) {
      console.error('Error in analyze-contract:', err);
      await send({ type: 'error', message: err.message ?? 'Erro interno' });
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      ...CORS,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
});
