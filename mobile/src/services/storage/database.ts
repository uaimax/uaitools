/**
 * Serviço de banco de dados local (SQLite)
 */

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;
let isInitialized = false;

/**
 * Inicializa banco de dados (com proteção contra chamadas múltiplas)
 */
export async function initDatabase(): Promise<void> {
  // Se já está inicializado, retorna
  if (isInitialized && db) {
    return;
  }

  // Se já há uma inicialização em andamento, aguarda
  if (initPromise) {
    return initPromise;
  }

  // Inicia nova inicialização
  initPromise = (async () => {
    try {
      db = await SQLite.openDatabaseAsync('supbrainnote.db');

      // Cria tabelas
      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        audio_uri TEXT,
        transcript TEXT,
        box_id TEXT,
        box_name TEXT,
        box_color TEXT,
        created_at TEXT,
        updated_at TEXT,
        duration_seconds REAL,
        processing_status TEXT,
        source_type TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS boxes (
        id TEXT PRIMARY KEY,
        name TEXT,
        color TEXT,
        description TEXT,
        note_count INTEGER,
        created_at TEXT,
        updated_at TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        type TEXT,
        payload TEXT,
        created_at TEXT,
        status TEXT,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_notes_synced ON notes(synced);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    `);

      isInitialized = true;
    } catch (error) {
      console.error('Erro ao inicializar banco:', error);
      // Reset para permitir nova tentativa
      db = null;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Obtém instância do banco (aguarda inicialização se necessário)
 */
async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Se não está inicializado, tenta inicializar
  if (!isInitialized || !db) {
    await initDatabase();
  }
  
  if (!db) {
    throw new Error('Banco de dados não disponível após inicialização.');
  }
  return db;
}

/**
 * Salva nota localmente
 */
export async function saveNoteLocal(note: {
  id: string;
  audio_uri: string;
  transcript?: string;
  box_id?: string | null;
  created_at: string;
  duration_seconds?: number;
}): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO notes
     (id, audio_uri, transcript, box_id, created_at, duration_seconds, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [
      note.id,
      note.audio_uri,
      note.transcript || null,
      note.box_id || null,
      note.created_at,
      note.duration_seconds || null,
    ]
  );
}

/**
 * Busca notas locais não sincronizadas
 */
export async function getUnsyncedNotes(): Promise<any[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync(
    'SELECT * FROM notes WHERE synced = 0 ORDER BY created_at DESC'
  );
  return result;
}

/**
 * Marca nota como sincronizada
 */
export async function markNoteSynced(noteId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE notes SET synced = 1 WHERE id = ?', [noteId]);
}

/**
 * Adiciona item à fila de sincronização
 */
export async function addToSyncQueue(
  type: string,
  payload: any
): Promise<void> {
  const database = await getDatabase();
  const id = `${type}_${Date.now()}_${Math.random()}`;
  await database.runAsync(
    `INSERT INTO sync_queue (id, type, payload, created_at, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [id, type, JSON.stringify(payload), new Date().toISOString()]
  );
}

/**
 * Busca itens pendentes da fila
 */
export async function getPendingSyncItems(): Promise<any[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync(
    "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 10"
  );
  return result.map((item: any) => ({
    ...item,
    payload: JSON.parse(item.payload),
  }));
}

/**
 * Atualiza status do item da fila
 */
export async function updateSyncItemStatus(
  id: string,
  status: 'pending' | 'uploading' | 'failed',
  error?: string
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE sync_queue SET status = ?, last_error = ? WHERE id = ?`,
    [status, error || null, id]
  );
}

/**
 * Remove item da fila (após sucesso)
 */
export async function removeSyncItem(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
}


