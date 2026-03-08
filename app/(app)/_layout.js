import { Tabs, Stack, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

function TabBarIcon({ name, focused }) {
  const icons = {
    order: focused ? '🍕' : '🍕',
    orders: focused ? '📋' : '📋',
    profile: focused ? '👤' : '👤',
  };

  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icons[name] || '📱'}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="order"
        options={{
          title: 'Pedir',
          tabBarIcon: ({ focused }) => <TabBarIcon name="order" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ focused }) => <TabBarIcon name="orders" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabBarIcon name="profile" focused={focused} />,
        }}
      />

      {/* Telas que nao aparecem no tab bar */}
      <Tabs.Screen
        name="checkout"
        options={{
          href: null, // Oculta do tab bar
        }}
      />
      <Tabs.Screen
        name="order-success"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="order-tracking"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 8,
    height: 65,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
});
