import Anthropic from '@anthropic-ai/sdk';
import { ANALYSIS_SYSTEM_PROMPT, chatSystemPrompt } from '../constants/prompts';
import { Report, Message } from '../types';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
  dangerouslyAllowBrowser: true,
});

export async function analyzeContractText(text: string): Promise<Report> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Analise este contrato:\n\n${text}` }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Resposta inesperada da IA');

  const cleaned = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as Report;
}

export async function analyzeContractImage(base64Image: string): Promise<Report> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
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

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Resposta inesperada da IA');

  const cleaned = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as Report;
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

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: chatSystemPrompt(contractText),
    messages,
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Resposta inesperada da IA');
  return content.text;
}
