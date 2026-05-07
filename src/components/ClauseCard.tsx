import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation } from 'react-native';
import { Clause } from '../types';
import { C, F, riskColors } from '../constants/theme';

interface Props {
  clause: Clause;
}

export function ClauseCard({ clause }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { fg, bg, border } = riskColors[clause.risk];

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  }

  return (
    <TouchableOpacity
      onPress={toggle}
      style={[styles.card, { borderLeftColor: fg, backgroundColor: bg, borderColor: border }]}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <Text style={[styles.id, { color: fg }]}>{clause.id}</Text>
        <Text style={[styles.chevron, { color: fg }]}>{expanded ? '▲' : '▼'}</Text>
      </View>
      <Text style={styles.title}>{clause.title}</Text>
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={[styles.explanationDivider, { backgroundColor: border }]} />
          <Text style={styles.explanation}>{clause.explanation}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 3,
    borderWidth: 1,
    borderRadius: 4,
    padding: 14,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  id: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  chevron: {
    fontFamily: F.mono,
    fontSize: 9,
  },
  title: {
    fontFamily: F.body,
    color: C.text1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  expandedContent: { marginTop: 10 },
  explanationDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  explanation: {
    fontFamily: F.body,
    color: C.text2,
    fontSize: 13,
    lineHeight: 20,
  },
});
