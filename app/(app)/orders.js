import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { orderService } from '../../services/api';
import { colors, spacing, borderRadius } from '../../constants/theme';

const ORDER_STATUS = {
  RECEBIDO:          { label: 'Recebido',          color: colors.info,    icon: '📋' },
  EM_PREPARO:        { label: 'Em preparo',         color: colors.warning, icon: '👨‍🍳' },
  PRONTO:            { label: 'Pronto',             color: colors.success, icon: '✅' },
  SAIU_PARA_ENTREGA: { label: 'Saiu p/ entrega',   color: colors.primary, icon: '🛵' },
  ENTREGUE:          { label: 'Entregue',           color: colors.success, icon: '🎉' },
  ENCERRADO:         { label: 'Encerrado',          color: colors.textMuted, icon: '✔️' },
  CANCELADO:         { label: 'Cancelado',          color: colors.error,   icon: '❌' },
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

function OrderCard({ item, onPress }) {
  const statusInfo = ORDER_STATUS[item.status] || ORDER_STATUS.RECEBIDO;
  const itensTexto = (item.items || [])
    .slice(0, 3)
    .map((i) => `${i.quantidade || 1}x ${i.nomeProduto || 'Item'}`)
    .join(' · ');
  const temMais = (item.items || []).length > 3;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Linha 1: ID + badge status */}
      <View style={styles.cardTop}>
        <Text style={styles.cardId}>Pedido #{item.id}</Text>
        <View style={[styles.badge, { backgroundColor: `${statusInfo.color}20` }]}>
          <Text style={styles.badgeIcon}>{statusInfo.icon}</Text>
          <Text style={[styles.badgeLabel, { color: statusInfo.color }]} numberOfLines={1}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Linha 2: itens */}
      {itensTexto.length > 0 && (
        <Text style={styles.itens} numberOfLines={2}>
          {itensTexto}{temMais ? ' ...' : ''}
        </Text>
      )}

      {/* Linha 3: data + total */}
      <View style={styles.cardBottom}>
        <Text style={styles.data}>{formatDate(item.date)}</Text>
        <Text style={styles.total}>
          R$ {Number(item.total || 0).toFixed(2).replace('.', ',')}
        </Text>
      </View>

      <Text style={styles.verDetalhes}>Ver detalhes →</Text>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => { loadOrders(); }, [])
  );

  const loadOrders = async () => {
    try {
      const result = await orderService.getOrders();
      if (result.success) setOrders(result.data);
    } catch (e) {
      console.error('Erro ao carregar pedidos:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Pedidos</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <OrderCard
            item={item}
            onPress={() => router.push({ pathname: '/(app)/order-tracking', params: { orderId: item.id } })}
          />
        )}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍕</Text>
            <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
            <Text style={styles.emptyText}>Faça seu primeiro pedido e acompanhe aqui!</Text>
            <TouchableOpacity style={styles.btnNovoPedido} onPress={() => router.replace('/(app)/order')}>
              <Text style={styles.btnNovoPedidoText}>Fazer pedido</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} colors={[colors.primary]} />
        }
      />

      {orders.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => router.replace('/(app)/order')} activeOpacity={0.85}>
          <Text style={styles.fabText}>+ Novo pedido</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textInverse },

  lista: { padding: spacing.md, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardId: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
    maxWidth: 140,
  },
  badgeIcon: { fontSize: 12 },
  badgeLabel: { fontSize: 11, fontWeight: '600', flexShrink: 1 },

  itens: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  data: { fontSize: 12, color: colors.textMuted },
  total: { fontSize: 16, fontWeight: '700', color: colors.primary },

  verDetalhes: {
    fontSize: 12,
    color: colors.primary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.xl },
  btnNovoPedido: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
  },
  btnNovoPedidoText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },

  // FAB
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  fabText: { fontSize: 14, fontWeight: '700', color: colors.textInverse },
});
