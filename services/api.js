// API Service - conectado ao backend real
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Configuracao do backend
// Prioridade: variavel de ambiente -> extra do Expo -> fallback local
const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  'http://localhost:8080/api'
).replace(/\/$/, '');

const extrairNomeProduto = (item) => {
  // Se produto for um array de objetos (meio-a-meio)
  if (Array.isArray(item.produto)) {
    const nomes = item.produto
      .map(p => p?.nome || p?.name)
      .filter(Boolean);
    if (nomes.length > 1) {
      return `1/2 ${nomes[0]} + 1/2 ${nomes[1]}`;
    }
    if (nomes.length === 1) {
      return nomes[0];
    }
  }

  // Se produto for um objeto
  if (item.produto && typeof item.produto === 'object') {
    return item.produto.nome || item.produto.name;
  }

  // Fallbacks
  return item.nomeProduto || item.nome || 'Produto';
};

// Helper para fazer requisicoes
const request = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('token');

  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Login retorna apenas o token como texto
  if (endpoint === '/login') {
    const tokenText = await response.text();
    if (response.ok) {
      return { ok: true, token: tokenText };
    }
    throw new Error(tokenText || 'Email ou senha invalidos');
  }

  // Verifica se a resposta tem conteudo
  const text = await response.text();

  // Tenta parsear como JSON
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      // Se nao for JSON valido, usa o texto como mensagem de erro
      if (!response.ok) {
        throw new Error(text.substring(0, 100) || 'Erro na requisicao');
      }
      // Se for sucesso mas nao JSON, retorna texto
      return { text };
    }
  }

  if (!response.ok) {
    throw new Error(data.mensagem || data.erro || data.message || 'Erro na requisicao');
  }

  return data;
};

// ========== AUTH ==========

export const authService = {
  // Login
  async login(email, password) {
    try {
      const result = await request('/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha: password }),
      });

      if (result.token) {
        // Salva o token
        await AsyncStorage.setItem('token', result.token);

        // Busca dados do usuario pelo email
        const userResponse = await request(`/email/${encodeURIComponent(email)}`);

        const user = userResponse.usuario || userResponse;

        // Salva dados do usuario
        await AsyncStorage.setItem('user', JSON.stringify(user));

        return {
          success: true,
          user: {
            id: user.idUsuario || user.id,
            name: user.nome,
            email: user.email,
            phone: user.telefone,
            cpf: user.cpf,
          },
          token: result.token,
        };
      }

      return { success: false, error: 'Falha na autenticacao' };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Email ou senha invalidos',
      };
    }
  },

  // Cadastro
  async register(userData) {
    try {
      // Formata a data de nascimento (usando data fixa por enquanto pois nao temos campo no form)
      const dataFormatada = userData.dataNasc || '01/01/2000';

      const response = await request('/cadastro', {
        method: 'POST',
        body: JSON.stringify({
          nome: userData.name,
          email: userData.email,
          dataNasc: dataFormatada,
          cpf: userData.cpf || '000.000.000-00', // CPF placeholder - precisa adicionar no form
          senha: userData.password,
          confirmarSenha: userData.password,
          telefone: userData.phone,
        }),
      });

      if (response.usuario) {
        // Faz login automatico apos cadastro
        return await this.login(userData.email, userData.password);
      }

      return {
        success: true,
        message: response.mensagem,
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.message || 'Erro ao cadastrar usuario',
      };
    }
  },

  // Logout
  async logout() {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false };
    }
  },

  // Restaurar sessao
  async restoreSession() {
    try {
      const token = await AsyncStorage.getItem('token');
      const userJson = await AsyncStorage.getItem('user');

      if (token && userJson) {
        const userData = JSON.parse(userJson);
        return {
          success: true,
          user: {
            id: userData.idUsuario || userData.id,
            name: userData.nome,
            email: userData.email,
            phone: userData.telefone,
            cpf: userData.cpf,
          },
          token,
        };
      }

      return { success: false };
    } catch (error) {
      console.error('Restore session error:', error);
      return { success: false };
    }
  },
};

// ========== PRODUTOS ==========

