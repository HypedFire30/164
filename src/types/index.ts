// Core data types for the PFS system

export interface Property {
  id: string;
  address: string;
  purchasePrice: number;
  currentValue: number;
  ownershipPercentage: number;
  mortgageId?: string;
  notes?: string;
  // Schedule E fields (Contracts and Mortgages Receivable)
  scheduleEDebtorName?: string; // Name of Debtor
  scheduleEPaymentSchedule?: string; // e.g., "Monthly", "Quarterly"
  scheduleEAmountPastDue?: number; // Amount Past Due
  scheduleEOriginalBalance?: number; // Original Balance
  scheduleEPresentBalance?: number; // Present Balance (if different from mortgage balance)
  scheduleEInterestRate?: number; // Interest Rate (if different from mortgage rate)
}

export interface Mortgage {
  id: string;
  propertyId: string;
  lender: string;
  principalBalance: number;
  interestRate: number;
  paymentAmount: number;
  lastUpdated: string; // ISO date string
}

export interface PersonalAsset {
  id: string;
  category: string;
  description: string;
  value: number;
  // Schedule A & B fields (Accounts/Notes Receivable)
  receivableName?: string; // Name of debtor/payor
  dueDate?: string; // ISO date string
  // Contact information for debtor/payor
  debtorEmail?: string;
  debtorPhone?: string;
  debtorAddress?: string;
  notes?: string; // Additional notes about the asset
}

export interface Liability {
  id: string;
  category: string;
  description: string;
  balance: number;
  // Schedule G & H fields (Accounts/Notes Payable)
  payableTo?: string; // Name of creditor
  dueDate?: string; // ISO date string
  // Schedule I fields (Installment Obligations)
  collateral?: string; // Collateral description
  finalDueDate?: string; // ISO date string - when loan matures
  monthlyPayment?: number; // Monthly payment amount
  // Contact information for creditor
  creditorEmail?: string;
  creditorPhone?: string;
  creditorAddress?: string;
  notes?: string; // Additional notes about the liability
}

export interface ValuationHistory {
  id: string;
  propertyId: string;
  value: number;
  timestamp: string; // ISO date string
}

export interface PFSData {
  properties: Property[];
  mortgages: Mortgage[];
  personalAssets: PersonalAsset[];
  liabilities: Liability[];
  totals: {
    totalRealEstateValue: number;
    totalMortgageBalance: number;
    totalEquity: number;
    totalPersonalAssets: number;
    totalLiabilities: number;
    totalAssets: number;
    netWorth: number;
  };
}

