import { canAdd, FREE_LIMITS, limitsFor, PREMIUM_LIMITS, usageLabel } from '../src/features/premium/plans';
import { usePremiumStore } from '../src/features/premium/usePremium';
import { StoreUnavailableError, unavailableService } from '../src/services/subscriptions';
import { entitlementChange } from '../supabase/functions/revenuecat-webhook/logic';

const USER = '0b6c3c1e-7d1a-4c55-9f7e-2d3f9a1b2c3d';

describe('planos', () => {
  it('grátis tem os limites do plano', () => {
    expect(limitsFor(false)).toBe(FREE_LIMITS);
    expect(FREE_LIMITS).toMatchObject({ wheels: 3, favorites: 20, historyVisible: 10, roomSize: 4, roomMinutes: 30 });
    expect(limitsFor(true)).toBe(PREMIUM_LIMITS);
  });

  it('bloqueia ao atingir o limite', () => {
    expect(canAdd(2, 3)).toBe(true);
    expect(canAdd(3, 3)).toBe(false);
    expect(canAdd(500, PREMIUM_LIMITS.wheels)).toBe(true);
    expect(usageLabel(3, 3, 'roletas')).toBe('3 de 3 roletas no plano grátis');
  });

  it('o estado Premium começa grátis e não é persistido', () => {
    expect(usePremiumStore.getState().status.isPremium).toBe(false);
    expect((usePremiumStore as unknown as { persist?: unknown }).persist).toBeUndefined();
  });
});

describe('loja indisponível', () => {
  it('não simula compra e mantém o grátis', async () => {
    const s = unavailableService('sem chave');
    expect(s.mode).toBe('unavailable');
    expect(await s.getStatus()).toEqual({ isPremium: false });
    expect(await s.getProducts()).toEqual([]);
    await expect(s.purchase('mensal')).rejects.toBeInstanceOf(StoreUnavailableError);
    expect(await s.restore()).toEqual({ isPremium: false });
  });
});

describe('webhook do RevenueCat', () => {
  it('compra e renovação liberam com a data de expiração', () => {
    const at = Date.UTC(2026, 11, 10);
    expect(entitlementChange({ type: 'INITIAL_PURCHASE', app_user_id: USER, entitlement_ids: ['premium'], expiration_at_ms: at, product_id: 'mensal' })).toEqual({
      kind: 'grant',
      userId: USER,
      expiresAt: new Date(at).toISOString(),
      productId: 'mensal',
    });
    expect(entitlementChange({ type: 'RENEWAL', app_user_id: USER })?.kind).toBe('grant');
  });

  it('cancelamento mantém até expirar; expiração remove', () => {
    expect(entitlementChange({ type: 'CANCELLATION', app_user_id: USER })).toBeNull();
    expect(entitlementChange({ type: 'EXPIRATION', app_user_id: USER })).toEqual({ kind: 'revoke', userId: USER });
  });

  it('ignora usuário sem conta e outros direitos', () => {
    expect(entitlementChange({ type: 'INITIAL_PURCHASE', app_user_id: '$RCAnonymousID:abc' })).toBeNull();
    expect(entitlementChange({ type: 'INITIAL_PURCHASE', app_user_id: USER, entitlement_ids: ['outro'] })).toBeNull();
    expect(entitlementChange({ type: 'TEST', app_user_id: USER })).toBeNull();
  });
});
