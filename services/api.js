// API Service - substitua as funções mock por chamadas reais ao backend
import { PIZZA_FLAVORS, DRINKS, PIZZA_SIZES, MOCK_USERS } from './mockData';

// Configuração base da API - configure seu backend aqui
const API_BASE_URL = 'http://localhost:3000/api'; // Altere para sua URL

// Simula delay de rede
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ========== AUTH ==========

export const authService = {
  // Login
  async login(email, password) {
    // TODO: Substituir por chamada real
    // return fetch(`${API_BASE_URL}/auth/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password }),
    // }).then(res => res.json());

    await delay(800); // Simula latência

    const user = MOCK_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return {
        success: true,
        user: userWithoutPassword,
        token: 'mock-jwt-token-' + user.id,
      };
    }

    return {
      success: false,
      error: 'Email ou senha inválidos',
    };
  },

  // Cadastro
  async register(userData) {
    // TODO: Substituir por chamada real
    // return fetch(`${API_BASE_URL}/auth/register`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(userData),
    // }).then(res => res.json());

    await delay(800);

    const existingUser = MOCK_USERS.find(
      u => u.email.toLowerCase() === userData.email.toLowerCase()
    );

    if (existingUser) {
      return {
        success: false,
        error: 'Este email já está cadastrado',
      };
    }

    const newUser = {
      id: MOCK_USERS.length + 1,
      ...userData,
    };

    MOCK_USERS.push(newUser);

    const { password: _, ...userWithoutPassword } = newUser;
    return {
      success: true,
      user: userWithoutPassword,
      token: 'mock-jwt-token-' + newUser.id,
    };
  },

  // Logout
  async logout() {
    // TODO: Substituir por chamada real se necessário
    await delay(300);
    return { success: true };
  },
};

// ========== PRODUTOS ==========

export const productService = {
  // Buscar sabores de pizza
  async getFlavors() {
    // TODO: Substituir por chamada real
    // return fetch(`${API_BASE_URL}/pizzas/flavors`).then(res => res.json());

    await delay(500);
    return { success: true, data: PIZZA_FLAVORS };
  },

  // Buscar tamanhos de pizza
  async getSizes() {
    // TODO: Substituir por chamada real
    // return fetch(`${API_BASE_URL}/pizzas/sizes`).then(res => res.json());

    await delay(300);
    return { success: true, data: PIZZA_SIZES };
  },

  // Buscar bebidas
  async getDrinks() {
    // TODO: Substituir por chamada real
    // return fetch(`${API_BASE_URL}/drinks`).then(res => res.json());

    await delay(400);
    return { success: true, data: DRINKS };
  },
};

// ========== PEDIDOS ==========

export const orderService = {
  // Criar pedido
  async createOrder(orderData) {
    // TODO: Substituir por chamada real
    // return fetch(`${API_BASE_URL}/orders`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${token}`,
    //   },
    //   body: JSON.stringify(orderData),
    // }).then(res => res.json());

    await delay(1000);

    return {
      success: true,
      order: {
        id: Date.now(),
        ...orderData,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    };
  },

  // Buscar histórico de pedidos
  async getOrders(userId) {
    // TODO: Substituir por chamada real
    // return fetch(`${API_BASE_URL}/orders/user/${userId}`, {
    //   headers: { 'Authorization': `Bearer ${token}` },
    // }).then(res => res.json());

    await delay(600);
    return { success: true, data: [] };
  },
};

// Exporta tudo junto também para facilitar
export default {
  auth: authService,
  products: productService,
  orders: orderService,
};
