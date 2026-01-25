import React from 'react';
import { 
  Home, ListFilter, Plus, ClipboardCheck, PieChart, Landmark, User, Wallet, LogOut 
} from 'lucide-react';
import { TABS } from '../../config/constants';

export const Navigation = ({ activeTab, setActiveTab, onSignOut }) => {
  
  // Defined tabs with labels for the tooltip
  const navItems = [
    { id: TABS.HOME, icon: Home, label: "Home" },
    { id: TABS.HISTORY, icon: ListFilter, label: "History" },
    { id: TABS.ADD, icon: Plus, label: "Add New" },
    { id: TABS.AUDIT, icon: ClipboardCheck, label: "Tax Audit" },
    { id: TABS.STATS, icon: PieChart, label: "Stats" },
    { id: TABS.WEALTH, icon: Landmark, label: "Wealth" },
    { id: TABS.PROFILE, icon: User, label: "Profile" }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col fixed left-4 top-4 bottom-4 w-24 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] items-center py-8 z-50 shadow-2xl shadow-black/50 print:hidden">
        <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg mb-10">
          <Wallet className="w-7 h-7 text-white" />
        </div>

        <div className="flex flex-col gap-6 w-full px-4">
          {navItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              // Added 'group' and 'relative' to handle hover state and positioning
              className={`group relative p-4 rounded-2xl transition-all ${
                activeTab === tab.id
                  ? "bg-white/10 text-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <tab.icon className="w-6 h-6" />
              
              {/* Tooltip / Name Label */}
              <span className="absolute left-16 top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 
                               bg-slate-900 text-white text-xs font-semibold rounded-lg border border-white/10 
                               opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                               pointer-events-none whitespace-nowrap shadow-xl z-50">
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-auto">
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

      {/* Mobile Bottom Bar (Unchanged) */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-40 print:hidden">
        <div className="bg-[#0f0c29]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-full p-2 flex justify-between items-center px-4 h-20 overflow-x-auto no-scrollbar">
          {navItems.map((t) => (
            t.id === TABS.ADD ? (
              <div key={t.id} className="relative -top-8 mx-2 shrink-0">
                <button onClick={() => setActiveTab(t.id)} className="bg-gradient-to-tr from-blue-600 to-cyan-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)] border-4 border-[#0f0c29] transform transition-transform active:scale-95">
                  <t.icon className="w-8 h-8" />
                </button>
              </div> 
            ) : (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`p-3 rounded-full transition-all shrink-0 ${activeTab === t.id ? 'text-cyan-400 bg-white/10' : 'text-slate-500'}`}>
                <t.icon className="w-6 h-6" />
              </button>
            )
          ))}
        </div>
      </div>
    </>
  );
};