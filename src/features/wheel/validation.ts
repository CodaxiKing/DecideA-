import {
  WHEEL_MAX_OPTIONS,
  WHEEL_MIN_OPTIONS,
  WHEEL_NAME_MAX,
  WHEEL_OPTION_MAX,
} from './types';

export interface WheelDraft {
  name: string;
  options: { id: string; label: string }[];
}

export interface WheelDraftErrors {
  name?: string;
  options?: string;
  optionIds: string[];
}

export function validateWheelDraft(draft: WheelDraft): WheelDraftErrors {
  const errors: WheelDraftErrors = { optionIds: [] };
  const name = draft.name.trim();
  if (!name) errors.name = 'Dê um nome para a roleta.';
  else if (name.length > WHEEL_NAME_MAX) errors.name = `Use até ${WHEEL_NAME_MAX} caracteres.`;

  const filled = draft.options.filter((o) => o.label.trim());
  for (const o of draft.options) {
    if (o.label.trim().length > WHEEL_OPTION_MAX) errors.optionIds.push(o.id);
  }
  if (errors.optionIds.length) errors.options = `Cada opção pode ter até ${WHEEL_OPTION_MAX} caracteres.`;
  else if (filled.length < WHEEL_MIN_OPTIONS) errors.options = `A roleta precisa de pelo menos ${WHEEL_MIN_OPTIONS} opções.`;
  else if (filled.length > WHEEL_MAX_OPTIONS) errors.options = `Use até ${WHEEL_MAX_OPTIONS} opções.`;
  return errors;
}

export function hasErrors(errors: WheelDraftErrors): boolean {
  return !!errors.name || !!errors.options;
}

/** Remove opções vazias e espaços sobrando antes de salvar. */
export function cleanDraft(draft: WheelDraft): WheelDraft {
  return {
    name: draft.name.trim(),
    options: draft.options.map((o) => ({ ...o, label: o.label.trim() })).filter((o) => o.label),
  };
}
