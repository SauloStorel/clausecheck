import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { RiskBadge } from '../components/RiskBadge';
import { ClauseCard } from '../components/ClauseCard';
import { Analysis, RootStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Relatorio'>;
  route: RouteProp<RootStackParamList, 'Relatorio'>;
};

export function RelatorioScreen({ navigation, route }: Props) {
  const { analysisId } = route.params;
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  async function fetchAnalysis() {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single();
      if (error) throw error;
      setAnalysis(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o relatório.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#4f46e5" size="large" />
        <Text style={styles.loadingText}>Carregando relatório...</Text>
      </View>
    );
  }

  if (!analysis?.report) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Relatório não encontrado.</Text>
      </View>
    );
  }

  const { report } = analysis;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{analysis.title}</Text>
        <Text style={styles.date}>
          {new Date(analysis.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </Text>

        <View style={[styles.riskCard, riskCardBg[report.risk_level]]}>
          <RiskBadge level={report.risk_level} />
          <Text style={styles.summary}>{report.summary}</Text>
        </View>

        <Text style={styles.sectionTitle}>Cláusulas analisadas</Text>
        <Text style={styles.sectionHint}>Toque em uma cláusula para ver a explicação</Text>
        {report.clauses.map(clause => (
          <ClauseCard key={clause.id} clause={clause} />
        ))}

        {report.recommendations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recomendações</Text>
            {report.recommendations.map((rec, i) => (
              <View key={i} style={styles.recItem}>
                <Text style={styles.recBullet}>•</Text>
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => navigation.navigate('Chat', { analysisId })}
        activeOpacity={0.8}
      >
        <Text style={styles.chatButtonText}>💬 Tirar dúvidas sobre este contrato</Text>
      </TouchableOpacity>
    </View>
  );
}

const riskCardBg: Record<string, object> = {
  high:   { backgroundColor: '#1f0a0a', borderColor: '#7f1d1d' },
  medium: { backgroundColor: '#1c1500', borderColor: '#78350f' },
  low:    { backgroundColor: '#0a1f0a', borderColor: '#14532d' },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  centered: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 100 },
  title: { color: '#f3f4f6', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  date: { color: '#6b7280', fontSize: 13, marginBottom: 20 },
  riskCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  summary: { color: '#d1d5db', fontSize: 14, lineHeight: 22 },
  sectionTitle: {
    color: '#f3f4f6',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  sectionHint: { color: '#6b7280', fontSize: 12, marginBottom: 14 },
  recItem: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  recBullet: { color: '#4f46e5', fontSize: 16, lineHeight: 22 },
  recText: { color: '#d1d5db', fontSize: 14, lineHeight: 22, flex: 1 },
  loadingText: { color: '#6b7280', marginTop: 12 },
  errorText: { color: '#6b7280' },
  chatButton: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  chatButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
