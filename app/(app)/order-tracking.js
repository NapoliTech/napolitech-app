import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { orderService } from '../../services/api';
import { colors, spacing, borderRadius } from '../../constants/theme';

// Status do pedido conforme API
const ORDER_STATUS = {
  RECEBIDO: {
    label: 'Pedido Recebido',
    description: 'Seu pedido foi recebido e esta na fila',
    icon: '📋',
    step: 0,
  },
  EM_PREPARO: {
    label: 'Em Preparo',
    description: 'Estamos preparando sua pizza com carinho',
    icon: '👨‍🍳',
    step: 1,
  },
  PRONTO: {
    label: 'Pronto',
    description: 'Seu pedido esta pronto!',
    icon: '✅',
    step: 2,
  },
  SAIU_PARA_ENTREGA: {
    label: 'Saiu para Entrega',
    description: 'O entregador esta a caminho',
    icon: '🛵',
    step: 3,
  },
  ENTREGUE: {
    label: 'Entregue',
    description: 'Pedido entregue. Bom apetite!',
    icon: '🎉',
    step: 4,
  },
  ENCERRADO: {
    label: 'Encerrado',
    description: 'Pedido finalizado e encerrado.',
    icon: '✔️',
    step: 5,
  },
  CANCELADO: {
    label: 'Cancelado',
    description: 'Pedido foi cancelado',
    icon: '❌',
    step: -1,
  },
};

const STEPS = ['RECEBIDO', 'EM_PREPARO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE'];

export default function OrderTrackingScreen() {
  const params = useLocalSearchParams();
  const orderId = params.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Animacao do ponto pulsante
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadOrder();

    // Atualiza a cada 30 segundos
    const interval = setInterval(loadOrder, 30000);

    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    // Animacao de pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const loadOrder = async () => {
    try {
      const result = await orderService.getOrderById(orderId);
      if (result.success) {
        setOrder(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erro ao carregar pedido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrder();
  };

  const getCurrentStep = () => {
    if (!order?.statusPedido) return 0;
    return ORDER_STATUS[order.statusPedido]?.step || 0;
  };

  const currentStep = getCurrentStep();
  const statusInfo = order?.statusPedido ? ORDER_STATUS[order.statusPedido] : ORDER_STATUS.RECEBIDO;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.Text
          style={[
            styles.loadingEmoji,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          🍕
        </Animated.Text>
        <Text style={styles.loadingText}>Carregando pedido...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrder}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedido #{orderId}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Status atual */}
        <View style={styles.currentStatus}>
          <Animated.View
            style={[
              styles.statusIconContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
          </Animated.View>
          <Text style={styles.statusLabel}>{statusInfo.label}</Text>
          <Text style={styles.statusDescription}>{statusInfo.description}</Text>
        </View>

        {/* Timeline de status */}
        <View style={styles.timeline}>
          {STEPS.map((status, index) => {
            const stepInfo = ORDER_STATUS[status];
            const isCompleted = currentStep >= index;
            const isCurrent = currentStep === index;

            return (
              <View key={status} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineDot,
                      isCompleted && styles.timelineDotCompleted,
                      isCurrent && styles.timelineDotCurrent,
                    ]}
                  >
                    {isCompleted && !isCurrent && (
                      <Text style={styles.timelineCheck}>✓</Text>
                    )}
                    {isCurrent && (
                      <Animated.View
                        style={[
                          styles.timelinePulse,
                          { transform: [{ scale: pulseAnim }] },
                        ]}
                      />
                    )}
                  </View>
                  {index < STEPS.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        isCompleted && styles.timelineLineCompleted,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      isCompleted && styles.timelineLabelActive,
                      isCurrent && styles.timelineLabelCurrent,
                    ]}
                  >
                    {stepInfo.icon} {stepInfo.label}
                  </Text>
                  <Text style={styles.timelineDescription}>
                    {stepInfo.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Detalhes do pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes do Pedido</Text>

          <View style={styles.detailCard}>
            {order?.itens?.map((item, index) => (
              <View key={index} style={styles.detailRow}>
                <Text style={styles.detailName}>
                  {item.quantidade}x {item.nomeProduto || 'Item'}
                </Text>
                {item.tamanhoPizza && item.tamanhoPizza !== 'GRANDE' && (
                  <Text style={styles.detailExtra}>({item.tamanhoPizza})</Text>
                )}
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                R$ {order?.precoTotal?.toFixed(2) || order?.valorTotal?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Informacoes de entrega */}
        {order?.endereco && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endereco de Entrega</Text>
            <View style={styles.addressCard}>
              <Text style={styles.addressIcon}>📍</Text>
              <View style={styles.addressInfo}>
                <Text style={styles.addressText}>
                  {order.endereco.rua}, {order.endereco.numero}
                </Text>
                <Text style={styles.addressText}>
                  {order.endereco.bairro} - {order.endereco.cidade}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botao para voltar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.replace('/(app)/orders')}
          activeOpacity={0.8}
        >
          <Text style={styles.historyButtonText}>Ver todos os pedidos</Text>
        </TouchableOpacity>
      </View>
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
  loadingEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    height: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'web' ? 16 : 60,
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 20,
    color: colors.textInverse,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  currentStatus: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  statusIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusIcon: {
    fontSize: 48,
  },
  statusLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  statusDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  timeline: {
    marginBottom: spacing.xl,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 70,
  },
  timelineLeft: {
    width: 30,
    alignItems: 'center',
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineDotCompleted: {
    backgroundColor: colors.success,
  },
  timelineDotCurrent: {
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  timelineCheck: {
    fontSize: 10,
    color: colors.textInverse,
    fontWeight: '700',
  },
  timelinePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textInverse,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  timelineLineCompleted: {
    backgroundColor: colors.success,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.md,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 2,
  },
  timelineLabelActive: {
    color: colors.text,
  },
  timelineLabelCurrent: {
    color: colors.primary,
    fontSize: 15,
  },
  timelineDescription: {
    fontSize: 12,
    color: colors.textMuted,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailName: {
    fontSize: 14,
    color: colors.text,
  },
  detailExtra: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  historyButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
