import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/api';
import { colors, spacing, borderRadius } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.name || '',
        email: user.email || '',
        telefone: user.phone || '',
        cpf: user.cpf || '',
      });
    }
  }, [user]);

  const formatPhone = (text) => {
    const numbers = text.replace(/\D/g, '');
    let formatted = numbers;
    if (numbers.length > 0) {
      formatted = `(${numbers.slice(0, 2)}`;
      if (numbers.length > 2) {
        formatted += `) ${numbers.slice(2, 7)}`;
        if (numbers.length > 7) {
          formatted += `-${numbers.slice(7, 11)}`;
        }
      }
    }
    return formatted;
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      Alert.alert('Erro', 'Nome e obrigatorio');
      return;
    }

    setSaving(true);
    try {
      const result = await userService.updateProfile({
        nome: formData.nome,
        telefone: formData.telefone.replace(/\D/g, ''),
      });

      if (result.success) {
        if (updateUser) {
          updateUser({
            ...user,
            name: formData.nome,
            phone: formData.telefone,
          });
        }
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
        setEditing(false);
      } else {
        Alert.alert('Erro', result.error || 'Nao foi possivel atualizar o perfil');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Deseja realmente sair da conta?')) {
        await logout();
        router.replace('/(auth)/login');
      }
    } else {
      Alert.alert('Sair da conta', 'Deseja realmente sair?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]);
    }
  };

  const handleDeleteAccount = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza que deseja excluir sua conta? Esta acao nao pode ser desfeita.')) {
        setLoading(true);
        const result = await userService.deleteAccount();
        setLoading(false);
        if (result.success) {
          await logout();
          router.replace('/(auth)/login');
        } else {
          window.alert(result.error || 'Nao foi possivel excluir a conta');
        }
      }
    } else {
      Alert.alert(
        'Excluir conta',
        'Tem certeza que deseja excluir sua conta? Esta acao nao pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              const result = await userService.deleteAccount();
              setLoading(false);
              if (result.success) {
                await logout();
                router.replace('/(auth)/login');
              } else {
                Alert.alert('Erro', result.error || 'Nao foi possivel excluir a conta');
              }
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informacoes Pessoais */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informacoes Pessoais</Text>
            {!editing ? (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={styles.editButton}>Editar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setEditing(false)}>
                <Text style={styles.cancelButton}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nome completo</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={formData.nome}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, nome: text }))}
                  placeholder="Seu nome"
                  placeholderTextColor={colors.textMuted}
                />
              ) : (
                <Text style={styles.fieldValue}>{formData.nome || '-'}</Text>
              )}
            </View>

            <View style={styles.fieldDivider} />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>E-mail</Text>
              <Text style={[styles.fieldValue, styles.fieldValueDisabled]}>
                {formData.email || '-'}
              </Text>
              {editing && (
                <Text style={styles.fieldHint}>E-mail nao pode ser alterado</Text>
              )}
            </View>

            <View style={styles.fieldDivider} />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Telefone</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={formData.telefone}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, telefone: formatPhone(text) }))}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              ) : (
                <Text style={styles.fieldValue}>{formData.telefone || '-'}</Text>
              )}
            </View>

            <View style={styles.fieldDivider} />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>CPF</Text>
              <Text style={[styles.fieldValue, styles.fieldValueDisabled]}>
                {formData.cpf || '-'}
              </Text>
              {editing && (
                <Text style={styles.fieldHint}>CPF nao pode ser alterado</Text>
              )}
            </View>
          </View>

          {editing && (
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.saveButtonText}>Salvar alteracoes</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Opcoes da Conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(app)/orders')}
            >
              <Text style={styles.menuIcon}>📋</Text>
              <Text style={styles.menuText}>Meus pedidos</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.fieldDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>📍</Text>
              <Text style={styles.menuText}>Enderecos salvos</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.fieldDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={styles.menuText}>Notificacoes</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.fieldDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.replace('/(admin)/dashboard')}
            >
              <Text style={styles.menuIcon}>⚙️</Text>
              <Text style={[styles.menuText, styles.adminLinkText]}>Acessar painel admin</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sobre */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>

          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>📄</Text>
              <Text style={styles.menuText}>Termos de uso</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.fieldDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>🔒</Text>
              <Text style={styles.menuText}>Politica de privacidade</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.fieldDivider} />

            <View style={styles.menuItem}>
              <Text style={styles.menuIcon}>📱</Text>
              <Text style={styles.menuText}>Versao do app</Text>
              <Text style={styles.versionText}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Acoes */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sair da conta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <Text style={styles.deleteButtonText}>Excluir minha conta</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'web' ? 16 : 60,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textInverse,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  editButton: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  cancelButton: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  field: {
    paddingVertical: spacing.sm,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 16,
    color: colors.text,
  },
  fieldValueDisabled: {
    color: colors.textSecondary,
  },
  fieldHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  fieldDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  adminLinkText: {
    color: colors.primary,
    fontWeight: '600',
  },
  menuArrow: {
    fontSize: 16,
    color: colors.textMuted,
  },
  versionText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  logoutButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.error,
  },
});
