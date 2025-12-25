
export const DB_NAME = 'LuxOmniumDB';
export const STORE_NAME = 'assets';
export const DB_VERSION = 1;

export interface SystemLogEntry {
    timestamp: number;
    action: string;
    level: string;
    result: string;
    notes?: string;
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event);
      reject("Database error");
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      // Ensure all state stores exist for backup purposes
      const stateStores = [
          'council_sessions', 'council_items', 'health_readings', 
          'council_memories', 'emotional_logs', 'dream_oracle', 
          'life_events', 'vault_items', 'flame_tokens', 
          'projects', 'companion_memories', 'life_domains',
          'connector_configs', 'custom_apis',
          'system_logs' // LOGGING STORE
      ];
      stateStores.forEach(name => {
          if (!db.objectStoreNames.contains(name)) {
              db.createObjectStore(name);
          }
      });
    };
  });
};

export const saveAsset = async (key: string, file: Blob | File): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject("Failed to save asset");
  });
};

export const getAsset = async (key: string): Promise<string | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result;
      if (result instanceof Blob || result instanceof File) {
        // Convert Blob/File to Object URL for display
        const url = URL.createObjectURL(result);
        resolve(url);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject("Failed to retrieve asset");
  });
};

// --- GENERIC STATE PERSISTENCE (JSON/Objects) ---

export const saveState = async (key: string, data: any): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject("Failed to save state");
  });
};

export const getState = async <T>(key: string): Promise<T | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result;
      if (result !== undefined && !(result instanceof Blob) && !(result instanceof File)) {
        resolve(result as T);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject("Failed to retrieve state");
  });
};

// --- LOGGING ---

export const logSystemEvent = async (action: string, level: string, result: string, notes?: string): Promise<void> => {
    try {
        const db = await initDB();
        const tx = db.transaction(['system_logs'], 'readwrite');
        const store = tx.objectStore('system_logs');
        const entry: SystemLogEntry = { timestamp: Date.now(), action, level, result, notes };
        // Key is timestamp + random to ensure uniqueness
        store.put(entry, `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`);
    } catch(e) {
        console.warn("Logging failed", e);
    }
};

export const getSystemLogs = async (): Promise<SystemLogEntry[]> => {
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const tx = db.transaction(['system_logs'], 'readonly');
            const store = tx.objectStore('system_logs');
            const request = store.getAll();
            request.onsuccess = () => {
                const logs = request.result as SystemLogEntry[];
                // Sort newest first
                resolve(logs.sort((a, b) => b.timestamp - a.timestamp));
            };
            request.onerror = () => resolve([]);
        });
    } catch {
        return [];
    }
};

// --- THE ARK PROTOCOL: BACKUP & RESTORE ---

export const createBackup = async (): Promise<string> => {
    const db = await initDB();
    await logSystemEvent('BACKUP', 'EXPORT', 'INITIATED');
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        const keyRequest = store.getAllKeys();

        request.onsuccess = () => {
            const values = request.result;
            keyRequest.onsuccess = () => {
                const keys = keyRequest.result;
                const backupData: Record<string, any> = {};
                
                keys.forEach((key, index) => {
                    // Exclude large binary assets from generic JSON backup to prevent crash
                    if (typeof key === 'string' && !key.startsWith('asset_') && !key.startsWith('vault_') && !key.startsWith('avatar_')) {
                         backupData[key] = values[index];
                    }
                });
                
                const jsonString = JSON.stringify(backupData, null, 2);
                logSystemEvent('BACKUP', 'EXPORT', 'SUCCESS', `Keys: ${keys.length}`);
                resolve(jsonString);
            };
        };
        request.onerror = () => {
            logSystemEvent('BACKUP', 'EXPORT', 'FAILED');
            reject("Backup failed");
        };
    });
};

export const restoreBackup = async (jsonString: string): Promise<void> => {
    const db = await initDB();
    await logSystemEvent('BACKUP', 'IMPORT', 'INITIATED');
    return new Promise((resolve, reject) => {
        try {
            const data = JSON.parse(jsonString);
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            
            Object.entries(data).forEach(([key, value]) => {
                store.put(value, key);
            });

            transaction.oncomplete = () => {
                logSystemEvent('BACKUP', 'IMPORT', 'SUCCESS');
                resolve();
            };
            transaction.onerror = () => {
                logSystemEvent('BACKUP', 'IMPORT', 'FAILED', 'Transaction Error');
                reject("Restore transaction failed");
            };
        } catch (e) {
            logSystemEvent('BACKUP', 'IMPORT', 'FAILED', 'Invalid JSON');
            reject("Invalid backup file");
        }
    });
};

