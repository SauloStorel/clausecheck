import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Dimensions, Animated, Easing,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../types';
import { C, F } from '../constants/theme';
import { useEntrance } from '../hooks/useEntrance';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Login'>;
};

const { height } = Dimensions.get('window');

function AnimatedRing({ size, delay, opacity: baseOpacity }: { size: number; delay: number; opacity: number }) {
  const scale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.1, duration: 2800, useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(scale, {
            toValue: 0.88, duration: 2800, useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: C.gold,
          opacity: baseOpacity,
        },
        { transform: [{ scale }] },
      ]}
    />
  );
}

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState('');

  const brand   = useEntrance(80);
  const form    = useEntrance(240);
  const actions = useEntrance(400);
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigation.replace('Home');
    });
  }, []);

  async function handleAuth() {
    setError('');
    if (!email || !senha) { setError('Preencha e-mail e senha.'); return; }

    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    setLoading(true);
    try {
      if (modo === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (err) throw err;
        navigation.replace('Home');
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password: senha });
        if (err) throw err;
        setError('Verifique seu e-mail para confirmar o cadastro.');
      }
    } catch (err: any) {
      setError(err.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.ringsContainer} pointerEvents="none">
        <AnimatedRing size={260} delay={0}   opacity={0.20} />
        <AnimatedRing size={400} delay={500} opacity={0.12} />
        <AnimatedRing size={540} delay={900} opacity={0.06} />
      </View>

      <View style={styles.inner}>
        <Animated.View style={[styles.brandBlock, brand]}>
          <Text style={styles.brandIcon}>§</Text>
          <Text style={styles.brandName}>ClauseCheck</Text>
          <Text style={styles.brandTag}>ANÁLISE INTELIGENTE DE CONTRATOS</Text>
        </Animated.View>

        <Animated.View style={form}>
          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>E-MAIL</Text>
          <TextInput
            style={[styles.input, focusedField === 'email' && styles.inputFocused]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={C.text3}
            placeholder="seu@email.com"
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />

          <Text style={[styles.fieldLabel, { marginTop: 22 }]}>SENHA</Text>
          <TextInput
            style={[styles.input, focusedField === 'senha' && styles.inputFocused]}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            placeholderTextColor={C.text3}
            placeholder="••••••••"
            onFocus={() => setFocusedField('senha')}
            onBlur={() => setFocusedField(null)}
          />

          {error !== '' && (
            <Text
              style={styles.errorText}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {error}
            </Text>
          )}
          <View style={styles.divider} />
        </Animated.View>

        <Animated.View style={actions}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.65 }]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>
                {loading ? 'AGUARDE...' : modo === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => { setError(''); setModo(m => m === 'login' ? 'cadastro' : 'login'); }}
          >
            <Text style={styles.toggleText}>
              {modo === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
              <Text style={styles.toggleLink}>
                {modo === 'login' ? 'Cadastre-se' : 'Entrar'}
              </Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  ringsContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    top: -height * 0.12,
    justifyContent: 'center',
  },
  inner:        { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  brandBlock:   { alignItems: 'center', marginBottom: 44 },
  brandIcon:    { fontFamily: 'Georgia', fontSize: 56, color: C.gold, marginBottom: 12 },
  brandName:    { fontFamily: 'Georgia', fontSize: 32, color: C.text1, letterSpacing: 0.5, marginBottom: 8 },
  brandTag:     { fontFamily: F.mono, fontSize: 9, color: C.goldDim, letterSpacing: 3, textAlign: 'center' },
  divider:      { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginVertical: 26 },
  fieldLabel:   { fontFamily: F.mono, fontSize: 9, color: C.text3, letterSpacing: 2, marginBottom: 10 },
  input: {
    borderBottomWidth: 1, borderBottomColor: C.border,
    paddingVertical: 10, fontSize: 16, fontFamily: F.body, color: C.text1,
  },
  inputFocused: { borderBottomColor: C.gold },
  errorText:    { fontFamily: F.body, color: C.danger, fontSize: 13, marginTop: 14, textAlign: 'center' },
  button: {
    backgroundColor: C.gold, borderRadius: 4,
    paddingVertical: 16, alignItems: 'center', marginBottom: 20,
  },
  buttonText:   { fontFamily: F.body, color: C.bg, fontSize: 12, fontWeight: '700', letterSpacing: 3 },
  toggleRow:    { alignItems: 'center' },
  toggleText:   { fontFamily: F.body, color: C.text2, fontSize: 13 },
  toggleLink:   { color: C.gold },
});
