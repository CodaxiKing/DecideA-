# Monetização

Planos, preços de teste e regras estão na [seção 8 do plano](../plan.md#8-monetização). Aqui fica como o app implementa.

## Limites

Definidos em `src/features/premium/plans.ts`.

| | Grátis | Premium |
|---|---|---|
| Roletas salvas | 3 | Ilimitadas |
| Favoritos | 20 | Ilimitados |
| Histórico visível | 10 últimas | Completo |
| Salas | 4 pessoas, 30 min | 12 pessoas, 2 h |

O app avisa ao atingir um limite e oferece a tela Premium (`/premium`). Nada é apagado: quem perde o Premium continua vendo o que já tem e só não cria além do limite.

## Onde o Premium é decidido

- **No aparelho:** `src/services/subscriptions.ts` consulta o RevenueCat (`react-native-purchases`). O estado fica só em memória e é consultado de novo a cada abertura; nenhuma variável local libera Premium.
- **No servidor:** `public.user_entitlements`, gravada apenas pelo webhook do RevenueCat (`supabase/functions/revenuecat-webhook`) com a chave de serviço. As salas usam `has_premium()` para decidir tamanho e duração, então mudar o app não dá mais vagas.
- **Conta:** o app chama `Purchases.logIn(userId)` com o id da conta do Supabase, e esse é o `app_user_id` que o webhook recebe.

## Modo sem loja

Sem chave do RevenueCat, no Expo Go ou na web, o serviço fica em modo `unavailable`: a tela Premium mostra "Loja indisponível" com o motivo, o botão de assinar fica desligado e o app segue no plano grátis. Não há compra simulada.

## Preços

Vêm da loja (`priceString` do pacote), na moeda da pessoa. A tela não tem preço fixo no código.

## Configuração pendente

1. Conta no RevenueCat, projeto com o app Android e o direito `premium`.
2. Produtos de assinatura mensal e anual no Google Play Console, ligados a uma oferta "current" no RevenueCat.
3. `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (chave pública do SDK) no `.env` do build.
4. Development build (`npx expo run:android` ou EAS), porque o Expo Go não tem o módulo nativo.
5. Webhook no RevenueCat apontando para a Edge Function, com o header `Authorization` igual ao segredo `REVENUECAT_WEBHOOK_AUTH`.
6. Compras de teste com contas de teste da Play Console (sem cobrança real).

## Premium Dupla

Aparece como "Em breve". Só será construído depois de validar as regras das lojas (decisão 7 da seção 2).
