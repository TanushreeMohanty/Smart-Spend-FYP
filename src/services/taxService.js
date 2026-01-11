import { TAX_CONSTANTS } from '../config/constants';
import { normalizeDate } from '../utils/helpers';

export const TaxService = {
  calculate: (transactions, profile, wealthItems, settings) => {
    
    // 1. DYNAMIC FY DETECTION (Fixes the date bug)
    // We look at the latest transaction date to decide the Fiscal Year
    let fyStartYear;
    if (transactions.length > 0) {
        // Sort to find latest date
        const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestDate = new Date(sorted[0].date);
        fyStartYear = latestDate.getMonth() >= 3 ? latestDate.getFullYear() : latestDate.getFullYear() - 1;
    } else {
        const now = new Date();
        fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    }

    const start = new Date(fyStartYear, 3, 1); // April 1st
    const end = new Date(fyStartYear + 1, 2, 31); // March 31st

    // 2. Initialize Variables
    let salaryIncome = 0;
    let housePropertyIncome = 0;
    let businessIncome = 0;
    let capitalGainsReceipts = 0;
    let otherSourcesIncome = 0;
    let savingsInterest = 0;

    // Detected via Parser
    let detected80C = 0;
    let detected80D = 0;
    
    // 3. Process Transactions
    transactions.forEach(t => {
      const d = normalizeDate(t.date);
      
      // Strict FY Filtering
      if (d >= start && d <= end) {
        const val = parseFloat(t.amount);
        const desc = t.description.toLowerCase();
        
        if (t.type === 'income') {
          if (desc.includes('salary') || desc.includes('payroll') || t.category === 'salary') {
            salaryIncome += val;
          } else if (desc.includes('interest')) {
            otherSourcesIncome += val;
            savingsInterest += val; 
          } else if (desc.includes('dividend')) {
            otherSourcesIncome += val;
          } else if (desc.includes('rent') && val > 5000) { 
            housePropertyIncome += val; 
          } else if (t.category === 'investment' || desc.includes('redeem') || desc.includes('sold')) {
            capitalGainsReceipts += val; 
          } else if (profile.isBusiness) {
            businessIncome += val;
          } else {
            otherSourcesIncome += val;
          }
        } else {
          // Expense Deductions (Auto-Detection)
          if (t.category === 'investment' || desc.includes('ppf') || desc.includes('lic') || desc.includes('elss')) {
             detected80C += val;
          }
          if (t.category === 'utilities' && (desc.includes('health') || desc.includes('mediclaim') || desc.includes('insurance'))) {
             detected80D += val;
          }
        }
      }
    });

    // 4. Merge Profile & Detected (PREVENT DOUBLE COUNTING)
    // Strategy: We take the Profile value (Manual) if it exists, otherwise use Detected (Auto)
    // Exception: EPF is usually salary deducted (not in bank), so we ADD EPF to detected Bank Investments (PPF/ELSS).
    const manualEPF = parseFloat(profile.annualEPF || 0);
    const inv80C = manualEPF + detected80C; 

    // For Health Insurance, user might pay via bank OR employer. We take the higher of the two to be safe/smart.
    const manualHealth = parseFloat(profile.healthInsuranceSelf || 0);
    const inv80D_Self = Math.max(manualHealth, detected80D);
    
    const inv80D_Parents = parseFloat(profile.healthInsuranceParents || 0);
    const invNPS = parseFloat(profile.npsContribution || 0);
    const interest24b = parseFloat(profile.homeLoanInterest || 0);
    const interest80E = parseFloat(profile.educationLoanInterest || 0);
    const rentPaid = parseFloat(profile.annualRent || 0);

    // 5. Asset Heuristics
    const hasHomeLoan = wealthItems.some(i => i.type === 'liability' && i.name.toLowerCase().includes('home'));
    const hasHouseAsset = wealthItems.some(i => i.type === 'asset' && (i.name.toLowerCase().includes('house')));
    const hasInsurance = wealthItems.some(i => i.type === 'asset' && i.name.toLowerCase().includes('insurance'));
    
    // Flags
    const missingInterestClaim = hasHomeLoan && interest24b === 0;
    const missingRentIncome = hasHouseAsset && housePropertyIncome === 0; 
    const missing80D = hasInsurance && inv80D_Self === 0;
    const hraNotComputed = rentPaid > 0;
    const capitalGainsUnverified = capitalGainsReceipts > 0;

    // 6. Gross Total Income (GTI)
    // Section 24b: Loss from House property capped at 2 Lakhs
    let incomeFromHP = (housePropertyIncome * 0.7) - interest24b;
    if (incomeFromHP < -200000) incomeFromHP = -200000; 

    let taxableBusinessIncome = businessIncome;
    if (profile.isBusiness && businessIncome <= TAX_CONSTANTS.LIMITS.PRESUMPTIVE_TURNOVER_LIMIT) {
      taxableBusinessIncome = businessIncome * TAX_CONSTANTS.LIMITS.PRESUMPTIVE_44ADA; 
    }

    // New Regime allows Standard Deduction now (FY 24-25)
    // Assuming 'salaryIncome' > 0 for std deduction eligibility
    const stdDed = (salaryIncome > 0) ? TAX_CONSTANTS.LIMITS.STANDARD_DEDUCTION : 0;

    const grossTotalIncome = salaryIncome + incomeFromHP + taxableBusinessIncome + otherSourcesIncome; 

    // 7. Deductions Calculation
    const used80C = Math.min(inv80C, TAX_CONSTANTS.LIMITS.SECTION_80C);
    const used80D = Math.min(inv80D_Self, TAX_CONSTANTS.LIMITS.SECTION_80D_SELF) + Math.min(inv80D_Parents, TAX_CONSTANTS.LIMITS.SECTION_80D_PARENTS);
    const usedNPS = Math.min(invNPS, TAX_CONSTANTS.LIMITS.SEC_80CCD_1B);
    const used80E = interest80E; // No limit
    const used80TTA = Math.min(savingsInterest, TAX_CONSTANTS.LIMITS.SECTION_80TTA);

    const totalDeductionsOld = stdDed + used80C + used80D + usedNPS + used80E + used80TTA;
    const totalDeductionsNew = stdDed; // Only Std Deduction allowed in New Regime
    
    // 8. Taxable Income
    const taxableOld = Math.max(0, grossTotalIncome - totalDeductionsOld);
    const taxableNew = Math.max(0, grossTotalIncome - totalDeductionsNew); 

    // 9. Robust Tax Calculator
    const calcTax = (income, regime) => {
      if (income <= regime.REBATE_LIMIT) return 0;
      
      let tax = 0;
      let prevLimit = 0;
      
      for (const slab of regime.SLABS) {
        if (income <= prevLimit) break;
        
        // Handle Infinity for last slab
        const currentLimit = slab.limit === null ? Infinity : slab.limit;
        const taxableAtThisSlab = Math.min(income, currentLimit) - prevLimit;
        
        if (taxableAtThisSlab > 0) {
            tax += taxableAtThisSlab * slab.rate;
        }
        prevLimit = currentLimit;
      }
      return tax * (1 + regime.CESS);
    };

    const taxOld = calcTax(taxableOld, TAX_CONSTANTS.OLD_REGIME);
    const taxNew = calcTax(taxableNew, TAX_CONSTANTS.NEW_REGIME);

    // 10. Compliance Checks
    const totalBankCredits = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const incomeMismatch = Math.abs(totalBankCredits - grossTotalIncome) > 50000;
    
    // Pace calculation
    const now = new Date();
    const monthsElapsed = now.getMonth() >= 3 ? now.getMonth() - 2 : now.getMonth() + 10;
    const monthlyPace80C = inv80C / Math.max(1, monthsElapsed);

    return {
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
        c80: { used: used80C, limit: TAX_CONSTANTS.LIMITS.SECTION_80C, pace: monthlyPace80C },
        d80: { used: used80D, limit: TAX_CONSTANTS.LIMITS.SECTION_80D_SELF + TAX_CONSTANTS.LIMITS.SECTION_80D_PARENTS },
        nps: { used: usedNPS, limit: TAX_CONSTANTS.LIMITS.SEC_80CCD_1B },
        hln: { used: interest24b, potential: missingInterestClaim },
        edu: { used: used80E, potential: false },
        tta: { used: used80TTA },
        hra: { potential: rentPaid, notComputed: hraNotComputed }
      },
      taxableOld, taxableNew, taxOld, taxNew,
      compliance: { incomeMismatch, totalBankCredits, missingRentIncome, missing80D, missingInterestClaim, capitalGainsUnverified },
      missedSavings: (Math.max(0, TAX_CONSTANTS.LIMITS.SECTION_80C - used80C) + Math.max(0, 50000 - usedNPS)) * 0.3
    };
  }
};