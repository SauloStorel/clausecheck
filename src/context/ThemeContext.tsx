import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, makeRiskColors } from '../constants/theme';

type Colors = typeof lightColors;
const STORAGE_KEY = 'theme_override';

interface ThemeContextValue {
  C: Colors;
  isDark: boolean;
  riskColors: ReturnType<typeof makeRiskColors>;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  C: lightColors,
  isDark: false,
  riskColors: makeRiskColors(lightColors),
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<'light' | 'dark' | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'light' || val === 'dark') setOverride(val);
      setLoaded(true);
    });
  }, []);

  const isDark = override !== null ? override === 'dark' : systemScheme === 'dark';

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark';
    setOverride(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }

  const C = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);
  const riskColors = useMemo(() => makeRiskColors(C), [C]);
  const value = useMemo(() => ({ C, isDark, riskColors, toggleTheme }), [C, isDark, riskColors]);

  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
