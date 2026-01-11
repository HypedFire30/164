// Core data types for the PFS system

export interface Property {
  id: string;
  address: string;
  purchasePrice: number;
  currentValue: number;
  ownershipPercentage: number;
  mortgageId?: string;
  notes?: string;
  // Rent Roll fields
  totalUnits?: number | null;
  occupiedUnits?: number | null;
  monthlyRentalIncome?: number | null; // Total monthly rental income
  occupancyRate?: number | null; // Percentage (0-100)
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

// ============================================================================
// PROPERTY MANAGEMENT TYPES (Rent Roll & Leases)
// ============================================================================

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string; // e.g., "101", "A", "Suite 200"
  unitType: "Studio" | "1BR" | "2BR" | "3BR" | "4BR" | "5BR+" | "Commercial" | "Other";
  squareFootage: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  marketRent: number | null; // Market rate for this unit
  notes?: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  notes?: string | null;
}

export interface Lease {
  id: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  tenant: Tenant; // Populated when fetching
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  monthlyRent: number;
  securityDeposit: number | null;
  petDeposit: number | null;
  parkingFee: number | null; // Monthly parking fee
  storageFee: number | null; // Monthly storage fee
  otherFees: number | null; // Other monthly fees
  totalMonthlyRent: number; // Calculated: monthlyRent + parkingFee + storageFee + otherFees
  leaseType: "Fixed-Term" | "Month-to-Month" | "Other";
  renewalOption: "Automatic" | "Option to Renew" | "None" | null;
  renewalTerms: string | null; // e.g., "5% increase", "Market rate"
  status: "Active" | "Expired" | "Terminated" | "Pending";
  lastPaymentDate: string | null; // ISO date string
  paymentStatus: "Current" | "Past Due" | "Partial" | null;
  daysPastDue: number | null;
  guarantorName: string | null;
  guarantorContact: string | null;
  specialTerms: string | null; // Special terms or conditions
  leaseDocumentUrl: string | null; // URL to lease document
  notes?: string | null;
}

export interface RentRollSummary {
  propertyId: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number; // Percentage
  totalMonthlyRentPotential: number; // If all units rented at market rate
  totalMonthlyRentCollected: number; // Actual rent from active leases
  averageRentPerUnit: number;
  averageRentPerSqFt: number | null;
}

// ============================================================================
// W-2 FORM DATA (Official IRS Form W-2 Structure for 2026)
// ============================================================================

export interface W2Form {
  id: string;
  taxYear: number; // e.g., 2026
  
  // ============================================================================
  // BOXES a-f: Employee and Employer Information
  // ============================================================================
  
  // Box a: Employee's Social Security Number
  employeeSSN: string; // Format: XXX-XX-XXXX
  
  // Box b: Employer Identification Number (EIN)
  employerEIN: string; // Format: XX-XXXXXXX
  
  // Box c: Employer's Name, Address, and ZIP Code
  employerName: string;
  employerAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Box d: Control Number (optional - used by employers for internal purposes)
  controlNumber?: string;
  
  // Box e: Employee's Name
  employeeName: string;
  
  // Box f: Employee's Address and ZIP Code
  employeeAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // ============================================================================
  // BOXES 1-20: Wage and Tax Information
  // ============================================================================
  
  // Box 1: Wages, tips, other compensation
  box1: number;
  
  // Box 2: Federal income tax withheld
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
  box7?: number;
  
  // Box 8: Allocated tips
  box8?: number;
  
  // Box 9: (Not currently in use - previously used for tax credit)
  
  // Box 10: Dependent care benefits
  box10?: number;
  
  // Box 11: Nonqualified plans
  box11?: number;
  
  // Box 12: Codes for various compensation and benefits
  // Common codes: D (401k), E (403b), G (457b), H (501c), W (HSA), DD (Cost of health insurance)
  box12Codes?: Array<{ code: string; amount: number }>;
  
  // Box 13: Checkboxes
  box13StatutoryEmployee?: boolean;
  box13RetirementPlan?: boolean;
  box13ThirdPartySickPay?: boolean;
  
  // Box 14: Other (e.g., state disability insurance, union dues)
  box14Other?: Array<{ description: string; amount: number }>;
  
  // Box 15: State and Employer's State ID Number
  box15State?: string;
  box15EmployerStateId?: string;
  
  // Box 16: State wages, tips, etc.
  box16?: number;
  
  // Box 17: State income tax
  box17?: number;
  
  // Box 18: Local wages, tips, etc.
  box18?: number;
  
  // Box 19: Local income tax
  box19?: number;
  
  // Box 20: Locality name
  box20LocalityName?: string;
  
  // ============================================================================
  // Calculation Inputs (for auto-calculation)
  // ============================================================================
  filingStatus?: "SINGLE" | "MARRIED_JOINTLY" | "MARRIED_SEPARATELY" | "HEAD_OF_HOUSEHOLD" | "QUALIFYING_WIDOW";
  allowances?: number; // Number of withholding allowances
  additionalWithholding?: number; // Additional withholding requested
  tips?: number; // Tips (used to calculate Box 1, 3, 5, 7)
  
  // Metadata
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
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

