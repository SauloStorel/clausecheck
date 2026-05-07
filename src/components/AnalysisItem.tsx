import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Analysis } from '../types';
import { RiskBadge } from './RiskBadge';

interface Props {
  analysis: Analysis;
  onPress: () => void;
}

export function AnalysisItem({ analysis, onPress }: Props) {
  const date = new Date(analysis.created_at).toLocaleDateString('pt-BR');

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{analysis.title}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      {analysis.risk_level && <RiskBadge level={analysis.risk_level} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#f3f4f6',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    color: '#6b7280',
    fontSize: 12,
  },
});