// --- ROOT ACCESS: SYSTEM REPAIR PROTOCOLS ---

export type RepairLevel = 'LEVEL_0' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';

export const performSystemRepair = async (level: RepairLevel | 'CACHE' | 'SOFT_RESET' | 'HARD_RESET'): Promise<string> => {
    console.log(`[SYSTEM] Executing Repair Protocol: ${level}`);
    
    // Normalize legacy strings to new levels
    let normalizedLevel: RepairLevel = 'LEVEL_0';
    if (level === 'CACHE') normalizedLevel = 'LEVEL_0';
    else if (level === 'SOFT_RESET') normalizedLevel = 'LEVEL_1';
    else if (level === 'HARD_RESET') normalizedLevel = 'LEVEL_3'; 
    else normalizedLevel = level as RepairLevel;

    await logSystemEvent('REPAIR', normalizedLevel, 'STARTED');

    switch (normalizedLevel) {
        case 'LEVEL_0':
            // Soft Refresh: Clear Session Storage & UI Settings
            sessionStorage.clear();
            // Clear specific volatile UI keys but keep preferences
            localStorage.removeItem('codex_sanctuary_ui_state'); 
            await logSystemEvent('REPAIR', normalizedLevel, 'COMPLETE');
            return "Level 0 Complete: Transient Cache Cleared.";

        case 'LEVEL_1':
            // Session Reset: Clear LocalStorage (Auth, Flags)
            localStorage.clear();
            // We assume database persistence handles the real data
            await logSystemEvent('REPAIR', normalizedLevel, 'COMPLETE');
            return "Level 1 Complete: Session & Auth Reset. Database Intact.";

        case 'LEVEL_2':
            // Deep Cleanse: Clean specific DB stores but keep Vault/Memories/Logs
            // Currently acts as a stronger L1 + DB Cleanup of temps
            localStorage.clear();
            sessionStorage.clear();
            // In future: Clear specific IDB object stores
            await logSystemEvent('REPAIR', normalizedLevel, 'COMPLETE');
            return "Level 2 Complete: Deep System Cleanse.";

        case 'LEVEL_3':
            // Nuclear: Wipe IndexedDB
            const req = indexedDB.deleteDatabase(DB_NAME);
            return new Promise((resolve) => {
                req.onsuccess = () => {
                    localStorage.clear();
                    // We can't log success because DB is gone, but we try to re-init
                    resolve("Level 3 Complete: FACTORY RESET. All Local Data Wiped.");
                };
                req.onerror = () => {
                    resolve("Level 3 Failed: Database Locked. Restart Browser.");
                };
            });
            
        default:
            return "Unknown Protocol.";
    }
};

export const runSystemDiagnostics = async (mode: 'QUICK' | 'FULL' = 'QUICK'): Promise<{ network: boolean; db: boolean; audio: boolean; api: boolean }> => {
    const results = { network: false, db: false, audio: false, api: false };
    
    await logSystemEvent('DIAGNOSTIC', mode, 'RUNNING');

    // 1. Network
    results.network = navigator.onLine;

    // 2. Database
    try {
        const db = await initDB();
        if (mode === 'FULL') {
            // Check specific store integrity
            const tx = db.transaction([STORE_NAME], 'readonly');
            await new Promise((res) => {
                tx.objectStore(STORE_NAME).count().onsuccess = res;
            });
        }
        results.db = true;
    } catch (e) { results.db = false; }

    // 3. Audio
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        results.audio = devices.some(d => d.kind === 'audioinput');
    } catch (e) { results.audio = false; }

    // 4. API (Simple Check)
    results.api = !!process.env.API_KEY || (window as any).aistudio?.hasSelectedApiKey;

    await logSystemEvent('DIAGNOSTIC', mode, 'COMPLETE', JSON.stringify(results));
    return results;
};
