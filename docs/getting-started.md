# Configuração Local

## Pré-requisitos

- Node.js 20 ou superior.
- npm.
- Uma instância PostgreSQL acessível, por exemplo Neon.

## Variáveis de Ambiente

Crie `.env` na raiz a partir de `.env.example`:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="uma-chave-longa-e-aleatoria"
DATABASE_SCHEMA="fintrack"
NODE_ENV="development"
```

`DATABASE_SCHEMA` é opcional e assume `fintrack`. O cliente Prisma força o uso desse schema para manter as tabelas do FinTrack separadas do schema `public` quando o banco é compartilhado. Não versione `.env` nem exponha a URL do banco ou `JWT_SECRET`.

## Inicialização

```bash
npm install
npm run db:generate
```

Antes de executar o push do schema, confirme que `DATABASE_URL` aponta para a instância correta. O comando padrão do Prisma usa a URL presente no ambiente; para um banco compartilhado, inclua `schema=fintrack` na URL usada pelo comando:

```bash
# PowerShell
$env:DATABASE_URL = node -e 'require("dotenv").config({quiet:true}); const u = new URL(process.env.DATABASE_URL); u.searchParams.set("schema", process.env.DATABASE_SCHEMA ?? "fintrack"); process.stdout.write(u.toString())'
npm run db:push
npm run db:seed
```

`db:seed` remove e recria apenas os dados do schema FinTrack configurado. Nunca rode esse comando em dados que precisam ser preservados.

Inicie a aplicação:

```bash
npm run dev
```

Acesse <http://localhost:3000>; rotas privadas redirecionam para `/login` até que haja uma sessão válida.

## Conta de Demonstração

Após o seed:

```text
demo@fintrack.dev
Demo@123
```

O seed cria contas, categorias, orçamentos, metas e transações de exemplo. Ele não deve ser tratado como migração de produção.

## Verificação Antes de Commit

```bash
npm run build
npm run lint
git diff --check
```

O build valida compilação e tipos; o lint verifica regras estáticas do ESLint.
