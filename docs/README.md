# Documentação do FinTrack Pro

Esta pasta é a fonte de verdade para operação e evolução do projeto. Cada documento descreve o comportamento confirmado no código em setembro de 2026.

| Documento | Quando usar |
| --- | --- |
| [Configuração Local](getting-started.md) | Instalar, configurar variáveis e iniciar o projeto. |
| [Arquitetura](architecture.md) | Entender responsabilidades, autenticação e fluxo de dados. |
| [Referência da API](api.md) | Consumir ou alterar endpoints e validações. |
| [Modelo de Dados](data-model.md) | Alterar Prisma, relações ou regras de persistência. |
| [Operação](operations.md) | Build, banco, deploy, backup e diagnóstico. |

## Convenções

- Valores monetários são inteiros em centavos (`amountCents`, `balanceCents`); a conversão para moeda ocorre na interface.
- Respostas JSON seguem `{ data, error, meta? }`, exceto o exportador CSV.
- A autenticação é por cookie HTTP-only com JWT de sete dias.
- O código é a fonte de verdade para contratos. Atualize o documento afetado no mesmo commit de qualquer alteração funcional.

## Mapa Rápido

```text
app/          páginas e rotas HTTP
services/     regras de negócio e persistência
lib/          Prisma, autenticação, tipos e validação
prisma/       schema e carga de dados de demonstração
components/   interface reutilizável e gráficos
docs/         documentação de produto e operação
```
