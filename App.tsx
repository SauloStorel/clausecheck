import 'react-native-url-polyfill/auto';
import React, { useMemo } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { NovaAnaliseScreen } from './src/screens/NovaAnaliseScreen';
import { RelatorioScreen } from './src/screens/RelatorioScreen';
import { PDFPreviewScreen } from './src/screens/PDFPreviewScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { PerfilScreen } from './src/screens/PerfilScreen';
import { HistoricoScreen } from './src/screens/HistoricoScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { RootStackParamList } from './src/types';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { F } from './src/constants/theme';

const Stack = createStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { C, isDark } = useTheme();

  const navTheme = useMemo(() => ({
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: C.bg,
      card: C.surface,
      text: C.text1,
      border: C.border,
      primary: C.accent,
    },
  }), [C, isDark]);

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: C.surface,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          },
          headerShadowVisible: false,
          headerTintColor: C.accent,
          headerTitleStyle: {
            fontFamily: F.display,
            fontWeight: '600',
            fontSize: 17,
            color: C.text1,
          },
          cardStyle: { backgroundColor: C.bg },
          ...TransitionPresets.SlideFromRightIOS,
        }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Perfil"
          component={PerfilScreen}
          options={{ title: 'Perfil' }}
        />
        <Stack.Screen
          name="Historico"
          component={HistoricoScreen}
          options={{ title: 'Histórico' }}
        />
        <Stack.Screen
          name="NovaAnalise"
          component={NovaAnaliseScreen}
          options={{ title: 'Nova análise' }}
        />
        <Stack.Screen
          name="Relatorio"
          component={RelatorioScreen}
          options={{ title: 'Relatório' }}
        />
        <Stack.Screen
          name="PDFPreview"
          component={PDFPreviewScreen}
          options={{ title: 'Relatório PDF' }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ title: 'Dúvidas' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
