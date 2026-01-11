import React, { useState, useEffect } from 'react';
import { User, Target, IndianRupee, Loader2 } from 'lucide-react';
import UnitSelector from '../components/domain/UnitSelector';

const ProfilePage = ({ user, settings, onUpdateSettings, onSignOut, triggerConfirm }) => {
    const [localSettings, setLocalSettings] = useState(settings);
    const [profileUnits, setProfileUnits] = useState({ monthlyIncome: 1, monthlyBudget: 1, dailyBudget: 1 });
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => { setLocalSettings(settings); }, [settings]);

    const requestSaveSettings = (e) => {
        e.preventDefault();
        triggerConfirm("Confirm saving settings?", async () => {
            setSavingSettings(true);
            await onUpdateSettings(localSettings, profileUnits);
            setSavingSettings(false);
        });
    };

    const requestSignOut = () => triggerConfirm("Sign out now?", onSignOut);

    return (
        <div className="space-y-6 pb-24 animate-in fade-in">
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 border-4 border-white/5">
                    <User className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-xl">{user.displayName || 'Guest User'}</h3>
                    <p className="text-sm text-slate-400 mb-2">{user.email || 'guest@smartspend.app'}</p>
                    <div className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-3 py-1 rounded-full w-fit border border-blue-500/20">PRO USER</div>
                </div>
            </div>
            
            <form onSubmit={requestSaveSettings} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-yellow-400" /> Financial Goals
                </h3>
                {['monthlyIncome', 'monthlyBudget', 'dailyBudget'].map((k) => (
                    <div key={k} className="space-y-2">
                        <label className="text-xs text-slate-500 font-bold uppercase">{k.replace(/([A-Z])/g, ' $1').trim()}</label>
                        <div className="relative">
                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input type="number" value={localSettings[k]} onChange={(e) => setLocalSettings({...localSettings, [k]: e.target.value})} className="w-full pl-10 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl text-white outline-none" placeholder="0" />
                        </div>
                        <UnitSelector currentUnit={profileUnits[k]} onSelect={(u) => setProfileUnits(prev => ({...prev, [k]: u}))} />
                    </div>
                ))}
                <button type="submit" disabled={savingSettings} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black shadow-xl">
                    {savingSettings ? <Loader2 className="w-6 h-6 animate-spin mx-auto"/> : 'Save Changes'}
                </button>
            </form>
            
            <button onClick={requestSignOut} className="w-full bg-rose-500/10 text-rose-400 py-4 rounded-2xl font-bold border border-rose-500/20">
                Sign Out
            </button>
        </div>
    );
};

export default ProfilePage;