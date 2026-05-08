import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../services/supabase';
import { SwipeableAnalysisItem } from '../components/SwipeableAnalysisItem';
import { Analysis, RiskLevel, RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { F, riskLabels } from '../constants/theme';

type RiskFilter = RiskLevel | 'all';
type SortOrder = 'desc' | 'asc';

const RISK_FILTERS: { key: RiskFilter; label: string }[] = [
  { key: 'all',    label: 'Todos' },
  { key: 'high',   label: riskLabels.high },
  { key: 'medium', label: riskLabels.medium },
  { key: 'low',    label: riskLabels.low },
];

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Historico'>;
};

export function HistoricoScreen({ navigation }: Props) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useFocusEffect(
    useCallback(() => { fetchAnalyses(); }, [])
  );

  async function fetchAnalyses(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAnalyses(data ?? []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o histórico.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from('analyses').delete().eq('id', id);
      if (error) throw error;
      setAnalyses(prev => prev.filter(a => a.id !== id));
    } catch {
      Alert.alert('Erro', 'Não foi possível excluir a análise.');
    }
  }

  const filtered = useMemo(() => {
    let result = analyses;

    if (riskFilter !== 'all') {
      result = result.filter(a => a.risk_level === riskFilter);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(a => a.title.toLowerCase().includes(q));
    }

    if (sortOrder === 'asc') {
      result = [...result].reverse();
    }

    return result;
  }, [analyses, riskFilter, query, sortOrder]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar contrato..."
          placeholderTextColor={C.text3}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.filtersRow}>
        {RISK_FILTERS.map(f => {
          const active = riskFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setRiskFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.resultsBar}>
        <Text style={styles.resultsCount}>
          {loading ? '' : `${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}`}
        </Text>
        <TouchableOpacity
          onPress={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.sortButton}>
            {sortOrder === 'desc' ? '↓ Mais recentes' : '↑ Mais antigos'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={C.accent} style={{ marginTop: 48 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhum resultado</Text>
          <Text style={styles.emptySubtext}>
            {query || riskFilter !== 'all'
              ? 'Tente outros termos ou remova os filtros.'
              : 'Você ainda não tem análises.'}
          </Text>
          {(query !== '' || riskFilter !== 'all') && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => { setQuery(''); setRiskFilter('all'); }}
              activeOpacity={0.7}
            >
              <Text style={styles.clearBtnText}>Limpar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <View style={[
              index === 0 && styles.firstRow,
              index === filtered.length - 1 && styles.lastRow,
              styles.rowWrap,
            ]}>
              <SwipeableAnalysisItem
                analysis={item}
                isLast={index === filtered.length - 1}
                onPress={() => navigation.navigate('Relatorio', { analysisId: item.id })}
                onDelete={handleDelete}
              />
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAnalyses(true)}
              tintColor={C.accent}
              colors={[C.accent]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof import('../context/ThemeContext').useTheme>['C']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surface,
      borderRadius: 10,
      marginHorizontal: 16,
      marginTop: 12,
      paddingHorizontal: 12,
      height: 44,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.border,
    },
    searchIcon: {
      fontSize: 18,
      color: C.text3,
      marginRight: 8,
      marginTop: -2,
    },
    searchInput: {
      flex: 1,
      fontFamily: F.body,
      fontSize: 16,
      color: C.text1,
    },

    filtersRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: C.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.border,
    },
    chipActive: {
      backgroundColor: C.accent,
      borderColor: C.accent,
    },
    chipText: {
      fontFamily: F.body,
      fontSize: 13,
      fontWeight: '500',
      color: C.text2,
    },
    chipTextActive: {
      color: C.textInverse,
    },

    resultsBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    resultsCount: {
      fontFamily: F.body,
      fontSize: 13,
      color: C.text3,
    },
    sortButton: {
      fontFamily: F.body,
      fontSize: 13,
      fontWeight: '500',
      color: C.accent,
    },

    list: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    rowWrap: {
      backgroundColor: C.surface,
      overflow: 'hidden',
    },
    firstRow: {
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    lastRow: {
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
    },

    empty: {
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingTop: 64,
    },
    emptyTitle: {
      fontFamily: F.display,
      fontSize: 18,
      fontWeight: '600',
      color: C.text1,
      marginBottom: 6,
    },
    emptySubtext: {
      fontFamily: F.body,
      fontSize: 15,
      color: C.text3,
      textAlign: 'center',
      lineHeight: 21,
      marginBottom: 24,
    },
    clearBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.accent,
    },
    clearBtnText: {
      fontFamily: F.body,
      fontSize: 15,
      fontWeight: '500',
      color: C.accent,
    },
  });
}
