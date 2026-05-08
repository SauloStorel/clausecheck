import { Analysis } from '../types';
import { buildReportHTML } from './pdf';

let cachedAnalysisId: string | null = null;
let cachedHTML: string | null = null;
let cachedAnalysis: Analysis | null = null;

export function primeCache(analysis: Analysis): void {
  cachedAnalysisId = analysis.id;
  cachedHTML = buildReportHTML(analysis, false);
  cachedAnalysis = analysis;
}

export function getCachedHTML(analysisId: string): string | null {
  return cachedAnalysisId === analysisId ? cachedHTML : null;
}

export function getCachedAnalysis(analysisId: string): Analysis | null {
  return cachedAnalysisId === analysisId ? cachedAnalysis : null;
}
