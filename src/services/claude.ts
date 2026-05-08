import { supabase } from './supabase';
import { Report, Message } from '../types';

export type ProgressCallback = (pct: number, step: string) => void;

// Etapas simuladas com tempo acumulado em ms
// O progresso desacelera conforme se aproxima do fim (easing exponencial)
const SIMULATED_STEPS: { ms: number; pct: number; step: string }[] = [
  { ms: 0,     pct: 10, step: 'Lendo o contrato…'         },
  { ms: 1500,  pct: 25, step: 'Identificando cláusulas…'   },
  { ms: 4000,  pct: 42, step: 'Avaliando riscos jurídicos…' },
  { ms: 8000,  pct: 58, step: 'Verificando base legal…'    },
  { ms: 14000, pct: 72, step: 'Verificando base legal…'    },
  { ms: 22000, pct: 83, step: 'Preparando o relatório…'    },
  { ms: 35000, pct: 89, step: 'Preparando o relatório…'    },
];

function simulateProgress(onProgress: ProgressCallback): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  for (const { ms, pct, step } of SIMULATED_STEPS) {
    timers.push(setTimeout(() => onProgress(pct, step), ms));
  }
  return () => timers.forEach(clearTimeout);
}

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

async function invokeEdgeFunction<T>(name: string, body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message ?? 'Erro na função de análise.');
  if (data?.error) throw new Error(data.error);
  return data as T;
}

async function analyzeWithProgress(
  mode: string,
  payload: unknown,
  onProgress?: ProgressCallback,
): Promise<Report> {
  let stopSimulation: (() => void) | undefined;
  if (onProgress) stopSimulation = simulateProgress(onProgress);

  try {
    const { report } = await invokeEdgeFunction<{ report: unknown }>('analyze-contract', {
      mode,
      payload,
    });
    onProgress?.(97, 'Finalizando…');
    return parseAndValidateReport(report);
  } finally {
    stopSimulation?.();
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
  const { reply } = await invokeEdgeFunction<{ reply: string }>('chat-contract', {
    contractText,
    history,
    userMessage,
  });
  return reply;
}
