import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Platform, Alert, useWindowDimensions, FlatList,
} from 'react-native';
import { adminService } from '../../services/api';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

const BREAKPOINT = 768;

const STATUS_CONFIG = {
  RECEBIDO:   { label: 'Recebido',   bg: '#E3F2FD', text: '#1565C0' },
  EM_PREPARO: { label: 'Em Preparo', bg: '#FFF8E1', text: '#F57F17' },
  ENTREGUE:   { label: 'Entregue',   bg: '#E8F5E9', text: '#2E7D32' },
  ENCERRADO:  { label: 'Encerrado',  bg: '#E0E0E0', text: '#424242' },
  CANCELADO:  { label: 'Cancelado',  bg: '#FFEBEE', text: '#C62828' },
};

const NEXT_STATUS = {
  RECEBIDO: 'EM_PREPARO',
  EM_PREPARO: 'ENTREGUE',
  ENTREGUE: 'ENCERRADO',
};

const ALL_STATUS = ['RECEBIDO', 'EM_PREPARO', 'ENTREGUE', 'ENCERRADO', 'CANCELADO'];

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: colors.border, text: colors.text };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

/* ── Modal de detalhe ─────────────────────────────────────────────────────── */
function OrderDetailModal({ pedidoId, visible, onClose, onStatusChanged }) {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (visible && pedidoId) loadPedido();
  }, [visible, pedidoId]);

  const loadPedido = async () => {
    setLoading(true);
    const res = await adminService.getPedidoById(pedidoId);
    if (res.success) setPedido(res.data);
    setLoading(false);
  };

  const handleStatus = async (status) => {
    setUpdating(true);
    const res = await adminService.updatePedidoStatus(pedidoId, status);
    if (res.success) {
      await loadPedido();
      onStatusChanged();
    } else {
      if (Platform.OS === 'web') window.alert(res.error || 'Erro ao atualizar status');
      else Alert.alert('Erro', res.error || 'Erro ao atualizar status');
    }
    setUpdating(false);
  };

  const nextStatus = pedido?.statusPedido ? NEXT_STATUS[pedido.statusPedido] : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pedido #{pedidoId}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ padding: spacing.xl }} />
          ) : pedido ? (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Status</Text>
                <StatusBadge status={pedido.statusPedido} />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Cliente</Text>
                <Text style={styles.modalInfo}>{pedido.nomeCliente || pedido.cliente?.nome}</Text>
                <Text style={styles.modalInfoSub}>{pedido.cliente?.email}</Text>
                <Text style={styles.modalInfoSub}>{pedido.cliente?.telefone}</Text>
              </View>

              {pedido.endereco && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Endereço</Text>
                  <Text style={styles.modalInfo}>
                    {pedido.endereco.rua}, {pedido.endereco.numero}
                    {pedido.endereco.complemento ? ` — ${pedido.endereco.complemento}` : ''}
                  </Text>
                  <Text style={styles.modalInfoSub}>
                    {pedido.endereco.bairro} — {pedido.endereco.cidade}/{pedido.endereco.estado}
                  </Text>
                </View>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Itens</Text>
                {(pedido.itens || []).map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.quantidade}x {item.produto?.nome || item.nomeProduto || 'Item'}
                      {item.tamanhoPizza ? ` (${item.tamanhoPizza})` : ''}
                      {item.bordaRecheada && item.bordaRecheada !== 'NORMAL' ? ` + Borda ${item.bordaRecheada}` : ''}
                    </Text>
                    <Text style={styles.itemPrice}>R$ {Number(item.precoTotal || 0).toFixed(2)}</Text>
                  </View>
                ))}
                <View style={styles.itemDivider} />
                <View style={styles.itemRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>R$ {Number(pedido.precoTotal || pedido.valorTotal || 0).toFixed(2)}</Text>
                </View>
              </View>

              {pedido.observacao ? (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Observação</Text>
                  <Text style={styles.modalInfo}>{pedido.observacao}</Text>
                </View>
              ) : null}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Tipo de Entrega</Text>
                <Text style={styles.modalInfo}>{pedido.tipoEntrega || '—'}</Text>
              </View>

              {updating ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
              ) : (
                <View style={styles.statusActions}>
                  {nextStatus && (
                    <TouchableOpacity style={styles.advanceBtn} onPress={() => handleStatus(nextStatus)}>
                      <Text style={styles.advanceBtnText}>▶ Avançar para {STATUS_CONFIG[nextStatus]?.label}</Text>
                    </TouchableOpacity>
                  )}
                  {pedido.statusPedido !== 'CANCELADO' && pedido.statusPedido !== 'ENCERRADO' && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => handleStatus('CANCELADO')}>
                      <Text style={styles.cancelBtnText}>✕ Cancelar Pedido</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.statusLabel}>Definir status manualmente:</Text>
                  <View style={styles.statusChips}>
                    {ALL_STATUS.map(s => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.statusChip, pedido.statusPedido === s && styles.statusChipActive]}
                        onPress={() => handleStatus(s)}
                        disabled={pedido.statusPedido === s}
                      >
                        <Text style={[styles.statusChipText, pedido.statusPedido === s && styles.statusChipTextActive]}>
                          {STATUS_CONFIG[s]?.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <View style={{ height: spacing.xl }} />
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>Pedido não encontrado</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ── Card mobile ──────────────────────────────────────────────────────────── */
function PedidoCard({ p, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardTop}>
        <Text style={styles.cardId}>#{p.id} — {p.nomeCliente || '—'}</Text>
        <StatusBadge status={p.statusPedido} />
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardData}>{formatDate(p.dataPedido)}</Text>
        <Text style={styles.cardTotal}>R$ {Number(p.precoTotal || 0).toFixed(2).replace('.', ',')}</Text>
      </View>
      {p.tipoEntrega ? (
        <Text style={styles.cardEntrega}>{p.tipoEntrega}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

/* ── Tela principal ───────────────────────────────────────────────────────── */
export default function PedidosScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= BREAKPOINT;

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadPedidos = useCallback(async (p = 0) => {
    setLoading(true);
    const res = await adminService.listPedidos(p, 10);
    if (res.success) {
      setPedidos(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 0);
      setTotalElements(res.data?.totalElements || 0);
      setPage(p);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadPedidos(0); }, []);

  const openModal = (id) => { setSelectedId(id); setModalVisible(true); };

  const Paginacao = () => totalPages > 1 ? (
    <View style={styles.pagination}>
      <TouchableOpacity
        style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
        onPress={() => loadPedidos(page - 1)}
        disabled={page === 0}
      >
        <Text style={styles.pageBtnText}>← Anterior</Text>
      </TouchableOpacity>
      <Text style={styles.pageInfo}>{page + 1} / {totalPages}</Text>
      <TouchableOpacity
        style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
        onPress={() => loadPedidos(page + 1)}
        disabled={page >= totalPages - 1}
      >
        <Text style={styles.pageBtnText}>Próxima →</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Pedidos</Text>
          <Text style={styles.pageSubtitle}>{totalElements} no total</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => loadPedidos(page)}>
          <Text style={styles.refreshText}>↻ Atualizar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : isWide ? (
        /* ── Tabela (tela larga) ── */
        <ScrollView style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 0.5 }]}>ID</Text>
            <Text style={[styles.th, { flex: 2 }]}>Cliente</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>Status</Text>
            <Text style={[styles.th, { flex: 1 }]}>Total</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Data</Text>
            <Text style={[styles.th, { flex: 1 }]}>Entrega</Text>
            <Text style={[styles.th, { flex: 0.8 }]}>Ação</Text>
          </View>
          {pedidos.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
          ) : pedidos.map((p, i) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.tableRow, i % 2 === 0 && styles.tableRowEven]}
              onPress={() => openModal(p.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.td, { flex: 0.5 }]}>#{p.id}</Text>
              <Text style={[styles.td, { flex: 2 }]} numberOfLines={1}>{p.nomeCliente || '—'}</Text>
              <View style={{ flex: 1.2 }}><StatusBadge status={p.statusPedido} /></View>
              <Text style={[styles.td, { flex: 1 }]}>R$ {Number(p.precoTotal || 0).toFixed(2)}</Text>
              <Text style={[styles.td, { flex: 1.5 }]} numberOfLines={1}>{formatDate(p.dataPedido)}</Text>
              <Text style={[styles.td, { flex: 1 }]} numberOfLines={1}>{p.tipoEntrega || '—'}</Text>
              <TouchableOpacity style={[styles.detailBtn, { flex: 0.8 }]} onPress={() => openModal(p.id)}>
                <Text style={styles.detailBtnText}>Ver</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <Paginacao />
        </ScrollView>
      ) : (
        /* ── Cards (mobile) ── */
        <FlatList
          data={pedidos}
          keyExtractor={(p) => p.id.toString()}
          renderItem={({ item }) => <PedidoCard p={item} onPress={() => openModal(item.id)} />}
          contentContainerStyle={styles.cardLista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum pedido encontrado</Text>}
          ListFooterComponent={<Paginacao />}
        />
      )}

      <OrderDetailModal
        pedidoId={selectedId}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onStatusChanged={() => loadPedidos(page)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  pageHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  pageTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  refreshBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.background, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.border,
  },
  refreshText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Tabela
  tableContainer: { flex: 1 },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.softCloud,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  th: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tableRowEven: { backgroundColor: colors.softCloud },
  td: { fontSize: 13, color: colors.text },
  detailBtn: {
    backgroundColor: colors.primaryLight, paddingVertical: 4,
    paddingHorizontal: spacing.sm, borderRadius: borderRadius.full, alignItems: 'center',
  },
  detailBtnText: { color: colors.primary, fontSize: 12, fontWeight: '600' },

  // Cards mobile
  cardLista: { padding: spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.sm,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.xs,
  },
  cardId: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: spacing.xs,
  },
  cardData: { fontSize: 12, color: colors.textMuted },
  cardTotal: { fontSize: 15, fontWeight: '700', color: colors.primary },
  cardEntrega: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // Badge
  badge: {
    alignSelf: 'flex-start', paddingHorizontal: spacing.sm,
    paddingVertical: 3, borderRadius: borderRadius.full,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Paginação
  pagination: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: spacing.md, padding: spacing.lg,
  },
  pageBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.border,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  pageInfo: { fontSize: 13, color: colors.textSecondary },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', padding: spacing.xl },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg,
    width: '100%', maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.softCloud, justifyContent: 'center', alignItems: 'center',
  },
  modalCloseText: { fontSize: 16, color: colors.textSecondary },
  modalBody: { padding: spacing.lg },
  modalSection: { marginBottom: spacing.md },
  modalSectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs,
  },
  modalInfo: { fontSize: 15, color: colors.text, fontWeight: '500' },
  modalInfoSub: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 4 },
  itemName: { flex: 1, fontSize: 13, color: colors.text, marginRight: spacing.sm },
  itemPrice: { fontSize: 13, fontWeight: '600', color: colors.text },
  itemDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
  statusActions: { marginTop: spacing.lg, gap: spacing.sm },
  advanceBtn: {
    backgroundColor: colors.success, paddingVertical: spacing.md,
    borderRadius: borderRadius.full, alignItems: 'center',
  },
  advanceBtnText: { color: colors.textInverse, fontWeight: '700', fontSize: 15 },
  cancelBtn: {
    paddingVertical: spacing.md, borderRadius: borderRadius.full, alignItems: 'center',
    borderWidth: 1, borderColor: colors.error,
  },
  cancelBtnText: { color: colors.error, fontWeight: '600', fontSize: 14 },
  statusLabel: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  statusChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  statusChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.background,
  },
  statusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusChipText: { fontSize: 12, color: colors.textSecondary },
  statusChipTextActive: { color: colors.textInverse, fontWeight: '600' },
});
