import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const { t } = useLanguage();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('login.alerts.requiredTitle'), t('login.alerts.requiredMessage'));
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      router.replace('/(app)/order');
    } else {
      Alert.alert(t('login.alerts.errorTitle'), result.error || t('login.alerts.errorMessage'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topActions}>
          <LanguageSwitcher />
        </View>

        {/* Header/Brand */}
        <View style={styles.brandContainer}>
          <View style={styles.logoWrapper}>
            <Text style={styles.logoIcon}>🍕</Text>
          </View>
          <Text style={styles.brandName}>Napolitech</Text>
          <Text style={styles.brandTagline}>{t('login.brandTagline')}</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('login.title')}</Text>
          <Text style={styles.cardSubtitle}>{t('login.subtitle')}</Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('common.email')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('common.password')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login.passwordPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.showPasswordButton}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>{t('login.forgotPassword')}</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.primaryButtonText}>{t('login.submit')}</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('login.divider')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register Link */}
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
              <Text style={styles.secondaryButtonText}>{t('login.createAccount')}</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Info Card */}
        <View style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <Text style={styles.demoIcon}>🔌</Text>
            <Text style={styles.demoTitle}>{t('login.backendTitle')}</Text>
          </View>
          <Text style={styles.demoText}>{t('login.backendConfigured')}</Text>
          <Text style={styles.demoText}>{t('login.backendHelp')}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
  },
  topActions: {
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  logoIcon: {
    fontSize: 40,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  showPasswordButton: {
    padding: spacing.sm,
  },
  showPasswordText: {
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  demoCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.info,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  demoIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.info,
  },
  demoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: spacing.lg + spacing.sm,
  },
});
