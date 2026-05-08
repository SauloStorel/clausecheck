import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../services/supabase';
import { AnalysisItem } from '../components/AnalysisItem';
import { Analysis, RootStackParamList } from '../types';
import { C, F } from '../constants/theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: Props) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => { fetchAnalyses(); }, [])
  );

  async function fetchAnalyses() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('analyses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAnalyses(data ?? []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar seus contratos.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigation.replace('Login');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={handleLogout} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.navAction}>Sair</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('NovaAnalise')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.navAction, styles.navActionPrimary]}>＋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>Contratos</Text>
        {!loading && analyses.length > 0 && (
          <Text style={styles.subtitle}>
            {analyses.length} {analyses.length === 1 ? 'análise' : 'análises'}
          </Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={C.accent} style={{ marginTop: 60 }} />
      ) : analyses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhum contrato analisado</Text>
          <Text style={styles.emptySubtext}>
            Toque em ＋ para adicionar seu primeiro contrato.
          </Text>
          <TouchableOpacity
            style={styles.emptyCta}
            onPress={() => navigation.navigate('NovaAnalise')}
            activeOpacity={0.7}
          >
            <Text style={styles.emptyCtaText}>Nova análise</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={analyses}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <View style={[
              index === 0 && styles.firstRow,
              index === analyses.length - 1 && styles.lastRow,
              styles.rowWrap,
            ]}>
              <AnalysisItem
                analysis={item}
                isLast={index === analyses.length - 1}
                onPress={() => navigation.navigate('Relatorio', { analysisId: item.id })}
              />
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          style={styles.listWrapper}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    minHeight: 44,
  },
  navAction: {
    fontFamily: F.body,
    fontSize: 16,
    color: C.accent,
  },
  navActionPrimary: {
    fontSize: 26,
    fontWeight: '300',
    marginTop: -4,
  },
  titleBlock: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  title: {
    fontFamily: F.display,
    fontSize: 34,
    fontWeight: '700',
    color: C.text1,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: F.body,
    fontSize: 15,
    color: C.text3,
    marginTop: 2,
  },
  listWrapper: { flex: 1 },
  list: {
    paddingTop: 8,
    paddingBottom: 40,
    paddingHorizontal: 16,
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
    paddingTop: 80,
  },
  emptyTitle: {
    fontFamily: F.display,
    fontSize: 19,
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
    marginBottom: 28,
  },
  emptyCta: {
    backgroundColor: C.accent,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
  },
  emptyCtaText: {
    fontFamily: F.body,
    color: C.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
});
