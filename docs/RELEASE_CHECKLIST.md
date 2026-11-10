# Checklist de lançamento

Critérios da beta na [seção 17 do plano](../plan.md#17-critérios-de-conclusão-da-beta). Estado em 2026-11-10. O app foi validado no emulador pelo Expo Go em todas as fases.

## Critérios da beta

- [x] As três ferramentas funcionam (Roleta, O Que Comer?, Qual Filme?)
- [x] O modo individual funciona sem cadastro
- [x] As salas compartilhadas funcionam em dispositivos distintos — testado com Supabase local, emulador e um segundo cliente; falta repetir na nuvem com dois celulares reais
- [x] As preferências são persistidas (tema, vibração, nome, roletas, favoritos, histórico, votos)
- [x] Os recursos Premium estão protegidos (limites no app e no servidor; Premium nunca liberado por variável local)
- [ ] As compras de teste funcionam — **bloqueado:** precisa de RevenueCat, produtos na Play Console e development build
- [x] Os fluxos críticos têm testes (unitários e de integração; ver `docs/TESTING.md`)
- [x] Nenhum erro bloqueante conhecido
- [x] Documentação atualizada
- [x] Build Android instalável: APK de release local (arm64-v8a e x86_64, assinado com a chave de debug) instalado e validado no emulador — tela inicial, sorteio, receita e tela Premium sem erros. Salas e contas no APK precisam do Supabase em HTTPS: o Android bloqueia `http://` em release, então o servidor local só serve ao Expo Go

## Antes de publicar

### Identidade

- [ ] Confirmar o identificador `app.decideai` (não dá para mudar depois de publicar) — precisa ser um domínio que vocês controlem
- [x] Nome do app: DecideAí
- [x] Ícone adaptativo e splash com a marca

### Contas e serviços externos

- [ ] Projeto Supabase na nuvem; aplicar `supabase/migrations` (`npx supabase db push`)
- [ ] Ativar login anônimo e definir senha mínima de 8 no painel do Supabase
- [ ] SMTP próprio para os e-mails de recuperação de senha
- [ ] URL de redirecionamento `decideai://**` no Supabase Auth
- [ ] RevenueCat: projeto, direito `premium`, ofertas mensal e anual
- [ ] Play Console: app criado, assinaturas cadastradas, contas de teste
- [ ] Edge Function `revenuecat-webhook` publicada com o segredo `REVENUECAT_WEBHOOK_AUTH`
- [ ] Conta Expo e EAS (`eas init`, `eas build --profile preview`)
- [ ] Chave de assinatura de produção gerada pelo EAS ou pela Play (não usar a de debug)

### Voto pelo navegador

- [ ] `npx expo export --platform web` e publicar a pasta `dist/` num host estático com regra de reescrita de todas as rotas para `index.html`
- [ ] Definir `EXPO_PUBLIC_WEB_URL` com o domínio (os convites passam a abrir no navegador)
- [ ] Adicionar o domínio às URLs permitidas do Supabase Auth

### Loja

- [ ] Política de privacidade publicada numa URL pública (`docs/PRIVACY_POLICY.md`, com os campos preenchidos e revisão jurídica)
- [ ] Texto da loja e formulário de segurança de dados (`docs/STORE_LISTING.md`)
- [ ] Capturas de tela
- [ ] Rever termos do Pexels para as fotos (`docs/CREDITS.md`)
- [ ] Catálogo de filmes: manter o demonstrativo ou contratar um provedor licenciado

### Build no Windows

- O `ninja.exe` do CMake 3.22.1 do Android SDK foi trocado pela versão 1.12.1, que aceita caminhos longos (o original ficou como `ninja-1.10.2-original.exe` na mesma pasta).
- Comando: `cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64` depois de `npx expo prebuild --platform android`.

### Qualidade

- [x] TypeScript, lint e testes passando
- [x] `expo-doctor` sem problemas
- [x] Movimento reduzido respeitado na roleta e nos cartões
- [x] Alvos de toque de 44 px ou mais; rótulos para leitores de tela
- [x] Tela de erro amigável (`AppErrorBoundary`)
- [ ] Testar em pelo menos um celular Android real
- [ ] Testar com TalkBack ligado
- [ ] Monitoramento de falhas (Sentry ou similar), se houver orçamento

## Nunca

- Publicar na loja ou fazer deploy de produção sem autorização explícita.
- Colocar a chave `service_role` do Supabase ou o segredo do webhook no app.
