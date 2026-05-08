import { supabase } from './supabase';
import { Report, Message } from '../types';

export type ProgressCallback = (pct: number, step: string) => void;

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

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

function analyzeViaXHR(
  mode: string,
  payload: unknown,
  token: string,
  onProgress?: ProgressCallback,
): Promise<Report> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/functions/v1/analyze-contract`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SUPABASE_KEY);
    xhr.timeout = 120_000;

    let cursor = 0;
    let lineBuffer = '';
    let settled = false;

    function handleLine(line: string) {
      if (!line.startsWith('data: ')) return;
      let event: { type: string; pct?: number; step?: string; report?: unknown; message?: string };
      try { event = JSON.parse(line.slice(6)); } catch { return; }

      if (event.type === 'progress' && event.pct != null) {
        onProgress?.(event.pct, event.step ?? '');
      } else if (event.type === 'result' && !settled) {
        settled = true;
        try { resolve(parseAndValidateReport(event.report)); } catch (e) { reject(e); }
      } else if (event.type === 'error' && !settled) {
        settled = true;
        reject(new Error(event.message ?? 'Erro na análise.'));
      }
    }

    function processChunk() {
      const newText = xhr.responseText.slice(cursor);
      cursor = xhr.responseText.length;
      if (!newText) return;

      // Acumula no buffer e processa apenas linhas completas (terminadas em \n)
      lineBuffer += newText;
      const lines = lineBuffer.split('\n');
      // Última entrada pode estar incompleta — guarda no buffer
      lineBuffer = lines.pop() ?? '';
      for (const line of lines) handleLine(line.trimEnd());
    }

    xhr.onreadystatechange = () => {
      // readyState 3 = LOADING (chunks em tempo real, suportado em alguns RN builds)
      // readyState 4 = DONE (sempre suportado — fallback garante que funciona de qualquer forma)
      if (xhr.readyState >= 3) processChunk();

      if (xhr.readyState === 4) {
        // Processar o que sobrou no buffer (última linha sem \n)
        if (lineBuffer) { handleLine(lineBuffer.trimEnd()); lineBuffer = ''; }

        if (!settled) {
          settled = true;
          try {
            const body = JSON.parse(xhr.responseText);
            reject(new Error(body.error ?? 'Análise encerrada sem resultado.'));
          } catch {
            reject(new Error(`Análise encerrada sem resultado. Status HTTP: ${xhr.status}`));
          }
        }
      }
    };

    xhr.onerror   = () => { if (!settled) { settled = true; reject(new Error('Erro de rede.')); } };
    xhr.ontimeout = () => { if (!settled) { settled = true; reject(new Error('Tempo esgotado (>2min).')); } };

    xhr.send(JSON.stringify({ mode, payload }));
  });
}

async function analyzeWithProgress(
  mode: string,
  payload: unknown,
  onProgress?: ProgressCallback,
): Promise<Report> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Usuário não autenticado.');
  return analyzeViaXHR(mode, payload, session.access_token, onProgress);
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
