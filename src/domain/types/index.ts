/**
 * Core Domain Types for Personal Financial Statement System
 * 
 * These types represent the complete domain model for all PFS modules.
 * All types support partials for drafts, versioning, and multiple owners.
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export interface BaseEntity {
  id: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  version: number;
  deletedAt?: string | null; // Soft delete
  snapshot?: Record<string, unknown>; // For rollback
}

export interface OwnerShare {
  ownerId: string;
  ownerName: string;
  ownershipPercentage: number; // 0-100
}

// ============================================================================
// 1. PERSONAL INFO
// ============================================================================

export interface PersonalInfo extends BaseEntity {
  userId: string;
  name: string;
  dateOfBirth: string | null; // ISO date string
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  } | null;
  ssn?: string | null; // Encrypted in production
  email?: string | null;
  phone?: string | null;
}

// ============================================================================
// 2. REAL ESTATE HOLDINGS
// ============================================================================

export interface Mortgage {
  id: string;
  lender: string;
  principalBalance: number;
  interestRate: number; // As decimal (0.05 = 5%)
  monthlyPayment: number;
  termMonths: number | null;
  startDate: string | null; // ISO date string
  maturityDate: string | null; // ISO date string
  propertyId: string;
}

export interface RealEstateProperty extends BaseEntity {
  address: string;
  propertyType: "Residential" | "Commercial" | "Land" | "Mixed Use" | "Other";
  acquisitionDate: string | null; // ISO date string
  purchasePrice: number | null;
  marketValue: number | null;
  mortgages: Mortgage[];
  monthlyIncome: number | null; // Rental income
  monthlyExpenses: number | null; // Operating expenses
  ownershipStructure: "Personal" | "Entity";
  entityId: string | null; // If owned by entity
  owners: OwnerShare[]; // If personal ownership
  notes?: string | null;
}

// ============================================================================
// 3. BANK ACCOUNTS
// ============================================================================

export interface BankAccount extends BaseEntity {
  bankName: string;
  accountType: "Checking" | "Savings" | "Money Market" | "CD" | "Other";
  accountNumber?: string | null; // Last 4 digits only in production
  balance: number;
  isJoint: boolean;
  jointOwners?: string[]; // Array of owner IDs
  interestRate?: number | null;
  notes?: string | null;
}

// ============================================================================
// 4. INVESTMENTS
// ============================================================================

export interface StockHolding {
  symbol: string;
  shares: number;
  averageCost: number;
  currentPrice: number | null;
  currentValue: number; // Calculated: shares * currentPrice
}

export interface InvestmentAccount extends BaseEntity {
  accountName: string;
  accountType: "Brokerage" | "IRA" | "401k" | "Roth IRA" | "Other";
  custodian: string; // e.g., "Fidelity", "Vanguard"
  stocks: StockHolding[];
  etfs: StockHolding[];
  totalValue: number; // Sum of all holdings
  owners: OwnerShare[];
  notes?: string | null;
}

export interface RSURestrictedStock {
  id: string;
  companyName: string;
  grantDate: string; // ISO date string
  vestingDate: string | null; // ISO date string
  shares: number;
  strikePrice: number | null;
  currentValue: number | null;
  vestedShares: number;
}

export interface PrivateEquity {
  id: string;
  fundName: string;
  commitmentAmount: number;
  investedAmount: number;
  currentValue: number | null;
  ownershipPercentage: number | null;
}

export interface CapTable {
  id: string;
  companyName: string;
  ownershipPercentage: number;
  sharesOwned: number;
  totalShares: number;
  valuation: number | null;
  currentValue: number; // Calculated: (sharesOwned / totalShares) * valuation
}

// ============================================================================
// 5. BUSINESS ENTITIES
// ============================================================================

export interface BusinessEntity extends BaseEntity {
  businessName: string;
  ein: string | null; // Tax ID
  entityType: "LLC" | "Corporation" | "Partnership" | "Sole Proprietorship" | "Other";
  ownershipPercentage: number; // 0-100
  assets: BusinessAsset[];
  liabilities: BusinessLiability[];
  totalAssets: number; // Sum of assets
  totalLiabilities: number; // Sum of liabilities
  netEquity: number; // Calculated: totalAssets - totalLiabilities
  notes?: string | null;
}

export interface BusinessAsset {
  id: string;
  description: string;
  value: number;
  category: string;
}

export interface BusinessLiability {
  id: string;
  description: string;
  balance: number;
  category: string;
}

// ============================================================================
// 6. LIABILITIES
// ============================================================================

export interface PersonalLoan extends BaseEntity {
  lender: string;
  loanType: "Personal Loan" | "Auto Loan" | "Student Loan" | "Other";
  originalBalance: number;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  termMonths: number | null;
  maturityDate: string | null; // ISO date string
  isSecured: boolean;
  collateral?: string | null;
  notes?: string | null;
}

export interface CreditLine extends BaseEntity {
  institution: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number; // Calculated: creditLimit - currentBalance
  interestRate: number;
  isBusiness: boolean;
  notes?: string | null;
}

export interface CreditCard extends BaseEntity {
  issuer: string; // e.g., "Chase", "American Express"
  cardName: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number; // Calculated: creditLimit - currentBalance
  interestRate: number;
  isBusiness: boolean;
  notes?: string | null;
}

// ============================================================================
// 7. INCOME SOURCES
// ============================================================================

export interface IncomeSource extends BaseEntity {
  sourceType: "Salary" | "Rental" | "Distribution" | "Dividend" | "Interest" | "Other";
  sourceName: string; // e.g., "Employer Name", "Property Address"
  monthlyAmount: number;
  annualAmount: number; // Calculated: monthlyAmount * 12
  isRecurring: boolean;
  startDate: string | null; // ISO date string
  endDate: string | null; // ISO date string
  notes?: string | null;
}

// ============================================================================
// 8. FULL PFS OBJECT
// ============================================================================

export interface FullPFS {
  id: string;
  userId: string;
  generatedAt: string; // ISO date string
  personalInfo: PersonalInfo;
  realEstate: RealEstateProperty[];
  bankAccounts: BankAccount[];
  investments: InvestmentAccount[];
  rsuRestrictedStock: RSURestrictedStock[];
  privateEquity: PrivateEquity[];
  capTables: CapTable[];
  businessEntities: BusinessEntity[];
  personalLoans: PersonalLoan[];
  creditLines: CreditLine[];
  creditCards: CreditCard[];
  incomeSources: IncomeSource[];
  
  // Calculated Summaries
  summaries: PFSSummaries;
}

export interface PFSSummaries {
  // Assets
  totalRealEstateValue: number;
  totalRealEstateEquity: number;
  totalBankAccountBalance: number;
  totalInvestmentValue: number;
  totalRSUValue: number;
  totalPrivateEquityValue: number;
  totalCapTableValue: number;
  totalBusinessEquity: number;
  totalAssets: number;
  
  // Liabilities
  totalMortgageBalance: number;
  totalPersonalLoanBalance: number;
  totalCreditLineBalance: number;
  totalCreditCardBalance: number;
  totalLiabilities: number;
  
  // Income
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
  
  // Financial Metrics
  netWorth: number;
  totalDebt: number;
  debtToAssetRatio: number;
  liquidity: number; // Cash + bank accounts
  
  // Real Estate Metrics
  averageLTV: number; // Loan-to-value
  totalNOI: number; // Net Operating Income
  averageDSCR: number; // Debt Service Coverage Ratio
}

// ============================================================================
// PARTIAL TYPES FOR DRAFTS
// ============================================================================

export type PartialPersonalInfo = Partial<Omit<PersonalInfo, "id" | "createdAt" | "updatedAt" | "version">>;
export type PartialRealEstateProperty = Partial<Omit<RealEstateProperty, "id" | "createdAt" | "updatedAt" | "version" | "mortgages">> & {
  mortgages?: Partial<Mortgage>[];
};
export type PartialBankAccount = Partial<Omit<BankAccount, "id" | "createdAt" | "updatedAt" | "version">>;
export type PartialInvestmentAccount = Partial<Omit<InvestmentAccount, "id" | "createdAt" | "updatedAt" | "version">>;
export type PartialBusinessEntity = Partial<Omit<BusinessEntity, "id" | "createdAt" | "updatedAt" | "version" | "assets" | "liabilities">>;
export type PartialPersonalLoan = Partial<Omit<PersonalLoan, "id" | "createdAt" | "updatedAt" | "version">>;
export type PartialCreditLine = Partial<Omit<CreditLine, "id" | "createdAt" | "updatedAt" | "version">>;
export type PartialCreditCard = Partial<Omit<CreditCard, "id" | "createdAt" | "updatedAt" | "version">>;
export type PartialIncomeSource = Partial<Omit<IncomeSource, "id" | "createdAt" | "updatedAt" | "version">>;






