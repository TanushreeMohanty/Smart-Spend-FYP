import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, IndianRupee, Briefcase, User, Wallet } from 'lucide-react';

const WelcomeWizard = ({ isOpen, onComplete }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
        monthlyIncome: '',
        isBusiness: false,
        budgetLimit: ''
    });

    if (!isOpen) return null;

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else onComplete(data);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            {/* Background Blurs */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full"></div>

            <div className="w-full max-w-md relative z-10">
                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-500' : 'bg-white/10'}`}></div>
                    ))}
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
                    
                    {/* STEP 1: INCOME */}
                    {step === 1 && (
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 text-emerald-400">
                                <IndianRupee className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Money In 💸</h2>
                            <p className="text-slate-400 mb-6">What is your approximate monthly take-home income? This helps us calculate tax & savings.</p>
                            <input 
                                type="number" 
                                autoFocus
                                value={data.monthlyIncome} 
                                onChange={e => setData({...data, monthlyIncome: e.target.value})} 
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-2xl font-bold text-white outline-none focus:border-emerald-500 transition-colors"
                                placeholder="e.g. 80000"
                            />
                        </div>
                    )}

                    {/* STEP 2: PROFESSION */}
                    {step === 2 && (
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Identity 🆔</h2>
                            <p className="text-slate-400 mb-6">How do you primarily earn? This customizes your Tax Audit.</p>
                            
                            <div className="space-y-3">
                                <button 
                                    onClick={() => setData({...data, isBusiness: false})}
                                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${!data.isBusiness ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5" />
                                        <div className="text-left">
                                            <p className="font-bold text-white">Salaried Employee</p>
                                            <p className="text-xs text-white/60">I get a paycheck & Form 16</p>
                                        </div>
                                    </div>
                                    {!data.isBusiness && <CheckCircle2 className="w-5 h-5 text-white" />}
                                </button>

                                <button 
                                    onClick={() => setData({...data, isBusiness: true})}
                                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${data.isBusiness ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Briefcase className="w-5 h-5" />
                                        <div className="text-left">
                                            <p className="font-bold text-white">Freelancer / Business</p>
                                            <p className="text-xs text-white/60">I raise invoices or run a shop</p>
                                        </div>
                                    </div>
                                    {data.isBusiness && <CheckCircle2 className="w-5 h-5 text-white" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: BUDGET */}
                    {step === 3 && (
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 text-purple-400">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Safety Limit 🛡️</h2>
                            <p className="text-slate-400 mb-6">Set a monthly spending limit. We'll warn you if you cross 80% of this.</p>
                            <input 
                                type="number" 
                                autoFocus
                                value={data.budgetLimit} 
                                onChange={e => setData({...data, budgetLimit: e.target.value})} 
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-2xl font-bold text-white outline-none focus:border-purple-500 transition-colors"
                                placeholder="e.g. 40000"
                            />
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                        <button 
                            onClick={handleNext}
                            disabled={step === 1 && !data.monthlyIncome || step === 3 && !data.budgetLimit}
                            className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {step === 3 ? "Start Exploring" : "Next"} <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeWizard;