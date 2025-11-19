/**
 * Financial Calculation Engine
 * 
 * Pure TypeScript functions for calculating all derived financial metrics.
 * Zero side effects - all functions are deterministic and testable.
 */

import type {
  RealEstateProperty,
  BankAccount,
  InvestmentAccount,
  BusinessEntity,
  PersonalLoan,
  CreditLine,
  CreditCard,
  IncomeSource,
  PFSSummaries,
  RSURestrictedStock,
  PrivateEquity,
  CapTable,
} from "../types";

// ============================================================================
// REAL ESTATE CALCULATIONS
// ============================================================================

/**
 * Calculate total real estate value (ownership-weighted)
 */
export function calculateTotalRealEstateValue(
  properties: RealEstateProperty[]
): number {
  return properties.reduce((total, property) => {
    const ownershipWeight = property.owners.reduce(
      (sum, owner) => sum + owner.ownershipPercentage,
      0
    ) / 100;
    return total + (property.marketValue || 0) * ownershipWeight;
  }, 0);
}

/**
 * Calculate total mortgage balance across all properties
 */
export function calculateTotalMortgageBalance(
  properties: RealEstateProperty[]
): number {
  return properties.reduce((total, property) => {
    const propertyMortgages = property.mortgages.reduce(
      (sum, mortgage) => sum + mortgage.principalBalance,
      0
    );
    return total + propertyMortgages;
  }, 0);
}

/**
 * Calculate total real estate equity
 */
export function calculateTotalRealEstateEquity(
  properties: RealEstateProperty[]
): number {
  const totalValue = calculateTotalRealEstateValue(properties);
  const totalMortgages = calculateTotalMortgageBalance(properties);
  return totalValue - totalMortgages;
}

/**
 * Calculate Loan-to-Value (LTV) ratio for a property
 */
export function calculateLTV(
  property: RealEstateProperty
): number {
  if (!property.marketValue || property.marketValue === 0) {
    return 0;
  }
  const totalMortgageBalance = property.mortgages.reduce(
    (sum, mortgage) => sum + mortgage.principalBalance,
    0
  );
  return (totalMortgageBalance / property.marketValue) * 100;
}

/**
 * Calculate average LTV across all properties
 */
export function calculateAverageLTV(
  properties: RealEstateProperty[]
): number {
  if (properties.length === 0) return 0;
  
  const totalLTV = properties.reduce((sum, property) => {
    return sum + calculateLTV(property);
  }, 0);
  
  return totalLTV / properties.length;
}

/**
 * Calculate Net Operating Income (NOI) for a property
 */
export function calculateNOI(property: RealEstateProperty): number {
  const income = property.monthlyIncome || 0;
  const expenses = property.monthlyExpenses || 0;
  return (income - expenses) * 12; // Annualized
}

/**
 * Calculate total NOI across all properties
 */
export function calculateTotalNOI(
  properties: RealEstateProperty[]
): number {
  return properties.reduce((total, property) => {
    return total + calculateNOI(property);
  }, 0);
}

/**
 * Calculate Debt Service Coverage Ratio (DSCR) for a property
 */
export function calculateDSCR(property: RealEstateProperty): number {
  const noi = calculateNOI(property);
  const annualDebtService = property.mortgages.reduce(
    (sum, mortgage) => sum + mortgage.monthlyPayment * 12,
    0
  );
  
  if (annualDebtService === 0) return Infinity;
  return noi / annualDebtService;
}

/**
 * Calculate average DSCR across all properties
 */
export function calculateAverageDSCR(
  properties: RealEstateProperty[]
): number {
  if (properties.length === 0) return 0;
  
  const validDSCRs = properties
    .map(calculateDSCR)
    .filter(dscr => isFinite(dscr));
  
  if (validDSCRs.length === 0) return 0;
  
  const totalDSCR = validDSCRs.reduce((sum, dscr) => sum + dscr, 0);
  return totalDSCR / validDSCRs.length;
}

// ============================================================================
// ASSET CALCULATIONS
// ============================================================================

/**
 * Calculate total bank account balance
 */
export function calculateTotalBankBalance(
  accounts: BankAccount[]
): number {
  return accounts.reduce((total, account) => total + account.balance, 0);
}

/**
 * Calculate total investment value
 */
