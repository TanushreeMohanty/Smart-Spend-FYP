//Database needed
// ITR Wizard Page
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ShieldCheck,
  Scale,
  FileText,
  Send,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Info,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

// --- TOOLTIP DATA & COMPONENT ---
const HELP_TEXTS = {
  salary: "Sum of Basic, HRA, and Special Allowance from Form 16.",
  houseProperty: "Income from self-occupied or let-out property.",
  businessIncome: "Profits/Gains from your profession or business.",
  capitalGains: "Profit from sale of stocks, property, or mutual funds.",
  otherIncome: "Freelance income, gifts, or lottery winnings.",
  interestIncome: "Interest earned from Savings Bank and Fixed Deposits.",
  section80C: "Investments in PPF, ELSS, LIC, or Tuition fees.",
  section80D: "Health insurance premiums for self and family.",
  section80E: "Interest paid on higher education loans.",
  section80G: "Donations made to charitable organizations.",
  hra: "Actual rent paid to your landlord.",
  homeLoanInterest: "Interest component of your home loan EMI.",
  nps80CCD: "Additional contributions to National Pension System.",
  panNumber: "10-digit Alphanumeric Permanent Account Number.",
  aadharNumber: "12-digit Unique Identification Number.",
  bankAccount: "Account number for receiving tax refunds.",
  ifscCode: "11-digit bank branch identification code.",
  email: "Active email for communication with Income Tax Dept.",
  mobile: "Mobile number linked to your Aadhar/PAN.",
};

const InfoTooltip = ({ field }) => (
  <div className="group relative inline-block ml-1.5 align-middle">
    <Info className="w-3 h-3 text-slate-500 cursor-help hover:text-blue-400 transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-[10px] text-slate-200 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl border border-white/10 z-50">
      {HELP_TEXTS[field] || "Enter the amount as per your records."}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
    </div>
  </div>
);

