import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

/**
 * O login com PKCE precisa de crypto.subtle.digest('SHA-256'), que o Hermes não tem.
 * Sem ele o Supabase cai no método "plain". Aqui usamos o SHA-256 nativo do expo-crypto.
 * Na web o navegador já oferece crypto.subtle.
 */
export function installCryptoPolyfill() {
  if (Platform.OS === 'web') return;
  const g = globalThis as unknown as { crypto?: Record<string, unknown> };
  g.crypto = g.crypto ?? {};
  if (typeof g.crypto.getRandomValues !== 'function') {
    g.crypto.getRandomValues = Crypto.getRandomValues;
  }
  const subtle = (g.crypto.subtle as Record<string, unknown> | undefined) ?? {};
  if (typeof subtle.digest !== 'function') {
    subtle.digest = (algorithm: string | { name: string }, data: BufferSource) => {
      const name = (typeof algorithm === 'string' ? algorithm : algorithm.name).toUpperCase();
      if (name !== 'SHA-256') return Promise.reject(new Error(`digest ${name} não suportado`));
      return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
    };
    g.crypto.subtle = subtle;
  }
}

installCryptoPolyfill();
