import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { F } from '../constants/theme';
import { RootStackParamList } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    icon: '📄',
    title: 'Analise contratos',
    subtitle: 'Identifique riscos jurídicos antes de assinar com ajuda da IA.',
  },
  {
    icon: '📷',
    title: '3 formas de envio',
    subtitle: 'Fotografe, envie PDF ou cole o texto do contrato.',
  },
  {
    icon: '⚖️',
    title: 'Relatório completo',
    subtitle: 'Cláusulas, riscos e recomendações explicadas em linguagem simples.',
  },
];

const TOTAL_STEPS = SLIDES.length + 1;

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Onboarding'>;
};

export function OnboardingScreen({ navigation }: Props) {
  const { C, isDark, toggleTheme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  function handleNext() {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
      setCurrentIndex(next);
    } else {
      setShowThemePicker(true);
      setCurrentIndex(SLIDES.length);
    }
  }

  async function handleStart() {
    await AsyncStorage.setItem('onboarding_done', '1');
    navigation.replace('Login');
  }

  function selectTheme(dark: boolean) {
    if (dark !== isDark) toggleTheme();
  }

  const dots = Array.from({ length: TOTAL_STEPS });

  if (showThemePicker) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
        <View style={styles.themePicker}>
          <Text style={[styles.themeTitle, { color: C.text1 }]}>Como prefere o app?</Text>
          <Text style={[styles.themeSubtitle, { color: C.text3 }]}>
            Pode alterar depois no seu perfil.
          </Text>

          <View style={styles.themeCards}>
            <TouchableOpacity
              style={[
                styles.themeCard,
                { backgroundColor: '#FFFFFF', borderColor: !isDark ? C.accent : '#E5E5EA' },
                !isDark && styles.themeCardSelected,
              ]}
              onPress={() => selectTheme(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.themeCardIcon}>☀️</Text>
              <Text style={[styles.themeCardLabel, { color: '#0A0A0F' }]}>Claro</Text>
              {!isDark && (
                <View style={[styles.themeCheck, { backgroundColor: C.accent }]}>
                  <Text style={styles.themeCheckMark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeCard,
                { backgroundColor: '#1C1C1E', borderColor: isDark ? C.accent : '#38383A' },
                isDark && styles.themeCardSelected,
              ]}
              onPress={() => selectTheme(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.themeCardIcon}>🌙</Text>
              <Text style={[styles.themeCardLabel, { color: '#FFFFFF' }]}>Escuro</Text>
              {isDark && (
                <View style={[styles.themeCheck, { backgroundColor: C.accent }]}>
                  <Text style={styles.themeCheckMark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {dots.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i === currentIndex ? C.accent : C.border,
                    width: i === currentIndex ? 20 : 8 },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: C.accent }]}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Text style={[styles.buttonText, { color: C.textInverse }]}>Começar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <Text style={styles.icon}>{slide.icon}</Text>
            <Text style={[styles.title, { color: C.text1 }]}>{slide.title}</Text>
            <Text style={[styles.subtitle, { color: C.text3 }]}>{slide.subtitle}</Text>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {dots.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === currentIndex ? C.accent : C.border,
                  width: i === currentIndex ? 20 : 8 },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: C.accent }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonText, { color: C.textInverse }]}>Próximo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  icon: { fontSize: 72, marginBottom: 32 },
  title: {
    fontFamily: F.display,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 14,
  },
  subtitle: {
    fontFamily: F.body,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },

  themePicker: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  themeTitle: {
    fontFamily: F.display,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 10,
  },
  themeSubtitle: {
    fontFamily: F.body,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 40,
  },
  themeCards: {
    flexDirection: 'row',
    gap: 16,
  },
  themeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderRadius: 20,
    borderWidth: 2,
    gap: 10,
    position: 'relative',
  },
  themeCardSelected: {
    borderWidth: 2.5,
  },
  themeCardIcon: { fontSize: 40 },
  themeCardLabel: {
    fontFamily: F.body,
    fontSize: 16,
    fontWeight: '600',
  },
  themeCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCheckMark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 24,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: F.body,
    fontSize: 17,
    fontWeight: '600',
  },
});
