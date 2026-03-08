import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../services/api';
import { colors, spacing, borderRadius } from '../../constants/theme';

// Status do pedido conforme API
const ORDER_STATUS = {
  RECEBIDO: { label: 'Recebido', color: colors.info, icon: '📋' },
  EM_PREPARO: { label: 'Em preparo', color: colors.warning, icon: '👨‍🍳' },
  PRONTO: { label: 'Pronto', color: colors.success, icon: '✅' },
  SAIU_PARA_ENTREGA: { label: 'Saiu para entrega', color: colors.primary, icon: '🛵' },
  ENTREGUE: { label: 'Entregue', color: colors.success, icon: '🎉' },
  CANCELADO: { label: 'Cancelado', color: colors.error, icon: '❌' },
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Recarrega ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    try {
      const result = await orderService.getOrders();
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOrderPress = (order) => {
    router.push({
      pathname: '/(app)/order-tracking',
      params: { orderId: order.id },
    });
  };

  const renderOrderItem = ({ item }) => {
    const statusInfo = ORDER_STATUS[item.status] || ORDER_STATUS.RECEBIDO;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderId}>Pedido #{item.id}</Text>
            <Text style={styles.orderDate}>{formatDate(item.date)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
            <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderContent}>
          {item.items && item.items.length > 0 ? (
            <View style={styles.itemsList}>
              {item.items.slice(0, 3).map((orderItem, index) => (
                <Text key={index} style={styles.itemText} numberOfLines={1}>
                  {orderItem.quantidade || 1}x {orderItem.nomeProduto || 'Item'}
                </Text>
              ))}
              {item.items.length > 3 && (
                <Text style={styles.moreItems}>+{item.items.length - 3} itens</Text>
              )}
            </View>
          ) : (
            <Text style={styles.noItems}>Pizza e acompanhamentos</Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {item.total?.toFixed(2) || '0.00'}</Text>
        </View>

        <View style={styles.viewMore}>
          <Text style={styles.viewMoreText}>Ver detalhes</Text>
          <Text style={styles.viewMoreIcon}>→</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🍕</Text>
      <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
      <Text style={styles.emptyText}>
        Faca seu primeiro pedido e acompanhe aqui!
      </Text>
      <TouchableOpacity
        style={styles.orderNowButton}
        onPress={() => router.replace('/(app)/order')}
      >
        <Text style={styles.orderNowButtonText}>Fazer pedido</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando pedidos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Pedidos</Text>
      </View>

      {/* Lista de pedidos */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      />

      {/* FAB para novo pedido */}
      {orders.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.replace('/(app)/order')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
          <Text style={styles.fabText}>Novo pedido</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: colors.textInverse,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textInverse,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderContent: {
    marginBottom: spacing.md,
  },
  itemsList: {},
  itemText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  noItems: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  viewMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginRight: spacing.xs,
  },
  viewMoreIcon: {
    fontSize: 14,
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  orderNowButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  orderNowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 20,
    color: colors.textInverse,
    marginRight: spacing.sm,
    fontWeight: '500',
  },
  fabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
