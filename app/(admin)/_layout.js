import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Alert, useWindowDimensions, Pressable, ScrollView,
} from 'react-native';
import { Slot, router, usePathname } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius } from '../../constants/theme';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '📊', route: 'dashboard' },
  { label: 'Pedidos',   icon: '📋', route: 'pedidos'   },
  { label: 'Cardápio',  icon: '🍕', route: 'cardapio'  },
  { label: 'Usuários',  icon: '👥', route: 'usuarios'  },
];

const SIDEBAR_WIDTH = 230;
const BREAKPOINT   = 768;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isWide = width >= BREAKPOINT;
  const [menuAberto, setMenuAberto] = useState(false);

  const fecharMenu = () => setMenuAberto(false);

  const navegar = (route) => {
    router.replace(`/(admin)/${route}`);
    fecharMenu();
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      fecharMenu();
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

  const SidebarContent = () => (
    <View style={styles.sidebarInner}>
      {/* Cabeçalho */}
      <View style={styles.brand}>
        <Text style={styles.brandIcon}>🍕</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandName}>Napolitech</Text>
          <Text style={styles.brandSub}>Painel Admin</Text>
        </View>
        {!isWide && (
          <TouchableOpacity onPress={fecharMenu} hitSlop={10}>
            <Text style={styles.fecharIcone}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Navegação */}
      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map(item => {
          const active = pathname.includes(item.route);
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => navegar(item.route)}
              activeOpacity={0.7}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
              {active && <View style={styles.navIndicador} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Rodapé */}
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
        <TouchableOpacity
          style={styles.backAppBtn}
          onPress={() => { fecharMenu(); router.replace('/(app)/order'); }}
        >
          <Text style={styles.backAppText}>🍕 Voltar ao app</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /* ── Layout wide (tablet / desktop) ── */
  if (isWide) {
    return (
      <View style={styles.rootWide}>
        <View style={styles.sidebarWide}>
          <SidebarContent />
        </View>
        <View style={styles.contentWide}>
          <Slot />
        </View>
      </View>
    );
  }

  /* ── Layout mobile ── */
  const paginaAtual = NAV_ITEMS.find(i => pathname.includes(i.route));

  return (
    <View style={styles.rootMobile}>
      {/* Header fixo mobile */}
      <View style={styles.headerMobile}>
        <TouchableOpacity onPress={() => setMenuAberto(true)} style={styles.hamburger}>
          <Text style={styles.hamburgerIcone}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>
          {paginaAtual ? `${paginaAtual.icon} ${paginaAtual.label}` : '🍕 Admin'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Conteúdo */}
      <View style={styles.contentMobile}>
        <Slot />
      </View>

      {/* Overlay + Drawer */}
      {menuAberto && (
        <>
          <Pressable style={styles.overlay} onPress={fecharMenu} />
          <View style={styles.drawer}>
            <SidebarContent />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Wide ── */
  rootWide: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  sidebarWide: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    flexShrink: 0,
  },
  contentWide: {
    flex: 1,
    overflow: Platform.OS === 'web' ? 'auto' : 'visible',
  },

  /* ── Mobile ── */
  rootMobile: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerMobile: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'web' ? 12 : 50,
    paddingBottom: 12,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hamburger: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerIcone: { fontSize: 22, color: colors.textInverse },
  headerTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textInverse,
  },
  contentMobile: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    zIndex: 20,
  },

  /* ── Sidebar interno (compartilhado) ── */
  sidebarInner: {
    flex: 1,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: Platform.OS === 'web' ? spacing.lg : 55,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  brandIcon: { fontSize: 28 },
  brandName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  brandSub: { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },
  fecharIcone: { fontSize: 18, color: colors.textSecondary, padding: 4 },

  nav: { flex: 1, paddingTop: spacing.md },
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
  navItemActive: { backgroundColor: 'rgba(255,107,53,0.08)' },
  navIcon: { fontSize: 18, marginRight: spacing.md },
  navLabel: {
    fontSize: 14, fontWeight: '500',
    color: colors.textSecondary, flex: 1,
  },
  navLabelActive: { color: colors.primary, fontWeight: '600' },
  navIndicador: {
    width: 3, height: 20,
    backgroundColor: colors.primary,
    borderRadius: 2,
    position: 'absolute', right: 0,
  },

  sidebarFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing.md, gap: spacing.sm,
  },
  userAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  userAvatarText: { color: colors.textInverse, fontWeight: '700', fontSize: 14 },
  userInfo: { flex: 1 },
  userName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  userRole: { color: colors.textSecondary, fontSize: 11 },
  backAppBtn: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center', marginBottom: spacing.sm,
  },
  backAppText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  logoutBtn: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.softCloud,
    alignItems: 'center',
  },
  logoutText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
});
