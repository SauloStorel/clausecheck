import React, { useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Clause } from '../types';
import { useTheme } from '../context/ThemeContext';
import { F } from '../constants/theme';

interface Props {
  clause: Clause;
  isLast?: boolean;
}

const RISK_LABEL: Record<string, string> = {
  high: 'CRÍTICO',
  medium: 'ATENÇÃO',
  low: 'NORMAL',
};

// Extrai a frase de impacto do explanation estruturado
function extractImpact(explanation: string): string {
  const match = explanation.match(/\(2\)\s*IMPACTO[:\s]+([^(]+)/i);
  if (match) {
    const text = match[1].trim().replace(/\s+/g, ' ');
    // Limitar a ~100 chars para ficar em 2 linhas
    return text.length > 110 ? text.slice(0, 107) + '…' : text;
  }
  // Fallback: segunda frase do texto
  const sentences = explanation.split(/(?<=[.!?])\s+/);
  const second = sentences[1]?.trim();
  if (second) return second.length > 110 ? second.slice(0, 107) + '…' : second;
  return explanation.length > 110 ? explanation.slice(0, 107) + '…' : explanation;
}

// Parseia as 3 seções do explanation estruturado
function parseSections(explanation: string): { oQueE: string; impacto: string; atencao: string } | null {
  const oQueEMatch = explanation.match(/\(1\)\s*O\s+QUE\s+É[:\s]+([^(]+)/i);
  const impactoMatch = explanation.match(/\(2\)\s*IMPACTO[:\s]+([^(]+)/i);
  const atencaoMatch = explanation.match(/\(3\)\s*ATENÇÃO[:\s]+([^(]+)/i);

  if (!oQueEMatch && !impactoMatch && !atencaoMatch) return null;

  return {
    oQueE: oQueEMatch?.[1]?.trim() ?? '',
    impacto: impactoMatch?.[1]?.trim() ?? '',
    atencao: atencaoMatch?.[1]?.trim() ?? '',
  };
}

export function ClauseCard({ clause, isLast }: Props) {
  const { C, riskColors } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [expanded, setExpanded] = useState(false);
  const rotate = useRef(new Animated.Value(0)).current;
  const { fg, bg } = riskColors[clause.risk];

  const impactLine = extractImpact(clause.explanation);
  const sections = parseSections(clause.explanation);

  function toggle() {
    if (clause.risk === 'high') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (clause.risk === 'medium') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.selectionAsync();
    }
    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
    Animated.timing(rotate, {
      toValue: expanded ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
    setExpanded(prev => !prev);
  }

  const chevronRotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View>
      <TouchableOpacity onPress={toggle} activeOpacity={0.6} style={styles.card}>
        {/* Barra lateral colorida */}
        <View style={[styles.sidebar, { backgroundColor: fg }]} />

        <View style={styles.body}>
          {/* Tag de risco + título */}
          <View style={styles.topRow}>
            <View style={[styles.riskTag, { backgroundColor: bg }]}>
              <Text style={[styles.riskTagText, { color: fg }]}>
                {RISK_LABEL[clause.risk]}
              </Text>
            </View>
            <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
              <Ionicons name="chevron-down" size={16} color={C.text4} />
            </Animated.View>
          </View>

          {/* Título */}
          <Text style={styles.title}>{clause.title}</Text>

          {/* Frase de impacto direto */}
          <Text style={styles.impact} numberOfLines={expanded ? undefined : 2}>
            {impactLine}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Detalhes expandidos */}
      {expanded && (
        <View style={[styles.detail, { borderLeftColor: fg }]}>
          {sections ? (
            <>
              {sections.oQueE !== '' && (
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: C.text3 }]}>O QUE É</Text>
                  <Text style={styles.sectionText}>{sections.oQueE}</Text>
                </View>
              )}
              {sections.impacto !== '' && (
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: C.text3 }]}>IMPACTO</Text>
                  <Text style={styles.sectionText}>{sections.impacto}</Text>
                </View>
              )}
              {sections.atencao !== '' && (
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: C.text3 }]}>ATENÇÃO</Text>
                  <Text style={styles.sectionText}>{sections.atencao}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.sectionText}>{clause.explanation}</Text>
          )}

          {clause.severity_note && (
            <View style={[styles.severityAlert, { backgroundColor: C.warningSoft, borderLeftColor: C.warning }]}>
              <Ionicons name="warning-outline" size={16} color={C.warning} />
              <Text style={[styles.severityText, { color: C.warning }]}>{clause.severity_note}</Text>
            </View>
          )}
        </View>
      )}

      {!isLast && <View style={[styles.separator, { backgroundColor: C.border }]} />}
    </View>
  );
}

function makeStyles(C: ReturnType<typeof import('../context/ThemeContext').useTheme>['C']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: C.surface,
    },
    sidebar: {
      width: 4,
    },
    body: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 6,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    riskTag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 5,
    },
    riskTagText: {
      fontFamily: F.body,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    title: {
      fontFamily: F.body,
      color: C.text1,
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 21,
    },
    impact: {
      fontFamily: F.body,
      color: C.text2,
      fontSize: 13,
      lineHeight: 19,
    },
    detail: {
      backgroundColor: C.bg,
      paddingHorizontal: 16,
      paddingVertical: 14,
      paddingLeft: 18,
      borderLeftWidth: 3,
      gap: 14,
    },
    section: {
      gap: 3,
    },
    sectionLabel: {
      fontFamily: F.body,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    sectionText: {
      fontFamily: F.body,
      color: C.text2,
      fontSize: 14,
      lineHeight: 21,
    },
    severityAlert: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      borderLeftWidth: 3,
      gap: 8,
    },
    severityText: {
      flex: 1,
      fontFamily: F.body,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '500',
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      marginLeft: 18,
    },
  });
}
