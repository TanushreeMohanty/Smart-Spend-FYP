import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  signInAnonymously, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithCustomToken 
} from 'firebase/auth';
import { 
  query, collection, orderBy, limit, onSnapshot, doc, getDoc, setDoc, deleteDoc, writeBatch 
} from 'firebase/firestore';
import { Pin, PinOff, ArrowUp, ArrowDown } from 'lucide-react';

// Config & Services
import { auth, db, TABS, APP_VERSION } from './config/constants';
import { formatIndianCompact } from './utils/helpers';

// Components
import { Navigation } from './components/ui/Navigation';
import { Toast, Loading, ConfirmationDialog } from './components/ui/Shared';
import WelcomeWizard from './components/onboarding/WelcomeWizard';

// Pages
import LoginScreen from './pages/LoginScreen';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import AddPage from './pages/AddPage';
import AuditPage from './pages/AuditPage';
import StatsPage from './pages/StatsPage';
import WealthPage from './pages/WealthPage';
import ProfilePage from './pages/ProfilePage';
import ITRPage from './pages/ITRPage'; // New ITR Page

// App ID for data segregation
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'info' });
  const [activeTab, setActiveTab] = useState(TABS.HOME);
  const [isHeaderPinned, setIsHeaderPinned] = useState(true);
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', action: null });
  
  // Wizard State
  const [showWizard, setShowWizard] = useState(false);

  // Data State
  const [transactions, setTransactions] = useState([]);
  const [wealthItems, setWealthItems] = useState([]);
  const [settings, setSettings] = useState({ monthlyIncome: '', monthlyBudget: '', dailyBudget: '' });
  const [taxProfile, setTaxProfile] = useState({ 
    annualRent: '', annualEPF: '', healthInsuranceSelf: '', 
    healthInsuranceParents: '', npsContribution: '', isBusiness: false 
  });

  // Helpers
  const showToast = useCallback((msg, type = 'info') => { 
    setToast({ show: true, msg, type }); 
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000); 
  }, []);

  const triggerConfirm = useCallback((message, action) => { 
    setConfirmModal({ isOpen: true, message, action }); 
  }, []);

  const closeConfirm = useCallback(() => { 
    setConfirmModal({ isOpen: false, message: '', action: null }); 
  }, []);

  const executeConfirm = useCallback(() => { 
    if (confirmModal.action) confirmModal.action(); 
    closeConfirm(); 
  }, [confirmModal, closeConfirm]);

  // Auth Init
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        }
      } catch (error) {
        console.error("Auth init failed:", error);
        setAuthError("Authentication failed.");
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // PDF Worker & UI Effects
  useEffect(() => {
      const loadPdfWorker = async () => {
          const src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          if (!document.querySelector(`script[src="${src}"]`)) {
              const script = document.createElement('script');
              script.src = src;
              script.onload = () => {
                   if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              };
              document.head.appendChild(script);
          }
      };
      loadPdfWorker();

      const savedPin = localStorage.getItem('smartSpend_header_pinned'); 
      if (savedPin !== null) { setIsHeaderPinned(savedPin === 'true'); }
  }, []);

  useEffect(() => {
      const handleScroll = () => { 
        if (!isHeaderPinned) { 
          setScrollOpacity(Math.max(0, 1 - window.scrollY / 150)); 
        } else { 
          setScrollOpacity(1); 
        } 
      };
      window.addEventListener('scroll', handleScroll); 
      return () => window.removeEventListener('scroll', handleScroll);
  }, [isHeaderPinned]);

  const togglePin = () => { 
    const newState = !isHeaderPinned; 
    setIsHeaderPinned(newState); 
    localStorage.setItem('smartSpend_header_pinned', newState); 
    if (newState) setScrollOpacity(1); 
  };

  // Data Subscriptions
  useEffect(() => {
    if (!user || !db) return;
    try {
        const q = query(
          collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'),
          orderBy('date', 'desc'),
          limit(200)
        );
        const unsubTrans = onSnapshot(q, (snapshot) => { 
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
          docs.sort((a, b) => { 
            const dateA = a.date?.seconds || 0; 
            const dateB = b.date?.seconds || 0; 
            return dateB - dateA; 
          }); 
          setTransactions(docs); 
        });

        const wq = collection(db, 'artifacts', appId, 'users', user.uid, 'wealth');
        const unsubWealth = onSnapshot(wq, (snapshot) => { 
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
          setWealthItems(docs); 
        });

        const fetchSettings = async () => { 
            const docSnap = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'preferences')); 
            if (docSnap.exists()) { 
                const data = docSnap.data(); 
                setSettings(data); 
                if (data.taxProfile) setTaxProfile(data.taxProfile);
            }
        };
        fetchSettings();
        return () => { unsubTrans(); unsubWealth(); };
    } catch (e) { console.error("Data Effect Error", e); }
  }, [user]);

  // Wizard Trigger
  useEffect(() => {
      if (user && !isGuestMode && settings && (!settings.monthlyIncome || parseFloat(settings.monthlyIncome) === 0)) {
          const timer = setTimeout(() => setShowWizard(true), 1000);
          return () => clearTimeout(timer);
      }
  }, [user, isGuestMode, settings]);

  // Actions
  const handleGoogleLogin = async () => { 
    setAuthError(''); 
    try { 
      await signInWithPopup(auth, new GoogleAuthProvider()); 
      setIsGuestMode(false); 
    } catch (error) { 
      setAuthError("Sign-in failed."); 
    } 
  };
  
  const handleGuestLogin = async () => {
    try { 
      await signInAnonymously(auth); 
      setIsGuestMode(true); 
    } catch (e) { 
      setAuthError("Guest login failed"); 
    }
  };

  const handleUpdateSettings = async (newSettings) => { 
      try {
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'preferences'), newSettings, { merge: true });
          showToast("Settings saved", "success");
      } catch(e) { showToast("Failed to save settings", "error"); }
  };

  const handleUpdateTaxProfile = async (newProfile) => {
      try { 
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'preferences'), { taxProfile: newProfile }, { merge: true }); 
        showToast("Tax Profile updated", "success"); 
      } catch(e) { showToast("Failed to update profile", "error"); }
  };

  const handleWizardComplete = async (wizardData) => {
      try {
          const newSettings = {
              ...settings,
              monthlyIncome: wizardData.monthlyIncome,
              monthlyBudget: wizardData.budgetLimit,
              dailyBudget: (parseFloat(wizardData.budgetLimit) / 30).toFixed(0)
          };
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'preferences'), newSettings, { merge: true });
          
          const newTaxProfile = { ...taxProfile, isBusiness: wizardData.isBusiness };
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'preferences'), { taxProfile: newTaxProfile }, { merge: true });
          
          setShowWizard(false);
          showToast("Setup Complete! Welcome 🚀", "success");
      } catch(e) { showToast("Setup failed", "error"); }
  };

  // --- OPTIMISTIC UPDATES ---

  const executeDeleteTransaction = async (id) => { 
    try { 
        setTransactions(prev => prev.filter(t => t.id !== id));
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', id)); 
        showToast("Transaction deleted", "success"); 
    } catch (e) { 
        showToast("Failed to delete", "error"); 
    } 
  };
  
  const requestDeleteTransaction = (id) => triggerConfirm('Permanently delete this transaction?', () => executeDeleteTransaction(id));
    
  const executeBulkDelete = async (items) => {
      try {
        const idsToDelete = new Set(items.map(i => i.id));
        setTransactions(prev => prev.filter(t => !idsToDelete.has(t.id)));

        const chunked = []; for (let i = 0; i < items.length; i += 500) { chunked.push(items.slice(i, i + 500)); }
        for (const chunk of chunked) { 
            const batch = writeBatch(db); 
            chunk.forEach(t => { batch.delete(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', t.id)); }); 
            await batch.commit(); 
        }
        showToast("Transactions deleted", "success");
      } catch(e) { showToast("Bulk delete failed", "error"); }
  };

  const executeUpdateTransaction = async (updatedTx) => {
    try {
        const { id, ...data } = updatedTx;
        const txRef = doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', id);
        await setDoc(txRef, data, { merge: true });
        showToast("Transaction updated", "success");
    } catch (e) {
        showToast("Failed to update", "error");
    }
  };

  // Calculations
  const totals = useMemo(() => transactions.reduce((acc, curr) => { 
      const amt = parseFloat(curr.amount || 0); 
      if (curr.type === 'income') acc.income += amt; 
      else acc.expenses += amt; 
      return acc; 
  }, { income: 0, expenses: 0 }), [transactions]);

  const netWorth = useMemo(() => wealthItems.reduce((acc, curr) => { 
      const amt = parseFloat(curr.amount || 0); 
      if (curr.type === 'asset') acc.assets += amt; 
      else acc.liabilities += amt; 
      return acc; 
  }, { assets: 0, liabilities: 0 }), [wealthItems]);

  const balance = totals.income - totals.expenses;

  // Render Logic
  if (loading) return <Loading />;
  
  if (!user && !isGuestMode) return <LoginScreen onLoginGoogle={handleGoogleLogin} onGuest={handleGuestLogin} error={authError} />;
  
  const displayName = user?.displayName ? user.displayName.split(' ')[0] : 'Guest';
  const photoURL = user?.photoURL;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-blue-950 to-slate-950 text-blue-50 font-sans pb-28 md:pb-0 md:pl-28 scroll-smooth">
      <ConfirmationDialog isOpen={confirmModal.isOpen} message={confirmModal.message} onConfirm={executeConfirm} onCancel={closeConfirm} />
      <Toast message={toast.msg} type={toast.type} isVisible={toast.show} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
      
      <WelcomeWizard isOpen={showWizard} onComplete={handleWizardComplete} />
      
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} onSignOut={async () => { await signOut(auth); setIsGuestMode(false); setUser(null); setActiveTab(TABS.HOME); }} />

      <div className="max-w-md mx-auto min-h-screen relative px-0 md:px-6">
        {activeTab !== TABS.PROFILE && activeTab !== TABS.HISTORY && activeTab !== TABS.AUDIT && activeTab !== TABS.ITR && (
            <header className={`z-40 pt-safe-top pb-4 transition-all duration-300 ${isHeaderPinned ? 'sticky top-0 bg-slate-950/85 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/20' : 'relative opacity-[var(--header-opacity,1)]'}`} style={{ '--header-opacity': scrollOpacity }}>
                <div className="grid grid-cols-3 items-center mb-6 px-6 pt-2">
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-white tracking-tight truncate">Hi, {displayName}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">Overview</span>
                            <button onClick={togglePin} className="p-1 rounded-full hover:bg-white/10 transition-colors">{isHeaderPinned ? <Pin className="w-3 h-3 text-cyan-400 fill-current" /> : <PinOff className="w-3 h-3 text-slate-500" />}</button>
                        </div>
                    </div>
                    <div className="flex justify-center"><span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Pro</span></div>
                    <div className="flex justify-end"><button onClick={() => setActiveTab(TABS.PROFILE)} className="relative group">{photoURL ? <img src={photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white/20 object-cover" /> : <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-cyan-400 font-bold">{displayName.charAt(0)}</div>}</button></div>
                </div>
                <div className="mx-6 relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 text-white shadow-inner">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-blue-500/10 blur-[60px]"></div>
                    <div className="relative z-10">
                        <p className="text-slate-300 text-xs font-medium mb-1 tracking-wide uppercase">{activeTab === TABS.WEALTH ? 'Net Worth' : 'Total Balance'}</p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tighter text-white">
                            {activeTab === TABS.WEALTH ? formatIndianCompact(netWorth.assets - netWorth.liabilities) : `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/10">
                                <div className="flex items-center text-emerald-300 text-[10px] mb-1 font-bold uppercase tracking-wider"><ArrowDown className="w-3 h-3 mr-1" /> {activeTab === TABS.WEALTH ? 'Assets' : 'Income'}</div>
                                <p className="font-semibold text-base sm:text-lg text-emerald-100">{activeTab === TABS.WEALTH ? formatIndianCompact(netWorth.assets) : `₹${totals.income.toLocaleString('en-IN')}`}</p>
                            </div>
                            <div className="bg-rose-500/10 rounded-xl p-3 border border-rose-500/10">
                                <div className="flex items-center text-rose-300 text-[10px] mb-1 font-bold uppercase tracking-wider"><ArrowUp className="w-3 h-3 mr-1" /> {activeTab === TABS.WEALTH ? 'Liabilities' : 'Expenses'}</div>
                                <p className="font-semibold text-base sm:text-lg text-rose-100">{activeTab === TABS.WEALTH ? formatIndianCompact(netWorth.liabilities) : `₹${totals.expenses.toLocaleString('en-IN')}`}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        )}

        <main className={`pb-6 px-6 ${activeTab === TABS.PROFILE || activeTab === TABS.HISTORY || activeTab === TABS.AUDIT || activeTab === TABS.ITR ? "pt-8" : "pt-4"}`}>
          {activeTab === TABS.HOME && <HomePage transactions={transactions} setActiveTab={setActiveTab} onDelete={requestDeleteTransaction} onUpdate={executeUpdateTransaction} settings={settings} />}
          {activeTab === TABS.HISTORY && <HistoryPage transactions={transactions} setActiveTab={setActiveTab} onDelete={requestDeleteTransaction} onBulkDelete={(items) => triggerConfirm(`Delete ${items.length} items?`, () => executeBulkDelete(items))} onUpdate={executeUpdateTransaction} />}
          {activeTab === TABS.ADD && <AddPage user={user} appId={appId} setActiveTab={setActiveTab} showToast={showToast} triggerConfirm={triggerConfirm} />}
          
          {activeTab === TABS.AUDIT && <AuditPage 
                transactions={transactions} 
                wealthItems={wealthItems} 
                taxProfile={taxProfile} 
                onUpdateProfile={handleUpdateTaxProfile} 
                showToast={showToast} 
                triggerConfirm={triggerConfirm} 
                settings={settings}
                setActiveTab={setActiveTab} 
          />}
          
          {activeTab === TABS.STATS && <StatsPage transactions={transactions} />}
          {activeTab === TABS.WEALTH && <WealthPage wealthItems={wealthItems} user={user} appId={appId} showToast={showToast} triggerConfirm={triggerConfirm} />}
          {activeTab === TABS.PROFILE && <ProfilePage user={user} settings={settings} onUpdateSettings={handleUpdateSettings} onSignOut={async () => { await signOut(auth); setIsGuestMode(false); setUser(null); setActiveTab(TABS.HOME); }} showToast={showToast} triggerConfirm={triggerConfirm} />}
          
          {activeTab === TABS.ITR && <ITRPage 
                user={user} 
                transactions={transactions} 
                setActiveTab={setActiveTab} 
                showToast={showToast} 
          />}
          
          <div className="text-center text-[10px] text-slate-600 font-mono py-6 opacity-50 print:hidden">{APP_VERSION}</div>
        </main>
      </div>
    </div>
  );
}