// Mock data - substitua por chamadas reais ao backend futuramente

export const PIZZA_FLAVORS = [
  { id: 1, name: 'Calabresa', price: 35.00, description: 'Calabresa fatiada com cebola' },
  { id: 2, name: 'Margherita', price: 32.00, description: 'Molho de tomate, mussarela e manjericão' },
  { id: 3, name: 'Portuguesa', price: 38.00, description: 'Presunto, ovos, cebola, ervilha e azeitona' },
  { id: 4, name: 'Frango com Catupiry', price: 40.00, description: 'Frango desfiado com catupiry' },
  { id: 5, name: 'Quatro Queijos', price: 42.00, description: 'Mussarela, provolone, parmesão e gorgonzola' },
  { id: 6, name: 'Pepperoni', price: 45.00, description: 'Pepperoni importado com mussarela' },
  { id: 7, name: 'Napolitana', price: 36.00, description: 'Tomate, mussarela, parmesão e manjericão' },
  { id: 8, name: 'Bacon', price: 38.00, description: 'Bacon crocante com mussarela' },
  { id: 9, name: 'Mussarela', price: 30.00, description: 'Mussarela com orégano' },
  { id: 10, name: 'Brasileira', price: 40.00, description: 'Catupiry, milho, bacon e mussarela' },
];

export const DRINKS = [
  { id: 1, name: 'Coca-Cola 350ml', price: 6.00 },
  { id: 2, name: 'Coca-Cola 2L', price: 12.00 },
  { id: 3, name: 'Guaraná Antarctica 350ml', price: 5.00 },
  { id: 4, name: 'Guaraná Antarctica 2L', price: 10.00 },
  { id: 5, name: 'Fanta Laranja 350ml', price: 5.00 },
  { id: 6, name: 'Sprite 350ml', price: 5.00 },
  { id: 7, name: 'Água Mineral 500ml', price: 4.00 },
  { id: 8, name: 'Suco de Laranja 500ml', price: 8.00 },
];

export const PIZZA_SIZES = [
  { id: 'small', name: 'Pequena', slices: 4, multiplier: 0.7 },
  { id: 'medium', name: 'Média', slices: 6, multiplier: 1.0 },
  { id: 'large', name: 'Grande', slices: 8, multiplier: 1.3 },
  { id: 'family', name: 'Família', slices: 12, multiplier: 1.6 },
];

// Mock de usuários cadastrados (apenas para simular)
export const MOCK_USERS = [
  { id: 1, name: 'João Silva', email: 'joao@email.com', password: '123456', phone: '11999999999' },
  { id: 2, name: 'Maria Santos', email: 'maria@email.com', password: '123456', phone: '11888888888' },
];
