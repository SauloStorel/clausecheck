import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clause, RiskLevel } from '../types';

const borderColor: Record<RiskLevel, string> = {
  high:   '#dc2626',
  medium: '#d97706',
  low:    '#16a34a',
};

const bgColor: Record<RiskLevel, string> = {
  high:   '#1f0a0a',
  medium: '#1c1500',
  low:    '#0a1f0a',
};

interface Props {
  clause: Clause;
}

export function ClauseCard({ clause }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => setExpanded(prev => !prev)}
      style={[
        styles.card,
        {
          borderLeftColor: borderColor[clause.risk],
          backgroundColor: bgColor[clause.risk],
        },
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.id}>{clause.id}</Text>
        <Text style={styles.arrow}>{expanded ? '▲' : '▼'}</Text>
      </View>
      <Text style={styles.title}>{clause.title}</Text>
      {expanded && (
        <Text style={styles.explanation}>{clause.explanation}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  id: {
    color: '#9ca3af',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arrow: {
    color: '#6b7280',
    fontSize: 11,
  },
  title: {
    color: '#f3f4f6',
    fontSize: 14,
    fontWeight: '600',
  },
  explanation: {
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
});
