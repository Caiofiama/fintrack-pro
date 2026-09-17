# Modelo de Dados

O schema Prisma está em [`prisma/schema.prisma`](../prisma/schema.prisma). Cada registro de negócio pertence a um `User`; relações de propriedade usam `onDelete: Cascade` quando apropriado.

## Entidades

| Entidade | Campos relevantes | Relações e regras |
| --- | --- | --- |
| `User` | `id`, `name`, `email`, `passwordHash` | `email` único; é dono de todas as entidades. |
| `Account` | `name`, `type`, `balanceCents`, `isArchived` | Uma conta possui transações; arquivada se já tiver movimentação. |
| `Transaction` | `amountCents`, `type`, `date`, `accountId`, `categoryId` | Pertence a conta e categoria; pode ter tags e recorrência associada. |
| `Category` | `name`, `type`, `isDefault`, `parentId` | Suporta subcategorias; as padrão não podem ser excluídas. |
| `Budget` | `amountCents`, `periodType`, `alertThreshold` | Pertence a uma categoria; o gasto é calculado a partir de transações de despesa. |
| `Goal` | `targetAmountCents`, `currentAmountCents`, `deadline` | Percentual é limitado a 100% na leitura. |
| `Tag` | `name`, `color` | Relação muitos-para-muitos com transações. |
| `TagsOnTransactions` | `transactionId`, `tagId` | Tabela de junção com chave primária composta. |

## Valores Enumerados no Código

| Campo | Valores |
| --- | --- |
| Tipo de conta | `CHECKING`, `SAVINGS`, `CREDIT`, `INVESTMENT` |
| Tipo de transação | `INCOME`, `EXPENSE`, `TRANSFER` |
| Tipo de categoria | `INCOME`, `EXPENSE` |
| Período de orçamento | `WEEKLY`, `MONTHLY`, `YEARLY` |

## Integridade e Migrações

- IDs são CUIDs.
- Valores monetários são inteiros em centavos e não `float`.
- Use `npx prisma db push` apenas em desenvolvimento ou em banco descartável. O repositório ainda não possui histórico de migrações em `prisma/migrations`.
- Para produção, crie e revise migrações versionadas antes de alterar `schema.prisma`; não use reset ou seed como estratégia de deploy.
- Antes de qualquer operação, confirme o destino do `DATABASE_URL` e o schema configurado. Um schema errado pode misturar dados de aplicações diferentes.
