import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Platform, Alert,
} from 'react-native';
import { adminService } from '../../services/api';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

const TIPO_COLORS = {
  ADMIN: { bg: '#FFE8E0', text: '#D63A0A' },
  ATENDENTE: { bg: colors.infoLight, text: colors.info },
  CLIENTE: { bg: colors.successLight, text: colors.success },
};

const PAGE_SIZE = 10;

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

function TipoBadge({ tipo }) {
  const c = TIPO_COLORS[tipo] || { bg: colors.border, text: colors.textSecondary };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{tipo}</Text>
    </View>
  );
}

function CreateUserModal({ visible, onClose, onCreated }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState('ATENDENTE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setNome(''); setEmail(''); setSenha(''); setTipo('ATENDENTE'); setError(''); };

  const handleCreate = async () => {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setError('Nome, email e senha são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = { nome: nome.trim(), email: email.trim(), senha };
    const fn = tipo === 'ADMIN' ? adminService.createAdmin : adminService.createAtendente;
    const res = await fn(payload);
    setSaving(false);
    if (res.success) {
      reset();
      onCreated();
    } else {
      setError(res.error || 'Erro ao criar usuário.');
    }
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Novo Usuário</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>Tipo de Conta *</Text>
            <View style={styles.tipoRow}>
              {['ATENDENTE', 'ADMIN'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tipoOption, tipo === t && styles.tipoOptionActive]}
                  onPress={() => setTipo(t)}
                >
                  <Text style={[styles.tipoOptionText, tipo === t && styles.tipoOptionTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Nome *</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome completo"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@exemplo.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Senha *</Text>
            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              placeholder="Senha de acesso"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.btnSecondary} onPress={handleClose} disabled={saving}>
              <Text style={styles.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleCreate} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.btnPrimaryText}>Criar Usuário</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EditUserModal({ visible, usuario, onClose, onSaved }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome || usuario.name || '');
      setEmail(usuario.email || '');
      setError('');
    }
  }, [usuario]);

  const handleSave = async () => {
    if (!nome.trim() || !email.trim()) {
      setError('Nome e email são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    const res = await adminService.updateUsuario(usuario.id, {
      nome: nome.trim(),
      email: email.trim(),
    });
    setSaving(false);
    if (res.success) {
      onSaved();
    } else {
      setError(res.error || 'Erro ao salvar.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Usuário</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>Nome *</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome completo"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@exemplo.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.btnSecondary} onPress={onClose} disabled={saving}>
              <Text style={styles.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.btnPrimaryText}>Salvar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const loadUsuarios = useCallback(async (p = 0) => {
    setLoading(true);
    setError('');
    const res = await adminService.listUsuarios(p, PAGE_SIZE);
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
      setUsuarios(items);
      setTotalPages(pages);
    } else {
      setError(res.error || 'Erro ao carregar usuários.');
    }
  }, []);

  useEffect(() => { loadUsuarios(page); }, [page]);

  const handleDelete = (u) => {
    confirm(`Excluir "${u.nome || u.name}"? Esta ação não pode ser desfeita.`, async () => {
      setDeletingId(u.id);
      const res = await adminService.deleteUsuario(u.id);
      setDeletingId(null);
      if (res.success) {
        loadUsuarios(page);
      } else {
        if (Platform.OS === 'web') {
          window.alert(res.error || 'Erro ao excluir usuário.');
        } else {
          Alert.alert('Erro', res.error || 'Erro ao excluir usuário.');
        }
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Usuários</Text>
          <Text style={styles.pageSubtitle}>Gerenciar contas</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.addBtnText}>+ Novo Usuário</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        {/* Header da tabela */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.col, styles.colId, styles.thText]}>ID</Text>
          <Text style={[styles.col, styles.colNome, styles.thText]}>Nome</Text>
          <Text style={[styles.col, styles.colEmail, styles.thText]}>Email</Text>
          <Text style={[styles.col, styles.colTipo, styles.thText]}>Tipo</Text>
          <Text style={[styles.col, styles.colAcoes, styles.thText]}>Ações</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : usuarios.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
          </View>
        ) : (
          usuarios.map((u, idx) => (
            <View key={u.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
              <Text style={[styles.col, styles.colId, styles.tdText]}>#{u.id}</Text>
              <Text style={[styles.col, styles.colNome, styles.tdText]} numberOfLines={1}>
                {u.nome || u.name || '—'}
              </Text>
              <Text style={[styles.col, styles.colEmail, styles.tdText]} numberOfLines={1}>
                {u.email || '—'}
              </Text>
              <View style={[styles.col, styles.colTipo]}>
                <TipoBadge tipo={u.tipoUsuario || u.tipo || '—'} />
              </View>
              <View style={[styles.col, styles.colAcoes, styles.acoesFlex]}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => setEditUser(u)}
                >
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.delBtn}
                  onPress={() => handleDelete(u)}
                  disabled={deletingId === u.id}
                >
                  {deletingId === u.id
                    ? <ActivityIndicator size="small" color={colors.error} />
                    : <Text style={styles.delBtnText}>🗑️</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

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

      <CreateUserModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); loadUsuarios(0); setPage(0); }}
      />

      <EditUserModal
        visible={!!editUser}
        usuario={editUser}
        onClose={() => setEditUser(null)}
        onSaved={() => { setEditUser(null); loadUsuarios(page); }}
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
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  addBtnText: { color: colors.textInverse, fontWeight: '700', fontSize: 14 },

  errorBanner: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.error, fontSize: 14 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
    marginBottom: spacing.lg,
  },

  tableHeader: {
    backgroundColor: colors.background,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: { backgroundColor: colors.background },
  thText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  tdText: { fontSize: 14, color: colors.text },

  col: { paddingHorizontal: 4 },
  colId: { width: 50 },
  colNome: { flex: 2 },
  colEmail: { flex: 3 },
  colTipo: { width: 100, alignItems: 'flex-start' },
  colAcoes: { width: 80 },
  acoesFlex: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  editBtn: {
    width: 30, height: 30,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.sm,
  },
  editBtnText: { fontSize: 14 },
  delBtn: {
    width: 30, height: 30,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
  },
  delBtnText: { fontSize: 14 },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  pageBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
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
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 440,
    ...shadows.lg,
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
  modalBody: { padding: spacing.lg },
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
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },

  tipoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tipoOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  tipoOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tipoOptionText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tipoOptionTextActive: { color: colors.textInverse },

  btnPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnPrimaryText: { color: colors.textInverse, fontWeight: '700', fontSize: 15 },
  btnSecondary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  btnSecondaryText: { color: colors.text, fontWeight: '600', fontSize: 15 },
});
