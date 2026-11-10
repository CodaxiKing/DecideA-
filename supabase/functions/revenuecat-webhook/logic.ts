// Regras do webhook, sem dependências: testadas em tests/entitlements.test.ts.

export interface RevenueCatEvent {
  type: string;
  app_user_id: string;
  entitlement_ids?: string[] | null;
  product_id?: string;
  expiration_at_ms?: number | null;
}

export type EntitlementChange =
  | { kind: 'grant'; userId: string; expiresAt: string | null; productId?: string }
  | { kind: 'revoke'; userId: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GRANTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE', 'SUBSCRIPTION_EXTENDED', 'TEMPORARY_ENTITLEMENT_GRANT']);
// Cancelar não tira o acesso na hora: vale até expirar. Só EXPIRATION remove.
const REVOKES = new Set(['EXPIRATION']);

/** Traduz um evento do RevenueCat numa mudança do direito Premium (ou nada). */
export function entitlementChange(event: RevenueCatEvent): EntitlementChange | null {
  if (!UUID.test(event.app_user_id)) return null; // compra sem conta: o app consulta direto o RevenueCat
  if (event.entitlement_ids && !event.entitlement_ids.includes('premium')) return null;
  if (GRANTS.has(event.type)) {
    return {
      kind: 'grant',
      userId: event.app_user_id,
      expiresAt: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
      productId: event.product_id,
    };
  }
  if (REVOKES.has(event.type)) return { kind: 'revoke', userId: event.app_user_id };
  return null;
}
