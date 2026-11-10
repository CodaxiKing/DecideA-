# DecideAí

> Menos indecisão. Mais diversão.

App em português brasileiro para decidir o que comer, assistir e fazer, sozinho ou com outras pessoas. Android primeiro, com arquitetura compatível com iOS.

- Plano mestre: [plan.md](plan.md)
- Canvas de telas: [design/README.md](design/README.md)
- Andamento por fase: [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)

## Requisitos

- Node 22 ou mais novo
- Android Studio com um emulador, ou um aparelho Android com o Expo Go 58

## Como rodar

```bash
npm install
```

```bash
npm run android
```

Abre o app no emulador ou aparelho conectado pelo Expo Go. Para usar outro aparelho, rode `npm start` e leia o QR Code com o Expo Go.

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

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `src/app/` | Rotas do Expo Router (só arquivos de tela) |
| `src/features/` | Telas e lógica de cada módulo |
| `src/components/ui/` | Componentes visuais reutilizáveis |
| `src/theme/` | Design tokens e tema claro e escuro |
| `src/stores/` | Estado local com Zustand |
| `tests/` | Testes com Jest e Testing Library |
| `design/` | Código-fonte do canvas de telas |
| `docs/` | Documentação do projeto |

Mais detalhes em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
