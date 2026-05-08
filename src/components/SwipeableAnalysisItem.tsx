import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Analysis } from '../types';
import { useTheme } from '../context/ThemeContext';
import { F } from '../constants/theme';
import { AnalysisItem } from './AnalysisItem';

interface Props {
  analysis: Analysis;
  isLast?: boolean;
  onPress: () => void;
  onDelete: (id: string) => void;
}

export function SwipeableAnalysisItem({ analysis, isLast, onPress, onDelete }: Props) {
  const { C } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  function renderRightActions() {
    return (
      <TouchableOpacity
        style={[styles.deleteAction, { backgroundColor: C.danger }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          Alert.alert(
            'Excluir análise',
            'Deseja excluir esta análise? Essa ação não pode ser desfeita.',
            [
              {
                text: 'Cancelar',
                style: 'cancel',
                onPress: () => swipeableRef.current?.close(),
              },
              {
                text: 'Excluir',
                style: 'destructive',
                onPress: () => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  onDelete(analysis.id);
                },
              },
            ]
          );
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.deleteText}>Excluir</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={60}
      overshootRight={false}
      onSwipeableOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
    >
      <AnalysisItem
        analysis={analysis}
        isLast={isLast}
        onPress={onPress}
      />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
  },
  deleteText: {
    fontFamily: F.body,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
