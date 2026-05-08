import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `Analise o contrato e retorne SOMENTE JSON válido, sem texto extra:
{"risk_level":"high"|"medium"|"low","summary":"2 frases diretas","clauses":[{"id":"slug-curto","risk":"high"|"medium"|"low","title":"até 6 palavras","explanation":"(1) O QUE É: 1 frase. (2) IMPACTO: 1-2 frases. (3) ATENÇÃO: 1 frase.","affects_both_parties":true,"severity_note":"só para high, 1 frase"}],"recommendations":["até 10 palavras"]}
REGRAS: CC/2002 como base. Omita cláusulas triviais. Máx 8 cláusulas. Linguagem neutra. high=ilegal/abusiva, medium=atenção, low=normal.`;

const PROGRESS_MILESTONES = [
  { chars: 50,   pct: 40, step: 'Identificando cláusulas…'    },
  { chars: 200,  pct: 58, step: 'Avaliando riscos jurídicos…'  },
  { chars: 600,  pct: 74, step: 'Verificando base legal…'      },
  { chars: 1100, pct: 87, step: 'Preparando o relatório…'      },
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
    messages = [{ role: 'user', content: `Contrato:\n\n${payload}` }];
  } else if (mode === 'images') {
    const imgs = payload as string[];
    messages = [{
      role: 'user',
      content: [
        ...imgs.map((data) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } })),
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

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const send = (data: object) => writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

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
          max_tokens: 2500,
          system: SYSTEM_PROMPT,
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
      const decoder = new TextDecoder();
      let fullText = '';
      let charCount = 0;
      let lastPct = 25;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            const event = JSON.parse(raw);
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              fullText += event.delta.text;
              charCount += event.delta.text.length;

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
      } catch (e: any) {
        throw new Error(`Resposta inválida da IA: ${e.message}`);
      }

      await send({ type: 'result', report });
    } catch (err: any) {
      console.error('analyze-contract error:', err);
      await send({ type: 'error', message: err.message ?? 'Erro interno' });
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
});
