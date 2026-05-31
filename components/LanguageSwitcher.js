import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../constants/theme';
import { LANGUAGES, useLanguage } from '../contexts/LanguageContext';

export default function LanguageSwitcher({ variant = 'default' }) {
  const { language, setLanguage, t } = useLanguage();
  const isOnPrimary = variant === 'primary';

  return (
    <View style={[styles.container, isOnPrimary && styles.containerOnPrimary]}>
      {Object.entries(LANGUAGES).map(([key, option]) => {
        const isActive = language === key;
        const accessibilityLabel =
          key === 'ptBR'
            ? t('language.switchToPortuguese')
            : t('language.switchToEnglish');

        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.flagButton,
              isOnPrimary && styles.flagButtonOnPrimary,
              isActive && styles.flagButtonActive,
              isOnPrimary && isActive && styles.flagButtonActiveOnPrimary,
            ]}
            onPress={() => setLanguage(key)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
          >
            <Text style={styles.flagText}>{option.flag}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
  },
  containerOnPrimary: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.24)',
  },
  flagButton: {
    width: 36,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagButtonOnPrimary: {
    backgroundColor: 'transparent',
  },
  flagButtonActive: {
    backgroundColor: colors.primary,
  },
  flagButtonActiveOnPrimary: {
    backgroundColor: colors.surface,
  },
  flagText: {
    fontSize: 18,
    lineHeight: 22,
  },
});