export function calculateTotalInvestmentValue(
  accounts: InvestmentAccount[]
): number {
  return accounts.reduce((total, account) => {
    // Calculate ownership-weighted value
    const ownershipWeight = account.owners.reduce(
      (sum, owner) => sum + owner.ownershipPercentage,
      0
    ) / 100;
    return total + account.totalValue * ownershipWeight;
  }, 0);
}

/**
 * Calculate total RSU value
 */
export function calculateTotalRSUValue(
  rsus: RSURestrictedStock[]
): number {
  return rsus.reduce((total, rsu) => {
    return total + (rsu.currentValue || 0) * rsu.vestedShares;
  }, 0);
}

/**
 * Calculate total private equity value
 */
export function calculateTotalPrivateEquityValue(
  privateEquity: PrivateEquity[]
): number {
  return privateEquity.reduce((total, pe) => {
    return total + (pe.currentValue || pe.investedAmount);
  }, 0);
}

/**
 * Calculate total cap table value
 */
export function calculateTotalCapTableValue(
  capTables: CapTable[]
): number {
  return capTables.reduce((total, capTable) => {
    return total + capTable.currentValue;
  }, 0);
}

/**
 * Calculate total business equity (ownership-weighted)
 */
export function calculateTotalBusinessEquity(
  entities: BusinessEntity[]
): number {
  return entities.reduce((total, entity) => {
    const ownershipWeight = entity.ownershipPercentage / 100;
    const netEquity = entity.totalAssets - entity.totalLiabilities;
    return total + netEquity * ownershipWeight;
  }, 0);
}

/**
 * Calculate total assets
 */
export function calculateTotalAssets(
  realEstate: RealEstateProperty[],
  bankAccounts: BankAccount[],
  investments: InvestmentAccount[],
  rsus: RSURestrictedStock[],
  privateEquity: PrivateEquity[],
  capTables: CapTable[],
  businessEntities: BusinessEntity[]
): number {
  const realEstateValue = calculateTotalRealEstateValue(realEstate);
  const bankBalance = calculateTotalBankBalance(bankAccounts);
  const investmentValue = calculateTotalInvestmentValue(investments);
  const rsuValue = calculateTotalRSUValue(rsus);
  const peValue = calculateTotalPrivateEquityValue(privateEquity);
  const capTableValue = calculateTotalCapTableValue(capTables);
  const businessEquity = calculateTotalBusinessEquity(businessEntities);
  
  return (
    realEstateValue +
    bankBalance +
    investmentValue +
    rsuValue +
    peValue +
    capTableValue +
    businessEquity
  );
}

// ============================================================================
// LIABILITY CALCULATIONS
// ============================================================================

/**
 * Calculate total personal loan balance
 */
export function calculateTotalPersonalLoanBalance(
  loans: PersonalLoan[]
): number {
  return loans.reduce((total, loan) => total + loan.currentBalance, 0);
}

/**
 * Calculate total credit line balance
 */
export function calculateTotalCreditLineBalance(
  creditLines: CreditLine[]
): number {
  return creditLines.reduce((total, line) => total + line.currentBalance, 0);
}

/**
 * Calculate total credit card balance
 */
export function calculateTotalCreditCardBalance(
  creditCards: CreditCard[]
): number {
  return creditCards.reduce((total, card) => total + card.currentBalance, 0);
}

/**
 * Calculate total liabilities
 */
export function calculateTotalLiabilities(
  realEstate: RealEstateProperty[],
  personalLoans: PersonalLoan[],
  creditLines: CreditLine[],
  creditCards: CreditCard[]
): number {
  const mortgageBalance = calculateTotalMortgageBalance(realEstate);
  const loanBalance = calculateTotalPersonalLoanBalance(personalLoans);
  const creditLineBalance = calculateTotalCreditLineBalance(creditLines);
  const creditCardBalance = calculateTotalCreditCardBalance(creditCards);
  
  return mortgageBalance + loanBalance + creditLineBalance + creditCardBalance;
}

// ============================================================================
// INCOME CALCULATIONS
// ============================================================================

/**
 * Calculate total monthly income
 */
export function calculateTotalMonthlyIncome(
  incomeSources: IncomeSource[]
): number {
  return incomeSources
    .filter(source => source.isRecurring)
    .reduce((total, source) => total + source.monthlyAmount, 0);
}

/**
 * Calculate total annual income
 */
