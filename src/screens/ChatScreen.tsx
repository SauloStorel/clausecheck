import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { sendChatMessage } from '../services/claude';
import { MessageBubble } from '../components/MessageBubble';
import { Analysis, Message, RootStackParamList } from '../types';
import { C, F } from '../constants/theme';

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
  const [focused, setFocused] = useState(false);
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
    return <View style={styles.centered}><ActivityIndicator color={C.gold} size="large" /></View>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.subHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>§</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiName}>ClauseCheck IA</Text>
          <Text style={styles.contractName} numberOfLines={1}>{analysis?.title}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        <TextInput
          style={styles.input}
          placeholder="Pergunte sobre o contrato..."
          placeholderTextColor={C.text3}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? <ActivityIndicator color={C.bg} size="small" /> : <Text style={styles.sendIcon}>↑</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  centered:       { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  subHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  avatar:         { width: 36, height: 36, borderRadius: 4, backgroundColor: C.goldDim, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontFamily: 'Georgia', fontSize: 18, color: C.gold },
  aiName:         { fontFamily: F.body, fontSize: 14, color: C.text1, fontWeight: '600' },
  contractName:   { fontFamily: F.mono, fontSize: 11, color: C.text3, maxWidth: 260, marginTop: 1 },
  divider:        { height: StyleSheet.hairlineWidth, backgroundColor: C.border },
  messageList:    { paddingVertical: 16, paddingBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16,
    paddingVertical: 12, gap: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg,
  },
  inputRowFocused: { borderTopColor: C.goldDim },
  input: {
    flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 4, paddingHorizontal: 14, paddingVertical: 10,
    color: C.text1, fontFamily: F.body, fontSize: 14, maxHeight: 100,
  },
  sendBtn:         { backgroundColor: C.gold, width: 40, height: 40, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.35 },
  sendIcon:        { color: C.bg, fontSize: 18, fontWeight: '700' },
});
