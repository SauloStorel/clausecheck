export type RiskLevel = 'high' | 'medium' | 'low';

export interface Clause {
  id: string;
  risk: RiskLevel;
  title: string;
  explanation: string;
}

export interface Report {
  risk_level: RiskLevel;
  summary: string;
  clauses: Clause[];
  recommendations: string[];
}

export interface Analysis {
  id: string;
  user_id: string;
  title: string;
  input_text: string | null;
  image_url: string | null;
  report: Report | null;
  risk_level: RiskLevel | null;
  created_at: string;
}

export interface Message {
  id: string;
  analysis_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  NovaAnalise: undefined;
  Relatorio: { analysisId: string };
  Chat: { analysisId: string };
};
