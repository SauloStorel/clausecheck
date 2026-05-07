import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RiskLevel } from '../types';
import { C, F, riskColors } from '../constants/theme';

const labels: Record<RiskLevel, string> = {
  high:   'ALTO RISCO',
  medium: 'ATENÇÃO',
  low:    'APROVADO',
};

interface Props {
  level: RiskLevel;
}

export function RiskBadge({ level }: Props) {
  const { fg, bg, border } = riskColors[level];
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[styles.text, { color: fg }]}>{labels[level]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  text: {
    fontFamily: F.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
