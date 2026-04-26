# Napolitech App — Estado Completo do Projeto

## O que é o projeto

App de pizzaria chamado **Napolitech**. Frontend em Expo/React Native com suporte a web (react-native-web). Backend em Java Spring Boot, rodando em Docker local, exposto via ngrok com domínio fixo.

**Por que:** Sistema de pedidos para pizzaria com app mobile e acesso web, integrando IA (Llama via Ollama) para upsell no checkout.

---

## Stack

- **Frontend:** Expo 54 + React Native 0.81.5 + React 19, Expo Router 6 (file-based routing), react-native-web
- **Backend:** Java Spring Boot, Docker, Redis, RabbitMQ, Llama (Ollama local)
- **Deploy frontend:** Netlify — URL: `https://bonaripizzaria.netlify.app`
- **Backend público:** ngrok domínio fixo `https://internation-sully-kolten.ngrok-free.dev`
- **API base:** `https://internation-sully-kolten.ngrok-free.dev/api`

---

## Estrutura de arquivos relevantes

```
napolitech-app/
├── .env                        ← EXPO_PUBLIC_API_BASE_URL configurado
├── .env.example
├── app/
│   ├── _layout.js              ← Root layout com AuthProvider
│   ├── index.js                ← Redirect baseado em isAuthenticated
│   ├── (auth)/
│   │   ├── login.js
│   │   └── register.js         ← ALTERADO
│   └── (app)/
│       ├── _layout.js          ← Tabs: order, orders, profile + hidden: checkout, order-success, order-tracking
│       ├── order.js
│       ├── checkout.js         ← ALTERADO
│       ├── order-success.js    ← ALTERADO
│       ├── order-tracking.js   ← ALTERADO
│       ├── orders.js
│       └── profile.js
├── contexts/
│   └── AuthContext.js          ← JWT, AsyncStorage, isAuthenticated, isInitialized
├── services/
│   └── api.js                  ← ALTERADO — service central de API
├── prompt/
│   ├── backend-integration-agent.json
│   ├── front-conect.json
│   └── project-state.md        ← ESTE ARQUIVO
└── dist/                       ← Build web gerado, usado no deploy Netlify
```

---

## Variáveis de ambiente

### `.env` (local)
```
EXPO_PUBLIC_API_BASE_URL=https://internation-sully-kolten.ngrok-free.dev/api
```

### Netlify (painel → Environment variables)
```
EXPO_PUBLIC_API_BASE_URL=https://internation-sully-kolten.ngrok-free.dev/api
```

---

## Autenticação

- JWT Bearer Token, 24h de validade
- Token salvo em `AsyncStorage` com chave `'token'`
- Usuário salvo em `AsyncStorage` com chave `'user'`
- Login retorna **string pura** (não JSON) — usa `response.text()`
- Toda requisição autenticada envia `Authorization: Bearer <token>`
- 401/403 → limpar AsyncStorage + redirecionar para login

---

## API — Contrato resumido

Todos os endpoints são relativos à `BASE_URL` que já inclui `/api`. **Nunca duplicar o prefixo.**

| Método | Path | Auth | Notas |
|--------|------|------|-------|
| POST | /cadastro | Não | Registro de usuário |
| POST | /login | Não | Retorna token como string pura |
| GET | /{id} | Sim | Busca usuário por ID (não é /usuarios/{id}) |
| GET | /email/{email} | Sim | Busca usuário por email |
| PUT | /{id} | Sim | Atualiza usuário (não é /usuarios/{id}) |
| DELETE | /{id} | Sim | Deleta usuário (não é /usuarios/{id}) |
| GET | /produtos | Sim | Paginado, cacheado no Redis 5min |
| POST | /pedidos | Sim | Cria pedido, publica no RabbitMQ |
| PUT | /pedidos/{id}/status | Sim | Atualiza status |
| GET | /pedidos/{id} | Sim | Busca pedido |
| POST | /enderecos | Sim | Cadastra endereço |
| GET | /enderecos/email/{email} | Sim | Busca endereço por email |
| PUT | /enderecos/{usuarioId}/{enderecoId} | Sim | Dois IDs no path |
| POST | /upsell/{clienteId} | Sim | Sugestões IA (Llama), nunca retorna erro |
| GET | /dashboard/kpis | Sim | Admin |

