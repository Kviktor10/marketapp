/**
 * Local DB Bridge - Adaptado para SQLite via WebAssembly
 */

import { initSQLite, querySQL, executeSQL } from './database-sqlite.js';
import { encryptData, decryptData } from '../security/crypto.js';

class LocalDB {
  constructor() {
    this.isReady = initSQLite();
  }

  async get(key, defaultValue = null) {
    await this.isReady;
    try {
      const rows = await querySQL('SELECT value FROM app_metadata WHERE key = ?;', [key]);
      if (rows && rows.length > 0) {
        const val = rows[0].value;
        const decrypted = decryptData(val);
        return decrypted !== null ? decrypted : (JSON.parse(val) || defaultValue);
      }
    } catch (e) {
      console.warn(`[SQLite DB] Fallback de leitura para key: ${key}`);
    }

    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      const decrypted = decryptData(data);
      return decrypted !== null ? decrypted : JSON.parse(data);
    } catch (e) {
      return defaultValue;
    }
  }

  async save(key, value) {
    await this.isReady;
    const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
    const encrypted = encryptData(value) || jsonStr;

    try {
      await executeSQL(
        'INSERT INTO app_metadata (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
        [key, encrypted]
      );
    } catch (e) {
      localStorage.setItem(key, encrypted);
    }

    return true;
  }

  async remove(key) {
    await this.isReady;
    try {
      await executeSQL('DELETE FROM app_metadata WHERE key = ?;', [key]);
    } catch (e) {
      localStorage.removeItem(key);
    }
    return true;
  }
}

export const localDB = new LocalDB();
export const LocalDatabase = LocalDB;
