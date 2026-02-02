import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, query, orderBy, limit, onSnapshot, doc, getDoc, 
  setDoc, deleteDoc, writeBatch 
} from 'firebase/firestore';
import { db } from "../config/constants";
import { useAuth } from './AuthContext';

const DataContext = createContext();
export function useData() { return useContext(DataContext); }
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export function DataProvider({ children }) {
  const { user } = useAuth();
  
  const [transactions, setTransactions] = useState([]);
  const [wealthItems, setWealthItems] = useState([]);
  const [settings, setSettings] = useState({ monthlyIncome: '', monthlyBudget: '', dailyBudget: '' });
  const [taxProfile, setTaxProfile] = useState({ 
    annualRent: '', annualEPF: '', healthInsuranceSelf: '', 
    healthInsuranceParents: '', npsContribution: '', isBusiness: false 
  });

  useEffect(() => {
    if (!user || !db) return;

    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(200));
    const unsubTrans = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(docs);
    });

    const wq = collection(db, 'artifacts', appId, 'users', user.uid, 'wealth');
    const unsubWealth = onSnapshot(wq, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWealthItems(docs);
    });

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'preferences');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(prev => ({ ...prev, ...data }));
          if (data.taxProfile) setTaxProfile(data.taxProfile);
        }
      } catch (e) { console.error(e); }
    };
    fetchSettings();

    return () => { unsubTrans(); unsubWealth(); };
  }, [user]);

  const deleteTransaction = async (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id)); // Optimistic
    try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', id)); } catch(e){}
  };

  const updateTransaction = async (updatedTx) => {
    const { id, ...data } = updatedTx;
    try { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', id), data, { merge: true }); } catch(e){}
  };

  const bulkDeleteTransactions = async (items) => {
     const ids = new Set(items.map(i => i.id));
     setTransactions(prev => prev.filter(t => !ids.has(t.id))); // Optimistic
     try {
        const chunked = []; for (let i = 0; i < items.length; i += 500) chunked.push(items.slice(i, i + 500));
        for (const chunk of chunked) {
            const batch = writeBatch(db);
            chunk.forEach(t => { batch.delete(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', t.id)); });
            await batch.commit();
        }
     } catch (e){}
  };

  const updateSettings = async (newSettings) => {
      try {
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'preferences'), newSettings, { merge: true });
          setSettings(newSettings);
      } catch (e) {}
  };

  const updateTaxProfile = async (newProfile) => {
      try {
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'preferences'), { taxProfile: newProfile }, { merge: true });
          setTaxProfile(newProfile);
      } catch (e) {}
  };

  const value = {
    transactions, wealthItems, settings, taxProfile, appId,
    deleteTransaction, updateTransaction, bulkDeleteTransactions, updateSettings, updateTaxProfile
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}