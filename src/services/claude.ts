import { supabase } from './supabase';
import { Report, Message } from '../types';

export type ProgressCallback = (pct: number, step: string) => void;

function parseAndValidateReport(data: unknown): Report {
  const r = data as Record<string, unknown>;
  if (!r || typeof r !== 'object') throw new Error('Resposta da IA inválida.');
  if (!['high', 'medium', 'low'].includes(r.risk_level as string))
    throw new Error(`Nível de risco inválido: "${r.risk_level}".`);
  if (typeof r.summary !== 'string' || !r.summary.trim())
    throw new Error('Resumo ausente na resposta da IA.');
  if (!Array.isArray(r.clauses))
    throw new Error('Lista de cláusulas inválida.');
  if (!Array.isArray(r.recommendations))
    throw new Error('Recomendações inválidas.');
  return data as Report;
}

// Progresso simulado com easing: rápido no início, desacelera perto do fim.
// Nunca ultrapassa 88% — os últimos % só chegam com a resposta real.
const STEPS: { ms: number; pct: number; step: string }[] = [
  { ms: 0,      pct: 12, step: 'Lendo o contrato…'          },
  { ms: 1200,   pct: 28, step: 'Identificando cláusulas…'   },
  { ms: 3500,   pct: 44, step: 'Avaliando riscos jurídicos…' },
  { ms: 7000,   pct: 60, step: 'Verificando base legal…'    },
  { ms: 13000,  pct: 72, step: 'Verificando base legal…'    },
  { ms: 21000,  pct: 81, step: 'Preparando o relatório…'    },
  { ms: 33000,  pct: 87, step: 'Preparando o relatório…'    },
  { ms: 50000,  pct: 88, step: 'Preparando o relatório…'    },
];

function startProgress(onProgress: ProgressCallback): () => void {
  const ids = STEPS.map(({ ms, pct, step }) =>
    setTimeout(() => onProgress(pct, step), ms)
  );
  return () => ids.forEach(clearTimeout);
}

async function analyzeWithProgress(
  mode: string,
  payload: unknown,
  onProgress?: ProgressCallback,
): Promise<Report> {
  const stop = onProgress ? startProgress(onProgress) : undefined;
  try {
    const { data, error } = await supabase.functions.invoke('analyze-contract', {
      body: { mode, payload },
    });
    if (error) throw new Error(error.message ?? 'Erro na análise.');
    if (data?.error) throw new Error(data.error);
    onProgress?.(96, 'Finalizando…');
    return parseAndValidateReport(data.report);
  } finally {
    stop?.();
  }
}

export async function analyzeContractText(text: string, onProgress?: ProgressCallback): Promise<Report> {
  return analyzeWithProgress('text', text, onProgress);
}

export async function analyzeContractImages(base64Images: string[], onProgress?: ProgressCallback): Promise<Report> {
  return analyzeWithProgress('images', base64Images, onProgress);
}

export async function analyzeContractPDF(base64: string, onProgress?: ProgressCallback): Promise<Report> {
  return analyzeWithProgress('pdf', base64, onProgress);
}

export async function sendChatMessage(
  contractText: string,
  history: Message[],
  userMessage: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('chat-contract', {
    body: { contractText, history, userMessage },
  });
  if (error) throw new Error(error.message ?? 'Erro no chat.');
  if (data?.error) throw new Error(data.error);
  return data.reply as string;
}