---

## CORS e ngrok

- Backend tem `allowCredentials: true`
- Frontend envia `credentials: 'include'` em toda requisição (configurado no `request()` do api.js)
- Frontend envia header `ngrok-skip-browser-warning: true` para pular a tela de aviso do ngrok
- Origem `https://bonaripizzaria.netlify.app` está liberada no backend
- Para adicionar nova origem: informar ao dev do backend para atualizar `FRONTEND_ALLOWED_ORIGINS` no `.env` do Docker e fazer rebuild

---

## Todas as alterações realizadas

### `services/api.js`
- Adicionado `credentials: 'include'` em todas as requisições
- Adicionado header `ngrok-skip-browser-warning: true` em todas as requisições
- Corrigido `updateProfile`: era `/usuarios/${userId}` → `/${userId}`
- Corrigido `deleteAccount`: era `/usuarios/${userId}` → `/${userId}`
- Corrigido `getDrinks`: filtro era `'BEBIDAS'` → `'BEBIDA'`

### `app/(auth)/register.js`
- Fix navegação pós-cadastro na web: `Alert.alert` com callback não funciona no browser
- `Platform.OS === 'web'` → navega direto com `router.replace('/(app)/order')`
- Nativo → mantém Alert com botão

### `app/(app)/order-success.js`
- `useNativeDriver: true` → `useNativeDriver: Platform.OS !== 'web'`
- Adicionado `Platform` no import

### `app/(app)/order-tracking.js`
- `useNativeDriver: true` → `useNativeDriver: Platform.OS !== 'web'`
- Adicionado `Platform` no import

### `app/(app)/checkout.js`
- Adicionado estado `loadingCep`
- Adicionado autocomplete de CEP via ViaCEP (`https://viacep.com.br/ws/{cep}/json/`)
- Ao digitar 8 dígitos no CEP, preenche automaticamente: rua, bairro, cidade, estado
- Campos continuam editáveis manualmente após preenchimento automático
- Label do CEP exibe "Buscando..." durante a requisição

### `.env` (novo arquivo criado)
- `EXPO_PUBLIC_API_BASE_URL=https://internation-sully-kolten.ngrok-free.dev/api`

### `dist/_redirects` (novo arquivo criado)
- `/* /index.html 200` — necessário para SPA funcionar no Netlify

---

## Como fazer rebuild e redeploy

```bash
# Na pasta do projeto
npx expo export --platform web
# Depois arrastar a pasta dist/ no Netlify (bonaripizzaria.netlify.app)
```

## Para o backend funcionar

```bash
docker compose up -d
docker compose --profile ngrok up -d ngrok
```

> **Limitação:** Backend roda localmente. Se Docker/ngrok parar, o frontend perde conexão.

---

## Enums importantes

```
StatusPedido:    RECEBIDO | EM_PREPARO | ENTREGUE | ENCERRADO | CANCELADO
TipoEntrega:     RETIRADA | DELIVERY | ENCOMENDA
BordaRecheada:   NORMAL | CHEDDAR (+R$8) | CATUPIRY (+R$8) | CHOCOLATE (+R$10)
TamanhoPizza:    PEQUENA | MEDIA | GRANDE | GIGANTE
CategoriaProduto: PIZZA | BEBIDA | SOBREMESA | ENTRADA | OUTRO
TipoUsuario:     CLIENTE | ATENDENTE | ADMIN
```

---

## Regras críticas — nunca violar

1. NUNCA hardcodar URL — sempre `process.env.EXPO_PUBLIC_API_BASE_URL`
2. NUNCA duplicar `/api` — a BASE_URL já inclui o prefixo
3. Endpoint de usuário é `/{id}`, não `/usuarios/{id}`
4. Endpoint de endereço tem DOIS IDs: `/enderecos/{usuarioId}/{enderecoId}`
5. Login retorna string pura — usar `response.text()`, nunca `.json()`
6. Animações com `useNativeDriver` devem usar `Platform.OS !== 'web'`
7. `Alert.alert` com callbacks não funciona na web — usar `Platform.OS` para diferenciar
8. Upsell nunca bloqueia o checkout — falha silenciosa com array vazio
