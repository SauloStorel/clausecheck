import { supabase } from './supabase';
import { Report, Message } from '../types';

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

    // Validar cada cláusula
    for (let i = 0; i < (r.clauses as unknown[]).length; i++) {
      const clause = (r.clauses as unknown[])[i] as Record<string, unknown>;
      if (!clause || typeof clause !== 'object') throw new Error(`Cláusula ${i + 1} inválida (não é um objeto).`);
      if (typeof clause.id !== 'string') throw new Error(`Cláusula ${i + 1}: ID ausente ou inválido.`);
      if (!clause.risk) throw new Error(`Cláusula ${i + 1}: risk ausente.`);
      if (!['high', 'medium', 'low'].includes(clause.risk as string))
        throw new Error(`Cláusula ${i + 1}: risco inválido "${clause.risk}".`);
      if (typeof clause.title !== 'string') throw new Error(`Cláusula ${i + 1}: título ausente ou inválido.`);
      if (typeof clause.explanation !== 'string') throw new Error(`Cláusula ${i + 1}: explicação ausente ou inválida.`);
    }

    return data as Report;
  } catch (err: any) {
    console.error('Validation error:', err.message);
    console.error('Data received:', JSON.stringify(data).substring(0, 500));
    throw err;
  }
}

async function invokeEdgeFunction<T>(name: string, body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    console.error(`Edge Function ${name} error:`, error);
    throw new Error(error.message ?? 'Erro na função de análise.');
  }
  if (data?.error) {
    console.error(`Edge Function ${name} returned error:`, data.error);
    throw new Error(data.error);
  }
  console.log(`Edge Function ${name} success:`, data);
  return data as T;
}

export async function analyzeContractText(text: string): Promise<Report> {
  const { report } = await invokeEdgeFunction<{ report: unknown }>('analyze-contract', {
    mode: 'text',
    payload: text,
  });
  return parseAndValidateReport(report);
}

export async function analyzeContractImages(base64Images: string[]): Promise<Report> {
  const { report } = await invokeEdgeFunction<{ report: unknown }>('analyze-contract', {
    mode: 'images',
    payload: base64Images,
  });
  return parseAndValidateReport(report);
}

export async function analyzeContractPDF(base64: string): Promise<Report> {
  const { report } = await invokeEdgeFunction<{ report: unknown }>('analyze-contract', {
    mode: 'pdf',
    payload: base64,
  });
  return parseAndValidateReport(report);
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
