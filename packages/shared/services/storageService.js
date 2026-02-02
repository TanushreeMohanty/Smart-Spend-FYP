import { 
  collection, addDoc, deleteDoc, doc, writeBatch, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/constants';

// Default App ID fallback
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export const StorageService = {
  saveTransaction: async (uid, data) => {
    await addDoc(collection(db, 'artifacts', appId, 'users', uid, 'transactions'), {
      ...data,
      date: serverTimestamp()
    });
  },

  deleteTransaction: async (uid, id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'users', uid, 'transactions', id));
  },

  bulkDelete: async (uid, items) => {
    const chunked = [];
    // Firestore batch limit is 500
    for (let i = 0; i < items.length; i += 500) {
      chunked.push(items.slice(i, i + 500));
    }
    
    for (const chunk of chunked) {
      const batch = writeBatch(db);
      chunk.forEach(t => {
        batch.delete(doc(db, 'artifacts', appId, 'users', uid, 'transactions', t.id));
      });
      await batch.commit();
    }
  },

  // Wealth / Asset methods
  addWealthItem: async (uid, data) => {
    await addDoc(collection(db, 'artifacts', appId, 'users', uid, 'wealth'), {
      ...data,
      date: serverTimestamp()
    });
  },

  deleteWealthItem: async (uid, id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'users', uid, 'wealth', id));
  }
};