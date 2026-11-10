import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/** Identificador do direito Premium no RevenueCat. */
export const PREMIUM_ENTITLEMENT = 'premium';

export interface SubscriptionStatus {
  isPremium: boolean;
  expiresAt?: string;
  productId?: string;
  willRenew?: boolean;
}

export interface SubscriptionProduct {
  id: string;
  /** Pacote no RevenueCat (mensal, anual). */
  packageId: string;
  title: string;
  /** Preço formatado pela loja, na moeda da pessoa. Nunca fixo no código. */
  priceText: string;
  period: 'monthly' | 'annual' | 'other';
}

export type SubscriptionMode = 'store' | 'unavailable';

export interface SubscriptionService {
  mode: SubscriptionMode;
  /** Por que a loja não está disponível, para mostrar na tela. */
  unavailableReason?: string;
  getStatus(): Promise<SubscriptionStatus>;
  getProducts(): Promise<SubscriptionProduct[]>;
  purchase(packageId: string): Promise<SubscriptionStatus>;
  restore(): Promise<SubscriptionStatus>;
  /** Liga a assinatura à conta (Fase 6) para valer em outros aparelhos. */
  identify(userId: string | null): Promise<void>;
  onChange(listener: (status: SubscriptionStatus) => void): () => void;
}

export class StoreUnavailableError extends Error {
  constructor(message = 'store_unavailable') {
    super(message);
  }
}

export class PurchaseCancelledError extends Error {
  constructor() {
    super('purchase_cancelled');
  }
}

const FREE: SubscriptionStatus = { isPremium: false };

/**
 * Sem chave do RevenueCat (ou no Expo Go): o app funciona no plano grátis e a
 * tela de assinatura explica que a loja não está disponível. Não simula compra.
 */
export function unavailableService(reason: string): SubscriptionService {
  return {
    mode: 'unavailable',
    unavailableReason: reason,
    getStatus: async () => FREE,
    getProducts: async () => [],
    purchase: async () => {
      throw new StoreUnavailableError();
    },
    restore: async () => FREE,
    identify: async () => {},
    onChange: () => () => {},
  };
}

/** Adaptador do RevenueCat (react-native-purchases). Precisa de development build. */
function revenueCatService(apiKey: string): SubscriptionService {
  // Import tardio: o módulo nativo não existe no Expo Go nem nos testes.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Purchases = require('react-native-purchases').default as typeof import('react-native-purchases').default;
  Purchases.configure({ apiKey });

  type CustomerInfo = Awaited<ReturnType<typeof Purchases.getCustomerInfo>>;
  const toStatus = (info: CustomerInfo): SubscriptionStatus => {
    const ent = info.entitlements.active[PREMIUM_ENTITLEMENT];
    return ent
      ? { isPremium: true, expiresAt: ent.expirationDate ?? undefined, productId: ent.productIdentifier, willRenew: ent.willRenew }
      : FREE;
  };

  return {
    mode: 'store',
    getStatus: async () => toStatus(await Purchases.getCustomerInfo()),
    getProducts: async () => {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) return [];
      return current.availablePackages.map((p) => ({
        id: p.product.identifier,
        packageId: p.identifier,
        title: p.product.title,
        priceText: p.product.priceString,
        period: p.packageType === 'MONTHLY' ? 'monthly' : p.packageType === 'ANNUAL' ? 'annual' : 'other',
      }));
    },
    purchase: async (packageId) => {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find((p) => p.identifier === packageId);
      if (!pkg) throw new StoreUnavailableError('product_not_found');
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        return toStatus(customerInfo);
      } catch (e) {
        if ((e as { userCancelled?: boolean }).userCancelled) throw new PurchaseCancelledError();
        throw e;
      }
    },
    restore: async () => toStatus(await Purchases.restorePurchases()),
    identify: async (userId) => {
      if (userId) await Purchases.logIn(userId);
      else if (!(await Purchases.getAppUserID()).startsWith('$RCAnonymousID')) await Purchases.logOut();
    },
    onChange: (listener) => {
      const cb = (info: CustomerInfo) => listener(toStatus(info));
      Purchases.addCustomerInfoUpdateListener(cb);
      return () => Purchases.removeCustomerInfoUpdateListener(cb);
    },
  };
}

function createService(): SubscriptionService {
  const key = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  if (Platform.OS === 'web') return unavailableService('Assinaturas são feitas pelo app no celular.');
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return unavailableService('Compras não funcionam no Expo Go. Use um development build para testar a loja.');
  }
  if (!key) return unavailableService('A loja ainda não foi configurada nesta versão do app.');
  try {
    return revenueCatService(key);
  } catch {
    return unavailableService('Não deu para conectar à loja.');
  }
}

export const subscriptions: SubscriptionService = createService();
