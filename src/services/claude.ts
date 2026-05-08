import { ANALYSIS_SYSTEM_PROMPT, chatSystemPrompt } from '../constants/prompts';
import { Report, Message } from '../types';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

async function callClaude(body: object): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro na API Anthropic: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.content?.[0];
  if (content?.type !== 'text') throw new Error('Resposta inesperada da IA');
  return content.text;
}

export async function analyzeContractText(text: string): Promise<Report> {
  const responseText = await callClaude({
    model: MODEL,
    max_tokens: 4096,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Analise este contrato:\n\n${text}` }],
  });

  const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as Report;
}

export async function analyzeContractImage(base64Image: string): Promise<Report> {
  const responseText = await callClaude({
    model: MODEL,
    max_tokens: 4096,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
        },
        { type: 'text', text: 'Analise este contrato.' },
      ],
    }],
  });

  const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as Report;
}

export async function analyzeContractPDF(base64: string): Promise<Report> {
  try {
    console.log('Enviando PDF para análise...', { base64Length: base64.length });

    const responseText = await callClaude({
      model: MODEL,
      max_tokens: 4096,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          },
          { type: 'text', text: 'Analise este contrato.' },
        ],
      }],
    });

    console.log('Resposta da API (primeiros 200 chars):', responseText.substring(0, 200));

    if (!responseText || responseText.trim().length === 0) {
      throw new Error('API retornou resposta vazia');
    }

    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    console.log('JSON após limpeza (primeiros 200 chars):', cleaned.substring(0, 200));

    return JSON.parse(cleaned) as Report;
  } catch (err: any) {
    console.error('Erro ao analisar PDF:', err);
    throw err;
  }
}

export async function sendChatMessage(
  contractText: string,
  history: Message[],
  userMessage: string,
): Promise<string> {
  const messages = [
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];

  return callClaude({
    model: MODEL,
    max_tokens: 1024,
    system: chatSystemPrompt(contractText),
    messages,
  });
}
