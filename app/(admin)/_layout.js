import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Slot, router, usePathname } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius } from '../../constants/theme';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '📊', route: 'dashboard' },
  { label: 'Pedidos', icon: '📋', route: 'pedidos' },
  { label: 'Cardápio', icon: '🍕', route: 'cardapio' },
  { label: 'Usuários', icon: '👥', route: 'usuarios' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const items = NAV_ITEMS;

  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
      router.replace('/(auth)/login');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Deseja realmente sair?')) doLogout();
    } else {
      Alert.alert('Sair', 'Deseja realmente sair?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        <View style={styles.brand}>
          <Text style={styles.brandIcon}>🍕</Text>
          <View>
            <Text style={styles.brandName}>Napolitech</Text>
            <Text style={styles.brandSub}>Painel Admin</Text>
          </View>
        </View>

        <View style={styles.nav}>
          {items.map(item => {
            const active = pathname.includes(item.route);
            return (
              <TouchableOpacity
                key={item.route}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => router.replace(`/(admin)/${item.route}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {item.label}
                </Text>
                {active && <View style={styles.navIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sidebarFooter}>
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{user?.name}</Text>
              <Text style={styles.userRole}>{user?.tipoUsuario}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.backAppBtn} onPress={() => router.replace('/(app)/order')}>
            <Text style={styles.backAppText}>🍕 Voltar ao app</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪 Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  sidebar: {
    width: 230,
    backgroundColor: colors.secondary,
    paddingTop: Platform.OS === 'web' ? 0 : 40,
    flexShrink: 0,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: spacing.md,
  },
  brandIcon: { fontSize: 28 },
  brandName: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  brandSub: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '500',
  },
  nav: {
    flex: 1,
    paddingTop: spacing.md,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.sm,
    marginBottom: 2,
    borderRadius: borderRadius.md,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(255,107,53,0.15)',
  },
  navIcon: { fontSize: 18, marginRight: spacing.md },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    flex: 1,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  navIndicator: {
    width: 3,
    height: 20,
    backgroundColor: colors.primary,
    borderRadius: 2,
    position: 'absolute',
    right: 0,
  },
  sidebarFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: 14,
  },
  userInfo: { flex: 1 },
  userName: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '600',
  },
  userRole: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  backAppBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,107,53,0.15)',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backAppText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
  },
  logoutText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    overflow: Platform.OS === 'web' ? 'auto' : 'visible',
  },
});
