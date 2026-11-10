import { ComingSoonScreen } from '../../features/home/ComingSoonScreen';

export default function HistoricoRoute() {
  return (
    <ComingSoonScreen
      title="Histórico"
      message="Cada decisão que você tomar no app fica guardada aqui."
      phase={2}
      showBack={false}
    />
  );
}
