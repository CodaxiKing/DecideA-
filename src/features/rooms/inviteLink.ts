import * as Linking from 'expo-linking';

/**
 * Endereço público da página de convite (voto pelo navegador). Sem domínio
 * configurado, usa o link do próprio app, que só abre onde ele está instalado.
 */
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/+$/, '');

export const hasWebInvites = Boolean(WEB_URL);

export function inviteLink(token: string): string {
  return WEB_URL ? `${WEB_URL}/convite/${token}` : Linking.createURL(`/convite/${token}`);
}

export function inviteMessage(link: string, code: string, isMatch: boolean): string {
  const what = isMatch ? 'fazer um Match comigo' : 'decidir com a gente';
  return `Bora ${what} no DecideAí? Toque no link para votar: ${link}\nOu entre no app com o código ${code}.`;
}
