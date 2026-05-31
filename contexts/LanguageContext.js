import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'napolitech-language';
const DEFAULT_LANGUAGE = 'ptBR';

export const LANGUAGES = {
  ptBR: {
    flag: '🇧🇷',
    label: 'Português',
  },
  en: {
    flag: '🇺🇸',
    label: 'English',
  },
};

const translations = {
  ptBR: {
    common: {
      cancel: 'Cancelar',
      logout: 'Sair',
      total: 'Total',
      email: 'Email',
      password: 'Senha',
    },
    language: {
      switchToPortuguese: 'Trocar idioma para português',
      switchToEnglish: 'Trocar idioma para inglês',
    },
    tabs: {
      order: 'Pedir',
      orders: 'Pedidos',
      profile: 'Perfil',
    },
    login: {
      brandTagline: 'Sua pizzaria favorita',
      title: 'Bem-vindo de volta',
      subtitle: 'Entre para fazer seu pedido',
      passwordPlaceholder: 'Sua senha',
      forgotPassword: 'Esqueceu a senha?',
      submit: 'Entrar',
      divider: 'ou',
      createAccount: 'Criar nova conta',
      backendTitle: 'Backend conectado',
      backendUrl: 'API: http://localhost:8080',
      backendConfigured: 'API configurada via ambiente',
      backendHelp: 'Use suas credenciais cadastradas',
      alerts: {
        requiredTitle: 'Campos obrigatórios',
        requiredMessage: 'Por favor, preencha email e senha.',
        errorTitle: 'Erro no login',
        errorMessage: 'Verifique suas credenciais.',
      },
    },
    register: {
      title: 'Criar conta',
      subtitle: 'Junte-se à família Napolitech',
      fullName: 'Nome completo',
      namePlaceholder: 'Seu nome',
      phone: 'Telefone',
      birthDate: 'Data de nascimento',
      birthDatePlaceholder: 'DD/MM/AAAA',
      passwordPlaceholder: 'Mínimo 6 caracteres',
      confirmPassword: 'Confirmar senha',
      confirmPasswordPlaceholder: 'Repita a senha',
      submit: 'Criar minha conta',
      termsPrefix: 'Ao criar sua conta, você concorda com nossos',
      termsUse: 'Termos de Uso',
      termsAnd: 'e',
      privacyPolicy: 'Política de Privacidade',
      footerPrompt: 'Já tem uma conta? ',
      footerLink: 'Faça login',
      alerts: {
        requiredTitle: 'Campos obrigatórios',
        requiredMessage: 'Por favor, preencha todos os campos.',
        passwordMismatchTitle: 'Senhas diferentes',
        passwordMismatchMessage: 'As senhas digitadas não conferem.',
        weakPasswordTitle: 'Senha fraca',
        weakPasswordMessage: 'A senha deve ter pelo menos 6 caracteres.',
        invalidCpfTitle: 'CPF inválido',
        invalidCpfMessage: 'O CPF deve ter 11 dígitos.',
        invalidDateTitle: 'Data inválida',
        invalidDateMessage: 'Informe a data no formato DD/MM/AAAA.',
        successTitle: 'Conta criada!',
        successMessage: 'Seu cadastro foi realizado com sucesso.',
        successButton: 'Começar',
        errorTitle: 'Erro no cadastro',
        errorMessage: 'Tente novamente.',
      },
    },
    order: {
      loading: 'Carregando cardápio...',
      greeting: 'Olá, {{name}}!',
      subtitle: 'O que vai pedir hoje?',
      loadErrorTitle: 'Erro',
      loadErrorMessage: 'Falha ao carregar dados',
      guestName: 'Cliente',
      logoutTitle: 'Sair da conta',
      logoutMessage: 'Deseja realmente sair?',
      selectFlavorTitle: 'Selecione um sabor',
      selectFlavorMessage: 'Escolha pelo menos um sabor de pizza.',
      sections: {
        size: 'Tamanho',
        flavors: 'Sabores',
        drinks: 'Bebidas',
        summary: 'Resumo do pedido',
      },
      sizes: {
        BROTO: 'Broto',
        GRANDE: 'Grande',
        TREM: 'Trem',
        MEIO_A_MEIO: 'Meio a Meio',
      },
      slices: '{{count}} fatias',
      firstHalf: 'Primeira metade',
      secondHalf: 'Segunda metade (opcional)',
      chooseFlavor: 'Toque para escolher',
      wholePizza: 'Deixe vazio para pizza inteira',
      removeSecondHalf: 'x Remover 2a metade',
      addDrink: 'Adicionar bebida',
      summary: {
        pizzaSize: 'Pizza {{size}}',
        drinks: 'Bebidas',
        itemSingular: '{{count}} item',
        itemPlural: '{{count}} itens',
      },
      bottomTotal: 'Total do pedido',
      continue: 'Continuar compra',
      chooseDrinkModal: '🥤 Escolha a bebida',
      chooseFlavorModal: '🍕 Escolha o sabor',
    },
  },
  en: {
    common: {
      cancel: 'Cancel',
      logout: 'Log out',
      total: 'Total',
      email: 'Email',
      password: 'Password',
    },
    language: {
      switchToPortuguese: 'Switch language to Portuguese',
      switchToEnglish: 'Switch language to English',
    },
    tabs: {
      order: 'Order',
      orders: 'Orders',
      profile: 'Profile',
    },
    login: {
      brandTagline: 'Your favorite pizza place',
      title: 'Welcome back',
      subtitle: 'Sign in to place your order',
      passwordPlaceholder: 'Your password',
      forgotPassword: 'Forgot password?',
      submit: 'Sign in',
      divider: 'or',
      createAccount: 'Create new account',
      backendTitle: 'Backend connected',
      backendUrl: 'API: http://localhost:8080',
      backendConfigured: 'API configured by environment',
      backendHelp: 'Use your registered credentials',
      alerts: {
        requiredTitle: 'Required fields',
        requiredMessage: 'Please enter your email and password.',
        errorTitle: 'Login error',
        errorMessage: 'Check your credentials.',
      },
    },
    register: {
      title: 'Create account',
      subtitle: 'Join the Napolitech family',
      fullName: 'Full name',
      namePlaceholder: 'Your name',
      phone: 'Phone',
      birthDate: 'Birth date',
      birthDatePlaceholder: 'DD/MM/YYYY',
      passwordPlaceholder: 'At least 6 characters',
      confirmPassword: 'Confirm password',
      confirmPasswordPlaceholder: 'Repeat your password',
      submit: 'Create my account',
      termsPrefix: 'By creating your account, you agree to our',
      termsUse: 'Terms of Use',
      termsAnd: 'and',
      privacyPolicy: 'Privacy Policy',
      footerPrompt: 'Already have an account? ',
      footerLink: 'Sign in',
      alerts: {
        requiredTitle: 'Required fields',
        requiredMessage: 'Please fill in all fields.',
        passwordMismatchTitle: 'Passwords do not match',
        passwordMismatchMessage: 'The passwords you entered do not match.',
        weakPasswordTitle: 'Weak password',
        weakPasswordMessage: 'Password must be at least 6 characters long.',
        invalidCpfTitle: 'Invalid CPF',
        invalidCpfMessage: 'CPF must have 11 digits.',
        invalidDateTitle: 'Invalid date',
        invalidDateMessage: 'Enter the date in DD/MM/YYYY format.',
        successTitle: 'Account created!',
        successMessage: 'Your registration was completed successfully.',
        successButton: 'Start',
        errorTitle: 'Registration error',
        errorMessage: 'Please try again.',
      },
    },
    order: {
      loading: 'Loading menu...',
      greeting: 'Hi, {{name}}!',
      subtitle: 'What would you like to order today?',
      loadErrorTitle: 'Error',
      loadErrorMessage: 'Failed to load data',
      guestName: 'Guest',
      logoutTitle: 'Log out',
      logoutMessage: 'Are you sure you want to log out?',
      selectFlavorTitle: 'Select a flavor',
      selectFlavorMessage: 'Choose at least one pizza flavor.',
      sections: {
        size: 'Size',
        flavors: 'Flavors',
        drinks: 'Drinks',
        summary: 'Order summary',
      },
      sizes: {
        BROTO: 'Small',
        GRANDE: 'Large',
        TREM: 'Party',
        MEIO_A_MEIO: 'Half and Half',
      },
      slices: '{{count}} slices',
      firstHalf: 'First half',
      secondHalf: 'Second half (optional)',
      chooseFlavor: 'Tap to choose',
      wholePizza: 'Leave empty for a whole pizza',
      removeSecondHalf: 'x Remove second half',
      addDrink: 'Add drink',
      summary: {
        pizzaSize: '{{size}} pizza',
        drinks: 'Drinks',
        itemSingular: '{{count}} item',
        itemPlural: '{{count}} items',
      },
      bottomTotal: 'Order total',
      continue: 'Continue checkout',
      chooseDrinkModal: '🥤 Choose a drink',
      chooseFlavorModal: '🍕 Choose a flavor',
    },
  },
};

const LanguageContext = createContext(null);

function getTranslation(language, key) {
  return key.split('.').reduce((value, part) => value?.[part], translations[language]);
}

function interpolate(template, params) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? ''));
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    let isMounted = true;

    async function restoreLanguage() {
      try {
        const storedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted && LANGUAGES[storedLanguage]) {
          setLanguageState(storedLanguage);
        }
      } catch (error) {
        console.error('Erro ao restaurar idioma:', error);
      }
    }

    restoreLanguage();

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage) => {
    if (!LANGUAGES[nextLanguage]) return;

    setLanguageState(nextLanguage);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch (error) {
      console.error('Erro ao salvar idioma:', error);
    }
  }, []);

  const t = useCallback((key, params = {}, fallback = key) => {
    const template =
      getTranslation(language, key) ??
      getTranslation(DEFAULT_LANGUAGE, key) ??
      fallback;

    return typeof template === 'string' ? interpolate(template, params) : fallback;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage deve ser usado dentro de um LanguageProvider');
  }
  return context;
}

export default LanguageContext;
