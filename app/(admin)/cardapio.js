import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Platform, Alert,
} from 'react-native';
import { adminService } from '../../services/api';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

const CATEGORIAS = [
  { value: 'PIZZA', label: '🍕 Pizza' },
  { value: 'PIZZA_DOCE', label: '🍕 Pizza Doce' },
  { value: 'BEBIDA', label: '🥤 Bebida' },
  { value: 'SOBREMESA', label: '🍰 Sobremesa' },
  { value: 'PORCAO', label: '🍗 Porção' },
  { value: 'ESFIHA', label: '🥙 Esfiha' },
  { value: 'ESFIHA_DOCE', label: '🥙 Esfiha Doce' },
];

const CAT_LABEL = Object.fromEntries(CATEGORIAS.map(c => [c.value, c.label]));

const PAGE_SIZE = 12;

const EMPTY_FORM = {
  nome: '',
  preco: '',
  quantidadeEstoque: '',
  ingredientes: '',
  categoriaProduto: 'PIZZA',
};

function confirm(msg, onYes) {
  if (Platform.OS === 'web') {
    if (window.confirm(msg)) onYes();
  } else {
    Alert.alert('Confirmar', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: onYes },
    ]);
  }
}

function CatBadge({ cat }) {
  const label = CAT_LABEL[cat] || cat;
  return (
    <View style={styles.catBadge}>
      <Text style={styles.catBadgeText}>{label}</Text>
    </View>
  );
}

