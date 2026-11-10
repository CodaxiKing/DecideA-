/** Acha um tempo no passo da receita: "por cerca de 2 minutos" → 120 s; "3 horas" → 10800 s. */
export function timerFromStep(step: string): number | null {
  const m = step.toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*(minutos?|min\b|horas?|h\b|segundos?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  const unit = m[2];
  if (unit.startsWith('h')) return Math.round(n * 3600);
  if (unit.startsWith('s')) return Math.round(n);
  return Math.round(n * 60);
}

/**
 * Tempo restante a partir do horário de término, não de um contador:
 * continua certo mesmo se o app ficou em segundo plano.
 */
export function remainingSeconds(endsAt: number, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

export function formatClock(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
