import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Analysis } from '../types';

type Risk = 'high' | 'medium' | 'low';

const RISK_STYLES: Record<Risk, {
  color: string;
  bg: string;
  border: string;
  label: string;
  short: string;
}> = {
  high:   { color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', label: 'ALTO RISCO',  short: 'ALTO'  },
  medium: { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', label: 'RISCO MÉDIO', short: 'MÉDIO' },
  low:    { color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', label: 'BAIXO RISCO', short: 'BAIXO' },
};

const RISK_ORDER: Risk[] = ['high', 'medium', 'low'];

function extractImpact(explanation: string): string {
  const match = explanation.match(/\(2\)\s*IMPACTO[:\s]+([^(]+)/i);
  if (match) {
    const text = match[1].trim().replace(/\s+/g, ' ');
    return text.length > 140 ? text.slice(0, 137) + '…' : text;
  }
  const sentences = explanation.split(/(?<=[.!?])\s+/);
  const second = sentences[1]?.trim();
  return second ? (second.length > 140 ? second.slice(0, 137) + '…' : second) : '';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeMultiline(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function formatDatePtBR(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function sanitizeFileName(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'relatorio';
}

type ReportData = {
  report: NonNullable<Analysis['report']>;
  date: string;
  riskStyle: typeof RISK_STYLES[Risk];
  sortedClauses: NonNullable<Analysis['report']>['clauses'];
  counts: Record<Risk, number>;
};

function prepareReportData(analysis: Analysis): ReportData {
  const report = analysis.report!;
  const sortedClauses = [...report.clauses].sort(
    (a, b) => RISK_ORDER.indexOf(a.risk) - RISK_ORDER.indexOf(b.risk)
  );
  const counts: Record<Risk, number> = { high: 0, medium: 0, low: 0 };
  for (const c of report.clauses) counts[c.risk]++;
  return {
    report,
    date: formatDatePtBR(analysis.created_at),
    riskStyle: RISK_STYLES[report.risk_level],
    sortedClauses,
    counts,
  };
}

// HTML para WebView — usa backgrounds e display:inline-block
function buildWebViewHTML(analysis: Analysis): string {
  const { report, date, riskStyle, sortedClauses, counts } = prepareReportData(analysis);

  const clausesHTML = sortedClauses.map((clause, i) => {
    const s = RISK_STYLES[clause.risk];
    const impact = extractImpact(clause.explanation);
    return `
      <div style="border-left:4px solid ${s.color};border:1px solid ${s.border};border-left:4px solid ${s.color};border-radius:8px;margin-bottom:16px;overflow:hidden;">
        <div style="background-color:${s.bg};padding:12px 16px;border-bottom:1px solid ${s.border};">
          <table width="100%" style="border-collapse:collapse;"><tr>
            <td style="vertical-align:top;padding-right:10px;">
              <span style="display:inline-block;background-color:${s.color};color:#fff;font-size:10px;font-weight:bold;padding:3px 8px;border-radius:4px;margin-bottom:6px;">${s.short}</span>
              <div style="font-size:15px;font-weight:bold;color:#111827;line-height:1.3;word-wrap:break-word;">${escapeHtml(clause.title)}</div>
              ${impact ? `<div style="font-size:12px;color:#374151;margin-top:5px;line-height:1.6;">${escapeHtml(impact)}</div>` : ''}
            </td>
          </tr></table>
        </div>
        <div style="padding:14px 16px;background:#fff;">
          <p style="font-size:13px;color:#374151;line-height:1.85;margin:0;word-wrap:break-word;">${escapeMultiline(clause.explanation)}</p>
        </div>
      </div>`;
  }).join('');

  const recsHTML = report.recommendations.map((rec, i) => `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid #E5E7EB;vertical-align:top;width:28px;">
        <div style="width:20px;height:20px;background-color:#D1FAE5;border-radius:50%;text-align:center;line-height:20px;">
          <span style="color:#15803D;font-size:12px;font-weight:bold;">${i + 1}</span>
        </div>
      </td>
      <td style="padding:11px 0 11px 12px;border-bottom:1px solid #E5E7EB;font-size:13px;color:#374151;line-height:1.8;word-wrap:break-word;">${escapeHtml(rec)}</td>
    </tr>`).join('');

  const countsCells = RISK_ORDER
    .filter(r => counts[r] > 0)
    .map((r, idx, arr) => {
      const s = RISK_STYLES[r];
      const borderRight = idx < arr.length - 1 ? 'border-right:1px solid #E5E7EB;' : '';
      return `<td style="padding:12px 20px;${borderRight}text-align:center;background-color:${s.bg};"><div style="font-size:22px;font-weight:bold;color:${s.color};">${counts[r]}</div><div style="font-size:10px;font-weight:bold;color:${s.color};letter-spacing:1px;">${s.short}</div></td>`;
    })
    .join('');

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#111827;background:#fff;padding:20px;}
    p,td,li,div{word-wrap:break-word;overflow-wrap:break-word;}
  </style></head><body>

  <!-- CAPA -->
  <div style="border-top:6px solid ${riskStyle.color};padding-top:28px;margin-bottom:32px;">
    <div style="font-size:13px;font-weight:bold;letter-spacing:3px;color:#374151;margin-bottom:6px;">CLAUSECHECK</div>
    <div style="width:36px;height:3px;background-color:${riskStyle.color};margin-bottom:28px;"></div>
    <div style="font-size:11px;font-weight:bold;letter-spacing:2px;color:#6B7280;margin-bottom:12px;">RELATÓRIO DE ANÁLISE DE CONTRATO</div>
    <div style="font-size:26px;font-weight:bold;color:#111827;line-height:1.25;margin-bottom:28px;word-wrap:break-word;">${escapeHtml(analysis.title)}</div>
    <table style="border-collapse:collapse;margin-bottom:28px;"><tr>
      <td style="padding-right:32px;vertical-align:top;">
        <div style="font-size:10px;font-weight:bold;color:#6B7280;letter-spacing:1px;margin-bottom:4px;">DATA DA ANÁLISE</div>
        <div style="font-size:14px;color:#111827;font-weight:600;">${date}</div>
      </td>
      <td style="padding-right:32px;vertical-align:top;">
        <div style="font-size:10px;font-weight:bold;color:#6B7280;letter-spacing:1px;margin-bottom:4px;">CLÁUSULAS</div>
        <div style="font-size:14px;color:#111827;font-weight:600;">${report.clauses.length} analisadas</div>
      </td>
      <td style="vertical-align:top;">
        <div style="font-size:10px;font-weight:bold;color:#6B7280;letter-spacing:1px;margin-bottom:4px;">RECOMENDAÇÕES</div>
        <div style="font-size:14px;color:#111827;font-weight:600;">${report.recommendations.length} identificadas</div>
      </td>
    </tr></table>
    <div style="margin-bottom:20px;">
      <div style="font-size:10px;font-weight:bold;color:#6B7280;letter-spacing:1px;margin-bottom:8px;">NÍVEL DE RISCO GERAL</div>
      <div style="background-color:${riskStyle.color};color:#fff;font-size:18px;font-weight:bold;padding:12px 24px;border-radius:6px;display:inline-block;letter-spacing:1px;">${riskStyle.short}</div>
    </div>
    ${countsCells ? `<table style="border-collapse:collapse;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;"><tr>${countsCells}</tr></table>` : ''}
  </div>

  <!-- RESUMO -->
  <div style="margin-bottom:28px;">
    <div style="font-size:10px;font-weight:bold;letter-spacing:2px;color:#374151;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #E5E7EB;">RESUMO EXECUTIVO</div>
    <div style="background-color:#F8FAFC;border-left:4px solid #3B82F6;padding:16px 18px;border-radius:0 6px 6px 0;">
      <p style="font-size:14px;color:#374151;line-height:1.9;margin:0;word-wrap:break-word;">${escapeHtml(report.summary)}</p>
    </div>
  </div>

  <!-- CLÁUSULAS -->
  <div style="margin-bottom:28px;">
    <div style="font-size:10px;font-weight:bold;letter-spacing:2px;color:#374151;margin-bottom:14px;padding-bottom:6px;border-bottom:2px solid #E5E7EB;">CLÁUSULAS ANALISADAS &mdash; ORDENADAS POR PRIORIDADE DE RISCO</div>
    ${clausesHTML}
  </div>

  ${report.recommendations.length > 0 ? `
  <!-- RECOMENDAÇÕES -->
  <div>
    <div style="font-size:10px;font-weight:bold;letter-spacing:2px;color:#374151;margin-bottom:14px;padding-bottom:6px;border-bottom:2px solid #E5E7EB;">RECOMENDAÇÕES</div>
    <div style="border:1px solid #E5E7EB;border-radius:8px;padding:0 16px;">
      <table width="100%" style="border-collapse:collapse;">${recsHTML}</table>
    </div>
  </div>` : ''}

  <div style="margin-top:40px;padding-top:14px;border-top:1px solid #E5E7EB;text-align:center;font-size:11px;color:#6B7280;">
    Relatório gerado pelo <strong>ClauseCheck</strong> &mdash; Análise de contratos com Inteligência Artificial
  </div>
</body></html>`;
}

// HTML para PDF — layout polido, com page-breaks controlados e cores impressas via color-adjust:exact
function buildPDFHTML(analysis: Analysis): string {
  const { report, date, riskStyle, sortedClauses, counts } = prepareReportData(analysis);

  const clausesHTML = sortedClauses.map((clause, i) => {
    const s = RISK_STYLES[clause.risk];
    const impact = extractImpact(clause.explanation);
    return `
      <div style="border:1px solid ${s.border};border-left:4px solid ${s.color};border-radius:6px;margin-bottom:14px;overflow:hidden;page-break-inside:avoid;">
        <div style="background-color:${s.bg};padding:10px 14px;border-bottom:1px solid ${s.border};">
          <span style="display:inline-block;background-color:${s.color};color:#fff;font-size:8.5px;font-weight:bold;padding:3px 8px;border-radius:3px;letter-spacing:0.6px;margin-bottom:5px;">${s.short}</span>
          <div style="font-size:13px;font-weight:bold;color:#111827;line-height:1.3;word-wrap:break-word;">${escapeHtml(clause.title)}</div>
          ${impact ? `<div style="font-size:11px;color:#374151;margin-top:4px;line-height:1.55;">${escapeHtml(impact)}</div>` : ''}
        </div>
        <div style="padding:12px 14px;background:#fff;">
          <p style="font-size:11.5px;color:#374151;line-height:1.75;margin:0;word-wrap:break-word;">${escapeMultiline(clause.explanation)}</p>
        </div>
      </div>`;
  }).join('');

  const recsHTML = report.recommendations.map((rec, i) => `
    <div style="page-break-inside:avoid;margin-bottom:10px;">
      <table width="100%" style="border-collapse:collapse;background-color:#F8FAFC;border:1px solid #E5E7EB;border-radius:6px;">
        <tr>
          <td style="width:34px;vertical-align:middle;padding:11px 0 11px 12px;">
            <div style="width:22px;height:22px;background-color:#15803D;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:bold;">${i + 1}</div>
          </td>
          <td style="vertical-align:middle;padding:11px 14px 11px 10px;font-size:11.5px;color:#374151;line-height:1.7;word-wrap:break-word;">${escapeHtml(rec)}</td>
        </tr>
      </table>
    </div>`).join('');

  const countsCells = RISK_ORDER.map((r, idx) => {
    const s = RISK_STYLES[r];
    const dim = counts[r] === 0;
    const borderRight = idx < RISK_ORDER.length - 1 ? 'border-right:1px solid #E5E7EB;' : '';
    return `<td style="width:33.33%;padding:14px 10px;text-align:center;background-color:${dim ? '#F9FAFB' : s.bg};${borderRight}${dim ? 'opacity:0.45;' : ''}">
      <div style="font-size:26px;font-weight:bold;color:${s.color};line-height:1;margin-bottom:4px;">${counts[r]}</div>
      <div style="font-size:8.5px;font-weight:bold;color:${s.color};letter-spacing:1.4px;">${s.short}</div>
    </td>`;
  }).join('');

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
  <style>
    * { box-sizing:border-box; margin:0; padding:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body { font-family:Helvetica,Arial,sans-serif; color:#111827; background:#fff; font-size:12px; }
    p,td,li,div { word-wrap:break-word; overflow-wrap:break-word; }
    .section-title { font-size:9px; font-weight:bold; letter-spacing:2px; color:#6B7280; margin-bottom:12px; padding-bottom:7px; border-bottom:1px solid #E5E7EB; }
    .section { margin-bottom:26px; }
  </style></head><body>

  <!-- CABEÇALHO -->
  <div style="margin-bottom:26px;">
    <table width="100%" style="border-collapse:collapse;margin-bottom:18px;">
      <tr>
        <td style="vertical-align:middle;">
          <div style="font-size:10px;font-weight:bold;letter-spacing:3.5px;color:#111827;">CLAUSECHECK</div>
          <div style="font-size:8.5px;color:#9CA3AF;letter-spacing:1.5px;margin-top:2px;">RELATÓRIO DE ANÁLISE DE CONTRATO</div>
        </td>
        <td style="vertical-align:middle;text-align:right;">
          <div style="font-size:8.5px;color:#9CA3AF;letter-spacing:1px;">${date.toUpperCase()}</div>
        </td>
      </tr>
    </table>
    <div style="height:4px;background-color:${riskStyle.color};border-radius:2px;margin-bottom:22px;"></div>

    <div style="font-size:24px;font-weight:bold;color:#111827;line-height:1.2;margin-bottom:20px;word-wrap:break-word;">${escapeHtml(analysis.title)}</div>

    <!-- Card de risco geral -->
    <table width="100%" style="border-collapse:collapse;margin-bottom:18px;">
      <tr>
        <td style="background-color:${riskStyle.color};padding:18px 22px;border-radius:6px 0 0 6px;width:38%;vertical-align:middle;">
          <div style="font-size:8.5px;font-weight:bold;color:rgba(255,255,255,0.85);letter-spacing:1.5px;margin-bottom:4px;">NÍVEL DE RISCO GERAL</div>
          <div style="font-size:24px;font-weight:bold;color:#fff;letter-spacing:1.5px;line-height:1;">${riskStyle.short}</div>
        </td>
        <td style="background-color:#F8FAFC;border:1px solid #E5E7EB;border-left:none;padding:14px 20px;border-radius:0 6px 6px 0;vertical-align:middle;">
          <table width="100%" style="border-collapse:collapse;"><tr>
            <td style="vertical-align:top;padding-right:14px;">
              <div style="font-size:8px;font-weight:bold;color:#9CA3AF;letter-spacing:1px;margin-bottom:3px;">CLÁUSULAS</div>
              <div style="font-size:15px;color:#111827;font-weight:bold;">${report.clauses.length}</div>
              <div style="font-size:9px;color:#6B7280;">analisadas</div>
            </td>
            <td style="vertical-align:top;">
              <div style="font-size:8px;font-weight:bold;color:#9CA3AF;letter-spacing:1px;margin-bottom:3px;">RECOMENDAÇÕES</div>
              <div style="font-size:15px;color:#111827;font-weight:bold;">${report.recommendations.length}</div>
              <div style="font-size:9px;color:#6B7280;">identificadas</div>
            </td>
          </tr></table>
        </td>
      </tr>
    </table>

    <!-- Distribuição por nível de risco -->
    <table width="100%" style="border-collapse:collapse;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;">
      <tr>${countsCells}</tr>
    </table>
  </div>

  <!-- RESUMO -->
  <div class="section" style="page-break-inside:avoid;">
    <div class="section-title">RESUMO EXECUTIVO</div>
    <div style="background-color:#F8FAFC;border-left:3px solid #3B82F6;padding:14px 18px;border-radius:0 4px 4px 0;">
      <p style="font-size:12px;color:#374151;line-height:1.8;margin:0;word-wrap:break-word;">${escapeHtml(report.summary)}</p>
    </div>
  </div>

  <!-- CLÁUSULAS -->
  <div class="section">
    <div class="section-title">CLÁUSULAS ANALISADAS &mdash; ORDENADAS POR PRIORIDADE DE RISCO</div>
    ${clausesHTML}
  </div>

  ${report.recommendations.length > 0 ? `
  <!-- RECOMENDAÇÕES -->
  <div class="section">
    <div class="section-title">RECOMENDAÇÕES</div>
    ${recsHTML}
  </div>` : ''}

  <div style="margin-top:32px;padding-top:14px;border-top:1px solid #E5E7EB;">
    <table width="100%" style="border-collapse:collapse;">
      <tr>
        <td style="font-size:9px;color:#9CA3AF;letter-spacing:0.5px;">
          Gerado por <strong style="color:#374151;">ClauseCheck</strong> &mdash; Análise com Inteligência Artificial
        </td>
        <td style="text-align:right;font-size:9px;color:#9CA3AF;">${date}</td>
      </tr>
    </table>
  </div>

</body></html>`;
}

export function buildReportHTML(analysis: Analysis, forPDF = false): string {
  return forPDF ? buildPDFHTML(analysis) : buildWebViewHTML(analysis);
}

export async function exportReportPDF(
  analysis: Analysis,
): Promise<{ uri: string; fileName: string }> {
  const html = buildPDFHTML(analysis);
  const { uri } = await printToFileAsync({
    html,
    base64: false,
    margins: { top: 48, right: 52, bottom: 48, left: 52 },
  });
  const fileName = `relatorio-${sanitizeFileName(analysis.title)}.pdf`;
  return { uri, fileName };
}


export async function sharePDF(uri: string): Promise<void> {
  await shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Compartilhar relatório',
  });
}
