import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, ScrollView, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../services/supabase';
import { analyzeContractText, analyzeContractImage } from '../services/claude';
import { RootStackParamList } from '../types';
import { C, F } from '../constants/theme';
import { useEntrance } from '../hooks/useEntrance';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'NovaAnalise'> };
type Modo = 'foto' | 'texto';

export function NovaAnaliseScreen({ navigation }: Props) {
  const [modo, setModo] = useState<Modo>('foto');
  const [texto, setTexto] = useState('');
  const [imagemUri, setImagemUri] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const tabs   = useEntrance(60);
  const upload = useEntrance(140);
  const nome   = useEntrance(220);
  const btn    = useEntrance(300);

  async function escolherImagem(origem: 'camera' | 'galeria') {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6, allowsEditing: false,
    };
    const result = origem === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets[0]) setImagemUri(result.assets[0].uri);
  }

  async function handleAnalisar() {
    if (modo === 'foto' && !imagemUri) { Alert.alert('Atenção', 'Selecione ou fotografe o contrato.'); return; }
    if (modo === 'texto' && texto.trim().length < 50) { Alert.alert('Atenção', 'Cole o texto (mínimo 50 caracteres).'); return; }
    setLoading(true);
    try {
      let report;
      if (modo === 'foto' && imagemUri) {
        const base64 = await FileSystem.readAsStringAsync(imagemUri, { encoding: 'base64' });
        report = await analyzeContractImage(base64);
      } else {
        report = await analyzeContractText(texto);
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('analyses').insert({
        user_id: user!.id,
        title: titulo.trim() || 'Contrato sem título',
        input_text: modo === 'texto' ? texto : null,
        image_url: imagemUri,
        report,
        risk_level: report.risk_level,
      }).select().single();
      if (error) throw error;
      navigation.replace('Relatorio', { analysisId: data.id });
    } catch (err: any) {
      Alert.alert('Erro na análise', err.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Animated.View style={tabs}>
          <View style={styles.tabsWrapper}>
            {(['foto', 'texto'] as Modo[]).map(m => (
              <TouchableOpacity key={m} style={styles.tab} onPress={() => setModo(m)} activeOpacity={0.7}>
                <Text style={[styles.tabText, modo === m && styles.tabTextActive]}>
                  {m === 'foto' ? 'Foto / Imagem' : 'Colar Texto'}
                </Text>
                {modo === m && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.divider} />
        </Animated.View>

        <Animated.View style={upload}>
          {modo === 'foto' ? (
            imagemUri ? (
              <TouchableOpacity onPress={() => setImagemUri(null)} activeOpacity={0.8}>
                <Image source={{ uri: imagemUri }} style={styles.preview} />
                <Text style={styles.trocar}>Toque para trocar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.uploadRow}>
                {(['camera', 'galeria'] as const).map(o => (
                  <TouchableOpacity key={o} style={styles.uploadBtn} onPress={() => escolherImagem(o)} activeOpacity={0.7}>
                    <Text style={styles.uploadIcon}>{o === 'camera' ? '◉' : '▣'}</Text>
                    <Text style={styles.uploadLabel}>{o === 'camera' ? 'Câmera' : 'Galeria'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )
          ) : (
            <TextInput
              style={[styles.textArea, focusedField === 'text' && styles.textAreaFocused]}
              placeholder="Cole ou digite o texto do contrato aqui..."
              placeholderTextColor={C.text3}
              value={texto}
              onChangeText={setTexto}
              multiline
              textAlignVertical="top"
              onFocus={() => setFocusedField('text')}
              onBlur={() => setFocusedField(null)}
            />
          )}
        </Animated.View>

        <Animated.View style={nome}>
          <Text style={styles.fieldLabel}>NOME DO CONTRATO</Text>
          <TextInput
            style={[styles.input, focusedField === 'titulo' && styles.inputFocused]}
            placeholder="Opcional"
            placeholderTextColor={C.text3}
            value={titulo}
            onChangeText={setTitulo}
            onFocus={() => setFocusedField('titulo')}
            onBlur={() => setFocusedField(null)}
          />
        </Animated.View>

        <Animated.View style={[{ marginTop: 32 }, btn]}>
          <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleAnalisar} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={C.bg} size="small" style={{ marginRight: 10 }} />
                <Text style={styles.buttonText}>ANALISANDO...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>ANALISAR CONTRATO</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  content:         { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 60 },
  tabsWrapper:     { flexDirection: 'row', marginBottom: 0 },
  tab:             { flex: 1, paddingBottom: 12, alignItems: 'center', position: 'relative' },
  tabText:         { fontFamily: F.body, fontSize: 14, color: C.text3, fontWeight: '500' },
  tabTextActive:   { color: C.text1 },
  tabUnderline:    { position: 'absolute', bottom: 0, left: 20, right: 20, height: 1, backgroundColor: C.gold },
  divider:         { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginBottom: 24 },
  uploadRow:       { flexDirection: 'row', gap: 12, marginBottom: 24 },
  uploadBtn: {
    flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4,
    borderStyle: 'dashed', paddingVertical: 36, alignItems: 'center', backgroundColor: C.surface,
  },
  uploadIcon:      { fontFamily: F.mono, fontSize: 24, color: C.goldDim, marginBottom: 10 },
  uploadLabel:     { fontFamily: F.body, fontSize: 13, color: C.text2 },
  preview:         { width: '100%', height: 220, borderRadius: 4, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  trocar:          { fontFamily: F.mono, fontSize: 10, color: C.text3, textAlign: 'center', marginBottom: 24, letterSpacing: 1 },
  textArea: {
    borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 14,
    color: C.text1, fontFamily: F.body, fontSize: 14, minHeight: 180, backgroundColor: C.surface, marginBottom: 24,
  },
  textAreaFocused: { borderColor: C.gold },
  fieldLabel:      { fontFamily: F.mono, fontSize: 10, color: C.text3, letterSpacing: 2, marginBottom: 8, marginTop: 4 },
  input:           { borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 10, fontSize: 15, fontFamily: F.body, color: C.text1 },
  inputFocused:    { borderBottomColor: C.gold },
  button:          { backgroundColor: C.gold, borderRadius: 4, paddingVertical: 17, alignItems: 'center' },
  buttonText:      { fontFamily: F.body, color: C.bg, fontSize: 12, fontWeight: '700', letterSpacing: 3 },
  loadingRow:      { flexDirection: 'row', alignItems: 'center' },
});
