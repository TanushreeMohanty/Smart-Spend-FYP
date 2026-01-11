import React, { useState, useEffect, useMemo } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ChevronLeft, Info, CheckCircle2, AlertCircle, FileText, 
  Wallet, ShieldCheck, Scale, Send, ArrowRight, Download, 
  AlertOctagon, BadgeCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Services & Config
import { db, TABS } from '../config/constants';
import { LocalRepository } from '../services/localRepository';
import { TaxForensics } from '../services/taxForensics'; // Ensure you created this service!
import { formatIndianCompact } from '../utils/helpers';

// --- UTILITIES ---
const formatCurrency = (amount) => 
  new Intl.NumberFormat("en-IN", { 
    style: "currency", 
    currency: "INR", 
    maximumFractionDigits: 0 
  }).format(amount);

const calculateOldRegimeTax = (taxableIncome) => {
  if (taxableIncome <= 250000) return 0;
  if (taxableIncome <= 500000) return (taxableIncome - 250000) * 0.05;
  if (taxableIncome <= 1000000) return 12500 + (taxableIncome - 500000) * 0.2;
  return 12500 + 100000 + (taxableIncome - 1000000) * 0.3;
};

const calculateNewRegimeTax = (taxableIncome) => {
  // FY 2024-25 (AY 2025-26)
  if (taxableIncome <= 300000) return 0;
  if (taxableIncome <= 700000) return (taxableIncome - 300000) * 0.05;
  if (taxableIncome <= 1000000) return 20000 + (taxableIncome - 700000) * 0.1;
  if (taxableIncome <= 1200000) return 50000 + (taxableIncome - 1000000) * 0.15;
  if (taxableIncome <= 1500000) return 80000 + (taxableIncome - 1200000) * 0.2;
  return 140000 + (taxableIncome - 1500000) * 0.3;
};

