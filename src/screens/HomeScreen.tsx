import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../services/supabase';
import { SwipeableAnalysisItem } from '../components/SwipeableAnalysisItem';
import { Analysis, RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { F } from '../constants/theme';

function UserAvatar({ email, onPress, C }: { email: string; onPress: () => void; C: any }) {
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.7}
    >
      <View style={[avatarStyles.circle, { backgroundColor: C.accentSoft }]}>
        <Text style={[avatarStyles.text, { color: C.accent }]}>{initials}</Text>
      </View>
    </TouchableOpacity>
  );
}

const avatarStyles = StyleSheet.create({
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: F.body,
    fontSize: 12,
    fontWeight: '700',
  },
});

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: Props) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        try {
          const [analysesRes, userRes] = await Promise.all([
            supabase.from('analyses').select('*').order('created_at', { ascending: false }),
            supabase.auth.getUser(),
          ]);
          if (cancelled) return;
          if (analysesRes.error) throw analysesRes.error;
          setAnalyses(analysesRes.data ?? []);
          setUserEmail(userRes.data.user?.email ?? '');
        } catch {
          if (!cancelled) Alert.alert('Erro', 'Não foi possível carregar seus contratos.');
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      load();
      return () => { cancelled = true; };
    }, [])
  );

  async function fetchAnalyses(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('analyses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAnalyses(data ?? []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar seus contratos.');
    } finally {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navbar}>
        <UserAvatar
          email={userEmail}
          onPress={() => navigation.navigate('Perfil')}
          C={C}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('NovaAnalise')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.navAction, styles.navActionPrimary]}>＋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Contratos</Text>
          {!loading && analyses.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Historico')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Text style={styles.filterLink}>Buscar ⌕</Text>
            </TouchableOpacity>
          )}
        </View>
        {!loading && analyses.length > 0 && (
          <Text style={styles.subtitle}>
            {analyses.length} {analyses.length === 1 ? 'análise' : 'análises'}
          </Text>
        )}
      </View>

      {!loading && analyses.length > 0 && (
        <TouchableOpacity
          style={styles.newAnalysisCard}
          onPress={() => navigation.navigate('NovaAnalise')}
          activeOpacity={0.82}
        >
          <View style={styles.newAnalysisIcon}>
            <Ionicons name="add" size={22} color={C.textInverse} />
          </View>
          <View style={styles.newAnalysisText}>
            <Text style={styles.newAnalysisTitle}>Nova análise</Text>
            <Text style={styles.newAnalysisSubtitle}>Câmera, PDF ou texto</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.textInverse} style={{ opacity: 0.7 }} />
        </TouchableOpacity>
      )}

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
              <SwipeableAnalysisItem
                analysis={item}
                isLast={index === analyses.length - 1}
                onPress={() => navigation.navigate('Relatorio', { analysisId: item.id })}
                onDelete={handleDelete}
              />
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          style={styles.listWrapper}
          contentInset={{ bottom: 80 }}
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

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: C.accent }]}
        onPress={() => navigation.navigate('NovaAnalise')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={C.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof import('../context/ThemeContext').useTheme>['C']) {
  return StyleSheet.create({
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
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    title: {
      fontFamily: F.display,
      fontSize: 34,
      fontWeight: '700',
      color: C.text1,
      letterSpacing: -0.5,
    },
    filterLink: {
      fontFamily: F.body,
      fontSize: 15,
      color: C.accent,
      paddingBottom: 4,
    },
    subtitle: {
      fontFamily: F.body,
      fontSize: 15,
      color: C.text3,
      marginTop: 2,
    },
    newAnalysisCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.accent,
      borderRadius: 14,
      marginHorizontal: 16,
      marginBottom: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
    },
    newAnalysisIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    newAnalysisText: { flex: 1 },
    newAnalysisTitle: {
      fontFamily: F.body,
      fontSize: 15,
      fontWeight: '700',
      color: C.textInverse,
    },
    newAnalysisSubtitle: {
      fontFamily: F.body,
      fontSize: 12,
      color: C.textInverse,
      opacity: 0.75,
      marginTop: 1,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    listWrapper: { flex: 1 },
    list: {
      paddingTop: 8,
      paddingBottom: 100,
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
}
