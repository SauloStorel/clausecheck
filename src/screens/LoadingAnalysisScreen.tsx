import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as FileSystem from 'expo-file-system';
import { RootStackParamList } from '../types';
import { C, F } from '../constants/theme';
import { supabase } from '../services/supabase';
import { analyzeContractText, analyzeContractImage } from '../services/claude';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'LoadingAnalysis'>;
  route: RouteProp<RootStackParamList, 'LoadingAnalysis'>;
};

export function LoadingAnalysisScreen({ navigation, route }: Props) {
  const { modo, titulo, imagemUri, texto } = route.params;
  const spinAnim = new Animated.Value(0);
  const pulseAnim = new Animated.Value(1);
  const progressAnim = new Animated.Value(0);

  useEffect(() => {
    performAnalysis();
  }, []);

  async function performAnalysis() {
    try {
      let report;
      if (modo === 'foto' && imagemUri) {
        const base64 = await FileSystem.readAsStringAsync(imagemUri, { encoding: 'base64' });
        report = await analyzeContractImage(base64);
      } else {
        report = await analyzeContractText(texto);
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('analyses').insert({
        user_id: user!.id,
        title: titulo,
        input_text: modo === 'texto' ? texto : null,
        image_url: imagemUri || null,
        report,
        risk_level: report.risk_level,
      }).select().single();

      if (error) throw error;

      navigation.replace('Relatorio', { analysisId: data.id });
    } catch (err: any) {
      Alert.alert('Erro na análise', err.message ?? 'Tente novamente.');
      navigation.goBack();
    }
  }

  useEffect(() => {
    // Rotação contínua
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Pulsação
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Barra de progresso
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: false,
    }).start();
  }, [spinAnim, pulseAnim, progressAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Ícone animado */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ rotate: spin }, { scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.circle} />
            <View style={[styles.dotOrbit, { transform: [{ rotate: '0deg' }] }]} />
          </Animated.View>

          {/* Textos */}
          <Text style={styles.title}>Analisando Contrato</Text>
          <Text style={styles.subtitle}>Aguarde enquanto processamos seu documento...</Text>

          {/* Barra de progresso */}
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>

          {/* Dicas */}
          <View style={styles.tipsContainer}>
            <TipItem text="Analisando claúsulas de risco" delay={0} />
            <TipItem text="Identificando termos importantes" delay={500} />
            <TipItem text="Gerando recomendações" delay={1000} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function TipItem({ text, delay }: { text: string; delay: number }) {
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim]);

  return (
    <Animated.View style={[styles.tip, { opacity: opacityAnim }]}>
      <View style={styles.tipDot} />
      <Text style={styles.tipText}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: C.gold,
    borderTopColor: 'transparent',
  },
  dotOrbit: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  title: {
    fontFamily: F.body,
    fontSize: 24,
    fontWeight: '700',
    color: C.text1,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: F.body,
    fontSize: 14,
    color: C.text2,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 40,
  },
  progressBar: {
    height: '100%',
    backgroundColor: C.gold,
    borderRadius: 2,
  },
  tipsContainer: {
    width: '100%',
    gap: 16,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.gold,
  },
  tipText: {
    fontFamily: F.body,
    fontSize: 13,
    color: C.text2,
  },
});
