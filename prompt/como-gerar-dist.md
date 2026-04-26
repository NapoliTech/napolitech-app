# Como gerar o dist e fazer deploy no Netlify

## Pré-requisitos
- Node.js instalado
- Estar na pasta do projeto: `napolitech-app/`
- Arquivo `.env` presente com a variável correta

## 1. Verificar o .env

O arquivo `.env` na raiz do projeto deve ter:
```
EXPO_PUBLIC_API_BASE_URL=https://internation-sully-kolten.ngrok-free.dev/api
```

## 2. Gerar o dist

Abra o terminal na pasta do projeto e rode:
```bash
npx expo export --platform web
```

Aguarde terminar (leva ~1-2 minutos). Ao final aparece:
```
Exported: dist
```

A pasta `dist/` será gerada/atualizada na raiz do projeto.

> **Obs:** O `dist/` está no `.gitignore` — não aparece no git, isso é normal.

## 3. Fazer deploy no Netlify

1. Acesse: https://app.netlify.com
2. Entre no projeto **bonaripizzaria**
3. Role até a área pontilhada: *"Want to deploy a new project? Drag and drop your folder here"*
4. Abra o Explorer em:
   ```
   c:\Users\aleja\OneDrive\Desktop\app-projeto-completo\napolitech-app\dist
   ```
5. Arraste a pasta `dist` para a área do Netlify
6. Aguarde ~30 segundos — o site atualiza automaticamente

A URL permanece sempre a mesma: **https://bonaripizzaria.netlify.app**

## Resumo rápido

```bash
npx expo export --platform web
# depois arrastar dist/ no Netlify
```
