import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { productService } from '../../services/api';
import { colors, spacing, borderRadius } from '../../constants/theme';

export default function OrderScreen() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [flavors, setFlavors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedFlavor1, setSelectedFlavor1] = useState(null);
  const [selectedFlavor2, setSelectedFlavor2] = useState(null);
  const [selectedDrinks, setSelectedDrinks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);

  const firstName = user?.name?.split(' ')[0] || t('order.guestName');

  const getSizeName = (size) => {
    if (!size) return '';
    return t(`order.sizes.${size.id}`, {}, size.name);
  };

  const getDrinkItemsLabel = () => {
    const count = selectedDrinks.reduce((sum, drink) => sum + drink.quantity, 0);
    const key = count === 1 ? 'order.summary.itemSingular' : 'order.summary.itemPlural';
    return t(key, { count });
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [flavorsRes, sizesRes, drinksRes] = await Promise.all([
        productService.getFlavors(),
        productService.getSizes(),
        productService.getDrinks(),
      ]);

      if (flavorsRes.success) setFlavors(flavorsRes.data);
      if (sizesRes.success) {
        setSizes(sizesRes.data);
        setSelectedSize(sizesRes.data[1]);
      }
      if (drinksRes.success) setDrinks(drinksRes.data);
    } catch (error) {
      Alert.alert(t('order.loadErrorTitle'), t('order.loadErrorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelectFlavor = (flavor) => {
    if (modalType === 'flavor1') {
      setSelectedFlavor1(flavor);
    } else if (modalType === 'flavor2') {
      setSelectedFlavor2(flavor);
    }
    setModalVisible(false);
  };

  const handleSelectDrink = (drink) => {
    const exists = selectedDrinks.find(d => d.id === drink.id);
    if (exists) {
      setSelectedDrinks(prev =>
        prev.map(d => (d.id === drink.id ? { ...d, quantity: d.quantity + 1 } : d))
      );
    } else {
      setSelectedDrinks(prev => [...prev, { ...drink, quantity: 1 }]);
    }
    setModalVisible(false);
  };

  const updateDrinkQuantity = (drinkId, delta) => {
    setSelectedDrinks(prev => {
      const drink = prev.find(d => d.id === drinkId);
      if (drink) {
        const newQty = drink.quantity + delta;
        if (newQty <= 0) {
          return prev.filter(d => d.id !== drinkId);
        }
        return prev.map(d => (d.id === drinkId ? { ...d, quantity: newQty } : d));
      }
      return prev;
    });
  };

  const calculatePizzaPrice = () => {
    if (!selectedSize || !selectedFlavor1) return 0;
    let basePrice = selectedFlavor2
      ? (selectedFlavor1.price + selectedFlavor2.price) / 2
      : selectedFlavor1.price;
    return basePrice * selectedSize.multiplier;
  };

  const calculateDrinksPrice = () => {
    return selectedDrinks.reduce((total, drink) => total + drink.price * drink.quantity, 0);
  };

  const calculateTotal = () => calculatePizzaPrice() + calculateDrinksPrice();

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('order.logoutMessage'))) {
        await logout();
        router.replace('/(auth)/login');
      }
    } else {
      Alert.alert(t('order.logoutTitle'), t('order.logoutMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]);
    }
  };

  const handleContinueOrder = () => {
    if (!selectedFlavor1) {
      Alert.alert(t('order.selectFlavorTitle'), t('order.selectFlavorMessage'));
      return;
    }

    // Monta os dados do pedido para passar para o checkout
    const orderData = {
      pizza: {
        size: selectedSize,
        flavor1: selectedFlavor1,
        flavor2: selectedFlavor2,
        price: calculatePizzaPrice(),
      },
      drinks: selectedDrinks,
      total: calculateTotal(),
    };

    // Navega para o checkout passando os dados
    router.push({
      pathname: '/(app)/checkout',
      params: { orderData: JSON.stringify(orderData) },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>🍕</Text>
        <Text style={styles.loadingText}>{t('order.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{t('order.greeting', { name: firstName })}</Text>
            <Text style={styles.headerSubtitle}>{t('order.subtitle')}</Text>
          </View>
          <View style={styles.headerActions}>
            <LanguageSwitcher variant="primary" />
            <TouchableOpacity onPress={handleLogout} style={styles.avatarButton}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Size Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📏</Text>
            <Text style={styles.sectionTitle}>{t('order.sections.size')}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.sizeContainer}>
              {sizes.map(size => (
                <TouchableOpacity
                  key={size.id}
                  style={[
                    styles.sizeCard,
                    selectedSize?.id === size.id && styles.sizeCardSelected,
                  ]}
                  onPress={() => setSelectedSize(size)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sizeEmoji}>
                    {size.id === 'BROTO' ? '🍕' : size.id === 'GRANDE' ? '🍕🍕' : size.id === 'TREM' ? '🍕🍕🍕' : '🍕🍕'}
                  </Text>
                  <Text style={[
                    styles.sizeName,
                    selectedSize?.id === size.id && styles.sizeNameSelected,
                  ]}>
                    {getSizeName(size)}
                  </Text>
                  <Text style={styles.sizeSlices}>{t('order.slices', { count: size.slices })}</Text>
                  {selectedSize?.id === size.id && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Flavors Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🧀</Text>
            <Text style={styles.sectionTitle}>{t('order.sections.flavors')}</Text>
          </View>

          <TouchableOpacity
            style={[styles.flavorCard, selectedFlavor1 && styles.flavorCardSelected]}
            onPress={() => openModal('flavor1')}
            activeOpacity={0.7}
          >
            <View style={styles.flavorCardContent}>
              <View style={styles.flavorBadge}>
                <Text style={styles.flavorBadgeText}>1</Text>
              </View>
              <View style={styles.flavorInfo}>
                <Text style={styles.flavorLabel}>{t('order.firstHalf')}</Text>
                {selectedFlavor1 ? (
                  <>
                    <Text style={styles.flavorName}>{selectedFlavor1.name}</Text>
                    <Text style={styles.flavorPrice}>R$ {selectedFlavor1.price.toFixed(2)}</Text>
                  </>
                ) : (
                  <Text style={styles.flavorPlaceholder}>{t('order.chooseFlavor')}</Text>
                )}
              </View>
            </View>
            <Text style={styles.flavorArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.flavorCard, selectedFlavor2 && styles.flavorCardSelected]}
            onPress={() => openModal('flavor2')}
            activeOpacity={0.7}
          >
            <View style={styles.flavorCardContent}>
              <View style={[styles.flavorBadge, styles.flavorBadgeSecondary]}>
                <Text style={styles.flavorBadgeText}>2</Text>
              </View>
              <View style={styles.flavorInfo}>
                <Text style={styles.flavorLabel}>{t('order.secondHalf')}</Text>
                {selectedFlavor2 ? (
                  <>
                    <Text style={styles.flavorName}>{selectedFlavor2.name}</Text>
                    <Text style={styles.flavorPrice}>R$ {selectedFlavor2.price.toFixed(2)}</Text>
                  </>
                ) : (
                  <Text style={styles.flavorPlaceholder}>{t('order.wholePizza')}</Text>
                )}
              </View>
            </View>
            <Text style={styles.flavorArrow}>→</Text>
          </TouchableOpacity>

          {selectedFlavor2 && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setSelectedFlavor2(null)}
            >
              <Text style={styles.removeButtonText}>{t('order.removeSecondHalf')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Drinks Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🥤</Text>
            <Text style={styles.sectionTitle}>{t('order.sections.drinks')}</Text>
          </View>

          <TouchableOpacity
            style={styles.addDrinkButton}
            onPress={() => openModal('drink')}
            activeOpacity={0.7}
          >
            <Text style={styles.addDrinkIcon}>+</Text>
            <Text style={styles.addDrinkText}>{t('order.addDrink')}</Text>
          </TouchableOpacity>

          {selectedDrinks.map(drink => (
            <View key={drink.id} style={styles.drinkItem}>
              <View style={styles.drinkInfo}>
                <Text style={styles.drinkName}>{drink.name}</Text>
                <Text style={styles.drinkPrice}>
                  R$ {(drink.price * drink.quantity).toFixed(2)}
                </Text>
              </View>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateDrinkQuantity(drink.id, -1)}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{drink.quantity}</Text>
                <TouchableOpacity
                  style={[styles.quantityButton, styles.quantityButtonAdd]}
                  onPress={() => updateDrinkQuantity(drink.id, 1)}
                >
                  <Text style={[styles.quantityButtonText, styles.quantityButtonTextAdd]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📋</Text>
            <Text style={styles.sectionTitle}>{t('order.sections.summary')}</Text>
          </View>

          <View style={styles.summaryCard}>
            {selectedFlavor1 && (
              <View style={styles.summaryRow}>
                <View style={styles.summaryItemInfo}>
                  <Text style={styles.summaryItemName}>
                    {t('order.summary.pizzaSize', { size: getSizeName(selectedSize) })}
                  </Text>
                  <Text style={styles.summaryItemDetail}>
                    {selectedFlavor2
                      ? `1/2 ${selectedFlavor1.name} + 1/2 ${selectedFlavor2.name}`
                      : selectedFlavor1.name}
                  </Text>
                </View>
                <Text style={styles.summaryItemPrice}>
                  R$ {calculatePizzaPrice().toFixed(2)}
                </Text>
              </View>
            )}

            {selectedDrinks.length > 0 && (
              <View style={styles.summaryRow}>
                <View style={styles.summaryItemInfo}>
                  <Text style={styles.summaryItemName}>{t('order.summary.drinks')}</Text>
                  <Text style={styles.summaryItemDetail}>
                    {getDrinkItemsLabel()}
                  </Text>
                </View>
                <Text style={styles.summaryItemPrice}>
                  R$ {calculateDrinksPrice().toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryTotal}>
              <Text style={styles.totalLabel}>{t('common.total')}</Text>
              <Text style={styles.totalValue}>R$ {calculateTotal().toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View>
            <Text style={styles.bottomLabel}>{t('order.bottomTotal')}</Text>
            <Text style={styles.bottomTotal}>R$ {calculateTotal().toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.orderButton, !selectedFlavor1 && styles.orderButtonDisabled]}
            onPress={handleContinueOrder}
            disabled={!selectedFlavor1}
            activeOpacity={0.8}
          >
            <Text style={styles.orderButtonText}>{t('order.continue')}</Text>
            <Text style={styles.orderButtonIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'drink' ? t('order.chooseDrinkModal') : t('order.chooseFlavorModal')}
              </Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>x</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={modalType === 'drink' ? drinks : flavors}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => modalType === 'drink' ? handleSelectDrink(item) : handleSelectFlavor(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemName}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.modalItemDescription}>{item.description}</Text>
                    )}
                  </View>
                  <Text style={styles.modalItemPrice}>R$ {item.price.toFixed(2)}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    fontSize: 48,
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'web' ? 16 : 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginRight: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textInverse,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textInverse,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sizeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  sizeCard: {
    width: 100,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  sizeCardSelected: {
    borderColor: colors.primary,
  },
  sizeEmoji: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  sizeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  sizeNameSelected: {
    color: colors.primary,
  },
  sizeSlices: {
    fontSize: 12,
    color: colors.textMuted,
  },
  selectedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  flavorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flavorCardSelected: {
    borderColor: colors.primary,
  },
  flavorCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flavorBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  flavorBadgeSecondary: {
    backgroundColor: colors.secondaryLight,
  },
  flavorBadgeText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  flavorInfo: {
    flex: 1,
  },
  flavorLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  flavorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  flavorPrice: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  flavorPlaceholder: {
    fontSize: 14,
    color: colors.textMuted,
  },
  flavorArrow: {
    fontSize: 18,
    color: colors.textMuted,
  },
  removeButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  removeButtonText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
  addDrinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: spacing.sm,
  },
  addDrinkIcon: {
    fontSize: 20,
    color: colors.primary,
    marginRight: spacing.sm,
    fontWeight: '500',
  },
  addDrinkText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  drinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  drinkInfo: {
    flex: 1,
  },
  drinkName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  drinkPrice: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quantityButtonAdd: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quantityButtonText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '500',
  },
  quantityButtonTextAdd: {
    color: colors.textInverse,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: spacing.md,
    minWidth: 24,
    textAlign: 'center',
  },
  summarySection: {
    marginBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  summaryItemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  summaryItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryItemDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  summaryTotal: {
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
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
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  orderButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  orderButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  orderButtonIcon: {
    color: colors.textInverse,
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalList: {
    padding: spacing.lg,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  modalItemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalItemDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});
