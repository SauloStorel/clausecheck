import 'react-native-url-polyfill/auto';
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { NovaAnaliseScreen } from './src/screens/NovaAnaliseScreen';
import { RelatorioScreen } from './src/screens/RelatorioScreen';
import { PDFPreviewScreen } from './src/screens/PDFPreviewScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { RootStackParamList } from './src/types';
import { C, F } from './src/constants/theme';

const Stack = createStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: C.bg,
    card: C.surface,
    text: C.text1,
    border: C.border,
    primary: C.accent,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer theme={navTheme}>
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
    </SafeAreaProvider>
  );
}
