import * as CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_AUTH_STORAGE_KEY;

export const EncryptedStorage = {
    
  hashKey: (key: string) => {
    return CryptoJS.HmacSHA256(key, SECRET_KEY).toString();
  },

  setItem: (key: string, value: string) => {
    const hashedKey = EncryptedStorage.hashKey(key);
    const encryptedValue = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
    localStorage.setItem(hashedKey, encryptedValue);
  },

  getItem: (key: string): string | null => {
    const hashedKey = EncryptedStorage.hashKey(key);
    const encryptedValue = localStorage.getItem(hashedKey);
    if (!encryptedValue) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  },

  removeItem: (key: string) => {
    const hashedKey = EncryptedStorage.hashKey(key);
    localStorage.removeItem(hashedKey);
  },
};