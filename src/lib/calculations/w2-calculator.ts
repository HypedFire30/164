/**
 * W-2 Tax Calculator for 2026 Tax Year
 * 
 * Calculates Social Security, Medicare, and estimates Federal/State withholding
 * Based on official IRS rates and wage bases for 2026
 */

// 2026 Tax Year Constants
export const TAX_YEAR_2026 = {
  // Social Security
  SOCIAL_SECURITY_WAGE_BASE: 184500, // Maximum wages subject to SS tax
  SOCIAL_SECURITY_RATE: 0.062, // 6.2%
  
  // Medicare
  MEDICARE_RATE: 0.0145, // 1.45%
  ADDITIONAL_MEDICARE_THRESHOLD: 200000, // Wages above this subject to additional 0.9%
  ADDITIONAL_MEDICARE_RATE: 0.009, // 0.9% additional on wages over threshold
  
  // Standard Deductions
  STANDARD_DEDUCTION: {
    SINGLE: 16100,
    MARRIED_JOINTLY: 32200,
    MARRIED_SEPARATELY: 16100,
    HEAD_OF_HOUSEHOLD: 24150,
    QUALIFYING_WIDOW: 32200,
  },
  
  // Tax Brackets (for withholding estimation)
  TAX_BRACKETS: {
    SINGLE: [
      { min: 0, max: 12400, rate: 0.10 },
      { min: 12401, max: 50400, rate: 0.12 },
      { min: 50401, max: 105700, rate: 0.22 },
      { min: 105701, max: 201775, rate: 0.24 },
      { min: 201776, max: 256225, rate: 0.32 },
      { min: 256226, max: 640600, rate: 0.35 },
      { min: 640601, max: Infinity, rate: 0.37 },
    ],
    MARRIED_JOINTLY: [
      { min: 0, max: 24800, rate: 0.10 },
      { min: 24801, max: 100800, rate: 0.12 },
      { min: 100801, max: 211400, rate: 0.22 },
      { min: 211401, max: 403550, rate: 0.24 },
      { min: 403551, max: 512450, rate: 0.32 },
      { min: 512451, max: 768700, rate: 0.35 },
      { min: 768701, max: Infinity, rate: 0.37 },
    ],
    HEAD_OF_HOUSEHOLD: [
      { min: 0, max: 17700, rate: 0.10 },
      { min: 17701, max: 67450, rate: 0.12 },
      { min: 67451, max: 105700, rate: 0.22 },
      { min: 105701, max: 201750, rate: 0.24 },
      { min: 201751, max: 256200, rate: 0.32 },
      { min: 256201, max: 640600, rate: 0.35 },
      { min: 640601, max: Infinity, rate: 0.37 },
    ],
  },
};

export type FilingStatus = "SINGLE" | "MARRIED_JOINTLY" | "MARRIED_SEPARATELY" | "HEAD_OF_HOUSEHOLD" | "QUALIFYING_WIDOW";

export interface W2CalculationInput {
  wages: number; // Box 1: Wages, tips, other compensation
  tips?: number; // Tips (if applicable)
  socialSecurityTips?: number; // Box 7
  allocatedTips?: number; // Box 8
  dependentCareBenefits?: number; // Box 10
  nonqualifiedPlans?: number; // Box 11
  box12Codes?: Array<{ code: string; amount: number }>; // Box 12 deferred compensation
  filingStatus?: FilingStatus;
  allowances?: number; // Number of withholding allowances (for estimation)
  additionalWithholding?: number; // Additional withholding requested
  state?: string; // State for state tax calculation
  localTaxRate?: number; // Local tax rate (if applicable)
}

export interface W2CalculationResult {
  // Box 1: Wages, tips, other compensation
  box1: number;
  
  // Box 2: Federal income tax withheld (estimated)
  box2: number;
  
  // Box 3: Social Security wages
  box3: number;
  
  // Box 4: Social Security tax withheld
  box4: number;
  
  // Box 5: Medicare wages and tips
  box5: number;
  
  // Box 6: Medicare tax withheld
  box6: number;
  
  // Box 7: Social Security tips
  box7: number;
  
  // Box 8: Allocated tips
  box8: number;
  
  // Box 10: Dependent care benefits
  box10: number;
  
  // Box 11: Nonqualified plans
  box11: number;
  
  // Box 16: State wages, tips, etc.
  box16: number;
  
  // Box 17: State income tax (estimated)
  box17: number;
  
  // Box 18: Local wages, tips, etc.
  box18: number;
  
  // Box 19: Local income tax
  box19: number;
}

/**
 * Calculate Social Security wages (capped at wage base)
 */
export function calculateSocialSecurityWages(wages: number, tips: number = 0): number {
  const totalWages = wages + tips;
  return Math.min(totalWages, TAX_YEAR_2026.SOCIAL_SECURITY_WAGE_BASE);
}

/**
 * Calculate Social Security tax withheld
 */
export function calculateSocialSecurityTax(wages: number, tips: number = 0): number {
  const ssWages = calculateSocialSecurityWages(wages, tips);
  return Math.round(ssWages * TAX_YEAR_2026.SOCIAL_SECURITY_RATE * 100) / 100;
}

/**
 * Calculate Medicare wages (no cap)
 */
export function calculateMedicareWages(wages: number, tips: number = 0): number {
  return wages + tips;
}

