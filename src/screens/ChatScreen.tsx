import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { sendChatMessage } from '../services/claude';
import { MessageBubble } from '../components/MessageBubble';
import { Analysis, Message, RootStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Chat'>;
  route: RouteProp<RootStackParamList, 'Chat'>;
};

export function ChatScreen({ route }: Props) {
  const { analysisId } = route.params;
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [{ data: anal }, { data: msgs }] = await Promise.all([
        supabase.from('analyses').select('*').eq('id', analysisId).single(),
        supabase.from('messages').select('*').eq('analysis_id', analysisId).order('created_at'),
      ]);

      setAnalysis(anal);

      if (msgs && msgs.length === 0) {
        await insertWelcome(anal);
      } else {
        setMessages(msgs ?? []);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o chat.');
    } finally {
      setLoading(false);
    }
  }

  async function insertWelcome(anal: Analysis | null) {
    const welcomeContent = `Olá! Analisei o contrato **${anal?.title ?? 'sem título'}** e estou pronto para responder suas dúvidas. O que você gostaria de saber?`;
    const { data } = await supabase.from('messages').insert({
      analysis_id: analysisId,
      role: 'assistant',
      content: welcomeContent,
    }).select().single();
    if (data) setMessages([data]);
  }

  async function handleSend() {
    if (!input.trim() || sending) return;

    const userContent = input.trim();
    setInput('');
    setSending(true);

    const { data: userMsg } = await supabase.from('messages').insert({
      analysis_id: analysisId,
      role: 'user',
      content: userContent,
    }).select().single();

    if (userMsg) setMessages(prev => [...prev, userMsg]);

    try {
      const contractText = analysis?.input_text ?? analysis?.report
        ? JSON.stringify(analysis.report)
        : 'Contrato sem texto disponível';

      const reply = await sendChatMessage(contractText, messages, userContent);

      const { data: assistantMsg } = await supabase.from('messages').insert({
        analysis_id: analysisId,
        role: 'assistant',
        content: reply,
      }).select().single();

      if (assistantMsg) setMessages(prev => [...prev, assistantMsg]);
    } catch {
      Alert.alert('Erro', 'Não foi possível obter resposta. Tente novamente.');
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#4f46e5" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.chatHeader}>
        <Text style={styles.avatarEmoji}>⚖️</Text>
        <View>
          <Text style={styles.aiName}>ClauseCheck IA</Text>
          <Text style={styles.contractName} numberOfLines={1}>{analysis?.title}</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Pergunte algo sobre o contrato..."
          placeholderTextColor="#555"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.sendIcon}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  centered: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  avatarEmoji: { fontSize: 28 },
  aiName: { color: '#f3f4f6', fontSize: 15, fontWeight: '600' },
  contractName: { color: '#6b7280', fontSize: 12, maxWidth: 260 },
  messageList: { paddingVertical: 12, paddingBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#f3f4f6',
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#4f46e5',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