export const productService = {
  // Buscar todos os produtos
  async getProducts(page = 0, size = 100) {
    try {
      const response = await request(`/produtos?page=${page}&size=${size}`);
      return { success: true, data: response };
    } catch (error) {
      console.error('Get products error:', error);
      return { success: false, error: error.message };
    }
  },

  // Buscar produtos por categoria
  async getProductsByCategory(category) {
    try {
      const response = await request(`/produtos?page=0&size=100`);
      const products = response.content || [];
      const filtered = products.filter(p => p.categoriaProduto === category);
      return { success: true, data: filtered };
    } catch (error) {
      console.error('Get products by category error:', error);
      return { success: false, error: error.message };
    }
  },

  // Buscar sabores de pizza (produtos da categoria PIZZA)
  async getFlavors() {
    try {
      const response = await request('/produtos?page=0&size=100');
      const products = response.content || [];

      // Filtra pizzas e mapeia para o formato esperado pelo frontend
      const pizzas = products
        .filter(p => p.categoriaProduto === 'PIZZA')
        .map(p => ({
          id: p.id,
          name: p.nome,
          price: p.preco,
          description: p.ingredientes,
        }));

      return { success: true, data: pizzas };
    } catch (error) {
      console.error('Get flavors error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Buscar tamanhos de pizza (valores fixos - backend nao tem endpoint para isso)
  async getSizes() {
    // Tamanhos baseados na documentacao do backend
    const sizes = [
      { id: 'BROTO', name: 'Broto', slices: 2, multiplier: 0.6 },
      { id: 'GRANDE', name: 'Grande', slices: 8, multiplier: 1.0 },
      { id: 'TREM', name: 'Trem', slices: 16, multiplier: 1.8 },
      { id: 'MEIO_A_MEIO', name: 'Meio a Meio', slices: 8, multiplier: 1.0 },
    ];
    return { success: true, data: sizes };
  },

  // Buscar bebidas
  async getDrinks() {
    try {
      const response = await request('/produtos?page=0&size=100');
      const products = response.content ?? (Array.isArray(response) ? response : []);

      const drinks = products
        .filter(p => {
          const cat = (p.categoriaProduto || '').toUpperCase();
          return cat === 'BEBIDA' || cat === 'BEBIDAS';
        })
        .map(p => ({
          id: p.id,
          name: p.nome,
          price: p.preco,
        }));

      return { success: true, data: drinks };
    } catch (error) {
      console.error('Get drinks error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Buscar porcoes
  async getPorcoes() {
    try {
      const response = await request('/produtos?page=0&size=100');
      const products = response.content || [];

      const porcoes = products
        .filter(p => p.categoriaProduto === 'PORCAO')
        .map(p => ({
          id: p.id,
          name: p.nome,
          price: p.preco,
          description: p.ingredientes,
        }));

      return { success: true, data: porcoes };
    } catch (error) {
      console.error('Get porcoes error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Buscar sobremesas
  async getSobremesas() {
    try {
      const response = await request('/produtos?page=0&size=100');
      const products = response.content || [];

      const sobremesas = products
        .filter(p => p.categoriaProduto === 'SOBREMESA' || p.categoriaProduto === 'PIZZA_DOCE')
        .map(p => ({
          id: p.id,
          name: p.nome,
          price: p.preco,
          description: p.ingredientes,
        }));

      return { success: true, data: sobremesas };
    } catch (error) {
      console.error('Get sobremesas error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Buscar esfihas
  async getEsfihas() {
    try {
      const response = await request('/produtos?page=0&size=100');
      const products = response.content || [];

      const esfihas = products
        .filter(p => p.categoriaProduto === 'ESFIHA' || p.categoriaProduto === 'ESFIHA_DOCE')
        .map(p => ({
          id: p.id,
          name: p.nome,
          price: p.preco,
          description: p.ingredientes,
        }));

      return { success: true, data: esfihas };
    } catch (error) {
      console.error('Get esfihas error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
};

// ========== PEDIDOS ==========

export const orderService = {
  // Criar pedido
  async createOrder(orderData) {
    try {
      const userJson = await AsyncStorage.getItem('user');
      console.log('User from storage:', userJson);

      const user = userJson ? JSON.parse(userJson) : {};

      // Verifica se tem usuario logado
      if (!user.idUsuario && !user.id) {
        console.error('Usuario nao encontrado no storage');
        return {
          success: false,
          error: 'Usuario nao esta logado. Faca login novamente.',
        };
      }

      const clienteId = user.idUsuario || user.id;

      // Monta os itens do pedido
      const itens = [];

      // Adiciona pizza
      if (orderData.pizza && orderData.pizza.flavor1) {
        const produtoIds = [orderData.pizza.flavor1.id];
        if (orderData.pizza.flavor2) {
          produtoIds.push(orderData.pizza.flavor2.id);
        }

        itens.push({
          produto: produtoIds,
          quantidade: 1,
          tamanhoPizza: orderData.pizza.size?.id || 'GRANDE',
          bordaRecheada: orderData.bordaRecheada || 'NORMAL',
        });
      }

      // Adiciona bebidas
      if (orderData.drinks && orderData.drinks.length > 0) {
        orderData.drinks.forEach(drink => {
          itens.push({
            produto: [drink.id],
            quantidade: drink.quantity,
            tamanhoPizza: 'GRANDE',
            bordaRecheada: 'NORMAL',
          });
        });
      }

      const pedidoData = {
        clienteId: clienteId,
        nomeCliente: user.nome || orderData.nomeCliente,
        valorTotal: orderData.total,
        enderecoId: orderData.enderecoId || null,
        telefone: user.telefone || orderData.telefone,
        observacao: orderData.observacao || '',
        statusPedido: 'RECEBIDO',
        tipoEntrega: orderData.tipoEntrega || 'RETIRADA',
        bordaRecheada: orderData.bordaRecheada || 'NORMAL',
        dataPedido: new Date().toISOString(),
        itens,
      };

      console.log('Pedido data:', JSON.stringify(pedidoData, null, 2));

      const response = await request('/pedidos', {
        method: 'POST',
        body: JSON.stringify(pedidoData),
      });

      return {
        success: true,
        order: {
          id: response.pedidoId,
          ...response,
        },
      };
    } catch (error) {
      console.error('Create order error:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar pedido',
      };
    }
  },

  // Buscar pedidos do usuario
  async getOrders() {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : {};
      const clienteId = user.idUsuario || user.id;

      if (!clienteId) {
        console.error('Usuario nao encontrado para buscar pedidos');
        return { success: false, error: 'Usuario nao logado', data: [] };
      }

      // Busca usuario por ID - retorna pedidosRealizados
      const response = await request(`/${clienteId}`);
      const pedidos = response.pedidosRealizados || [];

      return {
        success: true,
        data: pedidos.map(p => ({
          id: p.id,
          status: p.statusPedido,
          total: p.precoTotal,
          date: p.dataPedido,
          items: (p.itens || []).map(item => ({
            id: item.id,
            quantidade: item.quantidade,
            nomeProduto: extrairNomeProduto(item),
            preco: item.produto?.preco || item.preco,
            tamanhoPizza: item.tamanhoPizza,
            bordaRecheada: item.bordaRecheada,
          })),
        })),
      };
    } catch (error) {
      console.error('Get orders error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Buscar pedido por ID
  async getOrderById(orderId) {
    try {
      const response = await request(`/pedidos/${orderId}`);

      // Mapeia os itens para incluir nomeProduto
      const mappedData = {
        ...response,
        itens: (response.itens || []).map(item => ({
          id: item.id,
          quantidade: item.quantidade,
          nomeProduto: extrairNomeProduto(item),
          preco: item.produto?.preco || item.preco,
          tamanhoPizza: item.tamanhoPizza,
          bordaRecheada: item.bordaRecheada,
        })),
      };

      return { success: true, data: mappedData };
    } catch (error) {
      console.error('Get order by ID error:', error);
      return { success: false, error: error.message };
    }
  },
};

// ========== USUARIO ==========

export const userService = {
  // Buscar dados do usuario
  async getProfile() {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : {};

      if (!user.email) {
        return { success: false, error: 'Usuario nao logado' };
      }

      const response = await request(`/email/${encodeURIComponent(user.email)}`);
      const userData = response.usuario || response;

      return {
        success: true,
        user: {
          id: userData.idUsuario || userData.id,
          name: userData.nome,
          email: userData.email,
          phone: userData.telefone,
          cpf: userData.cpf,
        },
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, error: error.message };
    }
  },

  // Atualizar perfil do usuario
  async updateProfile(profileData) {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : {};
      const userId = user.idUsuario || user.id;

      if (!userId) {
        return { success: false, error: 'Usuario nao logado' };
      }

      const response = await request(`/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome: profileData.nome,
          telefone: profileData.telefone,
        }),
      });

      // Atualiza dados locais
      const updatedUser = {
        ...user,
        nome: profileData.nome || user.nome,
        telefone: profileData.telefone || user.telefone,
      };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      return {
        success: true,
        user: {
          id: updatedUser.idUsuario || updatedUser.id,
          name: updatedUser.nome,
          email: updatedUser.email,
          phone: updatedUser.telefone,
          cpf: updatedUser.cpf,
        },
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  },

  // Excluir conta do usuario
  async deleteAccount() {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : {};
      const userId = user.idUsuario || user.id;

      if (!userId) {
        return { success: false, error: 'Usuario nao logado' };
      }

      await request(`/${userId}`, {
        method: 'DELETE',
      });

      // Limpa dados locais
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, error: error.message };
    }
  },
};

// ========== ENDERECOS ==========

export const addressService = {
  // Cadastrar endereco
  async createAddress(addressData) {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : {};
      const usuarioId = user.idUsuario || user.id;

      if (!usuarioId) {
        return {
          success: false,
          error: 'Usuario nao esta logado.',
        };
      }

      console.log('Cadastrando endereco para usuario:', usuarioId);

      const response = await request('/enderecos', {
        method: 'POST',
        body: JSON.stringify({
          rua: addressData.rua,
          bairro: addressData.bairro,
          numero: parseInt(addressData.numero),
          complemento: addressData.complemento || '',
          cidade: addressData.cidade,
          estado: addressData.estado,
          cep: addressData.cep,
          usuarioId: usuarioId,
        }),
      });

      console.log('Endereco criado:', response);

      return {
        success: true,
        address: {
          id: response.enderecoId,
          rua: response.rua,
          numero: response.numero,
          bairro: response.bairro,
          complemento: response.complemento,
          cidade: response.cidade,
          estado: response.estado,
          cep: response.cep,
        },
      };
    } catch (error) {
      console.error('Create address error:', error);
      return {
        success: false,
        error: error.message || 'Erro ao cadastrar endereco',
      };
    }
  },

  // Buscar enderecos do usuario
  async getAddresses() {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : {};

      if (!user.email) {
        return { success: true, data: [] };
      }

      const response = await request(`/enderecos/email/${encodeURIComponent(user.email)}`);

      const endereco = response.endereco;
      if (endereco) {
        return {
          success: true,
          data: [{
            id: endereco.id,
            rua: endereco.rua,
            numero: endereco.numero,
            bairro: endereco.bairro,
            complemento: endereco.complemento,
            cidade: endereco.cidade,
            estado: endereco.estado,
            cep: endereco.cep,
          }],
        };
      }

      return { success: true, data: [] };
    } catch (error) {
      console.error('Get addresses error:', error);
      return { success: true, data: [] };
    }
  },
};

// ========== UPSELL (IA) ==========

export const upsellService = {
  // Buscar sugestoes de upsell com IA
  async getSugestoes(produtosIds = []) {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : {};
      const clienteId = user.idUsuario || user.id;

      if (!clienteId) {
        console.log('Usuario nao logado para upsell');
        return { success: true, data: [] };
      }

      const response = await request(`/upsell/${clienteId}`, {
        method: 'POST',
        body: JSON.stringify({ produtosIds }),
      });

      // A API retorna um array de sugestoes
      const sugestoes = Array.isArray(response) ? response : [];

      return {
        success: true,
        data: sugestoes.map(s => ({
          id: s.id,
          nome: s.nome,
          preco: s.preco,
          categoria: s.categoriaProduto,
          motivo: s.motivo,
        })),
      };
    } catch (error) {
      console.error('Upsell error:', error);
      // Nunca quebra o checkout - retorna array vazio em caso de erro
      return { success: true, data: [] };
    }
  },
};

// Exporta tudo junto tambem para facilitar
export default {
  auth: authService,
  products: productService,
  orders: orderService,
  addresses: addressService,
  user: userService,
  upsell: upsellService,
};
