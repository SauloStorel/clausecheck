# 🔒 Política de Segurança

## Reportando Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança no ClauseCheck, **por favor não abra uma issue pública**. Em vez disso, envie um e-mail para **[EMAIL_ADDRESS]** com:

- Descrição da vulnerabilidade
- Passos para reproduzir (se aplicável)
- Possível impacto
- Sua sugestão de correção (opcional)

Você receberá uma resposta em até **48 horas**. Trabalharemos com você para:

1. Confirmar e entender a vulnerabilidade
2. Desenvolver e testar uma correção
3. Lançar uma versão segura
4. Dar crédito na release notes (se desejar)

## Práticas de Segurança

### Autenticação
- Autenticação via Supabase Auth com email/senha
- Senhas criptografadas no servidor
- Row Level Security ativado no banco de dados

### Dados Sensíveis
- Chaves de API armazenadas em variáveis de ambiente (`.env`)
- Nunca commitadas no repositório
- Arquivo `.env` adicionado ao `.gitignore`

### Análises
- Dados do usuário isolados via `user_id`
- Cada usuário acessa apenas seus próprios contratos
- Histórico de chat criptografado no Supabase

### Dependências
- Verificação regular com `npm audit`
- Atualizações de segurança aplicadas imediatamente
- Dependabot habilitado para alertas automáticos

## Versões Suportadas

| Versão | Suporte |
|--------|---------|
| 1.x    | ✅ Ativo |

Versões antigas não recebem patches de segurança. Atualize para a versão mais recente.

## Divulgação Responsável

Agradecemos a pesquisadores de segurança que reportam vulnerabilidades de forma responsável. Pedimos que:

- Não compartilhe a vulnerabilidade publicamente até uma correção estar disponível
- Aguarde pelo menos 30 dias antes de divulgar, mesmo que não receba resposta
- Relate apenas para o proprietário do projeto, não para terceiros

## Contato

**E-mail:** saulostorell@gmail.com  
**GitHub:** [@seu-usuario](https://github.com/seu-usuario)
