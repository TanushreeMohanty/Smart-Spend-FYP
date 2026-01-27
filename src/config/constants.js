import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { 
  Briefcase, TrendingUp, Home as HomeIcon, Zap, Coffee, ShoppingBag, 
  Car, Gift, Smartphone, Activity 
} from 'lucide-react';

// --- VERSION & METADATA ---
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";
export const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- FIREBASE INIT ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- DOMAIN CONSTANTS ---
export const CATEGORIES = [
  { id: 'salary', name: 'Salary', icon: Briefcase, color: 'bg-emerald-500/20 text-emerald-300', keywords: ['payroll', 'salary', 'deposit', 'transfer', 'neft', 'imps', 'credit interest'] },
  { id: 'investment', name: 'Invest', icon: TrendingUp, color: 'bg-teal-500/20 text-teal-300', keywords: ['zerodha', 'groww', 'upstox', 'vanguard', 'fidelity', 'crypto', 'coinbase', 'stock', 'sip', 'mutual', 'ppf', 'nps', 'elss', 'redeem'] },
  { id: 'housing', name: 'Housing', icon: HomeIcon, color: 'bg-indigo-500/20 text-indigo-300', keywords: ['rent', 'mortgage', 'repair', 'home', 'depot', 'furniture', 'urban company'] },
  { id: 'utilities', name: 'Utilities', icon: Zap, color: 'bg-yellow-500/20 text-yellow-300', keywords: ['bill', 'electricity', 'mobile', 'internet', 'broadband', 'insurance', 'premium', 'lic'] },
  { id: 'food', name: 'Food', icon: Coffee, color: 'bg-orange-500/20 text-orange-300', keywords: ['cafe', 'coffee', 'restaurant', 'mcdonalds', 'burger', 'pizza', 'starbucks', 'grocery', 'market', 'food', 'zomato', 'swiggy'] },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: 'bg-sky-500/20 text-sky-300', keywords: ['amazon', 'flipkart', 'myntra', 'store', 'mall', 'clothing', 'shoe', 'nike', 'zara', 'shop', 'decathlon', 'ajio'] },
  { id: 'transport', name: 'Transport', icon: Car, color: 'bg-blue-500/20 text-blue-300', keywords: ['uber', 'ola', 'rapido', 'lyft', 'taxi', 'gas', 'fuel', 'shell', 'parking', 'train', 'bus', 'metro', 'petrol', 'hpcl', 'bpcl', 'irctc'] },
  { id: 'entertainment', name: 'Fun', icon: Gift, color: 'bg-pink-500/20 text-pink-300', keywords: ['netflix', 'spotify', 'cinema', 'movie', 'game', 'steam', 'playstation', 'ticket', 'bookmyshow', 'pvr', 'inox', 'hotstar'] },
  { id: 'tech', name: 'Tech', icon: Smartphone, color: 'bg-cyan-500/20 text-cyan-300', keywords: ['apple', 'google', 'software', 'hardware', 'electronics', 'croma', 'reliance digital'] },
  { id: 'other', name: 'Other', icon: Activity, color: 'bg-slate-500/20 text-slate-300', keywords: [] },
];

export const TABS = { 
  HOME: 'home', 
  HISTORY: 'history', 
  ADD: 'add', 
  AUDIT: 'audit', 
  STATS: 'stats', 
  WEALTH: 'wealth', 
  PROFILE: 'profile',
  ITR: 'itr' 
};

export const UNITS = [ 
  { label: '₹', value: 1 }, 
  { label: 'K', value: 1000 }, 
  { label: 'L', value: 100000 }, 
  { label: 'Cr', value: 10000000 } 
];

export const TAX_CONSTANTS = {
  NEW_REGIME: {
    SLABS: [
      { limit: 400000, rate: 0.00 },   // 0 - 4L
      { limit: 800000, rate: 0.05 },   // 4L - 8L
      { limit: 1200000, rate: 0.10 },  // 8L - 12L
      { limit: 1600000, rate: 0.15 },  // 12L - 16L
      { limit: 2000000, rate: 0.20 },  // 16L - 20L
      { limit: 2400000, rate: 0.25 },  // 20L - 24L
      { limit: null, rate: 0.30 }      // Above 24L
    ],
    REBATE_LIMIT: 1200000, // Section 87A rebate up to 12L taxable income
    REBATE_MAX: 60000,     // Max rebate amount for FY 25-26
    STANDARD_DEDUCTION: 75000,
    CESS: 0.04
  },
  OLD_REGIME: {
    SLABS: [
      { limit: 250000, rate: 0.00 },
      { limit: 500000, rate: 0.05 },
      { limit: 1000000, rate: 0.20 },
      { limit: null, rate: 0.30 }
    ],
    REBATE_LIMIT: 500000,
    REBATE_MAX: 12500,
    STANDARD_DEDUCTION: 50000,
    CESS: 0.04
  },
  LIMITS: {
    SECTION_80C: 150000,
    SECTION_80D_SELF: 25000,
    SECTION_80D_PARENTS: 50000,
    SEC_80CCD_1B: 50000,
    SECTION_80TTA: 10000,
    PRESUMPTIVE_44ADA: 0.50,
    PRESUMPTIVE_TURNOVER_LIMIT: 30000000 // Updated to 3Cr for FY 25-26
  }
};