import React, { useState } from 'react';
import { 
  Home, ListFilter, Plus, ClipboardCheck, PieChart, Landmark, User, Wallet, LogOut, Menu, X 
} from 'lucide-react';
import { TABS } from '../../config/constants';

export const Navigation = ({ activeTab, setActiveTab, onSignOut }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    { id: TABS.HOME, icon: Home, label: "Home" }, // Section 1
    { id: TABS.HISTORY, icon: ListFilter, label: "History" }, // Section 2
    { id: TABS.ADD, icon: Plus, label: "Add New" }, // Section 3
    { id: TABS.AUDIT, icon: ClipboardCheck, label: "Tax Audit" }, // Section 4
    { id: TABS.STATS, icon: PieChart, label: "Stats" }, // Section 5
    { id: TABS.WEALTH, icon: Landmark, label: "Wealth" }, // Section 6
    { id: TABS.PROFILE, icon: User, label: "Profile" } // Section 7
  ];

  return (
    <>
      {/* =======================
          DESKTOP SIDEBAR 
      ======================== */}
      <nav className="hidden md:flex flex-col fixed left-4 top-4 bottom-4 w-24 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] items-center py-6 z-50 shadow-2xl shadow-black/50 print:hidden">
        
        {/* --- GROUP 1: Logo & Nav Items (Anchored Top) --- */}
        <div className="flex flex-col items-center w-full gap-8 overflow-y-auto no-scrollbar">
          
          {/* Logo */}
          <div className="shrink-0 mt-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Wallet className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Navigation Items List */}
          <div className="flex flex-col gap-3 w-full px-4 pb-4">
            {navItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative p-3 xl:p-4 rounded-2xl transition-all shrink-0 ${
                  activeTab === tab.id
                    ? "bg-white/10 text-cyan-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <tab.icon className="w-6 h-6 mx-auto" />
                
                {/* Tooltip */}
                <span className="absolute left-16 top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 
                                 bg-slate-900 text-white text-xs font-semibold rounded-lg border border-white/10 
                                 opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                                 pointer-events-none whitespace-nowrap shadow-xl z-50">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* --- GROUP 2: Logout (Anchored Bottom) --- */}
        <div className="mt-auto shrink-0">
          <button 
            onClick={onSignOut} 
            className="group relative p-4 text-slate-500 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-6 h-6" />
            
            {/* Logout Tooltip */}
            <span className="absolute left-16 top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 
                             bg-slate-900 text-rose-400 text-xs font-semibold rounded-lg border border-white/10 
                             opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                             pointer-events-none whitespace-nowrap shadow-xl z-50">
              Sign Out
            </span>
          </button>
        </div>
      </nav>

      {/* =======================
          MOBILE NAVIGATION 
      ======================== */}
      <div className="md:hidden print:hidden">
        
        {/* 1. Backdrop Blur (Appears when menu opens) */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* 2. The Pop-up Menu Container */}
        <div className={`fixed bottom-6 left-6 right-6 z-50 transition-all duration-300 transform ${
          isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0 pointer-events-none'
        }`}>
          <div className="bg-[#0f0c29]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 rounded-[2rem] p-6">
            
            {/* Grid of Icons */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              {navItems.map((t) => (
                <button 
                  key={t.id} 
                  onClick={() => {
                    setActiveTab(t.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className={`p-4 rounded-2xl transition-all ${
                    activeTab === t.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                      : 'bg-white/5 text-slate-400'
                  }`}>
                    <t.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Logout Button (Full Width in Menu) */}
            <button 
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Sign Out</span>
            </button>
          </div>
        </div>

        {/* 3. The Toggle Button (Always Visible) */}
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border border-white/10 ${
              isMobileMenuOpen 
                ? 'bg-slate-800 text-white rotate-90' 
                : 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white animate-bounce-slow'
            }`}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* 4. Active Tab Indicator (Mini - Bottom Left) */}
        {!isMobileMenuOpen && (
           <div className="fixed bottom-6 left-6 z-40 bg-[#0f0c29]/90 backdrop-blur-xl border border-white/10 rounded-full py-2 px-4 flex items-center gap-3 shadow-lg">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-xs font-bold uppercase tracking-widest text-white/80">
               {navItems.find(n => n.id === activeTab)?.label}
             </span>
           </div>
        )}

      </div>
    </>
  );
};