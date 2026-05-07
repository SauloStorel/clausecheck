import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isAssistant = message.role === 'assistant';

  return (
    <View style={[styles.wrapper, isAssistant ? styles.wrapperLeft : styles.wrapperRight]}>
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
    marginHorizontal: 12,
  },
  wrapperLeft: {
    alignItems: 'flex-start',
  },
  wrapperRight: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAssistant: {
    backgroundColor: '#1e1b4b',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#1e293b',
    borderBottomRightRadius: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  textAssistant: {
    color: '#c7d2fe',
  },
  textUser: {
    color: '#e2e8f0',
  },
});
