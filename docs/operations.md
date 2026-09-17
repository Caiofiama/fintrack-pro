# Operação

## Scripts Disponíveis

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Servidor Next.js de desenvolvimento. |
| `npm run build` | Build de produção, compilação e checagem de tipos. |
| `npm run start` | Serve o build de produção. |
| `npm run db:generate` | Gera o cliente Prisma em `lib/generated/prisma`. |
| `npm run db:push` | Sincroniza schema Prisma com o banco de destino. |
| `npm run db:seed` | Recria a massa de dados de demonstração. |
| `npm run db:studio` | Abre Prisma Studio. |

## Checklist de Deploy

1. Confirmar que `DATABASE_URL` e `JWT_SECRET` foram configurados no provedor de hospedagem.
2. Definir `DATABASE_SCHEMA=fintrack` se for diferente do padrão.
3. Executar `npm run build` localmente.
4. Revisar o schema e aplicar uma migração versionada aprovada; o projeto ainda não tem migrations.
5. Publicar e validar registro, login, dashboard e uma leitura autenticada de API.
6. Verificar que `NODE_ENV=production`, para que o cookie de sessão receba o atributo `secure`.

## Diagnóstico de Login

Se `POST /api/auth/login` retornar 500:

1. Confirme que a aplicação foi reiniciada depois de alterar `.env` ou `lib/prisma.ts`.
2. Confirme que a URL alcança o PostgreSQL e aponta para o schema esperado.
3. Verifique se a tabela `User` do schema FinTrack possui `passwordHash`.
4. Em ambiente descartável, execute o fluxo de schema e seed de [Configuração Local](getting-started.md).
5. Não aplique `db push --force-reset` em banco com dados que precisam ser preservados.

O incidente anterior de login ocorreu porque a URL apontava para o schema `public` de outro aplicativo, cuja tabela `User` não tinha `passwordHash`. O cliente agora usa `fintrack` por padrão.

## Dados e Recuperação

- O seed é destrutivo para os dados do schema FinTrack: ele começa com `deleteMany` em todas as entidades.
- Faça backup no provedor PostgreSQL antes de alterações de schema ou ações administrativas em produção.
- A exclusão de usuário remove relações em cascata conforme o schema; trate-a como irreversível.

## Limitações Conhecidas

- Não há testes automatizados versionados atualmente.
- Não há migrations Prisma versionadas; `db push` não substitui uma estratégia de migração de produção.
- O filtro `tagIds` de transações está no validador, mas ainda não participa da consulta.
- Ainda não há testes automatizados de comportamento; `npm run build` e `npm run lint` cobrem apenas compilação, tipos e regras estáticas.
