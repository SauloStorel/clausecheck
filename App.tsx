import 'react-native-url-polyfill/auto';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { NovaAnaliseScreen } from './src/screens/NovaAnaliseScreen';
import { LoadingAnalysisScreen } from './src/screens/LoadingAnalysisScreen';
import { RelatorioScreen } from './src/screens/RelatorioScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { RootStackParamList } from './src/types';
import { C } from './src/constants/theme';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: C.bg,
              shadowColor: 'transparent',
              elevation: 0,
            },
            headerTintColor: C.gold,
            headerTitleStyle: {
              fontFamily: 'Georgia',
              fontWeight: '400',
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
            options={{ title: 'Nova Análise' }}
          />
          <Stack.Screen
            name="LoadingAnalysis"
            component={LoadingAnalysisScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Relatorio"
            component={RelatorioScreen}
            options={{ title: 'Relatório' }}
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
