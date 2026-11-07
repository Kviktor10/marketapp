/**
 * database-sqlite.js - Inicialização e abstração do SQLite via WebAssembly (wa-sqlite / sqlite3 WASM)
 */

let dbInstance = null;
let isInitPromise = null;

export async function initSQLite() {
  if (isInitPromise) return isInitPromise;

  isInitPromise = (async () => {
    try {
      if (typeof window.sqlite3InitModule === 'function') {
        const sqlite3 = await window.sqlite3InitModule();
        if ('opfs' in sqlite3.installOpfsSAHPoolVfs) {
          const sqlite3Opfs = await sqlite3.installOpfsSAHPoolVfs();
          dbInstance = new sqlite3Opfs.OpfsDb('/app_database.sqlite');
          console.log('[SQLite] Banco de dados inicializado com sucesso via OPFS.');
        } else {
          dbInstance = new sqlite3.oo1.DB('/app_database.sqlite', 'ct');
          console.log('[SQLite] Banco de dados inicializado no armazenamento local.');
        }
      } else {
        console.warn('[SQLite] Módulo WASM sqlite3 não encontrado. Usando fallback em app_metadata.');
      }

      await criarTabelas();
      return true;
    } catch (err) {
      console.error('[SQLite] Erro ao inicializar banco de dados SQLite:', err);
      return false;
    }
  })();

  return isInitPromise;
}

async function criarTabelas() {
  const schemaSQL = `
    CREATE TABLE IF NOT EXISTS finance_records (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      category TEXT,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS shopping_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      price REAL DEFAULT 0,
      completed INTEGER DEFAULT 0,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `;

  if (dbInstance && typeof dbInstance.exec === 'function') {
    dbInstance.exec(schemaSQL);
  }
}

export async function querySQL(sql, params = []) {
  await initSQLite();
  if (dbInstance && typeof dbInstance.exec === 'function') {
    const results = [];
    dbInstance.exec({
      sql: sql,
      bind: params,
      rowMode: 'object',
      callback: (row) => results.push(row)
    });
    return results;
  }
  return [];
}

export async function executeSQL(sql, params = []) {
  await initSQLite();
  if (dbInstance && typeof dbInstance.exec === 'function') {
    dbInstance.exec({
      sql: sql,
      bind: params
    });
    return true;
  }
  return false;
}