// --- SUB-COMPONENT: AUDIT SHIELD (The Forensic UI) ---
const AuditShield = ({ auditData }) => {
    const isClean = auditData.score > 80;
    
    return (
        <div className={`p-5 rounded-2xl border mb-6 transition-all ${isClean ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isClean ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                        {isClean ? <BadgeCheck className="w-6 h-6 text-emerald-400" /> : <ShieldCheck className="w-6 h-6 text-rose-400" />}
                    </div>
                    <div>
                        <h4 className={`text-sm font-bold ${isClean ? 'text-emerald-100' : 'text-rose-100'}`}>
                            {isClean ? 'Audit Ready' : 'Audit Risks Detected'}
                        </h4>
                        <p className="text-[10px] text-slate-400">Integrity Score</p>
                    </div>
                </div>
                <span className={`text-2xl font-black ${isClean ? 'text-emerald-400' : 'text-rose-400'}`}>{Math.round(auditData.score)}<span className="text-sm opacity-50">/100</span></span>
            </div>
            
            <div className="space-y-3 bg-black/20 p-3 rounded-xl">
                {auditData.incomeGap > 50000 && (
                    <div className="flex gap-2 text-[11px] text-rose-200 items-start">
                        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>Declared income exceeds bank credits by <strong>{formatIndianCompact(auditData.incomeGap)}</strong>. Ensure cash income is accounted for.</span>
                    </div>
                )}
                {auditData.proofGap > 20000 && (
                    <div className="flex gap-2 text-[11px] text-amber-200 items-start">
                        <AlertOctagon className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>Section 80C claims exceed visible bank outflows by <strong>{formatIndianCompact(auditData.proofGap)}</strong>.</span>
                    </div>
                )}
                {auditData.anomalies.map((flag, i) => (
                    <div key={i} className="flex gap-2 text-[11px] text-amber-200 items-start">
                        <AlertOctagon className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{flag.msg}</span>
                    </div>
                ))}
                {isClean && auditData.anomalies.length === 0 && (
                    <p className="text-[11px] text-emerald-200/70 ml-1 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" /> Your bank statement fully supports this declaration.
                    </p>
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: INPUT FIELD ---
const InputField = ({ label, value, onChange, placeholder = "0", maxLimit, icon }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center px-1">
        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {label}
        </label>
        {maxLimit && (
            <span className="text-[10px] text-slate-500 font-mono">
                Max: {formatIndianCompact(maxLimit)}
            </span>
        )}
    </div>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <span className="text-slate-500 font-serif text-lg">₹</span>
      </div>
      <input
        type="number"
        value={value || ""}
        onChange={(e) => {
          let val = parseFloat(e.target.value) || 0;
          if (maxLimit && val > maxLimit) val = maxLimit;
          onChange(val);
        }}
        placeholder={placeholder}
        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-4 pl-10 pr-10 text-white placeholder-slate-600 focus:border-blue-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all font-mono shadow-inner"
      />
      {icon && (
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-600 group-focus-within:text-blue-400 transition-colors">
            {icon}
        </div>
      )}
    </div>
  </div>
);

// --- SUB-COMPONENT: STEPPER ICON ---
const StepIcon = ({ step, current, icon: Icon, label }) => {
    const isActive = current === step;
    const isDone = current > step;
    return (
        <div className="flex flex-col items-center gap-3 relative z-10 group cursor-default">
            <div 
                className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border
                    ${isActive 
                        ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-110' 
                        : isDone 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-white/5 border-white/10 text-slate-600'
                    }
                `}
            >
                {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-blue-400' : 'text-slate-600'}`}>
                {label}
            </span>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function ITRPage({ user, transactions = [], setActiveTab, showToast }) {
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [taxRegime, setTaxRegime] = useState("new");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle");

  const [income, setIncome] = useState({ salary: 0, interestIncome: 0, otherIncome: 0 });
  const [deductions, setDeductions] = useState({ section80C: 0, section80D: 0, hra: 0, section80E: 0, section80G: 0 });
  
  // 1. Auto-Fill from Bank Data
  useEffect(() => {
    if (transactions.length > 0 && income.salary === 0) {
        const salary = transactions.filter(t => t.category === 'salary' && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const interest = transactions.filter(t => t.description.toLowerCase().includes('interest') && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        
        if (salary > 0) {
            setIncome(prev => ({ ...prev, salary, interestIncome: interest }));
            showToast("Income auto-detected from statement", "success");
        }
    }
  }, [transactions]);

  // 2. Load Draft
  useEffect(() => {
      const load = async () => {
          const draft = await LocalRepository.getITRDraft(user?.uid);
          if (draft) {
              setIncome(draft.income);
              setDeductions(draft.deductions);
          }
      };
      if (user) load();
  }, [user]);

  // 3. Auto-Save Debounce
  useEffect(() => {
      const timer = setTimeout(async () => {
          if (user && !submissionSuccess) {
              setAutoSaveStatus("saving");
              await LocalRepository.saveITRDraft(user.uid, { income, deductions });
              setTimeout(() => setAutoSaveStatus("saved"), 800);
          }
      }, 1500);
      return () => clearTimeout(timer);
  }, [income, deductions, user, submissionSuccess]);

  // 4. ADVANCED FORENSIC TAX LOGIC (The "Smart Audit")
  const auditResult = useMemo(() => {
    const grossIncome = Object.values(income).reduce((a, b) => a + b, 0);
    const stdDed = 75000; // FY 24-25 Standard Deduction

    // A. Estimate Basic Components
    // Heuristic: Basic Salary is typically ~40% of Gross CTC
    const basicSalary = grossIncome * 0.40; 
    const hraReceived = grossIncome * 0.20; 

    // B. Calculate Accurate HRA (Rule based)
    const hraExemption = TaxForensics.calculateHRAExemption(
        basicSalary, 
        hraReceived, 
        parseFloat(deductions.hra || 0) // Input treated as Rent Paid
    );

    // C. Forensic Audit Checks
    const incomeAudit = TaxForensics.auditIncome(transactions, { monthlyIncome: grossIncome / 12 });
    const investAudit = TaxForensics.verifyInvestments(transactions, { ...deductions, grossSalary: grossIncome });
    const anomalies = TaxForensics.detectAnomalies(transactions);

    // D. Calculate Taxable Income
    const totalDeductionsOld = 
        Math.min(deductions.section80C, 150000) + 
        Math.min(deductions.section80D, 75000) + 
        hraExemption + // Uses calculated exemption, not raw rent paid
        stdDed;

    const taxableOld = Math.max(0, grossIncome - totalDeductionsOld);
    const taxableNew = Math.max(0, grossIncome - stdDed);

    const taxOld = calculateOldRegimeTax(taxableOld) * 1.04;
    const taxNew = calculateNewRegimeTax(taxableNew) * 1.04;
    
    // Rebate 87A Logic
    const finalTaxOld = taxableOld <= 500000 ? 0 : taxOld;
    const finalTaxNew = taxableNew <= 700000 ? 0 : taxNew;

    return { 
        grossIncome, 
        totalDeductions: taxRegime === 'old' ? totalDeductionsOld : stdDed,
        taxableIncome: taxRegime === 'old' ? taxableOld : taxableNew,
        tax: taxRegime === 'old' ? finalTaxOld : finalTaxNew,
        audit: {
            score: Math.min(incomeAudit.integrityScore, investAudit.isFraudulent ? 40 : 100),
            incomeGap: incomeAudit.gap,
            proofGap: investAudit.gap,
            anomalies: anomalies.flags
        }
    };
  }, [income, deductions, taxRegime, transactions]);

  // Submit Handler
  const handleFileITR = async () => {
      setIsSubmitting(true);
      try {
          const itrData = {
              userId: user.uid,
              fy: '2024-25',
              filedAt: serverTimestamp(),
              income,
              deductions,
              finalTax: auditResult.tax,
              regime: taxRegime,
              status: 'filed',
              auditScore: auditResult.audit.score // Saving the integrity score
          };
          await setDoc(doc(db, 'artifacts', user.uid, 'itr_returns', 'AY_2025_26'), itrData);
          setSubmissionSuccess(true);
          showToast("ITR Filed Successfully!", "success");
      } catch (e) {
          console.error(e);
          showToast("Filing failed. Please check connection.", "error");
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- RENDER SUCCESS VIEW ---
  if (submissionSuccess) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Filing Complete!</h2>
              <p className="text-slate-400 text-sm mb-8">Your return for AY 2025-26 has been secured.</p>
              
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl w-full max-w-md backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                  <div className="flex justify-between items-center mb-6">
                      <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Tax Liability</span>
                      <span className="text-2xl font-bold text-white">{formatCurrency(auditResult.tax)}</span>
                  </div>
                  <div className="space-y-3">
                      <div className="flex justify-between text-sm"><span className="text-slate-400">Gross Income</span><span className="text-slate-200">{formatCurrency(auditResult.grossIncome)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-400">Total Deductions</span><span className="text-emerald-400">-{formatCurrency(auditResult.totalDeductions)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-400">Regime</span><span className="text-slate-200 uppercase">{taxRegime}</span></div>
                  </div>
              </div>

              <div className="flex gap-4 mt-8">
                  <button onClick={() => setActiveTab(TABS.HOME)} className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm font-bold transition-colors">
                      Return Home
                  </button>
                  <button className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-colors flex items-center gap-2">
                      <Download className="w-4 h-4" /> Download Ack
                  </button>
              </div>
          </div>
      );
  }

  // --- RENDER WIZARD ---
  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <button onClick={() => setActiveTab(TABS.HOME)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
                <h2 className="text-xl font-bold text-white tracking-tight">ITR Assistant</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AY 2025-26</p>
                    <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${autoSaveStatus === 'saving' ? 'text-blue-400' : 'text-emerald-500'}`}>
                        {autoSaveStatus === 'saving' ? 'Saving...' : 'Cloud Synced'}
                    </p>
                </div>
            </div>
            <div className="w-10" />
        </div>

        {/* Stepper */}
        <div className="relative flex justify-between px-6 mb-12">
            <div className="absolute top-6 left-10 right-10 h-0.5 bg-gradient-to-r from-blue-500/20 via-white/10 to-blue-500/20 -z-0" />
            <StepIcon step={1} current={currentStep} icon={Wallet} label="Income" />
            <StepIcon step={2} current={currentStep} icon={ShieldCheck} label="Deductions" />
            <StepIcon step={3} current={currentStep} icon={Scale} label="Regime" />
            <StepIcon step={4} current={currentStep} icon={FileText} label="Review" />
        </div>

        {/* Dynamic Content Card */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden min-h-[450px] shadow-2xl backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full"></div>
            
            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* STEP 1: INCOME */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            {income.salary > 0 && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
                                    <div className="p-2 bg-emerald-500/20 rounded-full"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-200">Auto-Detected Salary</p>
                                        <p className="text-[10px] text-emerald-500/70">Prefilled from your bank credits.</p>
                                    </div>
                                </div>
                            )}
                            <InputField label="Gross Salary" value={income.salary} onChange={v => setIncome({...income, salary: v})} />
                            <InputField label="Interest Income" value={income.interestIncome} onChange={v => setIncome({...income, interestIncome: v})} />
                            <InputField label="Other Sources" value={income.otherIncome} onChange={v => setIncome({...income, otherIncome: v})} />
                        </div>
                    )}

                    {/* STEP 2: DEDUCTIONS */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex gap-3">
                                <Info className="w-5 h-5 text-blue-400 shrink-0" />
                                <p className="text-xs text-blue-200 leading-relaxed">Standard Deduction of <span className="font-bold text-white">₹75,000</span> is automatically applied to both regimes.</p>
                            </div>
                            <InputField label="80C (PPF/ELSS/LIC)" value={deductions.section80C} onChange={v => setDeductions({...deductions, section80C: v})} maxLimit={150000} />
                            <InputField label="80D (Health Ins)" value={deductions.section80D} onChange={v => setDeductions({...deductions, section80D: v})} maxLimit={75000} />
                            <InputField label="HRA Exemption (Rent Paid)" value={deductions.hra} onChange={v => setDeductions({...deductions, hra: v})} />
                        </div>
                    )}

                    {/* STEP 3: REGIME SELECTION */}
                    {currentStep === 3 && (
                        <div className="space-y-4 pt-2">
                            {['new', 'old'].map(r => {
                                const isNew = r === 'new';
                                // Calculate tax preview for card
                                // NOTE: We can't use auditResult here because it depends on taxRegime state.
                                // We simulate the calculation for the specific card.
                                const stdDed = 75000;
                                let taxVal = 0;
                                
                                if (isNew) {
                                    const tNew = Math.max(0, auditResult.grossIncome - stdDed);
                                    taxVal = (tNew <= 700000 ? 0 : calculateNewRegimeTax(tNew)) * 1.04;
                                } else {
                                    const hEx = TaxForensics.calculateHRAExemption(auditResult.grossIncome * 0.40, auditResult.grossIncome * 0.20, parseFloat(deductions.hra||0));
                                    const tOld = Math.max(0, auditResult.grossIncome - (Math.min(deductions.section80C, 150000) + Math.min(deductions.section80D, 75000) + hEx + stdDed));
                                    taxVal = (tOld <= 500000 ? 0 : calculateOldRegimeTax(tOld)) * 1.04;
                                }
                                
                                const isSelected = taxRegime === r;

                                return (
                                    <div key={r} onClick={() => setTaxRegime(r)} 
                                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${isSelected ? 'border-blue-500 bg-blue-600/10 shadow-lg shadow-blue-500/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                                        
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-slate-300 uppercase text-xs tracking-[0.2em]">{r} Regime</span>
                                            {isSelected && <CheckCircle2 className="text-blue-400 w-6 h-6" />}
                                        </div>
                                        
                                        <div className="text-4xl font-bold text-white mb-2 tracking-tighter">
                                            {formatCurrency(taxVal)}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estimated Liability</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* STEP 4: REVIEW (FORENSIC AUDIT) */}
                    {currentStep === 4 && (
                        <div className="space-y-8 pt-4">
                            <div className="text-center">
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Final Tax Payable</p>
                                <h2 className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                                    {formatCurrency(auditResult.tax)}
                                </h2>
                                <div className="inline-block mt-4 px-4 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    {taxRegime} Regime Applied
                                </div>
                            </div>
                            
                            {/* NEW: Audit Shield Component */}
                            <AuditShield auditData={auditResult.audit} />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Income</p>
                                    <p className="text-xl font-bold text-white">{formatCurrency(auditResult.grossIncome)}</p>
                                </div>
                                <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Deductions</p>
                                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(auditResult.totalDeductions)}</p>
                                </div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 text-left">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-200/80 leading-relaxed font-medium">
                                    By clicking submit, you confirm that these details match your Form 16 / AIS. This record will be permanently saved to your profile.
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Bottom Actions */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
                {currentStep > 1 && (
                    <button 
                        onClick={() => setCurrentStep(p => p - 1)} 
                        className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
                    >
                        Back
                    </button>
                )}
                <button 
                    onClick={() => currentStep === 4 ? handleFileITR() : setCurrentStep(p => p + 1)}
                    disabled={isSubmitting}
                    className="flex-[2] py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 group"
                >
                    {isSubmitting ? 'Processing...' : currentStep === 4 ? 'File ITR Now' : 'Continue'}
                    {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </button>
            </div>
        </div>
    </div>
  );
}