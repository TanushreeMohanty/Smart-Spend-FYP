import { TAX_CONSTANTS } from '../config/constants';
import { normalizeDate } from '../utils/helpers';

export const TaxService = {
  /**
   * Main Tax Calculation Engine
   * Purpose: Takes raw financial data and produces a comprehensive Audit Report (Old vs New Regime).
   * * @param {Array} transactions - List of income/expense transactions.
   * @param {Object} profile - User's manual tax inputs (Rent paid, Loans, Insurance).
   * @param {Array} wealthItems - Assets/Liabilities to detect Home Loans etc.
   * @param {Object} settings - Global settings.
   */
  calculate: (transactions, profile, wealthItems, settings) => {
    
    // =====================================================
    // 1. DYNAMIC FISCAL YEAR (FY) DETECTION
    // =====================================================
    // Problem: If we hardcode dates, the app breaks next year.
    // Solution: We find the latest transaction date and infer the current FY.
    let fyStartYear;
    if (transactions.length > 0) {
        // Sort transactions to find the most recent one
        // Note: Using normalizeDate ensures we handle Firestore Timestamps correctly
        const sorted = [...transactions].sort((a, b) => normalizeDate(b.date) - normalizeDate(a.date));
        const latestDate = normalizeDate(sorted[0].date);
        
        // If latest tx is in Jan/Feb/Mar 2026, FY started in 2025.
        // If latest tx is in Apr 2025, FY started in 2025.
        fyStartYear = latestDate.getMonth() >= 3 ? latestDate.getFullYear() : latestDate.getFullYear() - 1;
    } else {
        // Fallback to current date if no data exists
        const now = new Date();
        fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    }

    const start = new Date(fyStartYear, 3, 1); // April 1st
    const end = new Date(fyStartYear + 1, 2, 31); // March 31st

    // =====================================================
    // 2. INITIALIZE ACCUMULATORS
    // =====================================================
    let salaryIncome = 0;
    let housePropertyIncome = 0;
    let businessIncome = 0;
    let capitalGainsReceipts = 0;
    let otherSourcesIncome = 0;
    let savingsInterest = 0;

    // These will be filled by scanning transaction descriptions (Auto-Discovery)
    let detected80C = 0;
    let detected80D = 0;
    
    // =====================================================
    // 3. PROCESS TRANSACTIONS (THE SCANNER)
    // =====================================================
    transactions.forEach(t => {
      const d = normalizeDate(t.date);
      
      // Filter: Strictly ignore transactions outside this Financial Year
      if (d >= start && d <= end) {
        const val = parseFloat(t.amount);
        const desc = t.description.toLowerCase();
        
        if (t.type === 'income') {
          // --- INCOME CLASSIFICATION ---
          if (desc.includes('salary') || desc.includes('payroll') || t.category === 'salary') {
            salaryIncome += val;
          } else if (desc.includes('interest')) {
            otherSourcesIncome += val;
            savingsInterest += val; // Track separately for Section 80TTA
          } else if (desc.includes('dividend')) {
            otherSourcesIncome += val;
          } else if (desc.includes('rent') && val > 5000) { 
            housePropertyIncome += val; 
          } else if (t.category === 'investment' || desc.includes('redeem') || desc.includes('sold')) {
            capitalGainsReceipts += val; 
          } else if (profile.isBusiness) {
            businessIncome += val; // Only if user flagged themselves as "Business/Freelancer"
          } else {
            otherSourcesIncome += val; // Default bucket
          }
        } else {
          // --- EXPENSE DEDUCTION DETECTION ---
          // Scan for keywords like 'LIC', 'PPF', 'Health' to find tax saving expenses
          if (t.category === 'investment' || desc.includes('ppf') || desc.includes('lic') || desc.includes('elss')) {
             detected80C += val;
          }
          if (t.category === 'utilities' && (desc.includes('health') || desc.includes('mediclaim') || desc.includes('insurance'))) {
             detected80D += val;
          }
        }
      }
    });

    // =====================================================
    // 4. DATA MERGING (MANUAL VS AUTO)
    // =====================================================
    // Logic: Manual inputs (from Profile) usually override Auto-detection,
    // except for things that add up (like EPF + Bank Investments).

    // EPF is deducted from Salary (not in bank), so we add it to whatever we found in bank (PPF/ELSS).
    const manualEPF = parseFloat(profile.annualEPF || 0);
    const inv80C = manualEPF + detected80C; 

    // For Health Insurance, take the higher value (User might pay via Credit Card or Salary Deduction)
    const manualHealth = parseFloat(profile.healthInsuranceSelf || 0);
    const inv80D_Self = Math.max(manualHealth, detected80D);
    
    // Standard Manual Fields
    const inv80D_Parents = parseFloat(profile.healthInsuranceParents || 0);
    const invNPS = parseFloat(profile.npsContribution || 0);
    const interest24b = parseFloat(profile.homeLoanInterest || 0);
    const interest80E = parseFloat(profile.educationLoanInterest || 0);
    const rentPaid = parseFloat(profile.annualRent || 0);

    // =====================================================
    // 5. ASSET INTELLIGENCE
    // =====================================================
    // Check 'Wealth' items to flag missing deductions (e.g., User has Home Loan but claims 0 Interest)
    const hasHomeLoan = wealthItems.some(i => i.type === 'liability' && i.name.toLowerCase().includes('home'));
    const hasHouseAsset = wealthItems.some(i => i.type === 'asset' && (i.name.toLowerCase().includes('house')));
    const hasInsurance = wealthItems.some(i => i.type === 'asset' && i.name.toLowerCase().includes('insurance'));
    
    // Compliance Flags
    const missingInterestClaim = hasHomeLoan && interest24b === 0;
    const missingRentIncome = hasHouseAsset && housePropertyIncome === 0; 
    const missing80D = hasInsurance && inv80D_Self === 0;
    const hraNotComputed = rentPaid > 0;
    const capitalGainsUnverified = capitalGainsReceipts > 0;

    // =====================================================
    // 6. GROSS TOTAL INCOME (GTI) CALCULATION
    // =====================================================
    
    // HEAD 1: HOUSE PROPERTY
    // Logic: Net Income = Rent Received - 30% Standard Deduction - Home Loan Interest
    // Rule: Loss from House Property can be set off against Salary up to ₹2 Lakhs.
    let incomeFromHP = (housePropertyIncome * 0.7) - interest24b;
    if (incomeFromHP < -200000) incomeFromHP = -200000; 

    // HEAD 2: BUSINESS
    // Logic: Section 44ADA (Presumptive) assumes 50% of receipts is profit for freelancers.
    let taxableBusinessIncome = businessIncome;
// Section 44ADA limit is 3Cr for FY 2025-26
if (profile.isBusiness && businessIncome <= 30000000) {
  taxableBusinessIncome = businessIncome * 0.50; 
}

    // HEAD 3: SALARY (Standard Deduction)
 // --- BUDGET 2025 UPDATE: Standard Deduction is now DIFFERENT for both regimes ---
const stdDedOld = (salaryIncome > 0) ? 50000 : 0;
const stdDedNew = (salaryIncome > 0) ? 75000 : 0; // Ensure this is 75000

    // TOTAL GTI
const grossTotalIncome = salaryIncome + incomeFromHP + taxableBusinessIncome + otherSourcesIncome;
    // =====================================================
    // 7. DEDUCTIONS (CHAPTER VI-A)
    // =====================================================
    // We apply the legal limits (e.g., 80C is capped at 1.5L)
const used80C = Math.min(inv80C, 150000);
const used80D = Math.min(inv80D_Self, 25000) + Math.min(inv80D_Parents, 50000);
const usedNPS = Math.min(invNPS, 50000); 
const used80TTA = Math.min(savingsInterest, 10000);
const used80E = interest80E; // No limit on 80E

    // Total Deductions for Old Regime
const totalDeductionsOld = stdDedOld + used80C + used80D + usedNPS + used80E + used80TTA;    
    // Total Deductions for New Regime (Only Standard Deduction allowed)
const totalDeductionsNew = stdDedNew; // Standard Deduction only for New Regime

    // =====================================================
    // 8. FINAL TAXABLE INCOME
    // =====================================================
    const taxableOld = Math.max(0, grossTotalIncome - totalDeductionsOld);
    const taxableNew = Math.max(0, grossTotalIncome - totalDeductionsNew); 

    // =====================================================
    // 9. ROBUST TAX CALCULATOR (SLAB ENGINE)
    // =====================================================
    // Generic function to apply any set of Tax Slabs (Old or New)
const calcTax = (income, regimeType) => {
  const config = regimeType === 'new' ? TAX_CONSTANTS.NEW_REGIME : TAX_CONSTANTS.OLD_REGIME;
  
  // Step A: Check for Rebate (Sec 87A)
  // New Regime: Tax-free up to 12L | Old Regime: Tax-free up to 5L
  if (income <= config.REBATE_LIMIT) return 0;
  
  let tax = 0;
  let prevLimit = 0;
  
  // Step B: Slab Calculation
  for (const slab of config.SLABS) {
    if (income <= prevLimit) break;
    
    const currentLimit = slab.limit === null ? Infinity : slab.limit;
    const taxableAtThisSlab = Math.min(income, currentLimit) - prevLimit;
    
    if (taxableAtThisSlab > 0) {
        tax += taxableAtThisSlab * slab.rate;
    }
    prevLimit = currentLimit;
  }

  // Step C: Marginal Relief (Budget 2025 Special)
  // Prevents a sudden tax jump if earning just over 12L in New Regime
  if (regimeType === 'new' && income > 1200000 && income <= 1275000) {
    const excessIncome = income - 1200000;
    tax = Math.min(tax, excessIncome);
  }

  return tax * (1 + config.CESS);
};

// Then call them like this:
const taxOld = calcTax(taxableOld, 'old');
const taxNew = calcTax(taxableNew, 'new');

    // =====================================================
    // 10. GENERATE REPORT & INSIGHTS
    // =====================================================
    
    // Integrity Check: Does Bank Credit match Calculated Income?
    const totalBankCredits = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const incomeMismatch = Math.abs(totalBankCredits - grossTotalIncome) > 50000;
    
    // Pace Calculation: Are we investing enough monthly to hit 80C limit?
    const currentMonth = new Date().getMonth();
    // Logic: Apr(3) -> 1 month elapsed. Mar(2) -> 12 months elapsed.
    const monthsElapsed = currentMonth >= 3 ? currentMonth - 2 : currentMonth + 10;
    const monthlyPace80C = inv80C / Math.max(1, monthsElapsed);

    return {
      taxableOld, // This will be 750,000 (8L - 50k)
    taxableNew, // This will be 925,000 (10L - 75k)
      fiscalYear: `${fyStartYear}-${fyStartYear+1}`,
      mode: 'PLANNING', 
      sources: { salary: salaryIncome, interest: savingsInterest, other: otherSourcesIncome, total: grossTotalIncome },
      heads: {
        salary: salaryIncome,
        houseProperty: incomeFromHP,
        business: taxableBusinessIncome,
        capitalGains: capitalGainsReceipts,
        other: otherSourcesIncome
      },
      deductions: {
      c80: { used: used80C, limit: 150000, pace: monthlyPace80C },
d80: { used: used80D, limit: 75000 },
nps: { used: usedNPS, limit: 50000 },
hln: { used: interest24b, potential: missingInterestClaim },
        edu: { used: used80E, potential: false },
        tta: { used: used80TTA },
        hra: { potential: rentPaid, notComputed: hraNotComputed }
      },
      taxableOld, taxableNew, taxOld, taxNew,
      compliance: { incomeMismatch, totalBankCredits, missingRentIncome, missing80D, missingInterestClaim, capitalGainsUnverified },
      // Opportunity Loss: How much tax COULD have been saved?
missedSavings: (Math.max(0, 150000 - used80C) + Math.max(0, 50000 - usedNPS)) * 0.3
    };
  }
};