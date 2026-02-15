// correct code
// A lightweight wrapper around the browser's native IndexedDB
const DB_NAME = 'SmartSpend_Offline_DB';
const DB_VERSION = 1;
const STORE_NAME = 'draft_transactions';

export const LocalRepository = {
    // 1. Initialize DB
    openDB: () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    },

    // 2. Save Drafts (Instant & Offline) - For Bank Parser
    saveDrafts: async (transactions) => {
        const db = await LocalRepository.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            transactions.forEach(t => store.put(t)); // 'put' updates if exists, inserts if new
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },

    // 3. Get All Drafts - For Bank Parser (Filters out ITR data)
    getAllDrafts: async () => {
        const db = await LocalRepository.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            
            request.onsuccess = () => {
                const allItems = request.result || [];
                // Safety: Ensure we don't return ITR drafts to the Transaction Parser
                const transactionDrafts = allItems.filter(item => !item.id.toString().startsWith('itr_draft_'));
                resolve(transactionDrafts);
            };
            request.onerror = () => reject(request.error);
        });
    },

    // 4. Delete Draft (After syncing to cloud)
    clearDrafts: async () => {
        const db = await LocalRepository.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            // We use clear() here, but since getAllDrafts filters ITR, 
            // strictly speaking this wipes everything. 
            // Ideally, you only call this when finishing the Statement Upload flow.
            store.clear(); 
            transaction.oncomplete = () => resolve();
        });
    },

    // --- NEW: ITR METHODS (Fixes your Error) ---

    saveITRDraft: async (userId, data) => {
        const db = await LocalRepository.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            // Save with a unique prefix so it doesn't clash with transactions
            const draftObject = { 
                id: `itr_draft_${userId}`, 
                ...data 
            };
            
            store.put(draftObject);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },

    getITRDraft: async (userId) => {
        const db = await LocalRepository.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(`itr_draft_${userId}`);
            
            request.onsuccess = () => {
                if (request.result) {
                    // Return just the data, remove the ID wrapper
                    const { id, ...data } = request.result;
                    resolve(data);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => resolve(null);
        });
    }
};