function CreateModal({ visible, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.nome.trim() || !form.preco || !form.categoriaProduto) {
      setError('Nome, preço e categoria são obrigatórios.');
      return;
    }
    const preco = parseFloat(form.preco.replace(',', '.'));
    if (isNaN(preco) || preco <= 0) {
      setError('Preço inválido.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      nome: form.nome.trim(),
      preco,
      quantidadeEstoque: parseInt(form.quantidadeEstoque) || 0,
      ingredientes: form.ingredientes.trim(),
      categoriaProduto: form.categoriaProduto,
    };
    const res = await adminService.createProduto(payload);
    setSaving(false);
    if (res.success) {
      setForm(EMPTY_FORM);
      onCreated();
    } else {
      setError(res.error || 'Erro ao criar produto.');
    }
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Novo Produto</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>Nome *</Text>
            <TextInput
              style={styles.input}
              value={form.nome}
              onChangeText={v => set('nome', v)}
              placeholder="Ex: Pizza Margherita"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Preço (R$) *</Text>
            <TextInput
              style={styles.input}
              value={form.preco}
              onChangeText={v => set('preco', v)}
              placeholder="Ex: 45.90"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />

            <Text style={styles.fieldLabel}>Estoque</Text>
            <TextInput
              style={styles.input}
              value={form.quantidadeEstoque}
              onChangeText={v => set('quantidadeEstoque', v)}
              placeholder="Ex: 100"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>Ingredientes</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={form.ingredientes}
              onChangeText={v => set('ingredientes', v)}
              placeholder="Ex: Molho, queijo, tomate..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.fieldLabel}>Categoria *</Text>
            <View style={styles.catGrid}>
              {CATEGORIAS.map(c => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.catOption, form.categoriaProduto === c.value && styles.catOptionActive]}
                  onPress={() => set('categoriaProduto', c.value)}
                >
                  <Text style={[styles.catOptionText, form.categoriaProduto === c.value && styles.catOptionTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.btnSecondary} onPress={handleClose} disabled={saving}>
              <Text style={styles.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleCreate} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.btnPrimaryText}>Criar Produto</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function CardapioScreen() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filterCat, setFilterCat] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const loadProdutos = useCallback(async (p = page, cat = filterCat) => {
    setLoading(true);
    setError('');
    const res = await adminService.listProdutos(p, PAGE_SIZE);
    setLoading(false);
    if (res.success) {
      let items = [];
      let pages = 1;
      if (Array.isArray(res.data)) {
        items = res.data;
      } else if (res.data?.content) {
        items = res.data.content;
        pages = res.data.totalPages ?? 1;
      }
      items = items.filter(i => i.nome !== 'Pizza teste');
      if (cat) items = items.filter(i => i.categoriaProduto === cat);
      setProdutos(items);
      setTotalPages(pages);
    } else {
      setError(res.error || 'Erro ao carregar produtos.');
    }
  }, []);

  useEffect(() => {
    loadProdutos(page, filterCat);
  }, [page]);

  const handleFilterChange = (cat) => {
    const next = filterCat === cat ? '' : cat;
    setFilterCat(next);
    setPage(0);
    loadProdutos(0, next);
  };

  const handleDelete = (id, nome) => {
    confirm(`Excluir "${nome}"? Esta ação não pode ser desfeita.`, async () => {
      setDeletingId(id);
      const res = await adminService.deleteProduto(id);
      setDeletingId(null);
      if (res.success) {
        loadProdutos(page, filterCat);
      } else {
        if (Platform.OS === 'web') {
          window.alert(res.error || 'Erro ao excluir produto.');
        } else {
          Alert.alert('Erro', res.error || 'Erro ao excluir produto.');
        }
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Cardápio</Text>
          <Text style={styles.pageSubtitle}>Gerenciar produtos</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.addBtnText}>+ Novo Produto</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Filtro por categoria */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity
          style={[styles.filterChip, !filterCat && styles.filterChipActive]}
          onPress={() => handleFilterChange('')}
        >
          <Text style={[styles.filterChipText, !filterCat && styles.filterChipTextActive]}>Todos</Text>
        </TouchableOpacity>
        {CATEGORIAS.map(c => (
          <TouchableOpacity
            key={c.value}
            style={[styles.filterChip, filterCat === c.value && styles.filterChipActive]}
            onPress={() => handleFilterChange(c.value)}
          >
            <Text style={[styles.filterChipText, filterCat === c.value && styles.filterChipTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : produtos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nenhum produto encontrado.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {produtos.map(prod => (
            <View key={prod.id} style={styles.prodCard}>
              <View style={styles.prodTop}>
                <Text style={styles.prodNome} numberOfLines={2}>{prod.nome}</Text>
                <CatBadge cat={prod.categoriaProduto} />
              </View>
              {prod.ingredientes ? (
                <Text style={styles.prodIngredientes} numberOfLines={2}>{prod.ingredientes}</Text>
              ) : null}
              <View style={styles.prodBottom}>
                <View style={styles.prodMeta}>
                  <Text style={styles.prodPreco}>R$ {Number(prod.preco || 0).toFixed(2)}</Text>
                  <Text style={styles.prodEstoque}>Estoque: {prod.quantidadeEstoque ?? '—'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(prod.id, prod.nome)}
                  disabled={deletingId === prod.id}
                >
                  {deletingId === prod.id
                    ? <ActivityIndicator size="small" color={colors.error} />
                    : <Text style={styles.deleteBtnText}>🗑️</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
            onPress={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <Text style={styles.pageBtnText}>‹ Anterior</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>Página {page + 1} de {totalPages}</Text>
          <TouchableOpacity
            style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
            onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <Text style={styles.pageBtnText}>Próxima ›</Text>
          </TouchableOpacity>
        </View>
      )}

      <CreateModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          setPage(0);
          loadProdutos(0, filterCat);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { color: colors.textMuted, fontSize: 15 },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  pageSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  addBtnText: { color: colors.textInverse, fontWeight: '700', fontSize: 14 },

  errorBanner: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.error, fontSize: 14 },

  filterBar: { marginBottom: spacing.lg },
  filterContent: { gap: spacing.sm, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  filterChipTextActive: { color: colors.textInverse, fontWeight: '600' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  prodCard: {
    width: '30%',
    minWidth: 200,
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
  },
  prodTop: { marginBottom: spacing.sm },
  prodNome: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  catBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  catBadgeText: { fontSize: 11, color: colors.info, fontWeight: '600' },
  prodIngredientes: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  prodBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  prodMeta: {},
  prodPreco: { fontSize: 16, fontWeight: '700', color: colors.primary },
  prodEstoque: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  deleteBtn: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.errorLight,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 16 },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  pageBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  pageInfo: { fontSize: 13, color: colors.textSecondary },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.sm,
    borderBottomRightRadius: borderRadius.sm,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  closeBtn: { padding: spacing.xs },
  closeBtnText: { fontSize: 18, color: colors.textMuted },
  modalBody: { padding: spacing.lg, maxHeight: 420 },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.softCloud,
    borderRadius: borderRadius.full,
    borderWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top', borderRadius: borderRadius.md },

  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  catOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  catOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catOptionText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  catOptionTextActive: { color: colors.textInverse, fontWeight: '600' },

  btnPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnPrimaryText: { color: colors.textInverse, fontWeight: '700', fontSize: 15 },
  btnSecondary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  btnSecondaryText: { color: colors.text, fontWeight: '600', fontSize: 15 },
});
