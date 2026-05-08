import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../services/supabase';
import { useTheme } from '../context/ThemeContext';
import { F } from '../constants/theme';
import { RootStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Login'>;
};

export function LoginScreen({ navigation }: Props) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkOnboarding() {
      const done = await AsyncStorage.getItem('onboarding_done');
      if (!done) {
        navigation.replace('Onboarding');
        return;
      }
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) navigation.replace('Home');
      });
    }
    checkOnboarding();
  }, []);

  async function handleAuth() {
    setError('');
    if (!email || !senha) { setError('Preencha e-mail e senha.'); return; }

    setLoading(true);
    try {
      if (modo === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (err) throw err;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('Home');
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password: senha });
        if (err) throw err;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setError('Verifique seu e-mail para confirmar o cadastro.');
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const isLogin = modo === 'login';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.brand}>ClauseCheck</Text>
            <Text style={styles.title}>{isLogin ? 'Entrar' : 'Criar conta'}</Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? 'Acesse seus contratos analisados.'
                : 'Comece a analisar contratos em segundos.'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={C.text3}
                placeholder="seu@email.com"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={[styles.input, focusedField === 'senha' && styles.inputFocused]}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                placeholderTextColor={C.text3}
                placeholder="Mínimo 6 caracteres"
                onFocus={() => setFocusedField('senha')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {error !== '' && (
              <Text
                style={styles.errorText}
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                {error}
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={C.textInverse} size="small" />
                : <Text style={styles.buttonText}>{isLogin ? 'Entrar' : 'Criar conta'}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggle}
              onPress={() => { setError(''); setModo(m => m === 'login' ? 'cadastro' : 'login'); }}
            >
              <Text style={styles.toggleText}>
                {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
                <Text style={styles.toggleLink}>
                  {isLogin ? 'Cadastre-se' : 'Entrar'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof import('../context/ThemeContext').useTheme>['C']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.surface },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 40,
    },
    header: {
      marginTop: 24,
      marginBottom: 32,
    },
    brand: {
      fontFamily: F.body,
      fontSize: 13,
      fontWeight: '600',
      color: C.accent,
      marginBottom: 14,
    },
    title: {
      fontFamily: F.display,
      fontSize: 32,
      fontWeight: '700',
      color: C.text1,
      letterSpacing: -0.5,
      marginBottom: 6,
    },
    subtitle: {
      fontFamily: F.body,
      fontSize: 16,
      color: C.text3,
      lineHeight: 22,
    },
    form: {
      gap: 18,
    },
    fieldGroup: {
      gap: 8,
    },
    label: {
      fontFamily: F.body,
      fontSize: 13,
      fontWeight: '500',
      color: C.text2,
    },
    input: {
      backgroundColor: C.bg,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 16,
      fontFamily: F.body,
      color: C.text1,
    },
    inputFocused: {
      borderColor: C.accent,
      backgroundColor: C.surface,
    },
    errorText: {
      fontFamily: F.body,
      color: C.danger,
      fontSize: 14,
      marginTop: 4,
    },
    actions: {
      marginTop: 28,
    },
    button: {
      backgroundColor: C.accent,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginBottom: 18,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: {
      fontFamily: F.body,
      color: C.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    toggle: { alignItems: 'center', paddingVertical: 6 },
    toggleText: {
      fontFamily: F.body,
      color: C.text3,
      fontSize: 15,
    },
    toggleLink: {
      color: C.accent,
      fontWeight: '600',
    },
  });
}
