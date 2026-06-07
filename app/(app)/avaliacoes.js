import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { orderService, avaliacaoService } from '../../services/api';
import { colors, spacing, borderRadius } from '../../constants/theme';

const STATUS_INFO = {
  RECEBIDO:          { label: 'Recebido',          cor: colors.info,    icone: '📋' },
  EM_PREPARO:        { label: 'Em preparo',         cor: colors.warning, icone: '👨‍🍳' },
  PRONTO:            { label: 'Pronto',             cor: colors.success, icone: '✅' },
  SAIU_PARA_ENTREGA: { label: 'Saiu para entrega', cor: colors.primary, icone: '🛵' },
  ENTREGUE:          { label: 'Entregue',           cor: colors.success, icone: '🎉' },
  ENCERRADO:         { label: 'Encerrado',          cor: colors.textMuted, icone: '✔️' },
  CANCELADO:         { label: 'Cancelado',          cor: colors.error,   icone: '❌' },
};

function Estrelas({ valor, tamanho = 14 }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} style={{ fontSize: tamanho, color: n <= valor ? '#F4B942' : colors.border }}>★</Text>
      ))}
    </View>
  );
}

function PedidoCard({ pedido, avaliado, nota }) {
  const status = STATUS_INFO[pedido.status] || STATUS_INFO.RECEBIDO;
  const data = pedido.date
    ? new Date(pedido.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';
  const total = pedido.total != null
    ? `R$ ${Number(pedido.total).toFixed(2).replace('.', ',')}`
    : '—';
  const itensTexto = (pedido.items || [])
    .slice(0, 2)
    .map((i) => `${i.quantidade}x ${i.nomeProduto}`)
    .join(', ') + (pedido.items?.length > 2 ? '...' : '');

  const podeAvaliar = (pedido.status === 'ENTREGUE' || pedido.status === 'ENCERRADO' || pedido.status === 'CANCELADO') && !avaliado;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.pedidoInfo}>
          <Text style={styles.pedidoId}>Pedido #{pedido.id}</Text>
          <Text style={styles.pedidoData}>{data}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${status.cor}20` }]}>
          <Text style={styles.statusIcone}>{status.icone}</Text>
          <Text style={[styles.statusLabel, { color: status.cor }]}>{status.label}</Text>
        </View>
      </View>

      {itensTexto.length > 0 && (
        <Text style={styles.itensTexto} numberOfLines={1}>{itensTexto}</Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.total}>{total}</Text>

        {avaliado ? (
          <View style={styles.avaliadoBadge}>
            <Estrelas valor={nota} tamanho={14} />
            <Text style={styles.avaliadoTexto}>Avaliado</Text>
          </View>
        ) : podeAvaliar ? (
          <TouchableOpacity
            style={styles.btnAvaliar}
            onPress={() => router.push({ pathname: '/(app)/avaliacao', params: { pedidoId: pedido.id, pedidoData: data, pedidoTotal: total, pedidoItens: itensTexto } })}
          >
            <Text style={styles.btnAvaliarTexto}>⭐ Avaliar</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.naoDisponivel}>Aguardando entrega</Text>
        )}
      </View>
    </View>
  );
}

export default function AvaliacoesScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [avaliadosSet, setAvaliadosSet] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  const carregar = async () => {
    setCarregando(true);
    const [pedidosResult, minhasResult] = await Promise.all([
      orderService.getOrders(),
      avaliacaoService.listarMinhas(0, 100),
    ]);

    if (pedidosResult.success) {
      const sorted = [...(pedidosResult.data || [])].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setPedidos(sorted);
    }

    if (minhasResult.success) {
      const lista = minhasResult.data.content || minhasResult.data.data || [];
      const mapa = {};
      lista.forEach((av) => {
        if (av.pedidoId) mapa[av.pedidoId] = av.nota;
      });
      setAvaliadosSet(mapa);
    }

    setCarregando(false);
    setAtualizando(false);
  };

  const onRefresh = () => {
    setAtualizando(true);
    carregar();
  };

  const renderItem = ({ item }) => (
    <PedidoCard
      pedido={item}
      avaliado={!!avaliadosSet[item.id]}
      nota={avaliadosSet[item.id] || 0}
    />
  );

  const renderEmpty = () => !carregando && (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcone}>🍕</Text>
      <Text style={styles.emptyTitulo}>Nenhum pedido ainda</Text>
      <Text style={styles.emptyTexto}>Faça um pedido para poder avaliar</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitulo}>Avaliar Pedidos</Text>
      </View>

      {carregando && pedidos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listaConteudo}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={atualizando} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  headerBar: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTitulo: { fontSize: 20, fontWeight: '700', color: colors.textInverse },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listaConteudo: { padding: spacing.lg, paddingBottom: 100 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  pedidoInfo: { flex: 1 },
  pedidoId: { fontSize: 15, fontWeight: '700', color: colors.text },
  pedidoData: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusIcone: { fontSize: 12 },
  statusLabel: { fontSize: 11, fontWeight: '600' },

  itensTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  total: { fontSize: 15, fontWeight: '700', color: colors.text },

  avaliadoBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  avaliadoTexto: { fontSize: 12, color: colors.textMuted, marginLeft: 4 },

  btnAvaliar: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  btnAvaliarTexto: { fontSize: 13, fontWeight: '700', color: colors.textInverse },

  naoDisponivel: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },

  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcone: { fontSize: 56, marginBottom: spacing.md },
  emptyTitulo: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  emptyTexto: { fontSize: 14, color: colors.textSecondary },
});
