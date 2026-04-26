# Apresentação de Sprint — Protótipo Funcional: App Conectado (API + BD)

---

## Slide 1 — Capa

**Título:** Protótipo Funcional — App Conectado (API + BD)

**Projeto:** Napolitech — Sistema de Pedidos para Pizzaria


**Entrega:** Protótipo funcional com consumo de APIs REST, integração com backend e banco de dados, navegação completa e uso de recursos do dispositivo

---

## Slide 2 — Visão Geral do Projeto

**O que é o Napolitech?**

Sistema completo de pedidos para pizzaria com:

- Aplicativo mobile e web para clientes realizarem pedidos
- Painel administrativo para gestão de pedidos, cardápio e usuários
- Integração completa entre frontend, backend e banco de dados reais

**Tecnologias principais:**
- Frontend: React Native + Expo (roda em iOS, Android e Web)
- Backend: Java Spring Boot
- Banco de dados: gerenciado pelo backend via Docker
- Deploy: Netlify (frontend) + ngrok (exposição do backend)

---

## Slide 3 — Arquitetura da Solução

```
[Usuário / Navegador]
        ↓
[Frontend — React Native Web]
  Hospedado no Netlify
  URL: bonaripizzaria.netlify.app
        ↓  (HTTPS / REST API)
[ngrok — túnel seguro]
  Expõe o servidor local para a internet
  com domínio fixo público
        ↓
[Backend — Java Spring Boot]
  Rodando em Docker local
  Gerencia regras de negócio e autenticação JWT
        ↓
[Banco de Dados]
  Gerenciado pelo backend via Docker Compose
  Dados reais persistidos e consultados em tempo real
```

---

## Slide 4 — Consumo de APIs REST (Ponto 1 da Entrega)

**O app consome uma API REST completa com os seguintes grupos de endpoints:**

| Grupo | Exemplos de endpoints |
|---|---|
| Autenticação | POST /login · POST /cadastro |
| Usuários | GET /{id} · PUT /{id} · DELETE /{id} |
| Produtos/Cardápio | GET /produtos (paginado, com cache Redis) |
| Pedidos | POST /pedidos · GET /pedidos/{id} · PUT /pedidos/{id}/status |
| Endereços | POST /enderecos · GET /enderecos/email/{email} · PUT /enderecos/{uid}/{eid} |
| Dashboard Admin | GET /dashboard/kpis/cards · GET /dashboard/kpis/vendas/ultimos-sete-dias |
| IA / Upsell | POST /upsell/{clienteId} — sugestões inteligentes no checkout |

**Detalhe técnico:**
- Todas as requisições enviam `Authorization: Bearer <token>` (JWT)
- Header `ngrok-skip-browser-warning: true` para permitir chamadas via navegador ao túnel ngrok
- Header `credentials: include` para compatibilidade com CORS do backend

---

## Slide 5 — Conexão Frontend ↔ Backend via ngrok

**Problema:** O backend roda localmente em Docker — não é acessível pela internet diretamente.

**Solução:** ngrok com domínio fixo

- ngrok cria um túnel HTTPS público com endereço fixo
- O frontend (hospedado no Netlify) aponta para esse endereço via variável de ambiente
- Qualquer dispositivo no mundo acessa os dados reais do banco

**Configuração:**
```
EXPO_PUBLIC_API_BASE_URL=https://internation-sully-kolten.ngrok-free.dev/api
```

Essa variável é injetada tanto no build do Netlify quanto no app local — nunca há URL hardcoded no código.

---

## Slide 6 — Deploy do Frontend (Netlify)

**Como foi feito o deploy:**

1. Build do app para web com `npx expo export --platform web`
2. A pasta `dist/` gerada contém o bundle completo da aplicação
3. Arquivo `_redirects` incluído para garantir que o roteamento SPA funcione (`/* /index.html 200`)
4. Pasta `dist/` arrastada no painel do Netlify — publicação em menos de 1 minuto

**Resultado:**
- URL pública: `https://bonaripizzaria.netlify.app`
- Funciona em qualquer navegador, sem instalação
- Mesma base de código roda também como app mobile no Expo Go

---

## Slide 7 — Funcionalidades do App (Ponto 2 da Entrega)

### Navegação completa entre telas

O app usa **Expo Router** (navegação baseada em arquivos, similar ao Next.js):

- `/(auth)` — Telas de Login e Cadastro
- `/(app)` — Telas do cliente: Cardápio, Checkout, Acompanhamento de Pedido, Perfil
- `/(admin)` — Painel administrativo com sidebar: Dashboard, Pedidos, Cardápio, Usuários

