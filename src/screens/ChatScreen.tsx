import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { sendChatMessage } from '../services/claude';
import { MessageBubble } from '../components/MessageBubble';
import { Analysis, Message, RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { F } from '../constants/theme';

type Props = {
  route: RouteProp<RootStackParamList, 'Chat'>;
};

export function ChatScreen({ route }: Props) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { analysisId } = route.params;
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [{ data: anal }, { data: msgs }] = await Promise.all([
        supabase.from('analyses').select('*').eq('id', analysisId).single(),
        supabase.from('messages').select('*').eq('analysis_id', analysisId).order('created_at'),
      ]);
      setAnalysis(anal);
      if (msgs && msgs.length === 0) await insertWelcome(anal);
      else setMessages(msgs ?? []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o chat.');
    } finally {
      setLoading(false);
    }
  }

  async function insertWelcome(anal: Analysis | null) {
    const content = `Analisei o contrato "${anal?.title ?? 'sem título'}". O que você gostaria de saber?`;
    const { data } = await supabase.from('messages').insert({
      analysis_id: analysisId, role: 'assistant', content,
    }).select().single();
    if (data) setMessages([data]);
  }

  async function handleSend() {
    if (!input.trim() || sending) return;
    const userContent = input.trim();
    setInput('');
    setSending(true);
    const { data: userMsg } = await supabase.from('messages').insert({
      analysis_id: analysisId, role: 'user', content: userContent,
    }).select().single();
    if (userMsg) setMessages(prev => [...prev, userMsg]);
    try {
      const contractText = analysis?.input_text ?? JSON.stringify(analysis?.report ?? {});
      const reply = await sendChatMessage(contractText, messages, userContent);
      const { data: assistantMsg } = await supabase.from('messages').insert({
        analysis_id: analysisId, role: 'assistant', content: reply,
      }).select().single();
      if (assistantMsg) setMessages(prev => [...prev, assistantMsg]);
    } catch {
      Alert.alert('Erro', 'Não foi possível obter resposta.');
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={C.accent} size="large" /></View>;
  }

  const canSend = input.trim().length > 0 && !sending;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.subHeader}>
        <Text style={styles.contractTitle} numberOfLines={1}>
          {analysis?.title}
        </Text>
        <Text style={styles.aiTag}>Conversando com a IA</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputBar}>
        <View style={styles.inputPill}>
          <TextInput
            style={styles.input}
            placeholder="Pergunte sobre o contrato…"
            placeholderTextColor={C.text3}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.8}
            accessibilityLabel="Enviar mensagem"
            accessibilityRole="button"
          >
            {sending
              ? <ActivityIndicator color={C.textInverse} size="small" />
              : <Text style={styles.sendIcon}>↑</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(C: ReturnType<typeof import('../context/ThemeContext').useTheme>['C']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.surface },
    centered: { flex: 1, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center' },
    subHeader: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
    },
    contractTitle: {
      fontFamily: F.body,
      fontSize: 15,
      color: C.text1,
      fontWeight: '600',
      maxWidth: 280,
    },
    aiTag: {
      fontFamily: F.body,
      fontSize: 12,
      color: C.text3,
      marginTop: 1,
    },
    messageList: {
      paddingVertical: 12,
      paddingBottom: 8,
    },
    inputBar: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: C.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: C.border,
    },
    inputPill: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: C.bg,
      borderRadius: 22,
      paddingLeft: 16,
      paddingRight: 4,
      paddingVertical: 4,
      gap: 6,
    },
    input: {
      flex: 1,
      color: C.text1,
      fontFamily: F.body,
      fontSize: 15,
      maxHeight: 110,
      paddingVertical: 8,
      paddingTop: 8,
    },
    sendBtn: {
      backgroundColor: C.accent,
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 2,
    },
    sendBtnDisabled: { backgroundColor: C.text4 },
    sendIcon: {
      color: C.textInverse,
      fontSize: 18,
      fontWeight: '700',
      marginTop: -2,
    },
  });
}
