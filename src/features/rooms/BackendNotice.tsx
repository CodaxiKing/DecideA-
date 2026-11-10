import { AppCard, AppText } from '../../components/ui';

/** Aviso do modo local: o app está sem servidor configurado. */
export function BackendNotice() {
  return (
    <AppCard>
      <AppText variant="bodyStrong">Salas indisponíveis neste app</AppText>
      <AppText variant="small" color="textMuted">
        As salas online precisam do servidor, que não foi configurado nesta versão. Enquanto isso, use o Passa o celular para
        votar juntos no mesmo aparelho.
      </AppText>
    </AppCard>
  );
}
