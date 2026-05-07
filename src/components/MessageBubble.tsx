import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types';
import { C, F } from '../constants/theme';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isAssistant = message.role === 'assistant';

  return (
    <View style={[styles.wrapper, isAssistant ? styles.wrapperLeft : styles.wrapperRight]}>
      {isAssistant && (
        <View style={styles.avatarDot} />
      )}
      <View style={[styles.bubble, isAssistant ? styles.bubbleAssistant : styles.bubbleUser]}>
        <Text style={[styles.text, isAssistant ? styles.textAssistant : styles.textUser]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  wrapperLeft:      { justifyContent: 'flex-start' },
  wrapperRight:     { justifyContent: 'flex-end' },
  avatarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.goldDim,
    marginBottom: 12,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleAssistant: {
    backgroundColor: C.surface,
    borderColor: C.border,
    borderBottomLeftRadius: 1,
  },
  bubbleUser: {
    backgroundColor: C.goldDim,
    borderColor: C.gold,
    borderBottomRightRadius: 1,
  },
  text: {
    fontFamily: F.body,
    fontSize: 14,
    lineHeight: 21,
  },
  textAssistant: { color: C.text2 },
  textUser:      { color: C.goldLight },
});
