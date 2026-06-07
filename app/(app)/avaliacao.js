import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { avaliacaoService } from '../../services/api';
import { colors, spacing, borderRadius } from '../../constants/theme';

const MAX_FOTOS = 10;
const LABELS_NOTA = { 1: 'Péssimo 😞', 2: 'Ruim 😕', 3: 'Regular 😐', 4: 'Bom 😊', 5: 'Excelente 🤩' };

const alerta = (titulo, mensagem) => {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
  } else {
    Alert.alert(titulo, mensagem);
  }
};

function Estrelas({ valor, onPress }) {
  return (
    <View style={styles.estrelasRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onPress(n)} activeOpacity={0.7}>
          <Text style={[styles.estrela, n <= valor && styles.estrelaSelecionada]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function AvaliacaoScreen() {
  const { pedidoId, pedidoData, pedidoTotal, pedidoItens } = useLocalSearchParams();

  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [fotos, setFotos] = useState([]);
  const [localizacao, setLocalizacao] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const selecionarFotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alerta('Permissão necessária', 'Permita acesso à galeria para adicionar fotos.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
    });
    if (!resultado.canceled) {
      const novas = resultado.assets.slice(0, MAX_FOTOS - fotos.length);
      setFotos((prev) => [...prev, ...novas]);
    }
  };

  const tirarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alerta('Permissão necessária', 'Permita acesso à câmera para tirar fotos.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (!resultado.canceled) {
      setFotos((prev) => [...prev, resultado.assets[0]]);
    }
  };

  const removerFoto = (index) => setFotos((prev) => prev.filter((_, i) => i !== index));

  const capturarLocalizacao = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alerta('Permissão negada', 'Não foi possível acessar a localização.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    setLocalizacao({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    alerta('Localização capturada!', `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
  };

  const validar = () => {
    if (!pedidoId) { alerta('Erro', 'Pedido não identificado.'); return false; }
    if (nota === 0) { alerta('Atenção', 'Selecione uma nota de 1 a 5 estrelas.'); return false; }
    if (comentario.trim().length < 3) { alerta('Atenção', 'Comentário deve ter no mínimo 3 caracteres.'); return false; }
    if (comentario.trim().length > 1000) { alerta('Atenção', 'Comentário deve ter no máximo 1000 caracteres.'); return false; }
    return true;
  };

  const enviar = async () => {
    if (!validar()) return;
    setEnviando(true);
    try {
      const result = await avaliacaoService.criar(
        Number(pedidoId),
        nota,
        comentario.trim(),
        localizacao?.latitude,
        localizacao?.longitude,
      );
      if (!result.success) throw new Error(result.error);

      const avaliacaoId = result.data.id;

      for (const foto of fotos) {
        if (foto.base64) {
          await avaliacaoService.adicionarFoto(
            avaliacaoId,
            `data:image/jpeg;base64,${foto.base64}`,
            foto.fileName || `foto_${Date.now()}.jpg`,
          );
        }
      }

      setEnviado(true);
    } catch (e) {
      alerta('Erro', e.message || 'Não foi possível enviar a avaliação.');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <View style={styles.sucessoContainer}>
        <Text style={styles.sucessoIcon}>🎉</Text>
        <Text style={styles.sucessoTitulo}>Obrigado!</Text>
        <Text style={styles.sucessoTexto}>Sua avaliação foi enviada com sucesso.</Text>
        <TouchableOpacity style={styles.btnPrimario} onPress={() => router.back()}>
          <Text style={styles.btnPrimarioTexto}>Voltar aos pedidos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnVoltar} onPress={() => router.back()}>
          <Text style={styles.btnVoltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Como foi sua experiência?</Text>
        <Text style={styles.headerSubtitulo}>Sua opinião nos ajuda a melhorar!</Text>
      </View>

      <View style={styles.conteudo}>
        {/* Resumo do pedido */}
        {pedidoId && (
          <View style={styles.resumoPedido}>
            <Text style={styles.resumoTitulo}>Pedido #{pedidoId}</Text>
            {pedidoData ? <Text style={styles.resumoInfo}>{pedidoData}</Text> : null}
            {pedidoTotal ? <Text style={styles.resumoInfo}>{pedidoTotal}</Text> : null}
            {pedidoItens ? <Text style={styles.resumoItens} numberOfLines={2}>{pedidoItens}</Text> : null}
          </View>
        )}

        {/* NOTA */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Sua nota *</Text>
          <Estrelas valor={nota} onPress={setNota} />
          {nota > 0 && <Text style={styles.labelNota}>{LABELS_NOTA[nota]}</Text>}
        </View>

        {/* COMENTÁRIO */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Comentário *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Conte como foi sua experiência com a pizza, atendimento e entrega..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={5}
            value={comentario}
            onChangeText={setComentario}
            maxLength={1000}
          />
          <Text style={styles.contadorChars}>
            {comentario.length}/1000 — mínimo 3 caracteres
          </Text>
        </View>

        {/* FOTOS */}
        <View style={styles.secao}>
          <View style={styles.secaoHeaderRow}>
            <Text style={styles.secaoTitulo}>Fotos (opcional)</Text>
            <Text style={styles.contadorFotos}>{fotos.length}/{MAX_FOTOS}</Text>
          </View>

          {fotos.length < MAX_FOTOS && (
            <View style={styles.botoesfoto}>
              <TouchableOpacity style={[styles.btnAddFoto, styles.btnAddFotoMeio]} onPress={tirarFoto} activeOpacity={0.8}>
                <Text style={styles.btnAddFotoIcon}>📸</Text>
                <Text style={styles.btnAddFotoTexto}>Câmera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnAddFoto, styles.btnAddFotoMeio]} onPress={selecionarFotos} activeOpacity={0.8}>
                <Text style={styles.btnAddFotoIcon}>🖼️</Text>
                <Text style={styles.btnAddFotoTexto}>Galeria</Text>
              </TouchableOpacity>
            </View>
          )}

          {fotos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fotosScroll}>
              {fotos.map((foto, i) => (
                <View key={i} style={styles.fotoWrapper}>
                  <Image source={{ uri: foto.uri }} style={styles.fotoPreview} />
                  <TouchableOpacity style={styles.btnRemoverFoto} onPress={() => removerFoto(i)}>
                    <Text style={styles.btnRemoverFotoTexto}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* LOCALIZAÇÃO */}
        <View style={styles.secao}>
          <View style={styles.localizacaoRow}>
            <View>
              <Text style={styles.secaoTitulo}>Localização GPS</Text>
              <Text style={styles.localizacaoTexto}>
                {localizacao
                  ? `📍 ${localizacao.latitude.toFixed(4)}, ${localizacao.longitude.toFixed(4)}`
                  : 'Não capturada'}
              </Text>
            </View>
            <TouchableOpacity style={styles.btnLocalizacao} onPress={capturarLocalizacao}>
              <Text style={styles.btnLocalizacaoTexto}>📍 Capturar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BOTÃO ENVIAR */}
        <TouchableOpacity
          style={[styles.btnPrimario, enviando && styles.btnDisabled]}
          onPress={enviar}
          disabled={enviando}
          activeOpacity={0.85}
        >
          {enviando ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.btnPrimarioTexto}>Enviar Avaliação ✉️</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  btnVoltar: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  btnVoltarTexto: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  headerTitulo: { fontSize: 22, fontWeight: '700', color: colors.textInverse, textAlign: 'center' },
  headerSubtitulo: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs, textAlign: 'center' },

  conteudo: { padding: spacing.lg, paddingBottom: 100 },

  resumoPedido: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  resumoTitulo: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  resumoInfo: { fontSize: 13, color: colors.textSecondary },
  resumoItens: { fontSize: 13, color: colors.textMuted, marginTop: 4 },

  secao: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secaoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  secaoTitulo: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.md },

  estrelasRow: { flexDirection: 'row', gap: 8 },
  estrela: { fontSize: 44, color: colors.border },
  estrelaSelecionada: { color: '#F4B942' },
  labelNota: { marginTop: spacing.sm, fontSize: 15, fontWeight: '500', color: colors.primary, textAlign: 'center' },

  textArea: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    padding: spacing.md, fontSize: 15, color: colors.text,
    minHeight: 120, textAlignVertical: 'top',
  },
  contadorChars: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'right' },

  contadorFotos: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  botoesfoto: {
    flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md,
  },
  btnAddFoto: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed',
    borderRadius: borderRadius.md, paddingVertical: spacing.lg,
  },
  btnAddFotoMeio: { flex: 1 },
  btnAddFotoIcon: { fontSize: 24 },
  btnAddFotoTexto: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  fotosScroll: { marginTop: spacing.sm },
  fotoWrapper: { position: 'relative', marginRight: spacing.sm },
  fotoPreview: { width: 90, height: 90, borderRadius: borderRadius.sm },
  btnRemoverFoto: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: colors.error, borderRadius: 12, width: 22, height: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  btnRemoverFotoTexto: { color: '#fff', fontSize: 11, fontWeight: '700' },

  localizacaoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  localizacaoTexto: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  btnLocalizacao: {
    backgroundColor: `${colors.primary}15`, borderRadius: borderRadius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  btnLocalizacaoTexto: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  btnPrimario: {
    backgroundColor: colors.primary, borderRadius: borderRadius.full,
    paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.md,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimarioTexto: { fontSize: 16, fontWeight: '700', color: colors.textInverse },

  sucessoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, backgroundColor: colors.background },
  sucessoIcon: { fontSize: 72, marginBottom: spacing.lg },
  sucessoTitulo: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  sucessoTexto: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
});
