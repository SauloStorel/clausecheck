import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../services/supabase';
import { analyzeContractText, analyzeContractImage, analyzeContractPDF } from '../services/claude';
import { RootStackParamList } from '../types';
import { C, F } from '../constants/theme';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'NovaAnalise'> };
type Modo = 'foto' | 'pdf' | 'texto';

export function NovaAnaliseScreen({ navigation }: Props) {
  const [modo, setModo] = useState<Modo>('foto');
  const [texto, setTexto] = useState('');
  const [imagemUri, setImagemUri] = useState<string | null>(null);
  const [pdfNome, setPdfNome] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function abrirOpcoesFoto() {
    Alert.alert('Selecionar imagem', 'Como você quer obter a foto?', [
      { text: 'Câmera', onPress: () => escolherImagem('camera') },
      { text: 'Galeria', onPress: () => escolherImagem('galeria') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function escolherImagem(origem: 'camera' | 'galeria') {
    if (origem === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Permita o acesso à câmera nas configurações do dispositivo.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Permita o acesso à galeria nas configurações do dispositivo.');
        return;
      }
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6, allowsEditing: false,
    };
    const result = origem === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets[0]) setImagemUri(result.assets[0].uri);
  }

  async function handlePDFUpload() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) {
        Alert.alert('Erro', 'Nenhum arquivo selecionado.');
        return;
      }
      if (asset.size && asset.size > 10 * 1024 * 1024) {
        Alert.alert('Arquivo muito grande', 'O PDF deve ter no máximo 10MB.');
        return;
      }
      console.log('PDF URI:', asset.uri);
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
      setPdfNome(asset.name);
      setPdfBase64(base64);
      if (!titulo) setTitulo(asset.name.replace('.pdf', ''));
    } catch (err: any) {
      console.error('Erro ao ler PDF:', err);
      Alert.alert('Erro ao ler PDF', err?.message || 'Não foi possível ler o arquivo PDF. Verifique as permissões do dispositivo.');
    }
  }

  async function handleAnalisar() {
    if (modo === 'foto' && !imagemUri) { Alert.alert('Atenção', 'Selecione ou fotografe o contrato.'); return; }
    if (modo === 'pdf' && !pdfBase64) { Alert.alert('Atenção', 'Selecione um arquivo PDF.'); return; }
    if (modo === 'texto' && texto.trim().length < 50) { Alert.alert('Atenção', 'Cole o texto (mínimo 50 caracteres).'); return; }
    setLoading(true);
    try {
      let report;
      if (modo === 'foto' && imagemUri) {
        const base64 = await FileSystem.readAsStringAsync(imagemUri, { encoding: 'base64' });
        report = await analyzeContractImage(base64);
      } else if (modo === 'pdf' && pdfBase64) {
        report = await analyzeContractPDF(pdfBase64);
      } else {
        report = await analyzeContractText(texto);
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('analyses').insert({
        user_id: user!.id,
        title: titulo.trim() || 'Contrato sem título',
        input_text: modo === 'texto' ? texto : null,
        image_url: modo === 'foto' ? imagemUri : null,
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Segmented control */}
        <View style={styles.segmented}>
          {(['foto', 'pdf', 'texto'] as Modo[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.segment, modo === m && styles.segmentActive]}
              onPress={() => {
                setModo(m);
                setImagemUri(null);
                setPdfBase64(null);
                setTexto('');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.segmentText, modo === m && styles.segmentTextActive]}>
                {m === 'foto' ? 'Câmera' : m === 'pdf' ? 'PDF' : 'Texto'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {modo === 'foto' ? (
          imagemUri ? (
            <TouchableOpacity onPress={() => setImagemUri(null)} activeOpacity={0.85}>
              <Image source={{ uri: imagemUri }} style={styles.preview} />
              <Text style={styles.trocar}>Toque para trocar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={abrirOpcoesFoto}
              activeOpacity={0.7}
            >
              <Ionicons
                name="camera-outline"
                size={28}
                color={C.accent}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.uploadLabel}>Adicionar foto</Text>
            </TouchableOpacity>
          )
        ) : modo === 'pdf' ? (
          pdfBase64 ? (
            <View style={styles.pdfContainer}>
              <View style={styles.pdfInfo}>
                <Ionicons name="document-outline" size={20} color={C.accent} />
                <Text style={styles.pdfName}>{pdfNome}</Text>
              </View>
              <TouchableOpacity onPress={() => { setPdfBase64(null); setPdfNome(null); }} activeOpacity={0.7}>
                <Text style={styles.pdfChange}>Trocar arquivo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={handlePDFUpload}
              activeOpacity={0.7}
            >
              <Ionicons
                name="document-outline"
                size={28}
                color={C.accent}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.uploadLabel}>Selecionar PDF</Text>
            </TouchableOpacity>
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

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nome do contrato</Text>
          <TextInput
            style={[styles.input, focusedField === 'titulo' && styles.inputFocused]}
            placeholder="Opcional"
            placeholderTextColor={C.text3}
            value={titulo}
            onChangeText={setTitulo}
            onFocus={() => setFocusedField('titulo')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAnalisar}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={C.textInverse} size="small" style={{ marginRight: 10 }} />
              <Text style={styles.buttonText}>Analisando…</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Analisar contrato</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: C.borderStrong,
    borderRadius: 9,
    padding: 2,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 7,
  },
  segmentActive: {
    backgroundColor: C.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: {
    fontFamily: F.body,
    fontSize: 14,
    color: C.text2,
    fontWeight: '500',
  },
  segmentTextActive: { color: C.text1, fontWeight: '600' },
  uploadBtn: {
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingVertical: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 24,
  },
  uploadLabel: { fontFamily: F.body, fontSize: 15, color: C.text1, fontWeight: '500' },
  pdfContainer: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  pdfInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  pdfName: {
    flex: 1,
    fontFamily: F.body,
    fontSize: 15,
    color: C.text1,
    fontWeight: '500',
  },
  pdfChange: {
    fontFamily: F.body,
    fontSize: 13,
    color: C.accent,
    fontWeight: '500',
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: C.border,
  },
  trocar: {
    fontFamily: F.body,
    fontSize: 13,
    color: C.text3,
    textAlign: 'center',
    marginBottom: 24,
  },
  textArea: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    color: C.text1,
    fontFamily: F.body,
    fontSize: 15,
    minHeight: 200,
    marginBottom: 24,
  },
  textAreaFocused: { borderColor: C.accent },
  fieldGroup: { gap: 8, marginBottom: 28 },
  label: {
    fontFamily: F.body,
    fontSize: 13,
    fontWeight: '500',
    color: C.text2,
  },
  input: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    fontFamily: F.body,
    color: C.text1,
  },
  inputFocused: { borderColor: C.accent },
  button: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontFamily: F.body,
    color: C.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
});
