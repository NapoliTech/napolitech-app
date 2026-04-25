import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, addressService, upsellService } from '../../services/api';
import { colors, spacing, borderRadius } from '../../constants/theme';

export default function CheckoutScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();

  // Dados do pedido vindos da tela anterior
  const [orderData, setOrderData] = useState(null);

  // Estado do endereco
  const [userAddress, setUserAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Estado do pedido
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Estado do CEP
  const [loadingCep, setLoadingCep] = useState(false);

  // Estado do upsell (IA)
  const [upsellSugestoes, setUpsellSugestoes] = useState([]);
  const [loadingUpsell, setLoadingUpsell] = useState(true);
  const [extrasAdicionados, setExtrasAdicionados] = useState([]);

  // Formulario de endereco
  const [addressForm, setAddressForm] = useState({
    rua: '',
    numero: '',
    bairro: '',
    complemento: '',
    cidade: '',
    estado: '',
    cep: '',
  });

  useEffect(() => {
    // Parse dos dados do pedido
    if (params.orderData) {
      try {
        const parsed = JSON.parse(params.orderData);
        setOrderData(parsed);
        // Carrega sugestoes de upsell em paralelo
        loadUpsellSugestoes(parsed);
      } catch (e) {
        console.error('Erro ao parsear orderData:', e);
      }
    }
    loadUserAddress();
  }, [params.orderData]);

  const loadUpsellSugestoes = async (pedidoData) => {
    setLoadingUpsell(true);
    try {
      // Coleta IDs dos produtos no carrinho
      const produtosIds = [];
      if (pedidoData?.pizza?.flavor1?.id) {
        produtosIds.push(pedidoData.pizza.flavor1.id);
      }
      if (pedidoData?.pizza?.flavor2?.id) {
        produtosIds.push(pedidoData.pizza.flavor2.id);
      }
      if (pedidoData?.drinks) {
        pedidoData.drinks.forEach(drink => {
          if (drink.id) produtosIds.push(drink.id);
        });
      }

      const result = await upsellService.getSugestoes(produtosIds);
      if (result.success) {
        setUpsellSugestoes(result.data);
      }
    } catch (error) {
      console.log('Erro ao carregar upsell:', error);
    } finally {
      setLoadingUpsell(false);
    }
  };

  const loadUserAddress = async () => {
    setLoadingAddress(true);
    try {
      const result = await addressService.getAddresses();
      if (result.success && result.data.length > 0) {
        setUserAddress(result.data[0]);
        setShowAddressForm(false);
      } else {
        setShowAddressForm(true);
      }
    } catch (error) {
      console.log('Erro ao carregar endereco:', error);
      setShowAddressForm(true);
    } finally {
      setLoadingAddress(false);
    }
  };

  const formatCep = async (text) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length > 8) return;

    let formatted = numbers;
    if (numbers.length > 5) {
      formatted = `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    }
    setAddressForm(prev => ({ ...prev, cep: formatted }));

    if (numbers.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${numbers}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setAddressForm(prev => ({
            ...prev,
            rua: data.logradouro || prev.rua,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado,
          }));
        }
      } catch (e) {
        // silencia erro — usuario preenche manual
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleSaveAddress = async () => {
    const { rua, numero, bairro, cidade, estado, cep } = addressForm;

    if (!rua || !numero || !bairro || !cidade || !estado || !cep) {
      Alert.alert('Campos obrigatorios', 'Preencha todos os campos do endereco.');
      return;
    }

    setSavingAddress(true);
    try {
      const result = await addressService.createAddress(addressForm);

      if (result.success) {
        setUserAddress(result.address);
        setShowAddressForm(false);
        Alert.alert('Sucesso', 'Endereco cadastrado com sucesso!');
      } else {
        Alert.alert('Erro', result.error || 'Nao foi possivel salvar o endereco.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar endereco.');
    } finally {
      setSavingAddress(false);
    }
  };

  // Toggle para adicionar/remover extra do upsell
  const toggleExtra = (sugestao) => {
    setExtrasAdicionados(prev => {
      const existe = prev.find(item => item.id === sugestao.id);
      if (existe) {
        return prev.filter(item => item.id !== sugestao.id);
      }
      return [...prev, sugestao];
    });
  };

  // Calcula o total incluindo extras
  const calcularTotal = () => {
    const totalBase = orderData?.total || 0;
    const totalExtras = extrasAdicionados.reduce((acc, item) => acc + item.preco, 0);
    return totalBase + totalExtras;
  };

  const handleFinishOrder = async () => {
    if (!userAddress) {
      Alert.alert('Endereco necessario', 'Cadastre um endereco para continuar.');
      return;
    }

    setCreatingOrder(true);

    // Inclui os extras do upsell no pedido
    const extrasParaPedido = extrasAdicionados.map(extra => ({
      id: extra.id,
      name: extra.nome,
      price: extra.preco,
      quantity: 1,
    }));

    const finalOrderData = {
      ...orderData,
      drinks: [...(orderData.drinks || []), ...extrasParaPedido],
      total: calcularTotal(),
      enderecoId: userAddress.id,
      tipoEntrega: 'DELIVERY',
    };

    const result = await orderService.createOrder(finalOrderData);

    setCreatingOrder(false);

    if (result.success) {
      router.replace({
        pathname: '/(app)/order-success',
        params: {
          orderId: result.order.id,
          total: calcularTotal(),
        },
      });
    } else {
      Alert.alert('Erro no pedido', result.error || 'Nao foi possivel criar o pedido. Tente novamente.');
    }
  };

  // Componente do card de upsell
  const UpsellCard = ({ sugestao }) => {
    const adicionado = extrasAdicionados.some(item => item.id === sugestao.id);

    return (
      <TouchableOpacity
        style={[styles.upsellItemCard, adicionado && styles.upsellItemCardAtivo]}
        onPress={() => toggleExtra(sugestao)}
        activeOpacity={0.8}
      >
        <Text style={styles.upsellItemNome} numberOfLines={1}>{sugestao.nome}</Text>
        <Text style={styles.upsellItemMotivo} numberOfLines={2}>{sugestao.motivo}</Text>
        <View style={styles.upsellItemRodape}>
          <Text style={styles.upsellItemPreco}>R$ {sugestao.preco.toFixed(2)}</Text>
          <Text style={[styles.upsellItemBotao, adicionado && styles.upsellItemBotaoAtivo]}>
            {adicionado ? '✓ Adicionado' : '+ Adicionar'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loadingAddress || !orderData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
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
        <Text style={styles.headerTitle}>Finalizar Pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Resumo do Pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍕 Resumo do Pedido</Text>

          <View style={styles.card}>
            {orderData.pizza && (
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>
                    Pizza {orderData.pizza.size?.name}
                  </Text>
                  <Text style={styles.itemDetail}>
                    {orderData.pizza.flavor2
                      ? `1/2 ${orderData.pizza.flavor1?.name} + 1/2 ${orderData.pizza.flavor2?.name}`
                      : orderData.pizza.flavor1?.name}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  R$ {orderData.pizza.price?.toFixed(2)}
                </Text>
              </View>
            )}

            {orderData.drinks?.map((drink, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>
                    {drink.quantity}x {drink.name}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  R$ {(drink.price * drink.quantity).toFixed(2)}
                </Text>
              </View>
            ))}

            {/* Extras adicionados do upsell */}
            {extrasAdicionados.map((extra, index) => (
              <View key={`extra-${index}`} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, styles.itemExtra]}>
                    1x {extra.nome} (adicionado)
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  R$ {extra.preco.toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {calcularTotal().toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Endereco de Entrega */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Endereco de Entrega</Text>

          {!showAddressForm && userAddress ? (
            <View style={styles.card}>
              <View style={styles.addressInfo}>
                <Text style={styles.addressText}>
                  {userAddress.rua}, {userAddress.numero}
                  {userAddress.complemento ? ` - ${userAddress.complemento}` : ''}
                </Text>
                <Text style={styles.addressText}>
                  {userAddress.bairro}
                </Text>
                <Text style={styles.addressText}>
                  {userAddress.cidade} - {userAddress.estado}
                </Text>
                <Text style={styles.addressText}>CEP: {userAddress.cep}</Text>
              </View>

              <View style={styles.addressActions}>
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>✓ Selecionado</Text>
                </View>
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={() => setShowAddressForm(true)}
                >
                  <Text style={styles.changeButtonText}>Alterar endereco</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.formTitle}>
                {userAddress ? 'Novo endereco' : 'Cadastre seu endereco'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  CEP{loadingCep ? '  Buscando...' : ''}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="00000-000"
                  placeholderTextColor={colors.textMuted}
                  value={addressForm.cep}
                  onChangeText={formatCep}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rua</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome da rua"
                  placeholderTextColor={colors.textMuted}
                  value={addressForm.rua}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, rua: text }))}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Numero</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor={colors.textMuted}
                    value={addressForm.numero}
                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, numero: text }))}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 2, marginLeft: spacing.md }]}>
                  <Text style={styles.inputLabel}>Complemento</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Apto, Bloco... (opcional)"
                    placeholderTextColor={colors.textMuted}
                    value={addressForm.complemento}
                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, complemento: text }))}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bairro</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do bairro"
                  placeholderTextColor={colors.textMuted}
                  value={addressForm.bairro}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, bairro: text }))}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.inputLabel}>Cidade</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Cidade"
                    placeholderTextColor={colors.textMuted}
                    value={addressForm.cidade}
                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, cidade: text }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.md }]}>
                  <Text style={styles.inputLabel}>Estado</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="UF"
                    placeholderTextColor={colors.textMuted}
                    value={addressForm.estado}
                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, estado: text.toUpperCase() }))}
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.formActions}>
                {userAddress && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowAddressForm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.saveButton, savingAddress && styles.buttonDisabled]}
                  onPress={handleSaveAddress}
                  disabled={savingAddress}
                >
                  {savingAddress ? (
                    <ActivityIndicator color={colors.textInverse} size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Salvar endereco</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Secao de Upsell com IA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Sugestoes para voce</Text>
          <Text style={styles.sectionSubtitle}>Recomendado especialmente para voce</Text>

          {loadingUpsell ? (
            <View style={styles.upsellLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.upsellLoadingText}>Preparando sugestoes...</Text>
            </View>
          ) : upsellSugestoes.length > 0 ? (
            <FlatList
              data={upsellSugestoes}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => <UpsellCard sugestao={item} />}
              contentContainerStyle={styles.upsellList}
            />
          ) : (
            <View style={styles.upsellVazio}>
              <Text style={styles.upsellVazioText}>Nenhuma sugestao disponivel no momento</Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomContent}>
          <View>
            <Text style={styles.bottomLabel}>Total</Text>
            <Text style={styles.bottomTotal}>R$ {calcularTotal().toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.finishButton,
              (!userAddress || creatingOrder) && styles.buttonDisabled
            ]}
            onPress={handleFinishOrder}
            disabled={!userAddress || creatingOrder}
          >
            {creatingOrder ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <>
                <Text style={styles.finishButtonText}>Confirmar pedido</Text>
                <Text style={styles.finishButtonIcon}>✓</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemExtra: {
    color: colors.success,
  },
  itemDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  addressInfo: {
    marginBottom: spacing.md,
  },
  addressText: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedBadge: {
    backgroundColor: colors.successLight || '#E8F5E9',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  selectedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  changeButton: {
    padding: spacing.sm,
  },
  changeButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  inputRow: {
    flexDirection: 'row',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  // Estilos do Upsell
  upsellLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  upsellLoadingText: {
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  upsellList: {
    paddingVertical: spacing.sm,
  },
  upsellVazio: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  upsellVazioText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  upsellItemCard: {
    width: 160,
    padding: spacing.md,
    marginRight: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  upsellItemCardAtivo: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight || '#FFF5F5',
  },
  upsellItemNome: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
  },
  upsellItemMotivo: {
    fontSize: 11,
    color: colors.textSecondary,
    marginVertical: spacing.sm,
    lineHeight: 15,
  },
  upsellItemRodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  upsellItemPreco: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  upsellItemBotao: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  upsellItemBotaoAtivo: {
    color: colors.success,
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
  bottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomTotal: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
    marginRight: spacing.sm,
  },
  finishButtonIcon: {
    fontSize: 18,
    color: colors.textInverse,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
