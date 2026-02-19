import React, { useState, useCallback } from "react";
import { TABS } from "../../../../packages/shared/config/constants";
import { cn } from "../../../../packages/shared/utils/cn";

// Components
import { Navigation } from "./components/ui/Navigation";
import { Toast } from "./components/ui/Shared";
import LoginScreen from "./pages/LoginScreen"; // Login Screen (UPDATED)

export default function App() {
  const API_BASE_URL = "http://127.0.0.1:8000/api/finance";

  // State
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.HOME);
  const [toast, setToast] = useState({ show: false, msg: "", type: "info" });
  const [theme] = useState(() => localStorage.getItem("app_theme") || "dark");
  const [testAmount, setTestAmount] = useState("");
  const [testNote, setTestNote] = useState("");

  const showToast = useCallback((msg, type = "info") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, []);

  const handleSaveData = async (e) => {
    e.preventDefault();
    if (!testAmount) return showToast("Enter an amount", "error");

    try {
      const response = await fetch(`${API_BASE_URL}/add-transaction/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          amount: testAmount,
          note: testNote,
        }),
      });

      if (response.ok) {
        showToast("Saved to Django Admin!", "success");
        setTestAmount("");
        setTestNote("");
      } else {
        showToast("Failed to save", "error");
      }
    } catch (err) {
      showToast("Network Error", "error");
    }
  };

  // If user is not logged in, show the LoginScreen
  if (!currentUser) {
    return <LoginScreen onAuthSuccess={setCurrentUser} showToast={showToast} />;
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-1000 font-sans pb-28 md:pb-0 md:pl-28", 
      theme === "dark" ? "bg-[#08090a] text-white" : "bg-[#cfd9e5] text-slate-900"
    )}>
      
      <Toast 
        message={toast.msg} 
        type={toast.type} 
        isVisible={toast.show} 
        onClose={() => setToast(p => ({ ...p, show: false }))} 
      />

      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onSignOut={() => setCurrentUser(null)} 
      />

      <div className="mx-auto min-h-screen relative z-10 max-w-6xl px-12 flex flex-col items-center justify-center">
        <div className="w-full">
          <header className="mb-10 text-left w-full">
            <h1 className="text-5xl font-black mb-2">Hello, {currentUser.username}</h1>
            <p className="opacity-50 text-lg">Django ID: {currentUser.id} • Status: Connected</p>
          </header>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] max-w-md backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-6">Test Django Persistence</h2>
            <form onSubmit={handleSaveData} className="flex flex-col gap-4">
              <input 
                type="number" 
                placeholder="Amount (₹)" 
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="bg-black/20 border border-white/10 p-4 rounded-2xl focus:border-blue-500 outline-none"
              />
              <input 
                type="text" 
                placeholder="Note (e.g. Test Entry)" 
                value={testNote}
                onChange={(e) => setTestNote(e.target.value)}
                className="bg-black/20 border border-white/10 p-4 rounded-2xl focus:border-blue-500 outline-none"
              />
              <button type="submit" className="bg-emerald-600 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all">
                Save to Django Admin
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// import React, { useEffect, useState } from 'react';

// function App() {
//   const [connection, setConnection] = useState("Testing...");

//   useEffect(() => {
//     fetch("http://127.0.0.1:8000/test/")
//       .then(response => response.json())
//       .then(data => setConnection(data.message))
//       .catch(error => setConnection("Connection Failed! Check CORS."));
//   }, []);

//   return (
//     <div>
//       <h1>Spendsy Frontend</h1>
//       <p>Backend Status: <strong>{connection}</strong></p>
//     </div>
//   );
// }

// export default App;

// //Actual code for spendsy -------------------------------------------------------------
// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import {
//   Pin,
//   PinOff,
//   ArrowUp,
//   ArrowDown,
//   Sun,
//   Moon,
//   Zap,
//   Layout as LayoutIcon,
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// // Context (Logic preserved 100%)
// import { useAuth } from "../../../../packages/shared/context/AuthContext";
// import { useData } from "../../../../packages/shared/context/DataContext";

// // Config & Utils
// import { TABS, APP_VERSION } from "../../../../packages/shared/config/constants";
// import { formatIndianCompact } from "../../../../packages/shared/utils/helpers";
// import { cn } from "../../../../packages/shared/utils/cn";

// // Components
// import { Navigation } from "./components/ui/Navigation";
// import { Toast, Loading, ConfirmationDialog } from "./components/ui/Shared";
// import WelcomeWizard from "./components/onboarding/WelcomeWizard";

// // Pages
// import LoginScreen from "./pages/LoginScreen"; // Login Screen (UPDATED)
// import HomePage from "./pages/HomePage"; // Section 1
// import HistoryPage from "./pages/HistoryPage"; // Section 2
// import AddPage from "./pages/AddPage"; // Section 3
// import AuditPage from "./pages/AuditPage"; // Section 4
// import StatsPage from "./pages/StatsPage"; // Section 5
// import WealthPage from "./pages/WealthPage"; // Section 6
// import ProfilePage from "./pages/ProfilePage"; // Section 7
// import ITRPage from "./pages/ITRPage"; // ITR Wizard

// export default function App() {

// const API_BASE_URL = "http://127.0.0.1:8000/api";

//   // --- 1. Global State (Original Logic) ---
//   const {
//     user,
//     loading,
//     isGuest,
//     error: authError,
//     loginWithGoogle,
//     loginAsGuest,
//     logout,
//   } = useAuth();
//   const {
//     transactions,
//     wealthItems,
//     settings,
//     taxProfile,
//     appId,
//     deleteTransaction,
//     updateTransaction,
//     bulkDeleteTransactions,
//     updateSettings,
//     updateTaxProfile,
//   } = useData();

//   // --- 2. Local UI State ---
//   const [showWizard, setShowWizard] = useState(false);
//   const [activeTab, setActiveTab] = useState(TABS.HOME);
//   const [isHeaderPinned, setIsHeaderPinned] = useState(true);
//   const [scrollOpacity, setScrollOpacity] = useState(1);
//   const [toast, setToast] = useState({ show: false, msg: "", type: "info" });
//   const [confirmModal, setConfirmModal] = useState({
//     isOpen: false,
//     message: "",
//     action: null,
//   });
//   const [theme, setTheme] = useState(
//     () => localStorage.getItem("app_theme") || "dark",
//   );
//   const layoutMode = "desktop-full"; // Force desktop view

//   // --- 3. Helpers (Original Logic) ---
//   const showToast = useCallback((msg, type = "info") => {
//     setToast({ show: true, msg, type });
//     setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
//   }, []);

//   const triggerConfirm = useCallback((message, action) => {
//     setConfirmModal({ isOpen: true, message, action });
//   }, []);
//   const closeConfirm = useCallback(() => {
//     setConfirmModal({ isOpen: false, message: "", action: null });
//   }, []);
//   const executeConfirm = useCallback(() => {
//     if (confirmModal.action) confirmModal.action();
//     closeConfirm();
//   }, [confirmModal, closeConfirm]);

//   const toggleTheme = () => {
//     const newTheme = theme === "dark" ? "light" : "dark";
//     setTheme(newTheme);
//     localStorage.setItem("app_theme", newTheme);
//   };

//   // --- 4. Effects (Original Logic) ---
//   useEffect(() => {
//     const checkBackend = async () => {
//       try {
//         const response = await fetch(`${API_BASE_URL}/test/`);
//         const data = await response.json();
//         console.log("Backend Status:", data.message);
//       } catch (err) {
//         console.error("Backend unreachable:", err);
//         showToast("Backend connection failed", "error");
//       }
//     };

//     if (user) checkBackend();
//   }, [user, showToast]);

// useEffect(() => {
//     // 1. ASYNC PDF WORKER INITIALIZATION
//     const loadPdfWorker = async () => {
//       const src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
//       if (!document.querySelector(`script[src="${src}"]`)) {
//         const script = document.createElement("script");
//         script.src = src;
//         script.async = true; // Added for performance
//         script.onload = () => {
//           if (window.pdfjsLib) {
//             window.pdfjsLib.GlobalWorkerOptions.workerSrc =
//               "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
//           }
//         };
//         document.head.appendChild(script);
//       }
//     };
//     loadPdfWorker();

//     // 2. HEADER PIN PREFERENCE
//     const savedPin = localStorage.getItem("smartSpend_header_pinned");
//     if (savedPin !== null) {
//       setIsHeaderPinned(savedPin === "true");
//     }

//     // 3. ONBOARDING WIZARD TRIGGER
//     // Logic: Only show if user is fully logged in, not a guest,
//     // and Django profile data shows no income.
//     const incomeValue = parseFloat(settings?.monthlyIncome || 0);

//     if (user && !isGuest && settings && incomeValue === 0) {
//       const timer = setTimeout(() => {
//         setShowWizard(true);
//       }, 1500);
//       return () => clearTimeout(timer);
//     }
//   }, [user, isGuest, settings, setIsHeaderPinned, setShowWizard]); // Added setters to dependency array for completeness

//   useEffect(() => {
//     const handleScroll = () => {
//       if (!isHeaderPinned)
//         setScrollOpacity(Math.max(0, 1 - window.scrollY / 150));
//       else setScrollOpacity(1);
//     };
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, [isHeaderPinned]);

//   const togglePin = () => {
//     const newState = !isHeaderPinned;
//     setIsHeaderPinned(newState);
//     localStorage.setItem("smartSpend_header_pinned", newState);
//     if (newState) setScrollOpacity(1);
//   };

//   // --- 5. Data Processing (Original Logic) ---
//   const totals = useMemo(
//     () =>
//       transactions.reduce(
//         (acc, curr) => {
//           const amt = parseFloat(curr.amount || 0);
//           if (curr.type === "income") acc.income += amt;
//           else acc.expenses += amt;
//           return acc;
//         },
//         { income: 0, expenses: 0 },
//       ),
//     [transactions],
//   );

//   const netWorth = useMemo(
//     () =>
//       wealthItems.reduce(
//         (acc, curr) => {
//           const amt = parseFloat(curr.amount || 0);
//           if (curr.type === "asset") acc.assets += amt;
//           else acc.liabilities += amt;
//           return acc;
//         },
//         { assets: 0, liabilities: 0 },
//       ),
//     [wealthItems],
//   );

//   const balance = totals.income - totals.expenses;
//   const displayName = user?.displayName
//     ? user.displayName.split(" ")[0]
//     : "Guest";

//   // --- 6. Handlers (Original Logic) ---

// // Inside your main App.jsx

// // Locate this function around line 250
// const handleWizardComplete = async (wizardData) => {
//   try {
//     const payload = {
//       monthlyIncome: wizardData.monthlyIncome,
//       monthlyBudget: wizardData.budgetLimit,
//       isBusiness: wizardData.isBusiness,
//       dailyBudget: Math.floor(wizardData.budgetLimit / 30)
//     };

//     await updateSettings(payload);

//     // FIX: Match this name exactly to your useState at the top of App.jsx
//     setShowWizard(false);
//   } catch (error) {
//     console.error("Save failed:", error);
//   }
// };

//   const requestDeleteTransaction = (id) =>
//     triggerConfirm("Permanently delete?", () => deleteTransaction(id));
//   const requestBulkDelete = (items) =>
//     triggerConfirm(`Delete ${items.length} items?`, () =>
//       bulkDeleteTransactions(items),
//     );

//   // --- 7. RENDER ---
//   if (loading) return <Loading />;
//   if (!user && !isGuest)
//     return (
//       <LoginScreen
//         onLoginGoogle={loginWithGoogle}
//         onGuest={loginAsGuest}
//         error={authError}
//       />
//     );

//   return (
//     <div
//       className={cn(
//         "min-h-screen transition-colors duration-1000 font-sans pb-28 md:pb-0 md:pl-28 scroll-smooth selection:bg-blue-500",
//         theme === "dark"
//           ? "bg-[#08090a] text-white"
//           : "bg-[#cfd9e5] text-slate-900",
//       )}
//     >
//       {/* BACKGROUND SYSTEM */}
//       <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
//         {/* Glowing Gradient Aura */}
//         <motion.div
//           animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
//           transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
//           className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#3b82f6,transparent_75%)] blur-[120px]"
//         />

//         <svg
//           width="100%"
//           height="100%"
//           className={theme === "dark" ? "opacity-[0.15]" : "opacity-[0.25]"}
//         >
//           <defs>
//             <pattern
//               id="diagonal-parallels"
//               width="80"
//               height="80"
//               patternUnits="userSpaceOnUse"
//             >
//               <circle
//                 cx="2"
//                 cy="2"
//                 r="1.5"
//                 fill={theme === "dark" ? "white" : "#475569"}
//               />
//               <line
//                 x1="15"
//                 y1="65"
//                 x2="65"
//                 y2="15"
//                 stroke={theme === "dark" ? "white" : "#475569"}
//                 strokeWidth="1.2"
//                 opacity="0.4"
//               />
//               <line
//                 x1="5"
//                 y1="55"
//                 x2="55"
//                 y2="5"
//                 stroke={theme === "dark" ? "white" : "#475569"}
//                 strokeWidth="1.2"
//                 opacity="0.4"
//               />
//             </pattern>
//           </defs>
//           <rect width="100%" height="100%" fill="url(#diagonal-parallels)" />
//         </svg>
//       </div>

//       <ConfirmationDialog
//         isOpen={confirmModal.isOpen}
//         message={confirmModal.message}
//         onConfirm={executeConfirm}
//         onCancel={closeConfirm}
//       />
//       <Toast
//         message={toast.msg}
//         type={toast.type}
//         isVisible={toast.show}
//         onClose={() => setToast((prev) => ({ ...prev, show: false }))}
//       />
//       <WelcomeWizard isOpen={showWizard} onComplete={handleWizardComplete} />

//       <Navigation
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         onSignOut={async () => {
//           await logout();
//           setActiveTab(TABS.HOME);
//         }}
//       />

//       <div
//         className={cn(
//           "mx-auto min-h-screen relative z-10 transition-all duration-700",
//           "max-w-6xl px-12", // Always desktop
//         )}
//       >
//         {/* // --- Header Starts --- */}
//         {![TABS.PROFILE].includes(activeTab) && (
//           <header
//             className={cn(
//               "z-40 pt-10 pb-2 transition-all duration-500",
//               isHeaderPinned
//                 ? "sticky top-0 backdrop-blur-xl border-b border-white/5"
//                 : "relative",
//             )}
//             style={{ opacity: scrollOpacity }}
//           >
//             <div className="flex items-center justify-between mb-2 px-2">
//               {/* 1. CONFIG: LEFT CONTENT (Branding & User Name)
//                */}
//               {[
//                 TABS.HOME,
//                 TABS.HISTORY,
//                 TABS.ADD,
//                 TABS.AUDIT,
//                 TABS.STATS,
//                 TABS.WEALTH,
//                 TABS.ITR,
//               ].includes(activeTab) ? (
//                 <div className="flex flex-col">
//                   <div className="flex items-center gap-2 mb-2">
//                     <div className="p-1.5 bg-blue-500/10 rounded-lg">
//                       <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
//                     </div>
//                     <span className="text-[11px] font-bold tracking-[0.3em] uppercase opacity-60">
//                       Spendsy
//                     </span>
//                   </div>
//                   <h1 className="text-4xl font-black tracking-tight leading-tight">
//                     <span
//                       className={
//                         theme === "dark" ? "text-white" : "text-slate-900"
//                       }
//                     >
//                       {displayName}
//                     </span>
//                   </h1>
//                 </div>
//               ) : (
//                 <div /> /* Spacer to keep Right content on the right if Left is hidden */
//               )}

//               {/* 2. CONFIG: RIGHT CONTENT (Theme & Pin Buttons)
//                */}
//               {[TABS.HOME, TABS.ADD, TABS.STATS].includes(activeTab) && (
//                 <div className="flex gap-2 p-1 bg-white/5 border border-white/10 backdrop-blur-md rounded-full shadow-lg">
//                   <button
//                     onClick={toggleTheme}
//                     className={cn(
//                       "p-3 rounded-full transition-all duration-300 active:scale-90",
//                       theme === "dark"
//                         ? "hover:bg-white/10 text-amber-400"
//                         : "hover:bg-slate-200 text-blue-600",
//                     )}
//                   >
//                     {theme === "dark" ? (
//                       <Sun className="w-4 h-4" />
//                     ) : (
//                       <Moon className="w-4 h-4" />
//                     )}
//                   </button>
//                   <button
//                     onClick={togglePin}
//                     className={cn(
//                       "p-3 rounded-full transition-all duration-300 active:scale-90",
//                       isHeaderPinned
//                         ? "bg-blue-500 text-white shadow-md"
//                         : "hover:bg-white/10 text-slate-400",
//                     )}
//                   >
//                     {isHeaderPinned ? (
//                       <Pin className="w-4 h-4 fill-current" />
//                     ) : (
//                       <PinOff className="w-4 h-4" />
//                     )}
//                   </button>
//                 </div>
//               )}
//             </div>

// {/* 3. CONFIG: HERO CARD (Current Balance & Stats) */}
// {[TABS.HOME, TABS.ADD, TABS.STATS].includes(activeTab) && (
//   <motion.div
//     whileHover={{ scale: 1.01, y: -2 }}
//     transition={{ type: "spring", stiffness: 300, damping: 20 }}
//     className={cn(
//       "relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 transition-all duration-500 border",
//       theme === "dark"
//         ? "bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]"
//         : "bg-gradient-to-br from-white to-slate-50 border-white/60 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)]"
//     )}
//   >
//     {/* Ambient Background Glows */}
//     <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none" />
//     <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

//     <div className="relative z-10">

//       {/* 1. Header Label */}
//       <div className="flex items-center gap-2 mb-4 sm:mb-6 opacity-50">
//         <LayoutIcon className="w-4 h-4" />
//         <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">
//           {activeTab === TABS.WEALTH ? "Net Valuation" : "Total Balance"}
//         </p>
//       </div>

//       {/* 2. Main Balance Figure (Dynamic Sizing Logic) */}
//       {(() => {
//         // A. Calculate the value string first
//         const displayValue = activeTab === TABS.WEALTH
//           ? formatIndianCompact(netWorth.assets - netWorth.liabilities)
//           : `₹${balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

//         // B. Determine font size based on character count (Mobile Only)
//         // Length > 13 (e.g. ₹10,00,000.00) -> text-2xl
//         // Length > 9  (e.g. ₹1,00,000)    -> text-3xl
//         // Short       (e.g. ₹5,000)       -> text-4xl
//         const mobileFontSize =
//           displayValue.length > 13 ? "text-2xl" :
//           displayValue.length > 9 ? "text-3xl" :
//           "text-4xl";

//         return (
//           <h2
//             className={cn(
//               "font-black mb-8 sm:mb-10 tracking-tighter leading-tight tabular-nums bg-clip-text text-transparent bg-gradient-to-r",
//               // Apply dynamic mobile font size, force text-7xl on desktop
//               `${mobileFontSize} sm:text-6xl md:text-7xl`,
//               theme === "dark"
//                 ? "from-white via-white to-white/70"
//                 : "from-slate-900 via-slate-800 to-slate-600"
//             )}
//           >
//             {displayValue}
//           </h2>
//         );
//       })()}

//       {/* 3. Stats Grid */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">

//         {/* Income Tile */}
//         <div
//           className={cn(
//             "group p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-300",
//             theme === "dark"
//               ? "bg-black/20 border-white/5 hover:bg-white/5"
//               : "bg-white/50 border-slate-200/60 hover:bg-white"
//           )}
//         >
//           <div className="flex flex-col gap-2 sm:gap-4">
//             <div className="flex items-center gap-2">
//               <div className="p-1.5 sm:p-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
//                 <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
//               </div>
//               <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-500/80">
//                 Income
//               </span>
//             </div>
//             <p className="font-bold text-lg sm:text-2xl tracking-tight tabular-nums truncate">
//               {activeTab === TABS.WEALTH
//                 ? formatIndianCompact(netWorth.assets)
//                 : `₹${totals.income.toLocaleString("en-IN")}`}
//             </p>
//           </div>
//         </div>

//         {/* Expense Tile */}
//         <div
//           className={cn(
//             "group p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-300",
//             theme === "dark"
//               ? "bg-black/20 border-white/5 hover:bg-white/5"
//               : "bg-white/50 border-slate-200/60 hover:bg-white"
//           )}
//         >
//           <div className="flex flex-col gap-2 sm:gap-4">
//             <div className="flex items-center gap-2">
//               <div className="p-1.5 sm:p-2 rounded-full bg-rose-500/10 border border-rose-500/20">
//                 <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500" />
//               </div>
//               <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-500/80">
//                 Expense
//               </span>
//             </div>
//             <p className="font-bold text-lg sm:text-2xl tracking-tight tabular-nums truncate">
//               {activeTab === TABS.WEALTH
//                 ? formatIndianCompact(netWorth.liabilities)
//                 : `₹${totals.expenses.toLocaleString("en-IN")}`}
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   </motion.div>
// )}

//           </header>
//         )}
//         {/* // --- Header Ends --- */}

//         <main
//           className={cn(
//             "pb-4",
//             [TABS.PROFILE, TABS.HISTORY, TABS.AUDIT, TABS.ITR].includes(
//               activeTab,
//             )
//               ? "pt-5"
//               : "pt-8",
//           )}
//         >

//           <AnimatePresence mode="wait">
//           {/* <AnimatePresence mode="wait"> */}
//             <motion.div
//               key={activeTab}
//               initial={{ opacity: 0, scale: 0.98, x: 20 }}
//               animate={{ opacity: 1, scale: 1, x: 0 }}
//               exit={{ opacity: 0, scale: 0.98, x: -20 }}
//               transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }} // Snappy Slide
//             >
//               {activeTab === TABS.HOME && (
//                 <HomePage
//                   transactions={transactions}
//                   wealthItems={wealthItems}  // <--- ADD THIS LINE HERE
//                   setActiveTab={setActiveTab}
//                   onDelete={requestDeleteTransaction}
//                   onUpdate={updateTransaction}
//                   settings={settings}
//                   theme={theme}
//                 />
//               )}
//               {activeTab === TABS.HISTORY && (
//                 <HistoryPage
//                   transactions={transactions}
//                   setActiveTab={setActiveTab}
//                   onDelete={requestDeleteTransaction}
//                   onBulkDelete={requestBulkDelete}
//                   onUpdate={updateTransaction}
//                 />
//               )}
//               {activeTab === TABS.ADD && (
//                 <AddPage
//                   user={user}
//                   appId={appId}
//                   setActiveTab={setActiveTab}
//                   showToast={showToast}
//                   triggerConfirm={triggerConfirm}
//                 />
//               )}
//               {activeTab === TABS.AUDIT && (
//                 <AuditPage
//                   transactions={transactions}
//                   wealthItems={wealthItems}
//                   taxProfile={taxProfile}
//                   onUpdateProfile={updateTaxProfile}
//                   showToast={showToast}
//                   settings={settings}
//                   setActiveTab={setActiveTab}
//                 />
//               )}
//               {activeTab === TABS.STATS && (
//                 <StatsPage transactions={transactions} />
//               )}
//               {activeTab === TABS.WEALTH && (
//                 <WealthPage
//                   wealthItems={wealthItems}
//                   user={user}
//                   appId={appId}
//                   showToast={showToast}
//                   triggerConfirm={triggerConfirm}
//                 />
//               )}
//               {activeTab === TABS.PROFILE && (
//                 <ProfilePage
//                   user={user}
//                   settings={settings}
//                   onUpdateSettings={updateSettings}
//                   onSignOut={async () => {
//                     await logout();
//                     setActiveTab(TABS.HOME);
//                   }}
//                   showToast={showToast}
//                   triggerConfirm={triggerConfirm}
//                 />
//               )}
//               {activeTab === TABS.ITR && (
//                 <ITRPage
//                   user={user}
//                   transactions={transactions}
//                   setActiveTab={setActiveTab}
//                   showToast={showToast}
//                 />
//               )}
//             </motion.div>
//           </AnimatePresence>

//           {/* Footer Start */}
//           <footer className="mt-32 pb-1 flex flex-col items-center justify-center gap-4 opacity-60 hover:opacity-100 transition-opacity duration-500">
//             {/* Gradient Separator Line */}
//             <div className="h-px w-48 bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-2" />

//             <div className="flex flex-col items-center gap-2 text-center">
//               {/* Brand & Copyright - Increased to text-sm (14px) */}
//               <p
//                 className={cn(
//                   "text-sm font-medium tracking-wide",
//                   theme === "dark" ? "text-slate-400" : "text-slate-600",
//                 )}
//               >
//                 &copy; {new Date().getFullYear()} Spendsy. All rights reserved.
//               </p>

//               {/* Version Badge - Increased to text-xs (12px) */}
//               <div
//                 className={cn(
//                   "px-4 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase border mt-2",
//                   theme === "dark"
//                     ? "bg-white/5 border-white/10 text-slate-500"
//                     : "bg-slate-100 border-slate-200 text-slate-500",
//                 )}
//               >
//                 {APP_VERSION}
//               </div>
//             </div>
//           </footer>
//           {/* Footer End */}
//         </main>
//       </div>
//     </div>
//   );
// }
