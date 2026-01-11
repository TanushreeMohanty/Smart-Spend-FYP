import React, { useMemo } from 'react';
import { CreditCard, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import TransactionItem from '../components/domain/TransactionItem';
import { TABS } from '../config/constants';
import { normalizeDate } from '../utils/helpers';

const HomePage = ({ transactions, setActiveTab, onDelete, settings }) => {
    // Calculate Monthly Metrics
    const metrics = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyData = transactions.filter(t => {
            const d = normalizeDate(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const income = monthlyData.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount), 0);
        const expense = monthlyData.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);
        
        return { income, expense };
    }, [transactions]);

    const budget = parseFloat(settings?.monthlyBudget) || 0;
    const percentage = budget > 0 ? Math.min(100, (metrics.expense / budget) * 100) : 0;
    
    // Determine status color
    let statusColor = 'bg-emerald-500';
    let statusText = 'Good';
    if (percentage > 75) { statusColor = 'bg-amber-500'; statusText = 'Careful'; }
    if (percentage >= 100) { statusColor = 'bg-rose-500'; statusText = 'Over Budget'; }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-8">
            
            {/* 1. Monthly Budget Card (New Feature) */}
            {budget > 0 ? (
                <div className="bg-white/5 border border-white/10 p-5 rounded-[2rem] relative overflow-hidden">
                    <div className="flex justify-between items-end mb-2 relative z-10">
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Monthly Spend</p>
                            <h3 className="text-2xl font-bold text-white">
                                ₹{metrics.expense.toLocaleString()} 
                                <span className="text-sm text-slate-500 font-normal ml-1">/ ₹{budget.toLocaleString()}</span>
                            </h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1 ${
                            percentage >= 100 ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 
                            percentage > 75 ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 
                            'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        }`}>
                            {percentage >= 100 ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            {statusText}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative z-10">
                        <div 
                            className={`h-full ${statusColor} rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]`} 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 text-right relative z-10">{percentage.toFixed(1)}% Used</p>

                    {/* Background decoration */}
                    <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-[40px] opacity-20 ${statusColor}`}></div>
                </div>
            ) : (
                <div className="bg-blue-600/10 border border-blue-600/20 p-5 rounded-[2rem] flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-blue-100">Set a Monthly Budget</h3>
                        <p className="text-[10px] text-blue-200/60 mt-1">Track your spending limits effectively.</p>
                    </div>
                    <button onClick={() => setActiveTab('profile')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg">Set Now</button>
                </div>
            )}

            {/* 2. Recent Activity Header */}
            <div className="flex justify-between items-end mt-4 px-1">
                <h3 className="font-bold text-lg text-white">Recent Activity</h3>
                <button onClick={() => setActiveTab(TABS.HISTORY)} className="text-[10px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-full hover:bg-cyan-500/20 transition-colors">VIEW ALL</button>
            </div>

            {/* 3. Transaction List */}
            {transactions.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/5">
                    <CreditCard className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="font-bold text-white mb-2">No transactions</h3>
                    <p className="text-slate-500 text-xs mb-4">Start by adding your first expense.</p>
                    <button onClick={() => setActiveTab(TABS.ADD)} className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-blue-600/20">Add First</button>
                </div>
            ) : (
                <div className="pb-24 space-y-3">
                    {transactions.slice(0, 5).map(t => <TransactionItem key={t.id} item={t} onDelete={onDelete} />)}
                </div>
            )}
        </div>
    );
};

export default HomePage;