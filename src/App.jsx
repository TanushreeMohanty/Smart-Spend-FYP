import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Pin,
  PinOff,
  ArrowUp,
  ArrowDown,
  Sun,
  Moon,
  Zap,
  Layout as LayoutIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Context (Logic preserved 100%)
import { useAuth } from "./context/AuthContext";
import { useData } from "./context/DataContext";

// Config & Utils
import { TABS, APP_VERSION } from "./config/constants";
import { formatIndianCompact } from "./utils/helpers";
import { cn } from "./utils/cn";

// Components
import { Navigation } from "./components/ui/Navigation";
import { Toast, Loading, ConfirmationDialog } from "./components/ui/Shared";
import WelcomeWizard from "./components/onboarding/WelcomeWizard";

// Pages
import LoginScreen from "./pages/LoginScreen";
import HomePage from "./pages/HomePage"; // Section 1
import HistoryPage from "./pages/HistoryPage"; // Section 2
import AddPage from "./pages/AddPage"; // Section 3
import AuditPage from "./pages/AuditPage"; // Section 4
import StatsPage from "./pages/StatsPage"; // Section 5
import WealthPage from "./pages/WealthPage"; // Section 6
import ProfilePage from "./pages/ProfilePage"; // Section 7
import ITRPage from "./pages/ITRPage"; // 

