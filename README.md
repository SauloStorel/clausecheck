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

| Tecnologia | Versão | Finalidade |
|---|---|---|
| [React Native](https://reactnative.dev/) | 0.81.5 | Framework mobile |
| [Expo](https://expo.dev/) | 54.0.0 | Toolchain e build |
| [React Navigation](https://reactnavigation.org/) | 7.2.2 | Navegação entre telas |
| [React](https://react.dev/) | 19.1.0 | Biblioteca de UI |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.2 | Tipagem estática |
| [Supabase](https://supabase.com/) | 2.105.3 | Autenticação, banco de dados, Edge Functions e vetores |
| [pgvector](https://github.com/pgvector/pgvector) | extensão Postgres | Busca por similaridade vetorial (RAG) |
| [Anthropic Claude API](https://www.anthropic.com/) | claude-opus-4-6 | Análise de contratos e chat jurídico com IA |
| [Voyage AI](https://www.voyageai.com/) | voyage-law-2 | Geração de embeddings especializados em direito |
| [@ronradtke/react-native-markdown-display](https://github.com/ronradtke/react-native-markdown-display) | 8.1.0 | Renderização de markdown nas respostas da IA |
| [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) | 17.0.11 | Câmera e galeria para captura de contrato |
| [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/) | 19.0.22 | Acesso ao sistema de arquivos |
| [expo-document-picker](https://docs.expo.dev/versions/latest/sdk/documentpicker/) | 14.0.8 | Seletor de PDFs |
| [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) | 14.0.8 | Compartilhamento do relatório |
| [expo-print](https://docs.expo.dev/versions/latest/sdk/print/) | 15.0.8 | Geração de PDF do relatório |
| [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) | 15.0.8 | Feedback tátil nas interações |

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
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

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
│   ├── services/
│   │   ├── supabase.ts            # Cliente Supabase (auth, DB)
│   │   ├── claude.ts              # Integração com Edge Functions
│   │   └── pdf.ts                 # Geração e leitura de PDF
│   ├── context/
│   │   └── ThemeContext.tsx       # Contexto de tema claro/escuro
│   ├── constants/
│   │   ├── theme.ts               # Sistema de cores e tipografia
│   │   └── prompts.ts             # Prompts do sistema para a IA
│   └── types/
│       └── index.ts               # Tipos TypeScript globais
├── supabase/
│   ├── functions/
│   │   ├── analyze-contract/      # Edge Function: análise de contrato com RAG
│   │   ├── chat-contract/         # Edge Function: chat jurídico com RAG
│   │   ├── ingest-documents/      # Edge Function: ingestão de legislação
│   │   └── _shared/
│   │       └── rag.ts             # Módulo compartilhado: embeddings e busca vetorial
│   └── migrations/
│       └── 20260510000000_rag_setup.sql  # Migração: pgvector + legal_chunks
├── App.tsx                        # Navegação e configuração principal
├── .env.example                   # Modelo de variáveis de ambiente
├── package.json                   # Dependências do projeto
└── README.md
```

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
