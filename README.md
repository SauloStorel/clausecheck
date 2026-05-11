# ⚖️ ClauseCheck

> Analise qualquer contrato com Inteligência Artificial. Foto, PDF ou texto — resultado em segundos.

---

## 📱 Sobre o Projeto

O **ClauseCheck** é um aplicativo mobile desenvolvido em React Native que permite ao usuário analisar contratos de forma simples e acessível. A maioria dos brasileiros assina contratos sem entendê-los por falta de acesso a assessoria jurídica. O ClauseCheck resolve isso: basta fotografar o contrato ou colar o texto, e a IA identifica cláusulas abusivas, explica cada ponto em linguagem simples e ainda fica disponível para tirar dúvidas via chat.

**Disciplina:** Desenvolvimento para Dispositivos Móveis — AV2
**Professor:** Igor Revoredo
**Período:** 3º Período

---

## 🎨 Design de Referência

Layout inspirado no [Finance App UI Kit](https://www.figma.com/community/file/1108023684588587252/finance-app-ui-kit) — Figma Community.
Adaptado para o contexto jurídico com sistema de cores próprio (modo claro/escuro) seguindo as diretrizes do iOS Human Interface Guidelines.

---

## 🚀 Funcionalidades

- 📷 **Análise por foto** — fotografe o contrato impresso, a IA lê a imagem diretamente
- 📄 **Análise por PDF** — envie o arquivo PDF para análise completa
- 📝 **Análise por texto** — cole o conteúdo do contrato e receba o relatório
- 🔴🟡🟢 **Relatório com semáforo de risco** — cláusulas classificadas por nível de perigo
- 💬 **Chat jurídico contextual** — tire dúvidas específicas sobre o contrato com a IA
- 🗂️ **Histórico de análises** — todos os contratos analisados ficam salvos
- 🔐 **Autenticação segura** — login e cadastro via Supabase Auth
- 🌙 **Tema claro/escuro** — interface adaptável à preferência do usuário
- 🧠 **RAG Jurídico** — contexto legal real (CC/2002, CDC, CLT) injetado automaticamente nas análises

---

## 🛠️ Tecnologias Utilizadas

### Core Framework
| Tecnologia | Versão | Finalidade |
|---|---|---|
| [React Native](https://reactnative.dev/) | 0.81.5 | Framework mobile multiplataforma |
| [Expo](https://expo.dev/) | 54.0.0 | Toolchain, build e gerenciamento de assets |
| [React](https://react.dev/) | 19.1.0 | Biblioteca de componentes de UI |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.2 | Tipagem estática e segurança de tipos |

### Navegação e Interface
| Tecnologia | Versão | Finalidade |
|---|---|---|
| [React Navigation](https://reactnavigation.org/) | 7.2.2 | Stack navigation entre telas |
| [react-native-gesture-handler](https://github.com/software-mansion/react-native-gesture-handler) | 2.28.0 | Gestos customizados (swipe, tap) |
| [react-native-screens](https://github.com/software-mansion/react-native-screens) | 4.16.0 | Otimização nativa de telas |
| [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context) | 5.6.0 | Contorno de notches e bordas seguras |
| [@expo/vector-icons](https://docs.expo.dev/guides/icons/) | 15.0.3 | Ícones Material Design e Feather |
| [@ronradtke/react-native-markdown-display](https://github.com/ronradtke/react-native-markdown-display) | 8.1.0 | Renderização de markdown nas respostas da IA |

### Backend e Autenticação
| Tecnologia | Versão | Finalidade |
|---|---|---|
| [Supabase](https://supabase.com/) | 2.105.3 | Autenticação, banco de dados, Edge Functions e vetores |
| [@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage) | 2.2.0 | Armazenamento local de dados (sessões, cache) |

### IA e RAG
| Tecnologia | Versão | Finalidade |
|---|---|---|
| [Anthropic Claude API](https://www.anthropic.com/) | claude-opus-4-6 | Análise de contratos e chat jurídico com IA |
| [Voyage AI](https://www.voyageai.com/) | voyage-law-2 | Geração de embeddings especializados em textos jurídicos |
| [pgvector](https://github.com/pgvector/pgvector) | extensão Postgres | Busca por similaridade vetorial para RAG |

### Capture e Processamento de Documentos
| Tecnologia | Versão | Finalidade |
|---|---|---|
| [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) | 17.0.11 | Câmera e galeria para captura de contratos |
| [expo-document-picker](https://docs.expo.dev/versions/latest/sdk/documentpicker/) | 14.0.8 | Seletor nativo de arquivos PDF |
| [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/) | 19.0.22 | Acesso ao sistema de arquivos do dispositivo |

### Exportação e Compartilhamento
| Tecnologia | Versão | Finalidade |
|---|---|---|
| [expo-print](https://docs.expo.dev/versions/latest/sdk/print/) | 15.0.8 | Geração e impressão de PDF do relatório |
| [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) | 14.0.8 | Compartilhamento de relatórios via apps |

### Feedback e UX
| Tecnologia | Versão | Finalidade |
|---|---|---|
| [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) | 15.0.8 | Feedback tátil nas interações |
| [expo-status-bar](https://docs.expo.dev/versions/latest/sdk/statusbar/) | 3.0.9 | Controle da barra de status (iOS/Android) |
| [expo-font](https://docs.expo.dev/versions/latest/sdk/font/) | 14.0.11 | Carregamento de fontes customizadas |

### Compatibilidade
| Tecnologia | Versão | Finalidade |
|---|---|---|
| [react-native-url-polyfill](https://github.com/react-native-community/url-polyfill) | 3.0.0 | Polyfill de URL para compatibilidade |
| [react-native-web](https://necolas.github.io/react-native-web/) | 0.21.0 | Suporte para compilação web (futuro) |
| [react-native-webview](https://github.com/react-native-webview/react-native-webview) | 13.15.0 | Visualização de conteúdo web embarcado |

---

## ✅ Componentes React Native Utilizados

| Componente | Uso no App |
|---|---|
| `View` | Estrutura de layout de todas as telas |
| `Text` | Títulos, descrições, cláusulas, mensagens do chat |
| `TextInput` | Campos de login, texto do contrato, busca e input do chat |
| `TouchableOpacity` / `Button` | Botões de ação em todas as telas |
| `FlatList` | Histórico de contratos, lista de cláusulas e mensagens do chat |
| `ScrollView` | Conteúdo em telas com muito texto (relatório, PDF preview) |
| `Image` | Preview das fotos do contrato capturadas |
| `ActivityIndicator` | Loading durante análise e busca de dados |
| **Flexbox Layout** | Layout responsivo em todas as telas |
| **React Navigation Stack** | 9 telas conectadas com roteamento e animações |
| **Animated** | Animações suaves (entrada de componentes, transições) |

---

## 🎪 Custom Hooks Utilizados

| Hook | Localização | Função |
|---|---|---|
| `useEntrance` | `src/hooks/useEntrance.ts` | Animação de entrada (fade + slide up) para componentes com delay customizável |
| `useTheme` | `src/context/ThemeContext.tsx` | Acesso ao contexto de tema (claro/escuro) e paleta de cores |

---

## 📲 Telas do Aplicativo

| # | Tela | Componentes Principais |
|---|---|---|
| 1 | **Onboarding** | `View`, `Text`, `TouchableOpacity`, Flexbox |
| 2 | **Login / Cadastro** | `TextInput` (e-mail e senha), `TouchableOpacity`, `ActivityIndicator` |
| 3 | **Home** | `FlatList`, `TouchableOpacity`, `ActivityIndicator` |
| 4 | **Histórico** | `FlatList`, `TextInput` (busca), `TouchableOpacity` |
| 5 | **Nova Análise** | `TextInput`, `Image`, `TouchableOpacity`, `ScrollView` |
| 6 | **Relatório** | `ScrollView`, `FlatList`, `Text`, `View` |
| 7 | **Prévia PDF** | `ScrollView`, `Text`, botões de ação |
| 8 | **Chat** | `FlatList`, `TextInput`, `TouchableOpacity`, `ActivityIndicator` |
| 9 | **Perfil** | `View`, `Text`, `TouchableOpacity`, tema claro/escuro |

---

## 🧠 Arquitetura RAG (Retrieval-Augmented Generation)

O ClauseCheck utiliza **RAG Jurídico** para enriquecer as análises com legislação real brasileira. Em vez de depender apenas do conhecimento geral da IA, o sistema recupera artigos específicos do banco de dados e os injeta no contexto antes de gerar a análise.

### Como funciona

```
Usuário envia contrato
        ↓
Edge Function recebe o texto/imagem/PDF
        ↓
Voyage AI (voyage-law-2) gera embedding da query
        ↓
pgvector busca os 5 artigos jurídicos mais similares
        ↓
Artigos relevantes são injetados no prompt do Claude
        ↓
Claude analisa o contrato com base legal real
        ↓
Relatório retorna com fundamentação jurídica precisa
```

### Componentes do RAG

| Componente | Tecnologia | Função |
|---|---|---|
| **Geração de embeddings** | Voyage AI `voyage-law-2` | Modelo especializado em textos jurídicos em português |
| **Armazenamento vetorial** | Supabase + `pgvector` | Tabela `legal_chunks` com vetores de 1024 dimensões |
| **Busca por similaridade** | Índice HNSW + cosine distance | Função RPC `search_legal_chunks` |
| **Ingestão de documentos** | Edge Function `ingest-documents` | Processa e indexa nova legislação em lotes |
| **Integração na análise** | Edge Functions `analyze-contract` e `chat-contract` | RAG com falha silenciosa — funciona mesmo sem contexto |

### Bases legais indexadas

- **CC/2002** — Código Civil Brasileiro
- **CDC** — Código de Defesa do Consumidor
- **CLT** — Consolidação das Leis do Trabalho
- **Lei do Inquilinato** — Lei 8.245/91

---

## 🗄️ Banco de Dados — Supabase

### Tabelas

**`analyses`** — armazena cada contrato analisado

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Chave primária |
| `user_id` | uuid | Referência ao usuário autenticado |
| `title` | text | Título do contrato |
| `input_text` | text | Texto original (quando enviado por texto) |
| `image_url` | text | URL da imagem (quando enviado por foto) |
| `report` | jsonb | Relatório completo gerado pela IA |
| `risk_level` | text | Nível de risco geral: `high`, `medium` ou `low` |
| `created_at` | timestamptz | Data da análise |

**`messages`** — armazena o histórico de chat por contrato

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Chave primária |
| `analysis_id` | uuid | Referência à análise relacionada |
| `role` | text | `user` ou `assistant` |
| `content` | text | Conteúdo da mensagem |
| `created_at` | timestamptz | Data da mensagem |

**`legal_chunks`** — base vetorial de legislação brasileira

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Chave primária |
| `content` | text | Texto do artigo de lei |
| `source` | text | Origem: `CC/2002`, `CDC`, `CLT`, etc. |
| `article` | text | Identificador: `Art. 421` |
| `embedding` | vector(1024) | Vetor gerado pelo Voyage AI |

Row Level Security ativado em todas as tabelas: cada usuário acessa apenas seus próprios dados.

---

## ⚙️ Instalação e Execução

### O que você precisa instalar

| Ferramenta | Versão mínima | Como instalar |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18+ | Download no site oficial ou via `nvm` |
| [Supabase CLI](https://supabase.com/docs/guides/cli) | Última | `npm install -g supabase` |
| [Expo Go](https://expo.dev/go) | Última | App Store / Google Play no celular |

Além disso, você precisa ter:
- Conta gratuita no [Supabase](https://supabase.com/)
- Chave de API da [Anthropic](https://console.anthropic.com/)
- Chave de API da [Voyage AI](https://www.voyageai.com/) (para o RAG)

---

### 1. Clonar o repositório

```bash
git clone https://github.com/SauloStorel/clausecheck.git
cd clausecheck
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com as credenciais do seu projeto Supabase (encontradas em **Project Settings → API**):

```env
# Supabase API (obrigatório para o app rodar)
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

⚠️ **Nota:** As credenciais das APIs (Anthropic e Voyage) são configuradas como **secrets** nas Edge Functions do Supabase (veja passo 5.3), não no `.env` do cliente.

### 4. Criar as tabelas no Supabase

Acesse seu projeto no Supabase → **SQL Editor** e execute:

```sql
-- Tabela de análises
create table analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null default 'Contrato sem título',
  input_text text,
  image_url text,
  report jsonb,
  risk_level text check (risk_level in ('high', 'medium', 'low')),
  created_at timestamptz default now()
);
alter table analyses enable row level security;
create policy "user_analyses" on analyses for all using (auth.uid() = user_id);

-- Tabela de mensagens do chat
create table messages (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references analyses(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamptz default now()
);
alter table messages enable row level security;
create policy "user_messages" on messages for all using (
  exists (select 1 from analyses where analyses.id = messages.analysis_id and analyses.user_id = auth.uid())
);
```

Para o RAG (base vetorial), execute o arquivo de migração:

```bash
supabase db push
```

Ou manualmente no SQL Editor, execute o conteúdo de `supabase/migrations/20260510000000_rag_setup.sql`.

### 5. Fazer deploy das Edge Functions

**5.1 — Login no Supabase CLI**
```bash
supabase login
```

**5.2 — Vincular ao seu projeto**
```bash
supabase link --project-ref SEU_PROJECT_REF
```

**5.3 — Configurar secrets**
```bash
supabase secrets set ANTHROPIC_API_KEY=sua-chave-anthropic
supabase secrets set VOYAGE_API_KEY=sua-chave-voyage
supabase secrets set INGEST_SECRET=uma-senha-secreta-para-ingestao
```

**5.4 — Fazer o deploy das funções**
```bash
supabase functions deploy analyze-contract
supabase functions deploy chat-contract
supabase functions deploy ingest-documents
```

### 6. Rodar o app

```bash
npx expo start
```

Escaneie o QR Code com o **Expo Go** no celular.

---

## ⚙️ Configuração do Expo (`app.json`)

O arquivo `app.json` contém metadados cruciais do app:

```json
{
  "expo": {
    "name": "clausecheck",
    "slug": "clausecheck",
    "version": "1.0.0",
    "orientation": "portrait",
    "newArchEnabled": true,  // 🔧 Nova Arquitetura do React Native
    "icon": "./assets/icon.png",
    "splash": { "image": "./assets/splash-icon.png" },
    "ios": { "supportsTablet": true },
    "android": {
      "package": "com.anonymous.clausecheck",
      "edgeToEdgeEnabled": true,
      "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png" }
    },
    "plugins": ["expo-font"]  // 📦 Plugins: carregamento de fontes customizadas
  }
}
```

**`newArchEnabled: true`** — Ativa a New Architecture do React Native:
- Usa Fabric (novo sistema de renderização) em vez de ponte JavaScript
- Oferece melhor performance e suporte a concorrência
- Compatível com Expo SDK 54+

---

## 📲 Telas do Aplicativo — Screenshots

<table>
  <tr>
    <td align="center"><b>Onboarding</b></td>
    <td align="center"><b>Login</b></td>
    <td align="center"><b>Histórico</b></td>
    <td align="center"><b>Nova Análise</b></td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/onboarding.png" width="140"/></td>
    <td><img src="assets/screenshots/login.png" width="140"/></td>
    <td><img src="assets/screenshots/historico.png" width="140"/></td>
    <td><img src="assets/screenshots/nova-analise.png" width="140"/></td>
  </tr>
</table>

<table>
  <tr>
    <td align="center"><b>PDF Preview</b></td>
    <td align="center"><b>Relatório</b></td>
    <td align="center"><b>Chat</b></td>
    <td align="center"><b>Perfil</b></td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/pdf-preview.png" width="140"/></td>
    <td><img src="assets/screenshots/relatorio.png" width="140"/></td>
    <td><img src="assets/screenshots/chat.png" width="140"/></td>
    <td><img src="assets/screenshots/perfil.png" width="140"/></td>
  </tr>
</table>

---

## 📦 Tipos TypeScript Principais

| Tipo | Localização | Descrição |
|---|---|---|
| `Analysis` | `src/types/index.ts` | Representa uma análise completa (ID, usuário, relatório, risco) |
| `Report` | `src/types/index.ts` | Estrutura do relatório (resumo, cláusulas, recomendações) |
| `Clause` | `src/types/index.ts` | Cláusula individual com risco, título, explicação |
| `RiskLevel` | `src/types/index.ts` | Union type: `'high' \| 'medium' \| 'low'` |
| `Message` | `src/types/index.ts` | Mensagem do chat (role: user/assistant, conteúdo, timestamp) |
| `RootStackParamList` | `src/types/index.ts` | Tipos de params para React Navigation |

---

## 🏗️ Estrutura do Projeto

```
clausecheck/
├── src/
│   ├── screens/
│   │   ├── OnboardingScreen.tsx   # Boas-vindas e introdução
│   │   ├── LoginScreen.tsx        # Login e cadastro
│   │   ├── HomeScreen.tsx         # Página inicial
│   │   ├── HistoricoScreen.tsx    # Histórico de contratos analisados
│   │   ├── NovaAnaliseScreen.tsx  # Envio do contrato (foto/texto/PDF)
│   │   ├── RelatorioScreen.tsx    # Resultado da análise com cláusulas
│   │   ├── PDFPreviewScreen.tsx   # Prévia de PDF antes da análise
│   │   ├── ChatScreen.tsx         # Chat contextual com a IA
│   │   └── PerfilScreen.tsx       # Perfil e configurações do usuário
│   ├── components/
│   │   ├── RiskBadge.tsx          # Badge 🔴🟡🟢 de risco
│   │   ├── ClauseCard.tsx         # Card expansível de cláusula
│   │   ├── MessageBubble.tsx      # Bolha de mensagem do chat
│   │   ├── AnalysisItem.tsx       # Item da lista de histórico
│   │   └── SwipeableAnalysisItem.tsx # Item com swipe para excluir
│   ├── hooks/
│   │   └── useEntrance.ts         # Hook de animação de entrada (fade + slide)
│   ├── services/
│   │   ├── supabase.ts            # Cliente Supabase (auth, DB)
│   │   ├── claude.ts              # Integração com Edge Functions (análise e chat)
│   │   ├── pdf.ts                 # Geração e renderização de PDF
│   │   └── pdfCache.ts            # Cache em memória de PDFs renderizados
│   ├── context/
│   │   └── ThemeContext.tsx       # Contexto de tema claro/escuro + paleta de cores
│   ├── constants/
│   │   ├── theme.ts               # Tokens de design: cores, tipografia, spacing
│   │   └── prompts.ts             # Prompts do sistema enviados para Claude API
│   └── types/
│       └── index.ts               # Tipos TypeScript globais (Analysis, Report, Clause)
├── supabase/
│   ├── functions/
│   │   ├── analyze-contract/      # Edge Function: análise de contrato com RAG
│   │   ├── chat-contract/         # Edge Function: chat jurídico com RAG
│   │   ├── ingest-documents/      # Edge Function: ingestão de legislação
│   │   └── _shared/
│   │       └── rag.ts             # Módulo compartilhado: embeddings + busca vetorial
│   └── migrations/
│       └── 20260510000000_rag_setup.sql  # Migração: pgvector + legal_chunks
├── assets/
│   ├── screenshots/               # Screenshots das telas
│   ├── icon.png                   # Ícone do app
│   ├── splash-icon.png            # Splash screen
│   ├── adaptive-icon.png          # Ícone adaptativo Android
│   └── favicon.png                # Favicon web
├── App.tsx                        # Navegação stack e configuração de tema
├── app.json                       # Configuração do Expo (nome, versão, ícones, plugins)
├── .env.example                   # Template de variáveis de ambiente
├── .env                           # Variáveis de ambiente (não commitar)
├── .gitignore                     # Arquivos ignorados pelo Git
├── tsconfig.json                  # Configuração do TypeScript
├── package.json                   # Dependências e scripts
└── README.md                      # Este arquivo
```

---

## 💾 Serviços e Utilitários

### **pdf.ts** — Geração e Renderização de PDF
- `buildReportHTML()` — Converte o relatório para HTML formatado
- `generatePDFUri()` — Gera PDF do relatório usando `expo-print`
- `sharePDF()` — Compartilha PDF via `expo-sharing`

### **pdfCache.ts** — Cache em Memória de PDFs
- `primeCache()` — Pré-renderiza e cacheа HTML do PDF (otimização)
- `getCachedHTML()` — Retorna HTML em cache se disponível
- `getCachedAnalysis()` — Retorna dados da análise em cache
- **Por quê:** Evita re-renderização desnecessária ao navegar entre telas

### **claude.ts** — Integração com Edge Functions
- `analyzeContract()` — Envia contrato (texto/imagem/PDF) para análise
- `chatWithContract()` — Envia pergunta para chat contextual

### **supabase.ts** — Cliente Supabase
- Instância pre-configurada com URL e chave de API
- Autenticação, banco de dados e Edge Functions

---

## 🧠 Sistema de Prompts

O arquivo `src/constants/prompts.ts` define os prompts enviados para Claude, incluindo:
- Prompt de análise de cláusulas com classificação de risco
- Contexto jurídico injetado via RAG (Código Civil, CDC, CLT)
- Instruções para gerar respostas em JSON estruturado

Os prompts são críticos para a qualidade das análises — mudanças aqui impactam diretamente a precisão do AI.

---

## 👥 Integrantes e Contribuições

| Membro | Responsabilidade |
|---|---|
| Saulo José Storel de Moura Abreu | Desenvolvimento completo do app — todas as telas, componentes, serviços, arquitetura RAG e integrações |

---

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

## 📞 Contato

- **GitHub Issues:** Para bugs e sugestões
- **Email:** saulostorell@gmail.com
