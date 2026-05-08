import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';
import { Message } from '../types';
import { useTheme } from '../context/ThemeContext';
import { F } from '../constants/theme';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const isAssistant = message.role === 'assistant';

  const markdownStyles = {
    body: {
      color: isAssistant ? C.text1 : C.textInverse,
      fontFamily: F.body,
      fontSize: 15,
      lineHeight: 21,
    },
    strong: {
      fontWeight: 'bold' as const,
      color: isAssistant ? C.text1 : C.textInverse,
    },
    em: {
      fontStyle: 'italic' as const,
      color: isAssistant ? C.text1 : C.textInverse,
    },
    text: {
      color: isAssistant ? C.text1 : C.textInverse,
      fontFamily: F.body,
      fontSize: 15,
      lineHeight: 21,
    },
  };

  return (
    <View style={[styles.wrapper, isAssistant ? styles.alignLeft : styles.alignRight]}>
      <View style={[styles.bubble, isAssistant ? styles.bubbleAssistant : [styles.bubbleUser, { backgroundColor: C.accent }]]}>
        <Markdown style={markdownStyles}>
          {message.content}
        </Markdown>
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof import('../context/ThemeContext').useTheme>['C']) {
  return StyleSheet.create({
    wrapper: {
      marginVertical: 3,
      marginHorizontal: 12,
      flexDirection: 'row',
    },
    alignLeft:  { justifyContent: 'flex-start' },
    alignRight: { justifyContent: 'flex-end' },
    bubble: {
      maxWidth: '78%',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
    },
    bubbleAssistant: {
      backgroundColor: C.surfaceRaised,
      borderBottomLeftRadius: 6,
    },
    bubbleUser: {
      borderBottomRightRadius: 6,
    },
  });
}
