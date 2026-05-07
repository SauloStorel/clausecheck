import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { animate } from 'animejs';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { RiskBadge } from '../components/RiskBadge';
import { ClauseCard } from '../components/ClauseCard';
import { Analysis, RootStackParamList } from '../types';
import { C, F, riskColors } from '../constants/theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Relatorio'>;
  route: RouteProp<RootStackParamList, 'Relatorio'>;
};

export function RelatorioScreen({ navigation, route }: Props) {
  const { analysisId } = route.params;
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [clauseCount, setClauseCount] = useState(0);

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

      // anime.js v4 counter animation for clause count
      if (data?.report?.clauses?.length) {
        const total = data.report.clauses.length;
        const obj = { val: 0 };
        animate(obj, {
          val: total,
          duration: 900,
          ease: 'outExpo',
          onUpdate: () => setClauseCount(Math.round(obj.val)),
        });
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o relatório.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.gold} size="large" />
        <Text style={styles.loadingText}>Carregando relatório...</Text>
      </View>
    );
  }

  if (!analysis?.report) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Relatório não encontrado.</Text>
      </View>
    );
  }

  const { report } = analysis;
  const risk = riskColors[report.risk_level];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Risk hero */}
        <Animated.View entering={FadeIn.duration(500)} style={[styles.heroCard, { borderColor: risk.border, backgroundColor: risk.bg }]}>
          <RiskBadge level={report.risk_level} />
          <Text style={styles.heroTitle} numberOfLines={2}>{analysis.title}</Text>
          <Text style={styles.heroDate}>
            {new Date(analysis.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{clauseCount}</Text>
            <Text style={styles.statLabel}>CLÁUSULAS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{report.recommendations.length}</Text>
            <Text style={styles.statLabel}>RECOMENDAÇÕES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: risk.fg }]}>
              {report.risk_level === 'high' ? 'ALTO' : report.risk_level === 'medium' ? 'MED' : 'OK'}
            </Text>
            <Text style={styles.statLabel}>RISCO</Text>
          </View>
        </Animated.View>

        {/* Summary */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)}>
          <Text style={styles.sectionLabel}>RESUMO</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{report.summary}</Text>
          </View>
        </Animated.View>

        {/* Clauses */}
        <Animated.View entering={FadeInDown.delay(260).duration(400)}>
          <Text style={styles.sectionLabel}>CLÁUSULAS ANALISADAS</Text>
          {report.clauses.map((clause, i) => (
            <Animated.View key={clause.id} entering={FadeInDown.delay(260 + i * 60).duration(350)}>
              <ClauseCard clause={clause} />
            </Animated.View>
          ))}
        </Animated.View>

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <Animated.View entering={FadeInDown.delay(380).duration(400)}>
            <Text style={styles.sectionLabel}>RECOMENDAÇÕES</Text>
            {report.recommendations.map((rec, i) => (
              <View key={i} style={styles.recItem}>
                <Text style={styles.recBullet}>—</Text>
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => navigation.navigate('Chat', { analysisId })}
        activeOpacity={0.85}
      >
        <Text style={styles.chatButtonText}>TIRAR DÚVIDAS SOBRE ESTE CONTRATO</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  centered:     { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  content:      { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  heroCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 20,
    marginBottom: 16,
    gap: 10,
  },
  heroTitle:    { fontFamily: 'Georgia', fontSize: 20, color: C.text1, lineHeight: 28 },
  heroDate:     { fontFamily: F.mono, fontSize: 11, color: C.text3, letterSpacing: 1 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  statBox:      { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statDivider:  { width: StyleSheet.hairlineWidth, backgroundColor: C.border },
  statNumber:   { fontFamily: 'Georgia', fontSize: 22, color: C.gold, marginBottom: 4 },
  statLabel:    { fontFamily: F.mono, fontSize: 9, color: C.text3, letterSpacing: 2 },
  sectionLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.text3,
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    padding: 16,
    marginBottom: 24,
  },
  summaryText: { fontFamily: F.body, color: C.text2, fontSize: 14, lineHeight: 22 },
  recItem:     { flexDirection: 'row', gap: 10, marginBottom: 10, paddingLeft: 4 },
  recBullet:   { fontFamily: F.mono, color: C.goldDim, fontSize: 14, lineHeight: 22 },
  recText:     { fontFamily: F.body, color: C.text2, fontSize: 14, lineHeight: 22, flex: 1 },
  loadingText: { fontFamily: F.body, color: C.text3, marginTop: 12 },
  chatButton: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
    backgroundColor: C.gold,
    borderRadius: 4,
    paddingVertical: 17,
    alignItems: 'center',
  },
  chatButtonText: {
    fontFamily: F.body,
    color: C.bg,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
  },
});
