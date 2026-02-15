// correct code
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const DataContext = createContext();
export function useData() { return useContext(DataContext); }

// --- CONFIGURATION ---
const API_BASE_URL = 'http://127.0.0.1:8000/api/finance';

export function DataProvider({ children }) {
  const { user } = useAuth();
  
  const [transactions, setTransactions] = useState([]);
  const [wealthItems, setWealthItems] = useState([]);
  const [settings, setSettings] = useState({ monthlyIncome: '', monthlyBudget: '', dailyBudget: '' });
  const [taxProfile, setTaxProfile] = useState({ 
    annualRent: '', annualEPF: '', healthInsuranceSelf: '', 
    healthInsuranceParents: '', npsContribution: '', isBusiness: false 
  });
  const [loading, setLoading] = useState(false);

  // --- HELPER: GET AUTH HEADERS ---
  const getAuthHeaders = useCallback(async () => {
    if (!user) return null;
    const token = await user.getIdToken();
    return {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }, [user]);

  // --- 1. FETCH ALL DATA FROM DJANGO ---
  const refreshData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const config = await getAuthHeaders();
      
      // Fetch Transactions
      const transRes = await axios.get(`${API_BASE_URL}/transactions/`, config);
      setTransactions(transRes.data);

      // Fetch Wealth Items (Assuming you created a wealth endpoint in Django)
      // const wealthRes = await axios.get(`${API_BASE_URL}/wealth/`, config);
      // setWealthItems(wealthRes.data);

      // Fetch Profile/Settings
      const profileRes = await axios.get(`${API_BASE_URL}/profile/`, config);
      if (profileRes.data) {
        setSettings({
          monthlyIncome: profileRes.data.monthly_income || '',
          monthlyBudget: profileRes.data.monthly_budget || '',
          dailyBudget: profileRes.data.daily_budget || ''
        });
        if (profileRes.data.tax_profile) setTaxProfile(profileRes.data.tax_profile);
      }
    } catch (e) {
      console.error("Django Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // --- 2. ACTIONS (REWRITTEN FOR DJANGO) ---

  const deleteTransaction = async (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id)); // Optimistic UI
    try {
      const config = await getAuthHeaders();
      await axios.delete(`${API_BASE_URL}/transactions/${id}/`, config);
    } catch (e) {
      console.error("Delete failed", e);
      refreshData(); // Rollback on failure
    }
  };

  const updateTransaction = async (updatedTx) => {
    try {
      const config = await getAuthHeaders();
      const { id, ...data } = updatedTx;
      await axios.patch(`${API_BASE_URL}/transactions/${id}/`, data, config);
      refreshData();
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const bulkDeleteTransactions = async (items) => {
    const ids = items.map(i => i.id);
    setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
    try {
      const config = await getAuthHeaders();
      // Django needs a custom 'bulk_delete' endpoint or a loop
      await axios.post(`${API_BASE_URL}/transactions/bulk_delete/`, { ids }, config);
    } catch (e) {
      console.error("Bulk delete failed", e);
      refreshData();
    }
  };

// --- 2. ACTIONS (REWRITTEN FOR DJANGO) ---

const updateSettings = async (newSettings) => {
  try {
    const config = await getAuthHeaders();
    
    // Ensure numbers are sent as numbers, not strings from input fields
    const djangoPayload = {
        monthly_income: parseFloat(newSettings.monthlyIncome) || 0,
        monthly_budget: parseFloat(newSettings.monthlyBudget) || 0,
        daily_budget: parseFloat(newSettings.dailyBudget) || 0,
        is_business: newSettings.isBusiness || false,
        is_onboarded: true
    };

    // 1. Send to Django
    const res = await axios.patch(`${API_BASE_URL}/profile/`, djangoPayload, config);
    
    // 2. IMPORTANT: Use the data returned from Django to update local state.
    // This ensures your frontend 'settings' object matches exactly what is in the DB.
    if (res.data) {
      setSettings({
        monthlyIncome: res.data.monthlyIncome || res.data.monthly_income,
        monthlyBudget: res.data.monthlyBudget || res.data.monthly_budget,
        dailyBudget: res.data.dailyBudget || res.data.daily_budget,
        isBusiness: res.data.isBusiness || res.data.is_business,
        isOnboarded: res.data.isOnboarded || res.data.is_onboarded
      });
    }
  } catch (e) {
    console.error("Settings update failed:", e.response?.data || e.message);
    // Rollback or alert user
    refreshData(); 
  }
};

  const updateTaxProfile = async (newProfile) => {
    try {
      const config = await getAuthHeaders();
      await axios.patch(`${API_BASE_URL}/profile/`, { tax_profile: newProfile }, config);
      setTaxProfile(newProfile);
    } catch (e) {
      console.error("Tax profile update failed", e);
    }
  };

  const value = {
    transactions, wealthItems, settings, taxProfile, loading,
    deleteTransaction, updateTransaction, bulkDeleteTransactions, 
    updateSettings, updateTaxProfile, refreshData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}