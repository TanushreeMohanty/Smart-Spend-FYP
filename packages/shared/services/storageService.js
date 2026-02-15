// correct code
// REMOVED: All Firestore imports
import { financeAPI } from './api'; // Import the Django API service we created

export const StorageService = {
  // 1. SAVE TRANSACTION TO DJANGO
  saveTransaction: async (uid, data) => {
    // We ignore 'uid' here because Django identifies the user 
    // automatically via the Bearer Token
    return await financeAPI.saveTransaction(data);
  },

  // 2. DELETE FROM DJANGO
  deleteTransaction: async (uid, id) => {
    // Note: You'll need to add a delete method to your financeAPI in api.js
    // if you haven't yet.
    return await financeAPI.deleteTransaction(id);
  },

  // 3. BULK DELETE FROM DJANGO
  bulkDelete: async (uid, items) => {
    const ids = items.map(item => item.id);
    return await financeAPI.bulkDeleteTransactions(ids);
  },

  // 4. WEALTH / ASSETS
  addWealthItem: async (uid, data) => {
    // Assuming you have a /wealth/ endpoint in Django
    return await financeAPI.saveWealthItem(data);
  }
};