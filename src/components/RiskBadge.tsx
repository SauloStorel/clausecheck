import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RiskLevel } from '../types';

const config: Record<RiskLevel, { label: string; bg: string; color: string }> = {
  high:   { label: '🔴 Alto risco', bg: '#7f1d1d', color: '#fca5a5' },
  medium: { label: '🟡 Atenção',    bg: '#78350f', color: '#fcd34d' },
  low:    { label: '🟢 Ok',         bg: '#14532d', color: '#86efac' },
};

interface Props {
  level: RiskLevel;
}

export function RiskBadge({ level }: Props) {
  const { label, bg, color } = config[level];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
