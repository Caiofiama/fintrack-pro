# Referência da API

Base local: `http://localhost:3000`. Salvo indicação contrária, rotas protegidas exigem o cookie de sessão.

## Envelope de Resposta

```json
{ "data": {}, "error": null, "meta": {} }
```

Erros usam `data: null` e uma mensagem em `error`. O exportador de transações retorna CSV, não JSON.

## Autenticação

| Método e rota | Protegida | Corpo / parâmetros | Resultado |
| --- | --- | --- | --- |
| `POST /api/auth/register` | Não | `name`, `email`, `password`, `confirmPassword` | Cria usuário, categorias padrão e sessão. Senha: mínimo 8 caracteres, uma maiúscula e um número. |
| `POST /api/auth/login` | Não | `email`, `password` | Cria sessão se as credenciais forem válidas. |
| `POST /api/auth/logout` | Sim pelo middleware | — | Remove o cookie de sessão. |
| `GET /api/auth/me` | Sim | — | Perfil sem hash de senha. |
| `PUT /api/auth/me` | Sim | `name`, `email`, `currentPassword` | Atualiza perfil após confirmar senha. |
| `PATCH /api/auth/me` | Sim | `currentPassword`, `newPassword` | Troca senha; a nova deve ter ao menos 8 caracteres. |
| `DELETE /api/auth/me` | Sim | — | Exclui conta e dados em cascata, removendo a sessão. |

## Recursos Financeiros

| Recurso | Endpoints | Observações |
| --- | --- | --- |
| Contas | `GET`, `POST /api/accounts`; `PUT`, `DELETE /api/accounts/:id` | `POST`: nome, tipo, saldo em centavos, cor e ícone. `DELETE` arquiva e falha se houver transações. |
| Categorias | `GET`, `POST /api/categories`; `PUT`, `DELETE /api/categories/:id` | `GET` retorna `{ income, expense }`. Categorias padrão ou em uso não podem ser removidas. |
| Orçamentos | `GET`, `POST /api/budgets`; `PUT`, `DELETE /api/budgets/:id` | Datas `YYYY-MM-DD`; períodos semanal, mensal ou anual. |
| Metas | `GET`, `POST /api/goals`; `PUT`, `DELETE /api/goals/:id` | Montantes em centavos e prazo opcional `YYYY-MM-DD`. |
| Transações | `GET`, `POST /api/transactions`; `PUT`, `DELETE /api/transactions/:id` | Tipos: receita, despesa, transferência. Atualizam saldo de conta atomicamente. |
| Exportação | `GET /api/transactions/export` | Retorna download CSV de todas as transações do usuário. |

### Filtros de Transações

`GET /api/transactions` aceita `accountId`, `categoryId`, `type`, `dateFrom`, `dateTo`, `search`, `tagIds`, `limit` e `offset`.

- `limit`: inteiro de 1 a 100; padrão 20.
- `offset`: inteiro maior ou igual a zero; padrão 0.
- `meta` retorna `total`, `limit`, `offset` e `hasMore`.
- `tagIds` é validado, mas não é aplicado pela implementação atual do serviço. Não dependa desse filtro até que seja implementado.

### Corpo de Transação

```json
{
  "accountId": "cuid",
  "categoryId": "cuid",
  "amountCents": 2590,
  "type": "EXPENSE",
  "description": "Almoço",
  "date": "2026-09-16",
  "isRecurring": false,
  "notes": null,
  "tagIds": []
}
```

Para `TRANSFER`, informe também `destinationAccountId`. A resposta principal representa a saída da conta origem; o lançamento de entrada é criado internamente.

## Analytics

| Rota | Parâmetros | Resultado |
| --- | --- | --- |
| `GET /api/analytics/overview` | `month=YYYY-MM` | Receita, despesa, saldo líquido e taxa de poupança. |
| `GET /api/analytics/cashflow` | `months=1..24`, padrão 6 | Receita e despesa mensais. |
| `GET /api/analytics/by-category` | `month=YYYY-MM`, `type=INCOME|EXPENSE` | Total e percentual por categoria. |
| `GET /api/analytics/trend` | `categoryId`, `months=1..24`, padrão 6 | Série mensal de uma categoria. |

## Códigos de Erro

- `400`: corpo ou parâmetros inválidos, ou regra de negócio não atendida.
- `401`: sem sessão, sessão inválida ou senha incorreta.
- `404`: recurso não encontrado para o usuário atual.
- `409`: e-mail já usado ou orçamento duplicado.
- `500`: falha inesperada. Não exponha stack trace ao cliente; investigue logs e a conexão do banco.
