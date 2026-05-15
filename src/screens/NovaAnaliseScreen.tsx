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
import * as Haptics from 'expo-haptics';
import { analyzeContractText, analyzeContractImages, analyzeContractPDF, ProgressCallback } from '../services/claude';
import { useTheme } from '../context/ThemeContext';
import { F } from '../constants/theme';
import { RootStackParamList } from '../types';


const LEGAL_TIPS = [
  'Multas contratuais acima de 10% do valor total podem ser contestadas judicialmente.',
  'Em contratos de adesão, cláusulas ambíguas sempre favorecem quem assinou.',
  'Cláusulas de foro exclusivo podem dificultar ações judiciais no seu estado.',
  'Reajuste automático acima do IPCA pode ser questionado pelo Código Civil.',
  'Contratos por prazo indeterminado exigem cláusula de rescisão sem multa.',
  'Toda obrigação deve ter prazo definido — "a critério da parte" é cláusula abusiva.',
  'O Código Civil permite revisar contratos com prestações excessivamente onerosas.',
  'Verifique se há cláusula de renovação automática e seu prazo de cancelamento.',
];

type OverlayProps = {
  visible: boolean;
  C: any;
  progressPct?: number;
  progressStep?: string;
};

function AnalysisLoadingOverlay({ visible, C, progressPct = 0, progressStep = '' }: OverlayProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stepFade = useRef(new Animated.Value(1)).current;
  const tipFade = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const prevStep = useRef('');

  // Anima a barra suavemente para o valor real recebido
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPct / 100,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progressPct]);

  // Fade no texto do passo quando mudar
  useEffect(() => {
    if (!progressStep || progressStep === prevStep.current) return;
    prevStep.current = progressStep;
    Animated.sequence([
      Animated.timing(stepFade, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(stepFade, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [progressStep]);

  useEffect(() => {
    if (!visible) return;
    setTipIndex(0);
    progressAnim.setValue(0);
    prevStep.current = '';

    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Dicas rotacionam independentemente da IA, a cada 4s
    const tipInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(tipFade, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(tipFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setTipIndex(i => (i + 1) % LEGAL_TIPS.length);
    }, 4000);

    return () => {
      clearInterval(tipInterval);
      fadeAnim.setValue(0);
      stepFade.setValue(1);
      tipFade.setValue(1);
      progressAnim.setValue(0);
    };
  }, [visible]);

  if (!visible) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[loadingStyles.backdrop, { opacity: fadeAnim }]}>
        <View style={[loadingStyles.card, { backgroundColor: C.surface }]}>

          {/* Ícone + título */}
          <View style={loadingStyles.header}>
            <View style={[loadingStyles.iconCircle, { backgroundColor: C.accent + '18' }]}>
              <Ionicons name="document-text-outline" size={28} color={C.accent} />
            </View>
            <Text style={[loadingStyles.title, { color: C.text1 }]}>Analisando contrato</Text>
          </View>

          {/* Barra de progresso real */}
          <View style={[loadingStyles.progressTrack, { backgroundColor: C.border }]}>
            <Animated.View
              style={[loadingStyles.progressFill, { backgroundColor: C.accent, width: progressWidth }]}
            />
          </View>

          {/* Passo atual com fade */}
          <Animated.Text style={[loadingStyles.step, { color: C.accent, opacity: stepFade }]}>
            {progressStep || 'Lendo o contrato…'}
          </Animated.Text>

          {/* Separador */}
          <View style={[loadingStyles.divider, { backgroundColor: C.border }]} />

          {/* Dica jurídica */}
          <View style={loadingStyles.tipContainer}>
            <Text style={[loadingStyles.tipLabel, { color: C.text3 }]}>💡 Você sabia?</Text>
            <Animated.Text style={[loadingStyles.tipText, { color: C.text2, opacity: tipFade }]}>
              {LEGAL_TIPS[tipIndex]}
            </Animated.Text>
          </View>

        </View>
      </Animated.View>
    </Modal>
  );
}

const loadingStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: F.display,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  step: {
    fontFamily: F.body,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    minHeight: 18,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
  },
  tipContainer: {
    gap: 6,
  },
  tipLabel: {
    fontFamily: F.body,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipText: {
    fontFamily: F.body,
    fontSize: 13,
    lineHeight: 19,
    minHeight: 38,
  },
});

type Props = { navigation: StackNavigationProp<RootStackParamList, 'NovaAnalise'> };
type Modo = 'foto' | 'pdf' | 'texto';

const MAX_IMAGES = 5;

const MODOS: { id: Modo; icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
  { id: 'foto',  icon: 'camera-outline',        label: 'Câmera' },
  { id: 'pdf',   icon: 'document-text-outline', label: 'PDF'    },
  { id: 'texto', icon: 'text-outline',          label: 'Texto'  },
];

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
  const [analysisPct, setAnalysisPct] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');
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
      mediaTypes: ['images'] as ImagePicker.MediaType[],
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
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
      setPdfNome(asset.name);
      setPdfBase64(base64);
      if (!titulo) setTitulo(asset.name.replace('.pdf', ''));
    } catch (err: any) {
      Alert.alert('Erro ao ler PDF', err?.message || 'Não foi possível ler o arquivo PDF. Verifique as permissões do dispositivo.');
    }
  }

  async function handleAnalisar() {
    if (modo === 'foto' && imagemUris.length === 0) { Alert.alert('Atenção', 'Selecione ou fotografe o contrato.'); return; }
    if (modo === 'pdf' && !pdfBase64) { Alert.alert('Atenção', 'Selecione um arquivo PDF.'); return; }
    if (modo === 'texto' && texto.trim().length < 50) { Alert.alert('Atenção', 'Cole o texto (mínimo 50 caracteres).'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setAnalysisPct(0);
    setAnalysisStep('');
    const onProgress: ProgressCallback = (pct, step) => {
      setAnalysisPct(pct);
      setAnalysisStep(step);
    };
    try {
      let report;
      if (modo === 'foto' && imagemUris.length > 0) {
        const base64Images = await Promise.all(
          imagemUris.map(uri => FileSystem.readAsStringAsync(uri, { encoding: 'base64' }))
        );
        report = await analyzeContractImages(base64Images, onProgress);
      } else if (modo === 'pdf' && pdfBase64) {
        report = await analyzeContractPDF(pdfBase64, onProgress);
      } else {
        report = await analyzeContractText(texto, onProgress);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('Relatorio', { analysisId: data.id });
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro na análise', err.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: C.bg }]} edges={['bottom']}>
      <AnalysisLoadingOverlay visible={loading} C={C} progressPct={analysisPct} progressStep={analysisStep} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modeCards}>
          {MODOS.map(m => {
            const active = modo === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.modeCard, active && styles.modeCardActive]}
                onPress={() => { setModo(m.id); setImagemUris([]); setPdfBase64(null); setTexto(''); }}
                activeOpacity={0.7}
              >
                <Ionicons name={m.icon} size={26} color={active ? C.accent : C.text3} style={styles.modeIcon} />
                <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
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
    modeCards: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 24,
    },
    modeCard: {
      flex: 1,
      backgroundColor: C.surface,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: C.border,
      gap: 4,
    },
    modeCardActive: {
      borderColor: C.accent,
      backgroundColor: C.accentSoft,
    },
    modeIcon: {
      marginBottom: 2,
    },
    modeLabel: {
      fontFamily: F.body,
      fontSize: 13,
      fontWeight: '600',
      color: C.text2,
    },
    modeLabelActive: {
      color: C.accent,
    },
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
