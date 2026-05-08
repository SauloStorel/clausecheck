import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RiskLevel } from '../types';
import { useTheme } from '../context/ThemeContext';
import { F, riskLabels } from '../constants/theme';

interface Props {
  level: RiskLevel;
}

export function RiskBadge({ level }: Props) {
  const { C, riskColors } = useTheme();
  const styles = useMemo(() => makeStyles(), []);
  const { fg, soft } = riskColors[level];

  return (
    <View style={[styles.badge, { backgroundColor: soft }]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[styles.text, { color: fg }]}>{riskLabels[level]}</Text>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      alignSelf: 'flex-start',
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    text: {
      fontFamily: F.body,
      fontSize: 12,
      fontWeight: '600',
    },
  });
}
