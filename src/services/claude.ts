import { supabase } from './supabase';
import { Report, Message } from '../types';

function parseAndValidateReport(text: string): Report {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('A IA retornou um formato inválido. Tente novamente.');
  }

  const r = parsed as Record<string, unknown>;

  if (!r || typeof r !== 'object') throw new Error('Resposta da IA inválida.');
  if (!['high', 'medium', 'low'].includes(r.risk_level as string))
    throw new Error('Nível de risco inválido na resposta da IA.');
  if (typeof r.summary !== 'string' || r.summary.trim() === '')
    throw new Error('Resumo ausente na resposta da IA.');
  if (!Array.isArray(r.clauses))
    throw new Error('Lista de cláusulas inválida na resposta da IA.');
  if (!Array.isArray(r.recommendations))
    throw new Error('Recomendações inválidas na resposta da IA.');

  return parsed as Report;
}

async function invokeEdgeFunction<T>(name: string, body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message ?? 'Erro na função de análise.');
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export async function analyzeContractText(text: string): Promise<Report> {
  const { report } = await invokeEdgeFunction<{ report: unknown }>('analyze-contract', {
    mode: 'text',
    payload: text,
  });
  return parseAndValidateReport(JSON.stringify(report));
}

export async function analyzeContractImages(base64Images: string[]): Promise<Report> {
  const { report } = await invokeEdgeFunction<{ report: unknown }>('analyze-contract', {
    mode: 'images',
    payload: base64Images,
  });
  return parseAndValidateReport(JSON.stringify(report));
}

export async function analyzeContractPDF(base64: string): Promise<Report> {
  const { report } = await invokeEdgeFunction<{ report: unknown }>('analyze-contract', {
    mode: 'pdf',
    payload: base64,
  });
  return parseAndValidateReport(JSON.stringify(report));
}

export async function sendChatMessage(
  contractText: string,
  history: Message[],
  userMessage: string,
): Promise<string> {
  const { reply } = await invokeEdgeFunction<{ reply: string }>('chat-contract', {
    contractText,
    history,
    userMessage,
  });
  return reply;
}
