import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import * as aesjs from 'aes-js';
import 'react-native-get-random-values';

const SECURE_KEY_PREFIX = 'secure-key:';

// Helper: sanitize keys to match SecureStore requirements
function sanitizeKey(key: string): string {
  if (!key) {
    throw new Error('Key cannot be empty');
  }
  // First remove any non-alphanumeric characters except ._- and convert to lowercase
  let sanitized = key.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
  // Ensure the key starts with a letter or number
  if (!/^[a-z0-9]/.test(sanitized)) {
    sanitized = 'key_' + sanitized;
  }
  // Ensure the key is not too long (SecureStore has a limit)
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  return sanitized;
}

class LargeSecureStore {
  private async _getEncryptionKey(key: string): Promise<Uint8Array> {
    try {
      const safeKey = sanitizeKey(key);
      const secureKeyId = sanitizeKey(`${SECURE_KEY_PREFIX}${safeKey}`);

      let encryptionKeyHex = await SecureStore.getItemAsync(secureKeyId);

      if (!encryptionKeyHex) {
        const newKey = crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
        encryptionKeyHex = aesjs.utils.hex.fromBytes(newKey);
        await SecureStore.setItemAsync(secureKeyId, encryptionKeyHex);
      }

      return aesjs.utils.hex.toBytes(encryptionKeyHex);
    } catch (error) {
      console.error('Error in _getEncryptionKey:', error);
      throw error;
    }
  }

  private async _encrypt(key: string, value: string): Promise<string> {
    try {
      const encryptionKey = await this._getEncryptionKey(key);
      const textBytes = aesjs.utils.utf8.toBytes(value);
      const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
      const encryptedBytes = cipher.encrypt(textBytes);
      return aesjs.utils.hex.fromBytes(encryptedBytes);
    } catch (error) {
      console.error('Error in _encrypt:', error);
      throw error;
    }
  }

  private async _decrypt(key: string, encryptedHex: string): Promise<string | null> {
    try {
      const encryptionKey = await this._getEncryptionKey(key);
      const encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);
      const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
      const decryptedBytes = cipher.decrypt(encryptedBytes);
      return aesjs.utils.utf8.fromBytes(decryptedBytes);
    } catch (error) {
      console.error('Error in _decrypt:', error);
      return null;
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (!key) {
      console.warn('getItem called with empty key');
      return null;
    }
    try {
      const safeKey = sanitizeKey(key);
      const encrypted = await AsyncStorage.getItem(safeKey);
      if (!encrypted) return null;
      return await this._decrypt(safeKey, encrypted);
    } catch (error) {
      console.warn('SecureStore getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!key) {
      console.warn('setItem called with empty key');
      return;
    }
    try {
      const safeKey = sanitizeKey(key);
      const encrypted = await this._encrypt(safeKey, value);
      await AsyncStorage.setItem(safeKey, encrypted);
    } catch (error) {
      console.warn('SecureStore setItem error:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!key) {
      console.warn('removeItem called with empty key');
      return;
    }
    try {
      const safeKey = sanitizeKey(key);
      const secureKeyId = sanitizeKey(`${SECURE_KEY_PREFIX}${safeKey}`);
      await AsyncStorage.removeItem(safeKey);
      await SecureStore.deleteItemAsync(secureKeyId);
    } catch (error) {
      console.warn('SecureStore removeItem error:', error);
    }
  }
}

const supabaseUrl = "https://obhfmfmgbyfagtjcljvl.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaGZtZm1nYnlmYWd0amNsanZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMzQxMTUsImV4cCI6MjA1NDYxMDExNX0.afDQKmm2zU6gk6QMxD26AXbnzzpZ-ebCAQ5OB1C4usY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {},
});
