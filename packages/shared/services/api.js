// correct code
import axios from 'axios';
import { auth } from '../config/constants';  // Importing Firebase auth instance

const API_BASE_URL = 'http://127.0.0.1:8000/api/finance';

const getAuthHeaders = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const token = await user.getIdToken();
    return {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const financeAPI = {
    // SAVE TRANSACTION
    saveTransaction: async (data) => {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${API_BASE_URL}/transactions/`, data, headers);
        return response.data;
    },

    // FETCH TRANSACTIONS
    getTransactions: async () => {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_BASE_URL}/transactions/`, headers);
        return response.data;
    }
};