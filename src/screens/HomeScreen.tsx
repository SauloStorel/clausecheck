import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
    useCallback(() => {
      fetchAnalyses();
    }, [])
  );

  async function fetchAnalyses() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Contratos</Text>
          <Text style={styles.subtitle}>{analyses.length} analisado{analyses.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>SAIR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {loading ? (
        <ActivityIndicator color={C.gold} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={analyses}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 70).duration(400)}>
              <AnalysisItem
                analysis={item}
                onPress={() => navigation.navigate('Relatorio', { analysisId: item.id })}
              />
            </Animated.View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View entering={FadeInDown.delay(100)} style={styles.empty}>
              <Text style={styles.emptyGlyph}>§</Text>
              <Text style={styles.emptyTitle}>Nenhum contrato ainda</Text>
              <Text style={styles.emptySubtext}>Toque em "Nova Análise" para começar.</Text>
            </Animated.View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NovaAnalise')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ NOVA ANÁLISE</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title:       { fontFamily: 'Georgia', fontSize: 28, color: C.text1, letterSpacing: 0.5 },
  subtitle:    { fontFamily: F.mono, fontSize: 11, color: C.text3, letterSpacing: 1, marginTop: 2 },
  logoutBtn:   { paddingBottom: 4 },
  logoutText:  { fontFamily: F.mono, fontSize: 10, color: C.text3, letterSpacing: 2 },
  divider:     { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 24 },
  list:        { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  empty: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyGlyph:   { fontFamily: 'Georgia', fontSize: 56, color: C.goldDim, marginBottom: 16 },
  emptyTitle:   { fontFamily: 'Georgia', fontSize: 20, color: C.text2, marginBottom: 8 },
  emptySubtext: { fontFamily: F.body, fontSize: 13, color: C.text3, textAlign: 'center', lineHeight: 20 },
  fab: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    backgroundColor: C.gold,
    borderRadius: 4,
    paddingVertical: 17,
    alignItems: 'center',
  },
  fabText: {
    fontFamily: F.body,
    color: C.bg,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
  },
});
