import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Analysis } from '../types';
import { C, F, riskColors, riskLabels } from '../constants/theme';

interface Props {
  analysis: Analysis;
  onPress: () => void;
  isLast?: boolean;
}

export const AnalysisItem = memo(function AnalysisItem({ analysis, onPress, isLast }: Props) {
  const date = new Date(analysis.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  }).replace('.', '');

  const risk = analysis.risk_level ? riskColors[analysis.risk_level] : null;
  const riskLabel = analysis.risk_level ? riskLabels[analysis.risk_level] : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.5}>
      <View style={styles.row}>
        <View style={styles.left}>
          {risk && <View style={[styles.dot, { backgroundColor: risk.fg }]} />}
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{analysis.title}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {riskLabel ? `${riskLabel} · ${date}` : date}
            </Text>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
      {!isLast && <View style={styles.separator} />}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: C.surface,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontFamily: F.body,
    color: C.text1,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  meta: {
    fontFamily: F.body,
    color: C.text3,
    fontSize: 13,
  },
  chevron: {
    fontFamily: F.body,
    color: C.text4,
    fontSize: 22,
    fontWeight: '300',
    marginLeft: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginLeft: 36,
  },
});