/**
 * Calculate Medicare tax withheld (regular + additional)
 */
export function calculateMedicareTax(wages: number, tips: number = 0): number {
  const medicareWages = calculateMedicareWages(wages, tips);
  
  // Regular Medicare tax (1.45% on all wages)
  const regularMedicare = medicareWages * TAX_YEAR_2026.MEDICARE_RATE;
  
  // Additional Medicare tax (0.9% on wages over $200,000)
  let additionalMedicare = 0;
  if (medicareWages > TAX_YEAR_2026.ADDITIONAL_MEDICARE_THRESHOLD) {
    const excessWages = medicareWages - TAX_YEAR_2026.ADDITIONAL_MEDICARE_THRESHOLD;
    additionalMedicare = excessWages * TAX_YEAR_2026.ADDITIONAL_MEDICARE_RATE;
  }
  
  return Math.round((regularMedicare + additionalMedicare) * 100) / 100;
}

/**
 * Estimate federal income tax withholding
 * This is a simplified estimation - actual withholding uses more complex formulas
 */
export function estimateFederalWithholding(
  wages: number,
  filingStatus: FilingStatus = "SINGLE",
  allowances: number = 0,
  additionalWithholding: number = 0
): number {
  // Get standard deduction
  const standardDeduction = TAX_YEAR_2026.STANDARD_DEDUCTION[filingStatus];
  
  // Get tax brackets
  const brackets = TAX_YEAR_2026.TAX_BRACKETS[filingStatus] || TAX_YEAR_2026.TAX_BRACKETS.SINGLE;
  
  // Calculate taxable income (simplified - assumes standard deduction)
  // In reality, withholding uses a more complex formula with allowances
  const allowanceValue = allowances * 4850; // Approximate value per allowance in 2026
  const taxableIncome = Math.max(0, wages - standardDeduction - allowanceValue);
  
  // Calculate tax using brackets
  let tax = 0;
  let remainingIncome = taxableIncome;
  
  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    
    const bracketIncome = Math.min(
      remainingIncome,
      bracket.max === Infinity ? remainingIncome : bracket.max - bracket.min + 1
    );
    
    tax += bracketIncome * bracket.rate;
    remainingIncome -= bracketIncome;
  }
  
  // Add additional withholding
  return Math.round((tax + additionalWithholding) * 100) / 100;
}

/**
 * Estimate state income tax withholding (simplified)
 * Actual rates vary by state - this is a rough estimate
 */
export function estimateStateWithholding(
  wages: number,
  state?: string
): number {
  if (!state) return 0;
  
  // Simplified state tax rates (these are rough estimates - actual rates vary)
  const stateRates: Record<string, number> = {
    "OR": 0.09, // Oregon (flat rate)
    "CA": 0.10, // California (progressive, using average)
    "NY": 0.08, // New York (progressive, using average)
    "TX": 0.00, // Texas (no state income tax)
    "FL": 0.00, // Florida (no state income tax)
    "WA": 0.00, // Washington (no state income tax)
    // Add more states as needed
  };
  
  const rate = stateRates[state.toUpperCase()] || 0.05; // Default 5% if state not found
  return Math.round(wages * rate * 100) / 100;
}

/**
 * Calculate all W-2 values
 */
export function calculateW2(input: W2CalculationInput): W2CalculationResult {
  const wages = input.wages || 0;
  const tips = input.tips || 0;
  const socialSecurityTips = input.socialSecurityTips || 0;
  const allocatedTips = input.allocatedTips || 0;
  
  // Box 1: Wages, tips, other compensation
  const box1 = wages + tips;
  
  // Box 3: Social Security wages (capped)
  const box3 = calculateSocialSecurityWages(wages, tips);
  
  // Box 4: Social Security tax withheld
  const box4 = calculateSocialSecurityTax(wages, tips);
  
  // Box 5: Medicare wages and tips
  const box5 = calculateMedicareWages(wages, tips);
  
  // Box 6: Medicare tax withheld
  const box6 = calculateMedicareTax(wages, tips);
  
  // Box 7: Social Security tips
  const box7 = socialSecurityTips;
  
  // Box 8: Allocated tips
  const box8 = allocatedTips;
  
  // Box 10: Dependent care benefits
  const box10 = input.dependentCareBenefits || 0;
  
  // Box 11: Nonqualified plans
  const box11 = input.nonqualifiedPlans || 0;
  
  // Box 2: Federal income tax withheld (estimated)
  const box2 = estimateFederalWithholding(
    box1,
    input.filingStatus || "SINGLE",
    input.allowances || 0,
    input.additionalWithholding || 0
  );
  
  // Box 16: State wages, tips, etc. (same as Box 1 for most states)
  const box16 = box1;
  
  // Box 17: State income tax (estimated)
  const box17 = estimateStateWithholding(box1, input.state);
  
  // Box 18: Local wages, tips, etc. (same as Box 1)
  const box18 = box1;
  
  // Box 19: Local income tax
  const box19 = input.localTaxRate ? Math.round(box1 * input.localTaxRate * 100) / 100 : 0;
  
  return {
    box1,
    box2,
    box3,
    box4,
    box5,
    box6,
    box7,
    box8,
    box10,
    box11,
    box16,
    box17,
    box18,
    box19,
  };
}
