// Database needed
// Section 7 Profile Page
import React, { useState, useEffect } from 'react';
import { User, Target, IndianRupee, Loader2 } from 'lucide-react';
// ❌ REMOVED: import UnitSelector from '../components/domain/UnitSelector';

const ProfilePage = ({ user, settings, onUpdateSettings, onSignOut, triggerConfirm }) => {
    
    // --- 1. Local State ---
    // We only need the values now. No more "units" state.
    const [localSettings, setLocalSettings] = useState(settings || {});
    const [savingSettings, setSavingSettings] = useState(false);

    // Sync state when database settings load
    useEffect(() => { 
        if (settings) setLocalSettings(settings); 
    }, [settings]);

    // --- 2. Helper: Live Unit Formatter ---
    // Converts raw numbers (500000) into readable text (5.00 L) for the UI badge
    const getReadableUnit = (value) => {
        const val = parseFloat(value);
        if (!val) return null;

        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)} K`;
        return `₹${val.toLocaleString('en-IN')}`;
    };

    // --- 3. Handlers ---

    const requestSaveSettings = (e) => {
        e.preventDefault();
        triggerConfirm("Confirm saving settings?", async () => {
            setSavingSettings(true);
            
            // We now pass ONLY the values. 
            // NOTE: You might need to update App.js to stop looking for a second 'units' argument.
            // Or we pass a dummy object to prevent errors if App.js expects it:
            const dummyUnits = { monthlyIncome: 1, monthlyBudget: 1, dailyBudget: 1 };
            
            await onUpdateSettings(localSettings, dummyUnits);
            setSavingSettings(false);
        });
    };

    const requestSignOut = () => triggerConfirm("Sign out now?", onSignOut);

    return (
        <div className="space-y-6 pb-4 animate-in fade-in">
            
            {/* User Header */}
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 border-4 border-white/5">
                    <User className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-xl">{user.displayName || 'Guest User'}</h3>
                    <p className="text-sm text-slate-400 mb-2">{user.email || 'guest@smartspend.app'}</p>
                </div>
            </div>
            
            {/* Financial Goals Form */}
            <form onSubmit={requestSaveSettings} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-yellow-400" /> Financial Goals
                </h3>
                
                {['monthlyIncome', 'monthlyBudget', 'dailyBudget'].map((k) => (
                    <div key={k} className="space-y-2">
                        <label className="text-xs text-slate-500 font-bold uppercase">
                            {k.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        
                        <div className="relative">
                            {/* Icon */}
                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            
                            {/* Input Field */}
                            <input 
                                type="number" 
                                value={localSettings[k]} 
                                onChange={(e) => setLocalSettings({...localSettings, [k]: e.target.value})} 
                                className="w-full pl-10 pr-24 py-4 bg-black/20 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-700" 
                                placeholder="e.g. 50000" 
                            />

                            {/* ✅ NEW: Dynamic Unit Badge */}
                            {/* This shows "5.00 L" inside the input box on the right side */}
                            {localSettings[k] && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 px-2 py-1 rounded-lg">
                                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                                        {getReadableUnit(localSettings[k])}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                <button 
                    type="submit" 
                    disabled={savingSettings} 
                    className="w-full bg-white hover:bg-slate-200 text-slate-900 py-4 rounded-2xl font-black shadow-xl transition-colors disabled:opacity-70"
                >
                    {savingSettings ? <Loader2 className="w-6 h-6 animate-spin mx-auto"/> : 'Save Changes'}
                </button>
            </form>
            
            <button 
                type="button"
                onClick={requestSignOut} 
                className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-4 rounded-2xl font-bold border border-rose-500/20 transition-all"
            >
                Sign Out
            </button>
        </div>
    );
};

export default ProfilePage;