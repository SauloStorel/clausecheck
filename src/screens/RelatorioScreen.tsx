import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { primeCache } from '../services/pdfCache';
import { RiskBadge } from '../components/RiskBadge';
import { ClauseCard } from '../components/ClauseCard';
import { Analysis, RootStackParamList } from '../types';
import { C, F } from '../constants/theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Relatorio'>;
  route: RouteProp<RootStackParamList, 'Relatorio'>;
};

export function RelatorioScreen({ navigation, route }: Props) {
  const { analysisId } = route.params;
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchAnalysis(); }, []);

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

  if (!analysis?.report) {
    return <View style={styles.centered}><Text style={styles.loadingText}>Relatório não encontrado.</Text></View>;
  }

  const { report } = analysis;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <RiskBadge level={report.risk_level} />
          <Text style={styles.heroTitle} numberOfLines={3}>{analysis.title}</Text>
          <Text style={styles.heroDate}>
            {new Date(analysis.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{report.clauses.length}</Text>
            <Text style={styles.statLabel}>cláusulas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{report.recommendations.length}</Text>
            <Text style={styles.statLabel}>recomendações</Text>
          </View>
        </View>

        {/* Resumo */}
        <Text style={styles.sectionLabel}>Resumo</Text>
        <View style={[styles.card, { padding: 16 }]}>
          <Text style={styles.summaryText}>{report.summary}</Text>
        </View>

        {/* Cláusulas */}
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

        {/* Recomendações */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  hero: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 10,
  },
  heroTitle: {
    fontFamily: F.display,
    fontSize: 26,
    fontWeight: '700',
    color: C.text1,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  heroDate: {
    fontFamily: F.body,
    fontSize: 14,
    color: C.text3,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 28,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: {
    fontFamily: F.display,
    fontSize: 22,
    fontWeight: '600',
    color: C.text1,
    marginBottom: 2,
  },
  statLabel: {
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
