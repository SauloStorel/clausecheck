import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { primeCache } from '../services/pdfCache';
import { ClauseCard } from '../components/ClauseCard';
import { Analysis, RootStackParamList, RiskLevel } from '../types';
import { useTheme } from '../context/ThemeContext';
import { F } from '../constants/theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Relatorio'>;
  route: RouteProp<RootStackParamList, 'Relatorio'>;
};

export function RelatorioScreen({ navigation, route }: Props) {
  const { C, riskColors } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { analysisId } = route.params;
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchAnalysis(); }, []);

  const report = analysis?.report ?? null;

  const counts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0 };
    if (report) for (const clause of report.clauses) c[clause.risk]++;
    return c;
  }, [report]);

  const verdictText = useMemo(() => {
    if (counts.high > 0)
      return counts.high === 1 ? '1 cláusula crítica pode prejudicá-lo' : `${counts.high} cláusulas críticas podem prejudicá-lo`;
    if (counts.medium > 0)
      return counts.medium === 1 ? '1 cláusula merece sua atenção' : `${counts.medium} cláusulas merecem atenção`;
    return 'Contrato equilibrado, sem riscos críticos';
  }, [counts]);

  async function fetchAnalysis() {
    try {
      const { data, error } = await supabase.from('analyses').select('*').eq('id', analysisId).single();
      if (error) throw error;
      setAnalysis(data);
      if (data.report) primeCache(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o relatório.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={styles.loadingText}>Carregando relatório…</Text>
      </View>
    );
  }

  if (!report) {
    return <View style={styles.centered}><Text style={styles.loadingText}>Relatório não encontrado.</Text></View>;
  }

  const RISK_COUNTERS: { risk: RiskLevel; label: string; icon: string }[] = [
    { risk: 'high',   label: counts.high === 1   ? 'crítico'  : 'críticos',  icon: 'alert-circle' },
    { risk: 'medium', label: counts.medium === 1 ? 'atenção'  : 'atenções',  icon: 'warning'      },
    { risk: 'low',    label: counts.low === 1     ? 'normal'   : 'normais',   icon: 'checkmark-circle' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* VEREDICTO */}
        <View style={[styles.verdict, { backgroundColor: riskColors[report.risk_level].soft }]}>
          <View style={styles.verdictTop}>
            <Ionicons
              name={report.risk_level === 'low' ? 'checkmark-circle' : report.risk_level === 'medium' ? 'warning' : 'alert-circle'}
              size={32}
              color={riskColors[report.risk_level].fg}
            />
            <View style={styles.verdictTexts}>
              <Text style={[styles.verdictTitle, { color: riskColors[report.risk_level].fg }]}>
                {report.risk_level === 'high' ? 'Alto risco' : report.risk_level === 'medium' ? 'Risco médio' : 'Baixo risco'}
              </Text>
              <Text style={[styles.verdictSubtitle, { color: C.text2 }]}>{verdictText}</Text>
            </View>
          </View>

          {/* Contadores por nível */}
          <View style={styles.counters}>
            {RISK_COUNTERS.map(({ risk, label, icon }) => (
              <View key={risk} style={[styles.counter, { opacity: counts[risk] === 0 ? 0.35 : 1 }]}>
                <Ionicons name={icon as any} size={18} color={riskColors[risk].fg} />
                <Text style={[styles.counterNum, { color: riskColors[risk].fg }]}>{counts[risk]}</Text>
                <Text style={[styles.counterLabel, { color: C.text3 }]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Título + data */}
        <View style={styles.titleBlock}>
          <Text style={styles.heroTitle} numberOfLines={3}>{analysis.title}</Text>
          <Text style={styles.heroDate}>
            {new Date(analysis.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Resumo</Text>
        <View style={[styles.card, { padding: 16 }]}>
          <Text style={styles.summaryText}>{report.summary}</Text>
        </View>

        <Text style={styles.sectionLabel}>Cláusulas analisadas</Text>
        <View style={styles.card}>
          {report.clauses.map((clause, i) => (
            <ClauseCard
              key={clause.id}
              clause={clause}
              isLast={i === report.clauses.length - 1}
            />
          ))}
        </View>

        {report.recommendations.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Recomendações</Text>
            <View style={[styles.card, { paddingVertical: 4 }]}>
              {report.recommendations.map((rec, i) => (
                <View
                  key={i}
                  style={[
                    styles.recItem,
                    i !== report.recommendations.length - 1 && styles.recItemBorder,
                  ]}
                >
                  <View style={styles.recDot} />
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      <View style={styles.chatButtonWrap}>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => navigation.navigate('PDFPreview', { analysisId })}
          activeOpacity={0.85}
        >
          <View style={styles.exportButtonInner}>
            <Ionicons name="document-text-outline" size={18} color={C.accent} />
            <Text style={styles.exportButtonText}>Visualizar PDF</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => navigation.navigate('Chat', { analysisId })}
          activeOpacity={0.85}
        >
          <Text style={styles.chatButtonText}>Tirar dúvidas sobre este contrato</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof import('../context/ThemeContext').useTheme>['C']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    centered: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
    content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

    verdict: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      gap: 16,
    },
    verdictTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    verdictTexts: {
      flex: 1,
      gap: 4,
    },
    verdictTitle: {
      fontFamily: F.display,
      fontSize: 18,
      fontWeight: '700',
    },
    verdictSubtitle: {
      fontFamily: F.body,
      fontSize: 14,
      lineHeight: 20,
    },
    counters: {
      flexDirection: 'row',
      gap: 8,
    },
    counter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 0,
      backgroundColor: C.surface,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    counterNum: {
      fontFamily: F.display,
      fontSize: 16,
      fontWeight: '700',
      minWidth: 20,
    },
    counterLabel: {
      fontFamily: F.body,
      fontSize: 11,
      color: C.text3,
    },
    titleBlock: {
      paddingHorizontal: 4,
      paddingBottom: 20,
      gap: 6,
    },
    heroTitle: {
      fontFamily: F.display,
      fontSize: 22,
      fontWeight: '700',
      color: C.text1,
      letterSpacing: -0.3,
      lineHeight: 28,
    },
    heroDate: {
      fontFamily: F.body,
      fontSize: 13,
      color: C.text3,
    },
    sectionLabel: {
      fontFamily: F.body,
      fontSize: 13,
      fontWeight: '600',
      color: C.text3,
      marginBottom: 8,
      marginTop: 4,
      paddingLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    card: {
      backgroundColor: C.surface,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 24,
    },
    summaryText: {
      fontFamily: F.body,
      color: C.text1,
      fontSize: 15,
      lineHeight: 22,
    },
    recItem: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'flex-start',
    },
    recItemBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
    },
    recDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: C.accent,
      marginTop: 9,
    },
    recText: {
      flex: 1,
      fontFamily: F.body,
      color: C.text1,
      fontSize: 15,
      lineHeight: 22,
    },
    loadingText: {
      fontFamily: F.body,
      color: C.text3,
      marginTop: 12,
      fontSize: 15,
    },
    chatButtonWrap: {
      position: 'absolute',
      bottom: 24,
      left: 16,
      right: 16,
      gap: 10,
    },
    exportButton: {
      backgroundColor: C.surface,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: C.accent,
    },
    exportButtonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    exportButtonText: {
      fontFamily: F.body,
      color: C.accent,
      fontSize: 15,
      fontWeight: '600',
    },
    chatButton: {
      backgroundColor: C.accent,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      shadowColor: C.accent,
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    chatButtonText: {
      fontFamily: F.body,
      color: C.textInverse,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
