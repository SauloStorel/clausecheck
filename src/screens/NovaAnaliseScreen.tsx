import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../services/supabase';
import { analyzeContractText, analyzeContractImage } from '../services/claude';
import { RootStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'NovaAnalise'>;
};

type Modo = 'foto' | 'texto';

export function NovaAnaliseScreen({ navigation }: Props) {
  const [modo, setModo] = useState<Modo>('foto');
  const [texto, setTexto] = useState('');
  const [imagemUri, setImagemUri] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [loading, setLoading] = useState(false);

  async function escolherImagem(origem: 'camera' | 'galeria') {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: false,
    };

    const result = origem === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0]) {
      setImagemUri(result.assets[0].uri);
    }
  }

  async function handleAnalisar() {
    if (modo === 'foto' && !imagemUri) {
      Alert.alert('Atenção', 'Selecione ou fotografe o contrato.');
      return;
    }
    if (modo === 'texto' && texto.trim().length < 50) {
      Alert.alert('Atenção', 'Cole o texto do contrato (mínimo 50 caracteres).');
      return;
    }

    setLoading(true);
    try {
      let report;

      if (modo === 'foto' && imagemUri) {
        const base64 = await FileSystem.readAsStringAsync(imagemUri, {
          encoding: 'base64',
        });
        report = await analyzeContractImage(base64);
      } else {
        report = await analyzeContractText(texto);
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('analyses')
        .insert({
          user_id: user!.id,
          title: titulo.trim() || 'Contrato sem título',
          input_text: modo === 'texto' ? texto : null,
          image_url: imagemUri,
          report,
          risk_level: report.risk_level,
        })
        .select()
        .single();

      if (error) throw error;

      navigation.replace('Relatorio', { analysisId: data.id });
    } catch (err: any) {
      Alert.alert('Erro na análise', err.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Analisar Contrato</Text>
      <Text style={styles.subheading}>Envie o contrato por foto ou cole o texto</Text>

      <View style={styles.tabs}>
        {(['foto', 'texto'] as Modo[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.tab, modo === m && styles.tabActive]}
            onPress={() => setModo(m)}
          >
            <Text style={[styles.tabText, modo === m && styles.tabTextActive]}>
              {m === 'foto' ? '📷 Foto' : '📝 Texto'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {modo === 'foto' ? (
        <View>
          {imagemUri ? (
            <TouchableOpacity onPress={() => setImagemUri(null)}>
              <Image source={{ uri: imagemUri }} style={styles.preview} />
              <Text style={styles.trocar}>Toque para trocar a imagem</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.fotoActions}>
              <TouchableOpacity style={styles.fotoBtn} onPress={() => escolherImagem('camera')}>
                <Text style={styles.fotoBtnIcon}>📷</Text>
                <Text style={styles.fotoBtnText}>Câmera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fotoBtn} onPress={() => escolherImagem('galeria')}>
                <Text style={styles.fotoBtnIcon}>🖼️</Text>
                <Text style={styles.fotoBtnText}>Galeria</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <TextInput
          style={styles.textArea}
          placeholder="Cole ou digite o texto do contrato aqui..."
          placeholderTextColor="#555"
          value={texto}
          onChangeText={setTexto}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Nome do contrato (opcional)"
        placeholderTextColor="#555"
        value={titulo}
        onChangeText={setTitulo}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAnalisar}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.buttonText}>Analisando com IA...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>🔍 Analisar com IA</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 20, paddingBottom: 40 },
  heading: { color: '#f3f4f6', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subheading: { color: '#6b7280', fontSize: 14, marginBottom: 20 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: '#4f46e5' },
  tabText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  fotoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  fotoBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 30,
    alignItems: 'center',
  },
  fotoBtnIcon: { fontSize: 28, marginBottom: 8 },
  fotoBtnText: { color: '#9ca3af', fontSize: 13 },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 6,
  },
  trocar: { color: '#6b7280', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  textArea: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    color: '#f3f4f6',
    fontSize: 14,
    minHeight: 180,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f3f4f6',
    fontSize: 15,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
});
