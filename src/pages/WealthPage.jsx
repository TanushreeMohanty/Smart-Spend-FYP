// Section 6 Wealth Page
import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts'; // New Imports
import { db } from '../config/constants';
import { formatIndianCompact } from '../utils/helpers';
import UnitSelector from '../components/domain/UnitSelector';
import WealthItem from '../components/domain/WealthItem';

const WealthPage = ({ wealthItems, user, appId, showToast, triggerConfirm }) => {
    const [wealthName, setWealthName] = useState('');
    const [wealthAmount, setWealthAmount] = useState('');
    const [wealthType, setWealthType] = useState('asset');
    const [wealthUnit, setWealthUnit] = useState(1);

    // --- 1. Calculate Live Net Worth ---
    const totalAssets = wealthItems.filter(i => i.type === 'asset').reduce((acc, i) => acc + parseFloat(i.amount || i.value || 0), 0);
    const totalLiabilities = wealthItems.filter(i => i.type === 'liability').reduce((acc, i) => acc + parseFloat(i.amount || i.value || 0), 0);
    const netWorth = totalAssets - totalLiabilities;

    // --- 2. Mock History Data (Simulating Growth) ---
    // In Phase 2, we will fetch real 'wealthSnapshots' from Firestore
    const historyData = [
        { month: 'Sep', value: netWorth * 0.85 },
        { month: 'Oct', value: netWorth * 0.90 },
        { month: 'Nov', value: netWorth * 0.92 },
        { month: 'Dec', value: netWorth * 0.98 },
        { month: 'Jan', value: netWorth } // Current Value
    ];

    const executeAddWealth = async () => {
        const actualAmount = parseFloat(wealthAmount) * wealthUnit;
        try {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'wealth'), { 
                name: wealthName, 
                amount: actualAmount, 
                type: wealthType, 
                date: serverTimestamp() 
            });
            setWealthName(''); 
            setWealthAmount(''); 
            setWealthUnit(1); 
            setWealthType('asset');
            showToast("Asset/Liability added", "success");
        } catch(e) { 
            console.error(e); 
            showToast("Failed to save", "error"); 
        }
    };

    const requestAddWealth = (e) => {
        e.preventDefault();
        if (!wealthName || !wealthAmount || !user) return;
        triggerConfirm("Confirm adding this asset/liability?", executeAddWealth);
    };

    const executeDeleteWealth = async(id) => { 
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'wealth', id)); 
            showToast("Item removed", "success");
        } catch(e) { 
            showToast("Failed to remove", "error"); 
        }
    };

    const requestDeleteWealth = (id) => triggerConfirm('Remove this item?', () => executeDeleteWealth(id));

    return (
        <div className="space-y-6 pb-28 animate-in slide-in-from-bottom-8">
            
            {/* NEW: Net Worth Graph Card */}
            <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-white/10 p-6 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10 mb-4 flex justify-between items-end">
                    <div>
                        <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider mb-1">Total Net Worth</p>
                        {/* FIXED CURRENCY SYMBOL */}
                        <h3 className="text-3xl font-bold text-white">{formatIndianCompact(netWorth)}</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-emerald-200/60 font-bold">vs last month</p>
                        <p className="text-sm font-bold text-emerald-300">+2.4%</p>
                    </div>
                </div>

                <div className="h-32 w-full -ml-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historyData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff', fontSize: '12px' }}
                                formatter={(value) => [`₹${formatIndianCompact(value)}`, 'Net Worth']}
                                labelStyle={{ display: 'none' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Add New Item Form */}
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10">
                <h3 className="text-lg font-bold text-white mb-6">Add Asset / Liability</h3>
                <form onSubmit={requestAddWealth} className="space-y-4">
                    <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
                        <button type="button" onClick={() => setWealthType('asset')} className={`flex-1 py-3 rounded-lg text-xs font-bold ${wealthType === 'asset' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500'}`}>Asset</button>
                        <button type="button" onClick={() => setWealthType('liability')} className={`flex-1 py-3 rounded-lg text-xs font-bold ${wealthType === 'liability' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-500'}`}>Liability</button>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <input type="number" step="0.01" value={wealthAmount} onChange={(e) => setWealthAmount(e.target.value)} className="flex-1 px-4 py-4 bg-black/20 border border-white/10 rounded-2xl text-white outline-none" placeholder="Amount (e.g. 1.5)" required />
                            <UnitSelector currentUnit={wealthUnit} onSelect={setWealthUnit} />
                        </div>
                    </div>
                    <input type="text" value={wealthName} onChange={(e) => setWealthName(e.target.value)} className="w-full px-4 py-4 bg-black/20 border border-white/10 rounded-2xl text-white outline-none" placeholder="Name (e.g. House, Car Loan)" required />
                    <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg">Add Item</button>
                </form>
            </div>
            
            {/* List */}
            <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Your Portfolio</h3>
                {wealthItems.length === 0 ? <p className="text-center text-slate-500 text-sm">No assets or liabilities added.</p> : (
                    <div className="space-y-3">{wealthItems.map(item => <WealthItem key={item.id} item={item} onDelete={() => requestDeleteWealth(item.id)} />)}</div>
                )}
            </div>
        </div>
    );
};

export default WealthPage;