export const ITRCalculator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [taxRegime, setTaxRegime] = useState("new");

  // Income State - UNTOUCHED
  const [income, setIncome] = useState({
    salary: "",
    houseProperty: "",
    businessIncome: "",
    capitalGains: "",
    otherIncome: "",
    interestIncome: "",
  });

  // Deductions State - UNTOUCHED
  const [deductions, setDeductions] = useState({
    section80C: "",
    section80D: "",
    section80E: "",
    section80G: "",
    hra: "",
    homeLoanInterest: "",
    nps80CCD: "",
  });

  // Filing Details State - UNTOUCHED
  const [filingDetails, setFilingDetails] = useState({
    panNumber: "",
    aadharNumber: "",
    bankAccount: "",
    ifscCode: "",
    email: "",
    mobile: "",
  });

  // Logic Functions - UNTOUCHED
  const calculateTotalIncome = () => {
    return Object.values(income).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
  };

  const calculateTotalDeductions = () => {
    if (taxRegime === "new") return 0;
    const deductionLimits = {
      section80C: 150000,
      section80D: 75000,
      section80E: Infinity,
      section80G: Infinity,
      hra: Infinity,
      homeLoanInterest: 200000,
      nps80CCD: 50000,
    };
    return Object.entries(deductions).reduce((sum, [key, val]) => {
      const amount = parseFloat(val) || 0;
      const limit = deductionLimits[key];
      return sum + Math.min(amount, limit);
    }, 0);
  };

  const calculateOldRegimeTax = (taxableIncome) => {
    let tax = 0;
    if (taxableIncome <= 250000) tax = 0;
    else if (taxableIncome <= 500000) tax = (taxableIncome - 250000) * 0.05;
    else if (taxableIncome <= 1000000)
      tax = 12500 + (taxableIncome - 500000) * 0.2;
    else tax = 112500 + (taxableIncome - 1000000) * 0.3;
    if (taxableIncome <= 500000) tax = Math.max(0, tax - 12500);
    return tax * 1.04;
  };

  const calculateNewRegimeTax = (totalIncome) => {
    let tax = 0;
    if (totalIncome <= 300000) tax = 0;
    else if (totalIncome <= 600000) tax = (totalIncome - 300000) * 0.05;
    else if (totalIncome <= 900000) tax = 15000 + (totalIncome - 600000) * 0.1;
    else if (totalIncome <= 1200000)
      tax = 45000 + (totalIncome - 900000) * 0.15;
    else if (totalIncome <= 1500000)
      tax = 90000 + (totalIncome - 1200000) * 0.2;
    else tax = 150000 + (totalIncome - 1500000) * 0.3;
    if (totalIncome <= 700000) tax = Math.max(0, tax - 25000);
    return tax * 1.04;
  };

  const getTaxResults = () => {
    const totalIncome = calculateTotalIncome();
    const totalDeductions = calculateTotalDeductions();
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    const oldRegimeTax = calculateOldRegimeTax(taxableIncome);
    const newRegimeTax = calculateNewRegimeTax(totalIncome);
    return {
      totalIncome,
      totalDeductions,
      taxableIncome,
      oldRegimeTax,
      newRegimeTax,
      recommendedRegime: oldRegimeTax < newRegimeTax ? "old" : "new",
      savingsWithRecommended: Math.abs(oldRegimeTax - newRegimeTax),
    };
  };

  const handleInputChange = (category, field, value) => {
    if (category === "income") setIncome({ ...income, [field]: value });
    else if (category === "deductions")
      setDeductions({ ...deductions, [field]: value });
    else if (category === "filing")
      setFilingDetails({ ...filingDetails, [field]: value });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const steps = [
    { id: 1, label: "Income", icon: <Wallet size={16} /> },
    { id: 2, label: "Deductions", icon: <ShieldCheck size={16} /> },
    { id: 3, label: "Regime", icon: <Scale size={16} /> },
    { id: 4, label: "Summary", icon: <FileText size={16} /> },
    { id: 5, label: "File", icon: <Send size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-transparent text-slate-200 pb-20 overflow-x-hidden">
      <div className="max-w-2xl mx-auto space-y-8 px-2">
        {/* Modern Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-white/5 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-400 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
              <FileText className="text-slate-900 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                ITR Wizard
              </h1>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">
                AY 2025-26 • Secure
              </p>
            </div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">
              Live Audit
            </span>
          </div>
        </motion.div>

        {/* Liquid Stepper */}
        <div className="flex justify-between items-center relative px-4">
          <div className="absolute h-[2px] bg-white/5 left-8 right-8 top-5 -z-10" />
          {steps.map((s) => (
            <motion.div
              key={s.id}
              onClick={() => setCurrentStep(s.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <motion.div
                animate={{
                  scale: currentStep === s.id ? 1.2 : 1,
                  backgroundColor:
                    currentStep >= s.id ? "#2563eb" : "rgba(255,255,255,0.05)",
                }}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-xl ${
                  currentStep >= s.id
                    ? "text-white shadow-blue-900/40"
                    : "text-slate-600 border border-white/5"
                } group-hover:opacity-80`}
              >
                {currentStep > s.id ? <CheckCircle2 size={18} /> : s.icon}
              </motion.div>
              <span
                className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                  currentStep === s.id ? "text-blue-400" : "text-slate-600"
                } group-hover:text-blue-300`}
              >
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Content Container */}
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden min-h-[450px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-blue-400" />
                    <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                      Income Declaration
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Object.keys(income).map((key) => (
                      <div key={key} className="group transition-all">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 ml-1 group-focus-within:text-blue-400 transition-colors">
                          {key.replace(/([A-Z])/g, " $1")}{" "}
                          <InfoTooltip field={key} />
                        </p>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium italic">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={income[key]}
                            onChange={(e) =>
                              handleInputChange("income", key, e.target.value)
                            }
                            className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white focus:border-blue-500/50 focus:bg-white/5 outline-none transition-all shadow-inner"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl flex gap-4 items-start shadow-lg">
                    <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-200/80 leading-relaxed font-medium">
                      Note: These deductions are only valid for the Old Tax
                      Regime.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Object.keys(deductions).map((key) => (
                      <div key={key} className="space-y-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider ml-1">
                          {key.replace(/([A-Z])/g, " $1")}{" "}
                          <InfoTooltip field={key} />
                        </p>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={deductions[key]}
                            onChange={(e) =>
                              handleInputChange(
                                "deductions",
                                key,
                                e.target.value
                              )
                            }
                            className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white focus:border-blue-500/50 focus:bg-white/5 outline-none transition-all shadow-inner disabled:opacity-30"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="mb-6 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-2">
                      Comparison Engine
                    </p>
                    <h2 className="text-xl font-bold text-white">
                      Select Your Regime
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {["new", "old"].map((r) => {
                      const results = getTaxResults();
                      const isSelected = taxRegime === r;
                      const isRecommended = results.recommendedRegime === r;
                      return (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          key={r}
                          onClick={() => setTaxRegime(r)}
                          className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group ${
                            isSelected
                              ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                              : "border-white/5 bg-white/5 hover:border-white/20"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-black text-white uppercase text-[10px] tracking-[0.2em]">
                              {r} Tax Regime
                            </span>
                            {isSelected && (
                              <CheckCircle2
                                className="text-blue-400"
                                size={24}
                              />
                            )}
                          </div>
                          <div className="text-3xl font-bold text-white tracking-tighter">
                            {formatCurrency(
                              r === "old"
                                ? results.oldRegimeTax
                                : results.newRegimeTax
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                            Payable Tax Liability
                          </p>
                          {isRecommended && (
                            <div className="absolute top-0 right-0 bg-emerald-500 text-slate-900 text-[8px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-[0.1em]">
                              Recommended Saving
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <p className="text-blue-100 text-[10px] uppercase font-black tracking-[0.3em] mb-3 opacity-80">
                      Final Calculated Due
                    </p>
                    <motion.h2
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="text-5xl font-black text-white tracking-tighter mb-4"
                    >
                      {formatCurrency(
                        taxRegime === "old"
                          ? getTaxResults().oldRegimeTax
                          : getTaxResults().newRegimeTax
                      )}
                    </motion.h2>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-black/20 rounded-full border border-white/10">
                      <Scale size={12} className="text-blue-200" />
                      <span className="text-[9px] font-bold text-white uppercase tracking-widest">
                        {taxRegime} Regime Applied
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-inner">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">
                        Gross Income
                      </p>
                      <p className="text-xl font-bold text-white tracking-tight">
                        {formatCurrency(getTaxResults().totalIncome)}
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-inner">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">
                        Total Savings
                      </p>
                      <p className="text-xl font-bold text-emerald-400 tracking-tight">
                        {formatCurrency(getTaxResults().totalDeductions)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Object.keys(filingDetails).map((key) => (
                      <div key={key} className="space-y-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">
                          {key.replace(/([A-Z])/g, " $1")}{" "}
                          <InfoTooltip field={key} />
                        </p>
                        <input
                          type="text"
                          value={filingDetails[key]}
                          onChange={(e) =>
                            handleInputChange("filing", key, e.target.value)
                          }
                          className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-6 text-white focus:border-blue-500 outline-none uppercase placeholder:lowercase"
                          placeholder={`Enter your ${key.replace(
                            /([A-Z])/g,
                            " $1"
                          )}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-600/5 border border-blue-500/10 p-5 rounded-[2rem] flex gap-4 mt-6">
                    <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                    <p className="text-[10px] text-slate-400 leading-relaxed italic font-medium">
                      I hereby certify that the information provided is true and
                      accurate according to my bank statements and 26AS records.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Liquid Navigation */}
          <div className="flex gap-4 mt-12">
            {currentStep > 1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 bg-white/5 border border-white/10 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center transition-colors hover:bg-white/10"
              >
                <ChevronLeft size={20} className="mr-2" /> Previous
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                currentStep < 5
                  ? setCurrentStep(currentStep + 1)
                  : alert("Submission Successful!")
              }
              className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl shadow-blue-600/30 transition-all"
            >
              {currentStep === 4
                ? "Review & File"
                : currentStep === 5
                ? "Submit Return"
                : "Continue"}
              <ChevronRight size={18} />
            </motion.button>
          </div>
        </div>
        <p className="text-center text-[9px] text-slate-700 font-black uppercase tracking-[0.4em] py-4">
          Ministry Approved Simulation • Secure Protocol
        </p>
      </div>
    </div>
  );
};

export default ITRCalculator;
