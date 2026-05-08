import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
  Animated, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../services/supabase';
import { analyzeContractText, analyzeContractImages, analyzeContractPDF } from '../services/claude';
import { useTheme } from '../context/ThemeContext';
import { F } from '../constants/theme';
import { RootStackParamList } from '../types';

const LOADING_STEPS = [
  'Lendo o contrato…',
  'Identificando cláusulas…',
  'Avaliando riscos jurídicos…',
  'Verificando base legal…',
  'Preparando o relatório…',
];

function AnalysisLoadingOverlay({ visible, C }: { visible: boolean; C: any }) {
  const [stepIndex, setStepIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const textFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    setStepIndex(0);

    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(textFade, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(textFade, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setStepIndex(i => (i + 1) % LOADING_STEPS.length);
    }, 2200);

    return () => {
      pulse.stop();
      clearInterval(interval);
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
      textFade.setValue(1);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[loadingStyles.backdrop, { opacity: fadeAnim }]}>
        <View style={[loadingStyles.card, { backgroundColor: C.surface }]}>
          <Animated.View style={[loadingStyles.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
            <ActivityIndicator color={C.accent} size="large" />
          </Animated.View>
          <Text style={[loadingStyles.title, { color: C.text1 }]}>Analisando contrato</Text>
          <Animated.Text style={[loadingStyles.step, { color: C.accent, opacity: textFade }]}>
            {LOADING_STEPS[stepIndex]}
          </Animated.Text>
          <Text style={[loadingStyles.hint, { color: C.text4 }]}>Isso pode levar alguns segundos</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const loadingStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 36,
    paddingVertical: 36,
    alignItems: 'center',
    width: 280,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconWrap: {
    marginBottom: 20,
  },
  title: {
    fontFamily: F.display,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  step: {
    fontFamily: F.body,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 20,
  },
  hint: {
    fontFamily: F.body,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});

type Props = { navigation: StackNavigationProp<RootStackParamList, 'NovaAnalise'> };
type Modo = 'foto' | 'pdf' | 'texto';

const MAX_IMAGES = 5;

export function NovaAnaliseScreen({ navigation }: Props) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [modo, setModo] = useState<Modo>('foto');
  const [texto, setTexto] = useState('');
  const [imagemUris, setImagemUris] = useState<string[]>([]);
  const [pdfNome, setPdfNome] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function abrirOpcoesFoto() {
    Alert.alert('Adicionar foto', 'Como você quer obter a foto?', [
      { text: 'Câmera', onPress: () => escolherImagem('camera') },
      { text: 'Galeria', onPress: () => escolherImagem('galeria') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function escolherImagem(origem: 'camera' | 'galeria') {
    if (imagemUris.length >= MAX_IMAGES) {
      Alert.alert('Limite atingido', `Você pode adicionar no máximo ${MAX_IMAGES} fotos.`);
      return;
    }

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

    const remaining = MAX_IMAGES - imagemUris.length;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: false,
      allowsMultipleSelection: origem === 'galeria',
      selectionLimit: remaining,
    };
    const result = origem === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map(a => a.uri);
      setImagemUris(prev => [...prev, ...newUris].slice(0, MAX_IMAGES));
    }
  }

  function removeImagem(index: number) {
    setImagemUris(prev => prev.filter((_, i) => i !== index));
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
    if (modo === 'foto' && imagemUris.length === 0) { Alert.alert('Atenção', 'Selecione ou fotografe o contrato.'); return; }
    if (modo === 'pdf' && !pdfBase64) { Alert.alert('Atenção', 'Selecione um arquivo PDF.'); return; }
    if (modo === 'texto' && texto.trim().length < 50) { Alert.alert('Atenção', 'Cole o texto (mínimo 50 caracteres).'); return; }
    setLoading(true);
    try {
      let report;
      if (modo === 'foto' && imagemUris.length > 0) {
        const base64Images = await Promise.all(
          imagemUris.map(uri => FileSystem.readAsStringAsync(uri, { encoding: 'base64' }))
        );
        report = await analyzeContractImages(base64Images);
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
        image_url: modo === 'foto' && imagemUris.length > 0 ? imagemUris[0] : null,
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: C.bg }]} edges={['bottom']}>
      <AnalysisLoadingOverlay visible={loading} C={C} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.segmented}>
          {(['foto', 'pdf', 'texto'] as Modo[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.segment, modo === m && styles.segmentActive]}
              onPress={() => {
                setModo(m);
                setImagemUris([]);
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
          <View>
            {imagemUris.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailRow}
                style={styles.thumbnailScroll}
              >
                {imagemUris.map((uri, index) => (
                  <View key={uri + index} style={styles.thumbnailWrap}>
                    <Image source={{ uri }} style={styles.thumbnail} />
                    <TouchableOpacity
                      style={[styles.removeBtn, { backgroundColor: C.danger }]}
                      onPress={() => removeImagem(index)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            {imagemUris.length < MAX_IMAGES && (
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
                <Text style={styles.uploadLabel}>
                  {imagemUris.length === 0 ? 'Adicionar foto' : 'Adicionar mais'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
          <Text style={styles.buttonText}>Analisar contrato</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof import('../context/ThemeContext').useTheme>['C']) {
  return StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
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
    thumbnailScroll: {
      marginBottom: 12,
    },
    thumbnailRow: {
      gap: 10,
      paddingRight: 4,
    },
    thumbnailWrap: {
      position: 'relative',
    },
    thumbnail: {
      width: 100,
      height: 130,
      borderRadius: 8,
      backgroundColor: C.border,
    },
    removeBtn: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeBtnText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
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
  });
}
