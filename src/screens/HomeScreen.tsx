import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../services/supabase';
import { AnalysisItem } from '../components/AnalysisItem';
import { Analysis, RootStackParamList } from '../types';

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
    } catch (err: any) {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Contratos</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Sair</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#4f46e5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={analyses}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <AnalysisItem
              analysis={item}
              onPress={() => navigation.navigate('Relatorio', { analysisId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={styles.emptyText}>Nenhum contrato analisado ainda.</Text>
              <Text style={styles.emptySubtext}>Toque em "+ Nova Análise" para começar.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NovaAnalise')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ Nova Análise</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: { color: '#f3f4f6', fontSize: 22, fontWeight: '700' },
  logout: { color: '#6b7280', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#f3f4f6', fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptySubtext: { color: '#6b7280', fontSize: 14 },
  fab: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