Redirecionamento automático baseado no estado de autenticação — usuário não autenticado é sempre levado para o login.

---

## Slide 8 — Uso de Recursos do Dispositivo

**Armazenamento local (AsyncStorage):**
- Token JWT salvo localmente após login
- Dados do usuário logado persistidos entre sessões
- Sessão restaurada automaticamente ao reabrir o app — sem precisar logar novamente

**Outros recursos:**
- Câmera/Teclado adaptativo: campos numéricos abrem teclado numérico no celular
- Scroll nativo: listas de produtos e pedidos com scroll fluido
- Alertas nativos: no celular usa `Alert.alert()` do sistema; no browser usa `window.confirm()`
- Animações: tela de pedido confirmado usa `Animated API` do React Native com compatibilidade web

---

## Slide 9 — Exibição de Dados Reais

Todos os dados exibidos vêm do banco de dados em tempo real:

| Tela | Dados reais exibidos |
|---|---|
| Cardápio | Produtos cadastrados no banco, com nome, preço, categoria e ingredientes |
| Checkout | Endereços reais do usuário buscados da API; autocomplete de CEP via ViaCEP |
| Pedidos | Histórico real de pedidos do usuário com status atualizado |
| Acompanhamento | Status do pedido atualizado (RECEBIDO → EM_PREPARO → ENTREGUE) |
| Dashboard Admin | KPIs reais: total de pedidos, faturamento do dia, vendas por categoria |
| Painel de Pedidos | Listagem paginada de todos os pedidos com detalhes completos |

---

## Slide 10 — Funcionalidades do Painel Administrativo

Área exclusiva acessada a partir do perfil do usuário:

- **Dashboard:** KPIs (pedidos totais, finalizados, em aberto, faturamento diário), gráfico de vendas dos últimos 7 dias, faturamento mensal do ano, ranking por categoria
- **Pedidos:** Tabela paginada com todos os pedidos, modal de detalhes, avanço de status (RECEBIDO → EM_PREPARO → ENTREGUE → ENCERRADO), cancelamento
- **Cardápio:** Grid de produtos com filtro por categoria, cadastro de novos produtos, exclusão com confirmação
- **Usuários:** Tabela de contas, criação de ATENDENTE/ADMIN, edição de nome e email, exclusão

---

## Slide 11 — Funcionalidade de IA no Checkout

**Upsell inteligente com Llama (IA local via Ollama):**

- No momento do checkout, o backend consulta o histórico do cliente e gera sugestões personalizadas de produtos
- O frontend exibe as sugestões como cards clicáveis — o cliente pode adicionar ao pedido com um toque
- Se a IA falhar ou demorar, o checkout continua normalmente (falha silenciosa — não bloqueia o pedido)

---

## Slide 12 — Fluxo Completo do Usuário

```
1. Acessa bonaripizzaria.netlify.app
2. Faz login ou cria conta → dados salvos no banco
3. Navega pelo cardápio → produtos reais do BD
4. Monta o pedido → adiciona bebidas, escolhe tamanho/borda
5. Vai para o checkout → endereço preenchido via CEP automático
6. Recebe sugestões de IA → adiciona ou ignora
7. Confirma pedido → salvo no banco, publicado na fila (RabbitMQ)
8. Acompanha status em tempo real
9. No perfil → acessa o painel admin se quiser
```

---

## Slide 13 — Resumo Técnico da Entrega

| Critério da Sprint | Como foi atendido |
|---|---|
| Consumo de APIs REST | Mais de 20 endpoints consumidos: auth, produtos, pedidos, endereços, dashboard, IA |
| Conexão com backend | Spring Boot + Docker exposto via ngrok com domínio fixo |
| Conexão com banco de dados | Todos os dados são reais — nenhum dado mockado no frontend |
| Navegação entre telas | Expo Router com rotas protegidas, redirecionamentos automáticos e deep links |
| Uso de recursos do dispositivo | AsyncStorage (sessão persistida), teclado adaptativo, alertas nativos, animações |
| Exibição de dados reais | Cardápio, pedidos, endereços, KPIs — tudo vindo da API em tempo real |
| Deploy funcional e acessível | Frontend no Netlify, acessível em qualquer dispositivo via URL pública |

---

## Slide 14 — Conclusão

**O protótipo está 100% funcional e conectado.**

- Qualquer pessoa com o link acessa o app real, faz pedidos reais que são salvos no banco
- O painel admin permite gerenciar todo o negócio em tempo real
- A mesma base de código funciona como app mobile (Expo Go) e como web (Netlify)
- A integração frontend ↔ backend ↔ banco de dados está completa e operacional
