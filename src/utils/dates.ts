const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Diferença em dias de calendário entre duas datas (b - a). */
export function calendarDaysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY);
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "Hoje", "Ontem", "Há 3 dias" ou "12/10". */
export function formatDayLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const diff = calendarDaysBetween(d, now);
  if (diff <= 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  if (diff < 7) return `Há ${diff} dias`;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Versão em minúsculas para meio de frase: "girada hoje". */
export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  const label = formatDayLabel(iso, now);
  return /^\d/.test(label) ? `em ${label}` : label.toLowerCase();
}
