import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Animated, Easing } from 'react-native';
import { Clause } from '../types';
import { C, F, riskColors } from '../constants/theme';

interface Props {
  clause: Clause;
  isLast?: boolean;
}

export function ClauseCard({ clause, isLast }: Props) {
  const [expanded, setExpanded] = useState(false);
  const rotate = useRef(new Animated.Value(0)).current;
  const { fg } = riskColors[clause.risk];

  function toggle() {
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
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View>
      <TouchableOpacity onPress={toggle} activeOpacity={0.5} style={styles.row}>
        <View style={[styles.dot, { backgroundColor: fg }]} />
        <Text style={styles.title} numberOfLines={expanded ? undefined : 2}>
          {clause.title}
        </Text>
        <Animated.Text style={[styles.chevron, { transform: [{ rotate: chevronRotation }] }]}>
          ›
        </Animated.Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.expanded}>
          <Text style={styles.explanation}>{clause.explanation}</Text>
          {clause.severity_note && (
            <View style={styles.severityAlert}>
              <Text style={styles.severityIcon}>⚠️</Text>
              <Text style={styles.severityText}>{clause.severity_note}</Text>
            </View>
          )}
        </View>
      )}
      {!isLast && <View style={styles.separator} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: C.surface,
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    flex: 1,
    fontFamily: F.body,
    color: C.text1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
  },
  chevron: {
    fontFamily: F.body,
    fontSize: 22,
    color: C.text4,
    fontWeight: '300',
  },
  expanded: {
    paddingHorizontal: 16,
    paddingLeft: 36,
    paddingBottom: 16,
    paddingTop: 2,
    backgroundColor: C.surface,
  },
  explanation: {
    fontFamily: F.body,
    color: C.text2,
    fontSize: 14,
    lineHeight: 21,
  },
  severityAlert: {
    flexDirection: 'row',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    gap: 8,
  },
  severityIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  severityText: {
    flex: 1,
    fontFamily: F.body,
    color: '#E65100',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginLeft: 36,
  },
});
