# DecideAí

> Menos indecisão. Mais diversão.

App em português brasileiro para decidir o que comer, assistir e fazer, sozinho ou com outras pessoas. Android primeiro, com arquitetura compatível com iOS.

- Plano mestre: [plan.md](plan.md)
- Canvas de telas: [design/README.md](design/README.md)
- Andamento por fase: [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)
- Lançamento: [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md)

## Requisitos

- Node 22 ou mais novo
- Android Studio com um emulador, ou um aparelho Android com o Expo Go 58
- Docker, para o servidor local (salas e contas)

## Rodar o app

```bash
npm install
```

```bash
npm run android
```

Abre no Expo Go do emulador ou do aparelho conectado. Sem servidor configurado, o app funciona em modo local: tudo menos salas e contas.

## Servidor local (salas e contas)

```bash
npm run db:start
```

Depois copie `API_URL` e `ANON_KEY` de `npx supabase status` para um `.env.local`, como em [.env.example](.env.example). Detalhes em [docs/DATABASE.md](docs/DATABASE.md).

## Development build

Compras (RevenueCat) não funcionam no Expo Go. Para testar a loja:

```bash
npm run android:build
```

As pastas `android/` e `ios/` são geradas pelo Expo e não vão para o Git.

## Verificações

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run test:integration
```

O último precisa do servidor local rodando (veja [docs/TESTING.md](docs/TESTING.md)).

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `src/app/` | Rotas do Expo Router (só arquivos de tela) |
| `src/features/` | Telas e lógica de cada módulo |
| `src/components/` | Componentes visuais reutilizáveis |
| `src/repositories/` | Acesso ao Supabase |
| `src/services/` | Supabase, autenticação e assinaturas |
| `src/stores/` | Estado local com Zustand |
| `src/theme/` | Design tokens e tema claro e escuro |
| `supabase/` | Migrações, configuração local e Edge Functions |
| `tests/`, `tests-integration/` | Testes unitários e de integração |
| `design/` | Código-fonte do canvas de telas |
| `docs/` | Documentação do projeto |

Mais detalhes em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
