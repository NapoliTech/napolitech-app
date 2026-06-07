import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, borderRadius } from '../../constants/theme';

export default function OrderSuccessScreen() {
  const params = useLocalSearchParams();
  const orderId = params.orderId;
  const total = params.total;

  // Animacoes
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequencia de animacoes
    Animated.sequence([
      // 1. Icone de sucesso aparece com escala
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: Platform.OS !== 'web',
      }),
      // 2. Check aparece
      Animated.timing(checkAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // Fade e slide do conteudo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, []);

  const handleTrackOrder = () => {
    router.replace({
      pathname: '/(app)/order-tracking',
      params: { orderId },
    });
  };

  const handleGoToHistory = () => {
    router.replace('/(app)/orders');
  };

  return (
    <View style={styles.container}>
      {/* Circulo de sucesso animado */}
      <Animated.View
        style={[
          styles.successCircle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.checkmark,
            {
              opacity: checkAnim,
              transform: [
                {
                  scale: checkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            },
          ]}
        >
          ✓
        </Animated.Text>
      </Animated.View>

      {/* Conteudo com fade e slide */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>Pedido Confirmado!</Text>
        <Text style={styles.subtitle}>Seu pedido foi recebido com sucesso</Text>

        <View style={styles.orderCard}>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Numero do pedido</Text>
            <Text style={styles.orderValue}>#{orderId}</Text>
          </View>
          {total && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Total</Text>
              <Text style={styles.orderValueHighlight}>R$ {parseFloat(total).toFixed(2)}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🍕</Text>
          <Text style={styles.infoText}>
            Estamos preparando seu pedido com muito carinho!
          </Text>
        </View>
      </Animated.View>

      {/* Botoes */}
      <Animated.View
        style={[
          styles.buttons,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleTrackOrder}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Acompanhar pedido</Text>
          <Text style={styles.buttonIcon}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleGoToHistory}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Ver meus pedidos</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  checkmark: {
    fontSize: 60,
    color: colors.textInverse,
    fontWeight: '700',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  orderValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  orderValueHighlight: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight || '#E8F5E9',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.success || '#2E7D32',
    fontWeight: '500',
  },
  buttons: {
    width: '100%',
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: spacing.lg,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
    marginRight: spacing.sm,
  },
  buttonIcon: {
    fontSize: 18,
    color: colors.textInverse,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
});
