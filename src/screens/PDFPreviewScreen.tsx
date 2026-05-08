import React, { useLayoutEffect, useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { getCachedHTML, getCachedAnalysis } from '../services/pdfCache';
import { exportReportPDF, sharePDF } from '../services/pdf';
import { RootStackParamList } from '../types';
import { C } from '../constants/theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'PDFPreview'>;
  route: RouteProp<RootStackParamList, 'PDFPreview'>;
};

export function PDFPreviewScreen({ navigation, route }: Props) {
  const { analysisId } = route.params;
  const [sharing, setSharing] = useState(false);

  const html     = getCachedHTML(analysisId) ?? '';
  const analysis = getCachedAnalysis(analysisId);

  async function handleShare() {
    if (!analysis || sharing) return;
    setSharing(true);
    try {
      const { uri } = await exportReportPDF(analysis);
      await sharePDF(uri);
    } catch {
      Alert.alert('Erro', 'Não foi possível exportar o PDF.');
    } finally {
      setSharing(false);
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleShare}
          disabled={!analysis || sharing}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          {sharing
            ? <ActivityIndicator size="small" color={C.accent} />
            : <Ionicons name="share-outline" size={22} color={C.accent} />}
        </TouchableOpacity>
      ),
    });
  }, [analysis, sharing]);

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  webview: { flex: 1 },
  headerButton: { marginRight: 16, padding: 4 },
});
