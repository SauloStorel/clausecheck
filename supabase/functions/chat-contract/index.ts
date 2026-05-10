import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { searchLegalContext } from '../_shared/rag.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'claude-opus-4-6';

function chatSystemPrompt(contractText: string, legalContext: string): string {
  const contextBlock = legalContext
    ? `\nLEGISLAÇÃO RELEVANTE RECUPERADA (use para fundamentar sua resposta):\n${legalContext}\n`
    : '';
  return `Você é um advogado acessível e empático que ajuda pessoas comuns a entender seus contratos.
Você está analisando o seguinte contrato:
---
${contractText}
---${contextBlock}
NEUTRALIDADE: Não assuma o papel do usuário no contrato. Explique como a cláusula afeta diferentes partes.
BASE LEGAL: Fundamente-se no Código Civil de 2002 (CC/2002). Cite artigos específicos quando relevante.
LIMITE: Até 5 parágrafos. Linguagem simples, nunca jargão incompreensível.
AVISOS: Se a questão for delicada: "⚠️ Recomenda-se consultar um advogado para proteger seus direitos."`;
}

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

    const { contractText, history, userMessage } = await req.json();

    // Busca contexto legal baseado na pergunta do usuário (falha silenciosa)
    const legalContext = await searchLegalContext(supabase, userMessage);

    const messages = [
      ...(history ?? []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const reply = await callAnthropic({
      model: MODEL,
      max_tokens: 8000,
      system: chatSystemPrompt(contractText ?? '', legalContext),
      messages,
    });

    return new Response(JSON.stringify({ reply }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'Erro interno' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
