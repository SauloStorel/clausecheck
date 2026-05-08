import { supabase } from './supabase';
import { Report, Message } from '../types';

export type ProgressCallback = (pct: number, step: string) => void;

function parseAndValidateReport(data: unknown): Report {
  try {
    const r = data as Record<string, unknown>;

    if (!r || typeof r !== 'object') throw new Error('Resposta da IA inválida (não é um objeto).');

    if (!r.risk_level) throw new Error('Campo risk_level ausente.');
    if (!['high', 'medium', 'low'].includes(r.risk_level as string))
      throw new Error(`Nível de risco inválido: "${r.risk_level}". Deve ser high, medium ou low.`);

    if (!r.summary) throw new Error('Campo summary ausente.');
    if (typeof r.summary !== 'string' || r.summary.trim() === '')
      throw new Error('Resumo vazio ou inválido.');

    if (!r.clauses) throw new Error('Campo clauses ausente.');
    if (!Array.isArray(r.clauses))
      throw new Error(`Campo clauses deve ser um array, recebido: ${typeof r.clauses}`);

    if (!r.recommendations) throw new Error('Campo recommendations ausente.');
    if (!Array.isArray(r.recommendations))
      throw new Error(`Campo recommendations deve ser um array, recebido: ${typeof r.recommendations}`);

    for (let i = 0; i < (r.clauses as unknown[]).length; i++) {
      const clause = (r.clauses as unknown[])[i] as Record<string, unknown>;
      if (!clause || typeof clause !== 'object') throw new Error(`Cláusula ${i + 1} inválida.`);
      if (typeof clause.id !== 'string') throw new Error(`Cláusula ${i + 1}: ID ausente ou inválido.`);
      if (!clause.risk) throw new Error(`Cláusula ${i + 1}: risk ausente.`);
      if (!['high', 'medium', 'low'].includes(clause.risk as string))
        throw new Error(`Cláusula ${i + 1}: risco inválido "${clause.risk}".`);
      if (typeof clause.title !== 'string') throw new Error(`Cláusula ${i + 1}: título ausente.`);
      if (typeof clause.explanation !== 'string') throw new Error(`Cláusula ${i + 1}: explicação ausente.`);
    }

    return data as Report;
  } catch (err: any) {
    console.error('Validation error:', err.message);
    throw err;
  }
}

async function analyzeViaStream(
  mode: string,
  payload: unknown,
  onProgress?: ProgressCallback,
): Promise<Report> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Usuário não autenticado.');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-contract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseKey!,
    },
    body: JSON.stringify({ mode, payload }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erro na análise: ${response.status} — ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Streaming não suportado neste ambiente.');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Processar linhas completas, manter o que sobrou no buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      let event: { type: string; pct?: number; step?: string; report?: unknown; message?: string };
      try {
        event = JSON.parse(raw);
      } catch {
        continue;
      }

      if (event.type === 'progress' && event.pct !== undefined && event.step) {
        onProgress?.(event.pct, event.step);
      } else if (event.type === 'result') {
        return parseAndValidateReport(event.report);
      } else if (event.type === 'error') {
        throw new Error(event.message ?? 'Erro na análise.');
      }
    }
  }

  throw new Error('Análise encerrada sem resultado.');
}

export async function analyzeContractText(text: string, onProgress?: ProgressCallback): Promise<Report> {
  return analyzeViaStream('text', text, onProgress);
}

export async function analyzeContractImages(base64Images: string[], onProgress?: ProgressCallback): Promise<Report> {
  return analyzeViaStream('images', base64Images, onProgress);
}

export async function analyzeContractPDF(base64: string, onProgress?: ProgressCallback): Promise<Report> {
  return analyzeViaStream('pdf', base64, onProgress);
}

export async function sendChatMessage(
  contractText: string,
  history: Message[],
  userMessage: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('chat-contract', {
    body: { contractText, history, userMessage },
  });
  if (error) throw new Error(error.message ?? 'Erro na função de chat.');
  if (data?.error) throw new Error(data.error);
  return data.reply as string;
}