export default function App() {
  // --- 1. Global State (Original Logic) ---
  const {
    user,
    loading,
    isGuest,
    error: authError,
    loginWithGoogle,
    loginAsGuest,
    logout,
  } = useAuth();
  const {
    transactions,
    wealthItems,
    settings,
    taxProfile,
    appId,
    deleteTransaction,
    updateTransaction,
    bulkDeleteTransactions,
    updateSettings,
    updateTaxProfile,
  } = useData();

  // --- 2. Local UI State ---
  const [activeTab, setActiveTab] = useState(TABS.HOME);
  const [isHeaderPinned, setIsHeaderPinned] = useState(true);
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [toast, setToast] = useState({ show: false, msg: "", type: "info" });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: "",
    action: null,
  });
  const [showWizard, setShowWizard] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("app_theme") || "dark"
  );
  const layoutMode = "desktop-full"; // Force desktop view
  // Removed toggleLayout function and state

  // --- 3. Helpers (Original Logic) ---
  const showToast = useCallback((msg, type = "info") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  }, []);

  const triggerConfirm = useCallback((message, action) => {
    setConfirmModal({ isOpen: true, message, action });
  }, []);
  const closeConfirm = useCallback(() => {
    setConfirmModal({ isOpen: false, message: "", action: null });
  }, []);
  const executeConfirm = useCallback(() => {
    if (confirmModal.action) confirmModal.action();
    closeConfirm();
  }, [confirmModal, closeConfirm]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("app_theme", newTheme);
  };

  // --- 4. Effects (Original Logic) ---
  useEffect(() => {
    const loadPdfWorker = async () => {
      const src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      if (!document.querySelector(`script[src="${src}"]`)) {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => {
          if (window.pdfjsLib)
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        };
        document.head.appendChild(script);
      }
    };
    loadPdfWorker();
    const savedPin = localStorage.getItem("smartSpend_header_pinned");
    if (savedPin !== null) setIsHeaderPinned(savedPin === "true");
    if (
      user &&
      !isGuest &&
      settings &&
      (!settings.monthlyIncome || parseFloat(settings.monthlyIncome) === 0)
    ) {
      const timer = setTimeout(() => setShowWizard(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, isGuest, settings]);

  useEffect(() => {
    const handleScroll = () => {
      if (!isHeaderPinned)
        setScrollOpacity(Math.max(0, 1 - window.scrollY / 150));
      else setScrollOpacity(1);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHeaderPinned]);

  const togglePin = () => {
    const newState = !isHeaderPinned;
    setIsHeaderPinned(newState);
    localStorage.setItem("smartSpend_header_pinned", newState);
    if (newState) setScrollOpacity(1);
  };

  // --- 5. Data Processing (Original Logic) ---
  const totals = useMemo(
    () =>
      transactions.reduce(
        (acc, curr) => {
          const amt = parseFloat(curr.amount || 0);
          if (curr.type === "income") acc.income += amt;
          else acc.expenses += amt;
          return acc;
        },
        { income: 0, expenses: 0 }
      ),
    [transactions]
  );

  const netWorth = useMemo(
    () =>
      wealthItems.reduce(
        (acc, curr) => {
          const amt = parseFloat(curr.amount || 0);
          if (curr.type === "asset") acc.assets += amt;
          else acc.liabilities += amt;
          return acc;
        },
        { assets: 0, liabilities: 0 }
      ),
    [wealthItems]
  );

  const balance = totals.income - totals.expenses;
  const displayName = user?.displayName
    ? user.displayName.split(" ")[0]
    : "Guest";

  // --- 6. Handlers (Original Logic) ---
  const handleWizardComplete = async (wizardData) => {
    const newSettings = {
      ...settings,
      monthlyIncome: wizardData.monthlyIncome,
      monthlyBudget: wizardData.budgetLimit,
      dailyBudget: (parseFloat(wizardData.budgetLimit) / 30).toFixed(0),
    };
    await updateSettings(newSettings);
    const newProfile = { ...taxProfile, isBusiness: wizardData.isBusiness };
    await updateTaxProfile(newProfile);
    setShowWizard(false);
    showToast("Setup Complete! 🚀", "success");
  };

  const requestDeleteTransaction = (id) =>
    triggerConfirm("Permanently delete?", () => deleteTransaction(id));
  const requestBulkDelete = (items) =>
    triggerConfirm(`Delete ${items.length} items?`, () =>
      bulkDeleteTransactions(items)
    );

  // --- 7. RENDER ---
  if (loading) return <Loading />;
  if (!user && !isGuest)
    return (
      <LoginScreen
        onLoginGoogle={loginWithGoogle}
        onGuest={loginAsGuest}
        error={authError}
      />
    );

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-1000 font-sans pb-28 md:pb-0 md:pl-28 scroll-smooth selection:bg-blue-500",
        theme === "dark"
          ? "bg-[#08090a] text-white"
          : "bg-[#cfd9e5] text-slate-900"
      )}
    >
      {/* BACKGROUND SYSTEM */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Glowing Gradient Aura */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#3b82f6,transparent_75%)] blur-[120px]"
        />

        <svg
          width="100%"
          height="100%"
          className={theme === "dark" ? "opacity-[0.15]" : "opacity-[0.25]"}
        >
          <defs>
            <pattern
              id="diagonal-parallels"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="2"
                cy="2"
                r="1.5"
                fill={theme === "dark" ? "white" : "#475569"}
              />
              <line
                x1="15"
                y1="65"
                x2="65"
                y2="15"
                stroke={theme === "dark" ? "white" : "#475569"}
                strokeWidth="1.2"
                opacity="0.4"
              />
              <line
                x1="5"
                y1="55"
                x2="55"
                y2="5"
                stroke={theme === "dark" ? "white" : "#475569"}
                strokeWidth="1.2"
                opacity="0.4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonal-parallels)" />
        </svg>
      </div>

      <ConfirmationDialog
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={executeConfirm}
        onCancel={closeConfirm}
      />
      <Toast
        message={toast.msg}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
      <WelcomeWizard isOpen={showWizard} onComplete={handleWizardComplete} />

      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={async () => {
          await logout();
          setActiveTab(TABS.HOME);
        }}
      />

      <div
        className={cn(
          "mx-auto min-h-screen relative z-10 transition-all duration-700",
          "max-w-6xl px-12" // Always desktop
        )}
      >
        {![TABS.PROFILE, TABS.HISTORY, TABS.AUDIT, TABS.ITR].includes(
          activeTab
        ) && (
          <header
            className={cn(
              "z-40 pt-10 pb-6 transition-all duration-500",
              isHeaderPinned ? "sticky top-0 backdrop-blur-3xl" : "relative"
            )}
            style={{ opacity: scrollOpacity }}
          >
            <div className="flex items-center justify-between mb-10 px-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                  <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-50">
                    Spendsy
                  </span>
                </div>
                <h1 className="text-4xl font-black tracking-tight">
                  {displayName}
                  <span className="text-blue-500">.</span>
                </h1>
              </div>

              <div className="flex gap-2 p-1.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-2xl shadow-2xl">
                <button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl hover:bg-blue-500/20 transition-all active:scale-95"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-blue-600" />
                  )}
                </button>
                <button
                  onClick={togglePin}
                  className="p-2.5 rounded-xl transition-all active:scale-95"
                >
                  {isHeaderPinned ? (
                    <Pin className="w-4 h-4 text-blue-500 fill-current" />
                  ) : (
                    <PinOff className="w-4 h-4 opacity-20" />
                  )}
                </button>
              </div>
            </div>

            {/* DASHBOARD CARD - SNAPPY SPRING */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className={cn(
                "relative group overflow-hidden rounded-[3rem] border p-10 transition-all duration-500",
                theme === "dark"
                  ? "bg-white/[0.03] border-white/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] backdrop-blur-3xl"
                  : "bg-white border-white/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)]"
              )}
            >
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-1000" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 opacity-40">
                  <LayoutIcon className="w-4 h-4" />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em]">
                    {activeTab === TABS.WEALTH
                      ? "Net Valuation"
                      : "Current Balance"}
                  </p>
                </div>

                <h2 className="text-5xl sm:text-7xl font-black mb-12 tracking-tighter">
                  {activeTab === TABS.WEALTH
                    ? formatIndianCompact(
                        netWorth.assets - netWorth.liabilities
                      )
                    : `₹${balance.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}`}
                </h2>

                <div className="grid grid-cols-2 gap-6">
                  {/* SOLID TILES FOR LIGHT MODE */}
                  <div
                    className={cn(
                      "p-6 rounded-[2.2rem] border transition-all hover:scale-[1.03]",
                      theme === "dark"
                        ? "bg-white/5 border-white/5"
                        : "bg-[#f8fafc] border-slate-100"
                    )}
                  >
                    <div className="flex items-center text-emerald-500 text-[10px] mb-2 font-black uppercase tracking-widest">
                      <ArrowDown className="w-3.5 h-3.5 mr-1" /> Inflow
                    </div>
                    <p className="font-bold text-2xl tracking-tight">
                      {activeTab === TABS.WEALTH
                        ? formatIndianCompact(netWorth.assets)
                        : `₹${totals.income.toLocaleString("en-IN")}`}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "p-6 rounded-[2.2rem] border transition-all hover:scale-[1.03]",
                      theme === "dark"
                        ? "bg-white/5 border-white/5"
                        : "bg-[#f8fafc] border-slate-100"
                    )}
                  >
                    <div className="flex items-center text-rose-500 text-[10px] mb-2 font-black uppercase tracking-widest">
                      <ArrowUp className="w-3.5 h-3.5 mr-1" /> Outflow
                    </div>
                    <p className="font-bold text-2xl tracking-tight">
                      {activeTab === TABS.WEALTH
                        ? formatIndianCompact(netWorth.liabilities)
                        : `₹${totals.expenses.toLocaleString("en-IN")}`}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </header>
        )}

        <main
          className={cn(
            "pb-24",
            [TABS.PROFILE, TABS.HISTORY, TABS.AUDIT, TABS.ITR].includes(
              activeTab
            )
              ? "pt-20"
              : "pt-8"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.98, x: -20 }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }} // Snappy Slide
            >
              {activeTab === TABS.HOME && (
                <HomePage
                  transactions={transactions}
                  setActiveTab={setActiveTab}
                  onDelete={requestDeleteTransaction}
                  onUpdate={updateTransaction}
                  settings={settings}
                  theme={theme}
                />
              )}
              {activeTab === TABS.HISTORY && (
                <HistoryPage
                  transactions={transactions}
                  setActiveTab={setActiveTab}
                  onDelete={requestDeleteTransaction}
                  onBulkDelete={requestBulkDelete}
                  onUpdate={updateTransaction}
                />
              )}
              {activeTab === TABS.ADD && (
                <AddPage
                  user={user}
                  appId={appId}
                  setActiveTab={setActiveTab}
                  showToast={showToast}
                  triggerConfirm={triggerConfirm}
                />
              )}
              {activeTab === TABS.AUDIT && (
                <AuditPage
                  transactions={transactions}
                  wealthItems={wealthItems}
                  taxProfile={taxProfile}
                  onUpdateProfile={updateTaxProfile}
                  showToast={showToast}
                  settings={settings}
                  setActiveTab={setActiveTab}
                />
              )}
              {activeTab === TABS.STATS && (
                <StatsPage transactions={transactions} />
              )}
              {activeTab === TABS.WEALTH && (
                <WealthPage
                  wealthItems={wealthItems}
                  user={user}
                  appId={appId}
                  showToast={showToast}
                  triggerConfirm={triggerConfirm}
                />
              )}
              {activeTab === TABS.PROFILE && (
                <ProfilePage
                  user={user}
                  settings={settings}
                  onUpdateSettings={updateSettings}
                  onSignOut={async () => {
                    await logout();
                    setActiveTab(TABS.HOME);
                  }}
                  showToast={showToast}
                  triggerConfirm={triggerConfirm}
                />
              )}
              {activeTab === TABS.ITR && (
                <ITRPage
                  user={user}
                  transactions={transactions}
                  setActiveTab={setActiveTab}
                  showToast={showToast}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <footer className="mt-28 flex flex-col items-center opacity-30">
            <div className="h-[1px] w-12 bg-blue-500 mb-6" />
            <div className="text-[10px] font-mono tracking-[0.5em] uppercase">
              {APP_VERSION}
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
