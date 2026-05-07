import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Analysis } from '../types';
import { C, F, riskColors } from '../constants/theme';

interface Props {
  analysis: Analysis;
  onPress: () => void;
}

export const AnalysisItem = memo(function AnalysisItem({ analysis, onPress }: Props) {
  const date = new Date(analysis.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const risk = analysis.risk_level ? riskColors[analysis.risk_level] : null;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.75}>
      {risk && <View style={[styles.stripe, { backgroundColor: risk.fg }]} />}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{analysis.title}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      {risk && (
        <View style={[styles.riskPill, { backgroundColor: risk.bg, borderColor: risk.border }]}>
          <View style={[styles.riskDot, { backgroundColor: risk.fg }]} />
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  stripe: {
    width: 3,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  title: {
    fontFamily: F.body,
    color: C.text1,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    fontFamily: F.mono,
    color: C.text3,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  riskPill: {
    marginRight: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
