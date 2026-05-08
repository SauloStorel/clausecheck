import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../services/supabase';
import { useTheme } from '../context/ThemeContext';
import { F } from '../constants/theme';
import { RootStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Perfil'>;
};

function Avatar({ email, C }: { email: string; C: any }) {
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <View style={[avatarStyles.avatar, { backgroundColor: C.accentSoft }]}>
      <Text style={[avatarStyles.avatarText, { color: C.accent }]}>{initials}</Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: F.display,
    fontSize: 28,
    fontWeight: '700',
  },
});

function InfoRow({ label, value, C }: { label: string; value: string; C: any }) {
  return (
    <View style={infoStyles.infoRow}>
      <Text style={[infoStyles.infoLabel, { color: C.text2 }]}>{label}</Text>
      <Text style={[infoStyles.infoValue, { color: C.text3 }]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: {
    fontFamily: F.body,
    fontSize: 15,
  },
  infoValue: {
    fontFamily: F.body,
    fontSize: 15,
  },
});

export function PerfilScreen({ navigation }: Props) {
  const { C, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [email, setEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [analysesCount, setAnalysesCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadPerfil();
  }, []);

  async function loadPerfil() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? '');
      setMemberSince(formatDate(user.created_at));

      const { count } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setAnalysesCount(count ?? 0);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  function formatDate(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  async function handleChangePassword() {
    if (!email) return;
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      Alert.alert('E-mail enviado', 'Verifique sua caixa de entrada para redefinir a senha.');
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Tente novamente.');
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.replace('Login');
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ActivityIndicator color={C.accent} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <Avatar email={email} C={C} />
          <Text style={styles.emailText}>{email}</Text>
        </View>

        <View style={styles.card}>
          <InfoRow label="Membro desde" value={memberSince} C={C} />
          <View style={styles.separator} />
          <InfoRow
            label="Análises realizadas"
            value={analysesCount !== null ? String(analysesCount) : '—'}
            C={C}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <Text style={styles.actionText}>Modo escuro</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor={C.surface}
            />
          </View>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleChangePassword}
            disabled={changingPassword}
            activeOpacity={0.7}
          >
            {changingPassword
              ? <ActivityIndicator color={C.accent} size="small" />
              : <Text style={styles.actionText}>Alterar senha</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.dangerText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof import('../context/ThemeContext').useTheme>['C']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    scroll: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 48,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    emailText: {
      fontFamily: F.body,
      fontSize: 16,
      color: C.text2,
    },
    card: {
      backgroundColor: C.surface,
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: C.border,
      marginLeft: 16,
    },
    actionRow: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      minHeight: 50,
      justifyContent: 'center',
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      minHeight: 50,
    },
    actionText: {
      fontFamily: F.body,
      fontSize: 15,
      color: C.accent,
    },
    dangerText: {
      fontFamily: F.body,
      fontSize: 15,
      color: C.danger,
    },
  });
}
