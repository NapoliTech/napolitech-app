import { useState, useEffect } from 'react';
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
      <Text style={[styles.badgeText, { color: c.text }]}>{tipo || '—'}</Text>
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
            {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}

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
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome completo" placeholderTextColor={colors.textMuted} />

            <Text style={styles.fieldLabel}>Email *</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@exemplo.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.fieldLabel}>Senha *</Text>
            <TextInput style={styles.input} value={senha} onChangeText={setSenha} placeholder="Senha de acesso" placeholderTextColor={colors.textMuted} secureTextEntry />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.btnSecondary} onPress={handleClose} disabled={saving}>
              <Text style={styles.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Text style={styles.btnPrimaryText}>Criar Usuário</Text>}
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
    if (usuario) { setNome(usuario.nome || usuario.name || ''); setEmail(usuario.email || ''); setError(''); }
  }, [usuario]);

  const handleSave = async () => {
    if (!nome.trim() || !email.trim()) { setError('Nome e email são obrigatórios.'); return; }
    setSaving(true);
    setError('');
    const res = await adminService.updateUsuario(usuario.id, { nome: nome.trim(), email: email.trim() });
    setSaving(false);
    if (res.success) { onSaved(); } else { setError(res.error || 'Erro ao salvar.'); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Usuário</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Text style={styles.closeBtnText}>✕</Text></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}
            <Text style={styles.fieldLabel}>Nome *</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome completo" placeholderTextColor={colors.textMuted} />
            <Text style={styles.fieldLabel}>Email *</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@exemplo.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.btnSecondary} onPress={onClose} disabled={saving}><Text style={styles.btnSecondaryText}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Text style={styles.btnPrimaryText}>Salvar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function UsuariosScreen() {
  const [emailBusca, setEmailBusca] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleBuscar = async () => {
    if (!emailBusca.trim()) return;
    setLoading(true);
    setError('');
    setResultado(null);
    const res = await adminService.getUsuarioByEmail(emailBusca.trim());
    setLoading(false);
    if (res.success && res.data) {
      setResultado(res.data);
    } else {
      setError('Usuário não encontrado para esse e-mail.');
    }
  };

  const handleDelete = () => {
    if (!resultado) return;
    confirm(`Excluir "${resultado.nome || resultado.name}"? Esta ação não pode ser desfeita.`, async () => {
      setDeleting(true);
      const res = await adminService.deleteUsuario(resultado.id);
      setDeleting(false);
      if (res.success) {
        setResultado(null);
        setEmailBusca('');
      } else {
        if (Platform.OS === 'web') {
          window.alert(res.error || 'Erro ao excluir usuário.');
        } else {
          Alert.alert('Erro', res.error || 'Erro ao excluir usuário.');
        }
      }
    });
  };

  const u = resultado;
  const tipo = u?.tipoUsuario || u?.tipo;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Usuários</Text>
          <Text style={styles.pageSubtitle}>Buscar e gerenciar contas</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.addBtnText}>+ Novo Usuário</Text>
        </TouchableOpacity>
      </View>

      {/* Busca por e-mail */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔍 Buscar por e-mail</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={emailBusca}
            onChangeText={setEmailBusca}
            placeholder="Digite o e-mail do usuário"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            onSubmitEditing={handleBuscar}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleBuscar} disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color={colors.textInverse} />
              : <Text style={styles.searchBtnText}>Buscar</Text>}
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      {/* Resultado */}
      {u && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.resultAvatar}>
              <Text style={styles.resultAvatarText}>
                {(u.nome || u.name || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultNome}>{u.nome || u.name || '—'}</Text>
              <Text style={styles.resultEmail}>{u.email || '—'}</Text>
              <TipoBadge tipo={tipo} />
            </View>
          </View>

          <View style={styles.resultMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>ID</Text>
              <Text style={styles.metaValue}>#{u.id}</Text>
            </View>
            {u.telefone ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Telefone</Text>
                <Text style={styles.metaValue}>{u.telefone}</Text>
              </View>
            ) : null}
            {u.cpf ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>CPF</Text>
                <Text style={styles.metaValue}>{u.cpf}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditUser(u)}
            >
              <Text style={styles.editBtnText}>✏️ Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.delBtn}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting
                ? <ActivityIndicator size="small" color={colors.error} />
                : <Text style={styles.delBtnText}>🗑️ Excluir</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <CreateUserModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => setShowCreate(false)}
      />

      <EditUserModal
        visible={!!editUser}
        usuario={editUser}
        onClose={() => setEditUser(null)}
        onSaved={() => {
          setEditUser(null);
          if (emailBusca) handleBuscar();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { padding: spacing.lg, paddingBottom: spacing.xxl },

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

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },

  searchRow: { flexDirection: 'row', gap: spacing.sm },
  searchInput: {
    flex: 1,
    backgroundColor: colors.softCloud,
    borderRadius: borderRadius.full,
    borderWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    minHeight: 44,
  },
  searchBtnText: { color: colors.textInverse, fontWeight: '700', fontSize: 14 },

  errorBanner: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
  },
  errorText: { color: colors.error, fontSize: 14 },

  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultHeader: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  resultAvatar: {
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultAvatarText: { color: colors.textInverse, fontSize: 22, fontWeight: '700' },
  resultInfo: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  resultNome: { fontSize: 18, fontWeight: '700', color: colors.text },
  resultEmail: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },

  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  badgeText: { fontSize: 11, fontWeight: '700' },

  resultMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  metaItem: {},
  metaLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  metaValue: { fontSize: 14, fontWeight: '600', color: colors.text },

  resultActions: { flexDirection: 'row', gap: spacing.md },
  editBtn: {
    flex: 1,
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  editBtnText: { color: colors.info, fontWeight: '700', fontSize: 14 },
  delBtn: {
    flex: 1,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  delBtnText: { color: colors.error, fontWeight: '700', fontSize: 14 },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, borderBottomLeftRadius: borderRadius.sm, borderBottomRightRadius: borderRadius.sm, width: '100%', maxWidth: 440 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  closeBtn: { padding: spacing.xs },
  closeBtnText: { fontSize: 18, color: colors.textMuted },
  modalBody: { padding: spacing.lg },
  modalFooter: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.softCloud, borderRadius: borderRadius.full, borderWidth: 0, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15, color: colors.text },

  tipoRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  tipoOption: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.background },
  tipoOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tipoOptionText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tipoOptionTextActive: { color: colors.textInverse },

  btnPrimary: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  btnPrimaryText: { color: colors.textInverse, fontWeight: '700', fontSize: 15 },
  btnSecondary: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.full, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, minHeight: 48 },
  btnSecondaryText: { color: colors.text, fontWeight: '600', fontSize: 15 },
});
