import 'react-native-url-polyfill/auto';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { NovaAnaliseScreen } from './src/screens/NovaAnaliseScreen';
import { RelatorioScreen } from './src/screens/RelatorioScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { RootStackParamList } from './src/types';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: '#0f0f0f' },
          headerTintColor: '#f3f4f6',
          headerTitleStyle: { fontWeight: '600' },
          cardStyle: { backgroundColor: '#0f0f0f' },
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
          name="Relatorio"
          component={RelatorioScreen}
          options={{ title: 'Relatório' }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ title: 'Tirar Dúvidas' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