export function calculateTotalAnnualIncome(
  incomeSources: IncomeSource[]
): number {
  return incomeSources.reduce((total, source) => {
    return total + source.annualAmount;
  }, 0);
}

// ============================================================================
// FINANCIAL METRICS
// ============================================================================

/**
 * Calculate net worth
 */
export function calculateNetWorth(
  totalAssets: number,
  totalLiabilities: number
): number {
  return totalAssets - totalLiabilities;
}

/**
 * Calculate debt-to-asset ratio
 */
export function calculateDebtToAssetRatio(
  totalDebt: number,
  totalAssets: number
): number {
  if (totalAssets === 0) return 0;
  return (totalDebt / totalAssets) * 100;
}

/**
 * Calculate liquidity (cash + bank accounts)
 */
export function calculateLiquidity(
  bankAccounts: BankAccount[]
): number {
  return calculateTotalBankBalance(bankAccounts);
}

// ============================================================================
// COMPREHENSIVE SUMMARY CALCULATION
// ============================================================================

/**
 * Calculate all PFS summaries in one function
 */
export function calculatePFSSummaries(
  realEstate: RealEstateProperty[],
  bankAccounts: BankAccount[],
  investments: InvestmentAccount[],
  rsus: RSURestrictedStock[],
  privateEquity: PrivateEquity[],
  capTables: CapTable[],
  businessEntities: BusinessEntity[],
  personalLoans: PersonalLoan[],
  creditLines: CreditLine[],
  creditCards: CreditCard[],
  incomeSources: IncomeSource[]
): PFSSummaries {
  // Assets
  const totalRealEstateValue = calculateTotalRealEstateValue(realEstate);
  const totalRealEstateEquity = calculateTotalRealEstateEquity(realEstate);
  const totalBankAccountBalance = calculateTotalBankBalance(bankAccounts);
  const totalInvestmentValue = calculateTotalInvestmentValue(investments);
  const totalRSUValue = calculateTotalRSUValue(rsus);
  const totalPrivateEquityValue = calculateTotalPrivateEquityValue(privateEquity);
  const totalCapTableValue = calculateTotalCapTableValue(capTables);
  const totalBusinessEquity = calculateTotalBusinessEquity(businessEntities);
  const totalAssets = calculateTotalAssets(
    realEstate,
    bankAccounts,
    investments,
    rsus,
    privateEquity,
    capTables,
    businessEntities
  );
  
  // Liabilities
  const totalMortgageBalance = calculateTotalMortgageBalance(realEstate);
  const totalPersonalLoanBalance = calculateTotalPersonalLoanBalance(personalLoans);
  const totalCreditLineBalance = calculateTotalCreditLineBalance(creditLines);
  const totalCreditCardBalance = calculateTotalCreditCardBalance(creditCards);
  const totalLiabilities = calculateTotalLiabilities(
    realEstate,
    personalLoans,
    creditLines,
    creditCards
  );
  
  // Income
  const totalMonthlyIncome = calculateTotalMonthlyIncome(incomeSources);
  const totalAnnualIncome = calculateTotalAnnualIncome(incomeSources);
  
  // Financial Metrics
  const netWorth = calculateNetWorth(totalAssets, totalLiabilities);
  const totalDebt = totalLiabilities;
  const debtToAssetRatio = calculateDebtToAssetRatio(totalDebt, totalAssets);
  const liquidity = calculateLiquidity(bankAccounts);
  
  // Real Estate Metrics
  const averageLTV = calculateAverageLTV(realEstate);
  const totalNOI = calculateTotalNOI(realEstate);
  const averageDSCR = calculateAverageDSCR(realEstate);
  
  return {
    totalRealEstateValue,
    totalRealEstateEquity,
    totalBankAccountBalance,
    totalInvestmentValue,
    totalRSUValue,
    totalPrivateEquityValue,
    totalCapTableValue,
    totalBusinessEquity,
    totalAssets,
    totalMortgageBalance,
    totalPersonalLoanBalance,
    totalCreditLineBalance,
    totalCreditCardBalance,
    totalLiabilities,
    totalMonthlyIncome,
    totalAnnualIncome,
    netWorth,
    totalDebt,
    debtToAssetRatio,
    liquidity,
    averageLTV,
    totalNOI,
    averageDSCR,
  };
}



