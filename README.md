# ⚖️ ClauseCheck

> Analise qualquer contrato com Inteligência Artificial. Foto ou texto — resultado em segundos.

---

## 📱 Sobre o Projeto

O **ClauseCheck** é um aplicativo mobile desenvolvido em React Native que permite ao usuário analisar contratos de forma simples e acessível. A maioria dos brasileiros assina contratos sem entendê-los por falta de acesso a assessoria jurídica. O ClauseCheck resolve isso: basta fotografar o contrato ou colar o texto, e a IA identifica cláusulas abusivas, explica cada ponto em linguagem simples e ainda fica disponível para tirar dúvidas via chat.

**Disciplina:** Desenvolvimento para Dispositivos Móveis — AV2  
**Professor:** Igor Revoredo  
**Período:** 3º Período  

---

## 🚀 Funcionalidades

- 📷 **Análise por foto** — fotografe o contrato impresso, Claude lê a imagem diretamente
- 📝 **Análise por texto** — cole o conteúdo do contrato e receba o relatório
- 🔴🟡🟢 **Relatório com semáforo de risco** — cláusulas classificadas por nível de perigo
- 💬 **Chat jurídico contextual** — tire dúvidas específicas sobre o contrato com a IA
- 🗂️ **Histórico de análises** — todos os contratos analisados ficam salvos
- 🔐 **Autenticação segura** — login e cadastro via Supabase Auth

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Finalidade |
|---|---|
| [React Native](https://reactnative.dev/) | Framework mobile |
| [Expo](https://expo.dev/) | Toolchain e build |
| [React Navigation](https://reactnavigation.org/) | Navegação entre telas |
| [Supabase](https://supabase.com/) | Autenticação e banco de dados |
| [Claude API (Anthropic)](https://www.anthropic.com/) | Análise de contratos e chat com IA |
| [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) | Câmera e galeria |
| [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/) | Conversão de imagem para base64 |
| TypeScript | Tipagem estática |

---

## ✅ Componentes React Native Utilizados

| Componente | Onde é utilizado |
|---|---|
| `View` | Estrutura de layout de todas as 5 telas |
| `Text` | Títulos, descrições, cláusulas, mensagens do chat |
| `TextInput` | Campos de login, texto do contrato e input do chat |
| `TouchableOpacity` / `Button` | Botões de ação em todas as telas |
| `FlatList` | Histórico de contratos, lista de cláusulas e mensagens do chat |
| `Image` | Logo na tela de login, preview de foto do contrato |
| **Flexbox** | Layout responsivo de todas as telas |
| **Navegação entre telas** | React Navigation Stack com 5 telas conectadas |

---

## 📲 Telas do Aplicativo

| # | Tela | Descrição |
|---|---|---|
| 1 | **Login / Cadastro** | Autenticação com e-mail e senha via Supabase |
| 2 | **Histórico** | Lista de todos os contratos já analisados com badge de risco |
| 3 | **Nova Análise** | Envio do contrato por foto (câmera/galeria) ou texto |
| 4 | **Relatório** | Resultado com risco geral, cláusulas classificadas e recomendações |
| 5 | **Chat** | Conversa contextual com a IA sobre o contrato analisado |

---

## 🗄️ Banco de Dados — Supabase

**Tabela `analyses`** — armazena cada contrato analisado  
**Tabela `messages`** — armazena o histórico de chat por contrato  
Row Level Security ativado: cada usuário acessa apenas seus próprios dados.

---

## ⚙️ Instalação e Execução

### Pré-requisitos
- Node.js 18+
- Expo Go instalado no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Conta no [Supabase](https://supabase.com/) (gratuita)
- Chave de API da [Anthropic](https://console.anthropic.com/) (Claude)

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/clausecheck.git
cd clausecheck
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar o Supabase

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

### 4. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-sua-chave
```

> As chaves do Supabase estão em: **Project Settings → API**  
> A chave do Claude está em: **console.anthropic.com → API Keys**

### 5. Rodar o app
```bash
npx expo start
```

Escaneie o QR Code com o **Expo Go** no celular.

---

## 👥 Integrantes e Contribuições

| Membro | Responsabilidade |
|---|---|
| Saulo José Storel de Moura Abreu | Desenvolvimento completo do app — todas as telas, componentes, serviços e integrações |

---

## 📸 Prints das Telas

<table>
  <tr>
    <td align="center"><b>Login</b></td>
    <td align="center"><b>Histórico</b></td>
    <td align="center"><b>Nova Análise</b></td>
    <td align="center"><b>Relatório</b></td>
    <td align="center"><b>Chat</b></td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/login.png" width="160"/></td>
    <td><img src="assets/screenshots/historico.png" width="160"/></td>
    <td><img src="assets/screenshots/nova-analise.png" width="160"/></td>
    <td><img src="assets/screenshots/relatorio.png" width="160"/></td>
    <td><img src="assets/screenshots/chat.png" width="160"/></td>
  </tr>
</table>

> 📌 Para adicionar os prints: crie a pasta `assets/screenshots/` e adicione as imagens com os nomes acima.

---

## 🏗️ Estrutura do Projeto

```
clausecheck/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx       # Tela 1 — Login e cadastro
│   │   ├── HomeScreen.tsx        # Tela 2 — Histórico de contratos
│   │   ├── NovaAnaliseScreen.tsx # Tela 3 — Envio do contrato
│   │   ├── RelatorioScreen.tsx   # Tela 4 — Resultado da análise
│   │   └── ChatScreen.tsx        # Tela 5 — Chat com a IA
│   ├── components/
│   │   ├── RiskBadge.tsx         # Badge 🔴🟡🟢 de risco
│   │   ├── ClauseCard.tsx        # Card expansível de cláusula
│   │   ├── MessageBubble.tsx     # Bolha de mensagem do chat
│   │   └── AnalysisItem.tsx      # Item da lista de histórico
│   ├── services/
│   │   ├── supabase.ts           # Cliente Supabase
│   │   └── claude.ts             # Integração Claude API
│   ├── constants/
│   │   └── prompts.ts            # Prompts do sistema para o Claude
│   └── types/
│       └── index.ts              # Tipos TypeScript globais
├── App.tsx                       # Navegação principal
├── .env.example                  # Modelo de variáveis de ambiente
└── README.md
```

---

## 📄 Licença

Projeto acadêmico — uso educacional.
