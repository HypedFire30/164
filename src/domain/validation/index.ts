/**
 * Validation Layer
 * 
 * Reusable validation functions for all PFS entities.
 * All validations return ValidationResult with clear error messages.
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
  OwnerShare,
} from "../types";

// ============================================================================
// VALIDATION RESULT TYPE
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function createValidationResult(
  isValid: boolean,
  errors: string[] = []
): ValidationResult {
  return { isValid, errors };
}

// ============================================================================
// COMMON VALIDATIONS
// ============================================================================

export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined || value === "") {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateNumber(
  value: unknown,
  fieldName: string,
  min?: number,
  max?: number
): string | null {
  if (typeof value !== "number") {
    return `${fieldName} must be a number`;
  }
  if (min !== undefined && value < min) {
    return `${fieldName} must be at least ${min}`;
  }
  if (max !== undefined && value > max) {
    return `${fieldName} must be at most ${max}`;
  }
  return null;
}

export function validatePercentage(value: number, fieldName: string): string | null {
  const numError = validateNumber(value, fieldName, 0, 100);
  if (numError) return numError;
  return null;
}

export function validateDate(value: string | null, fieldName: string): string | null {
  if (value === null) return null; // Optional field
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return `${fieldName} must be a valid date`;
  }
  return null;
}

export function validateEmail(value: string | null | undefined): string | null {
  if (!value) return null; // Optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return "Email must be a valid email address";
  }
  return null;
}

// ============================================================================
// OWNERSHIP VALIDATION
// ============================================================================

export function validateOwnerShares(owners: OwnerShare[]): string | null {
  if (owners.length === 0) {
    return "At least one owner is required";
  }
  
  const totalPercentage = owners.reduce(
    (sum, owner) => sum + owner.ownershipPercentage,
    0
  );
  
  if (Math.abs(totalPercentage - 100) > 0.01) {
    return `Total ownership percentage must equal 100% (currently ${totalPercentage}%)`;
  }
  
  // Check for duplicate owner IDs
  const ownerIds = owners.map(o => o.ownerId);
  const uniqueIds = new Set(ownerIds);
  if (ownerIds.length !== uniqueIds.size) {
    return "Duplicate owner IDs are not allowed";
  }
  
  return null;
}

// ============================================================================
// REAL ESTATE VALIDATION
// ============================================================================

export function validateRealEstateProperty(
  property: Partial<RealEstateProperty>
): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  const addressError = validateRequired(property.address, "Address");
  if (addressError) errors.push(addressError);
  
  // Market value validation
  if (property.marketValue !== undefined && property.marketValue !== null) {
    const valueError = validateNumber(property.marketValue, "Market value", 0);
    if (valueError) errors.push(valueError);
  }
  
  // Purchase price validation
  if (property.purchasePrice !== undefined && property.purchasePrice !== null) {
    const priceError = validateNumber(property.purchasePrice, "Purchase price", 0);
    if (priceError) errors.push(priceError);
  }
  
  // Logical constraint: mortgage balance <= market value
  if (property.marketValue && property.mortgages) {
    const totalMortgageBalance = property.mortgages.reduce(
      (sum, mortgage) => sum + (mortgage.principalBalance || 0),
      0
    );
    if (totalMortgageBalance > property.marketValue) {
      errors.push(
        `Total mortgage balance (${totalMortgageBalance}) cannot exceed market value (${property.marketValue})`
      );
    }
  }
  
  // Ownership validation
  if (property.owners && property.owners.length > 0) {
    const ownershipError = validateOwnerShares(property.owners);
    if (ownershipError) errors.push(ownershipError);
  }
  
  // Date validations
  if (property.acquisitionDate) {
    const dateError = validateDate(property.acquisitionDate, "Acquisition date");
    if (dateError) errors.push(dateError);
  }
  
  return createValidationResult(errors.length === 0, errors);
}

export function validateMortgage(mortgage: Partial<RealEstateProperty["mortgages"][0]>): ValidationResult {
  const errors: string[] = [];
  
  const lenderError = validateRequired(mortgage.lender, "Lender");
  if (lenderError) errors.push(lenderError);
  
  if (mortgage.principalBalance !== undefined) {
    const balanceError = validateNumber(mortgage.principalBalance, "Principal balance", 0);
    if (balanceError) errors.push(balanceError);
  }
  
  if (mortgage.interestRate !== undefined) {
    const rateError = validateNumber(mortgage.interestRate, "Interest rate", 0, 1);
    if (rateError) errors.push(rateError);
  }
  
  if (mortgage.monthlyPayment !== undefined) {
    const paymentError = validateNumber(mortgage.monthlyPayment, "Monthly payment", 0);
    if (paymentError) errors.push(paymentError);
  }
  
  return createValidationResult(errors.length === 0, errors);
}

// ============================================================================
// BANK ACCOUNT VALIDATION
// ============================================================================

export function validateBankAccount(account: Partial<BankAccount>): ValidationResult {
  const errors: string[] = [];
  
  const bankNameError = validateRequired(account.bankName, "Bank name");
  if (bankNameError) errors.push(bankNameError);
  
  if (account.balance !== undefined) {
    const balanceError = validateNumber(account.balance, "Balance");
    if (balanceError) errors.push(balanceError);
  }
  
  if (account.interestRate !== undefined && account.interestRate !== null) {
    const rateError = validateNumber(account.interestRate, "Interest rate", 0, 1);
    if (rateError) errors.push(rateError);
  }
  
  return createValidationResult(errors.length === 0, errors);
}

// ============================================================================
// INVESTMENT VALIDATION
// ============================================================================

export function validateInvestmentAccount(account: Partial<InvestmentAccount>): ValidationResult {
  const errors: string[] = [];
  
  const accountNameError = validateRequired(account.accountName, "Account name");
  if (accountNameError) errors.push(accountNameError);
  
  const custodianError = validateRequired(account.custodian, "Custodian");
  if (custodianError) errors.push(custodianError);
  
  if (account.totalValue !== undefined) {
    const valueError = validateNumber(account.totalValue, "Total value", 0);
    if (valueError) errors.push(valueError);
  }
  
  if (account.owners && account.owners.length > 0) {
    const ownershipError = validateOwnerShares(account.owners);
    if (ownershipError) errors.push(ownershipError);
  }
  
  return createValidationResult(errors.length === 0, errors);
}

// ============================================================================
// BUSINESS ENTITY VALIDATION
// ============================================================================

export function validateBusinessEntity(entity: Partial<BusinessEntity>): ValidationResult {
  const errors: string[] = [];
  
  const nameError = validateRequired(entity.businessName, "Business name");
  if (nameError) errors.push(nameError);
  
  if (entity.ownershipPercentage !== undefined) {
    const ownershipError = validatePercentage(entity.ownershipPercentage, "Ownership percentage");
    if (ownershipError) errors.push(ownershipError);
  }
  
  // Validate EIN format (basic check)
  if (entity.ein) {
    const einRegex = /^\d{2}-?\d{7}$/;
    if (!einRegex.test(entity.ein)) {
      errors.push("EIN must be in format XX-XXXXXXX");
    }
  }
  
  return createValidationResult(errors.length === 0, errors);
}

// ============================================================================
// LIABILITY VALIDATION
// ============================================================================

export function validatePersonalLoan(loan: Partial<PersonalLoan>): ValidationResult {
  const errors: string[] = [];
  
  const lenderError = validateRequired(loan.lender, "Lender");
  if (lenderError) errors.push(lenderError);
  
  if (loan.currentBalance !== undefined) {
    const balanceError = validateNumber(loan.currentBalance, "Current balance", 0);
    if (balanceError) errors.push(balanceError);
  }
  
  if (loan.originalBalance !== undefined) {
    const originalError = validateNumber(loan.originalBalance, "Original balance", 0);
    if (originalError) errors.push(originalError);
    
    // Logical constraint: current balance <= original balance
    if (loan.currentBalance !== undefined && loan.currentBalance > loan.originalBalance) {
      errors.push("Current balance cannot exceed original balance");
    }
  }
  
  if (loan.interestRate !== undefined) {
    const rateError = validateNumber(loan.interestRate, "Interest rate", 0, 1);
    if (rateError) errors.push(rateError);
  }
  
  return createValidationResult(errors.length === 0, errors);
}

export function validateCreditLine(creditLine: Partial<CreditLine>): ValidationResult {
  const errors: string[] = [];
  
  const institutionError = validateRequired(creditLine.institution, "Institution");
  if (institutionError) errors.push(institutionError);
  
  if (creditLine.creditLimit !== undefined) {
    const limitError = validateNumber(creditLine.creditLimit, "Credit limit", 0);
    if (limitError) errors.push(limitError);
  }
  
  if (creditLine.currentBalance !== undefined) {
    const balanceError = validateNumber(creditLine.currentBalance, "Current balance", 0);
    if (balanceError) errors.push(balanceError);
    
    // Logical constraint: balance <= limit
    if (creditLine.creditLimit !== undefined && creditLine.currentBalance > creditLine.creditLimit) {
      errors.push("Current balance cannot exceed credit limit");
    }
  }
  
  return createValidationResult(errors.length === 0, errors);
}

export function validateCreditCard(card: Partial<CreditCard>): ValidationResult {
  const errors: string[] = [];
  
  const issuerError = validateRequired(card.issuer, "Issuer");
  if (issuerError) errors.push(issuerError);
  
  if (card.creditLimit !== undefined) {
    const limitError = validateNumber(card.creditLimit, "Credit limit", 0);
    if (limitError) errors.push(limitError);
  }
  
  if (card.currentBalance !== undefined) {
    const balanceError = validateNumber(card.currentBalance, "Current balance", 0);
    if (balanceError) errors.push(balanceError);
    
    // Logical constraint: balance <= limit
    if (card.creditLimit !== undefined && card.currentBalance > card.creditLimit) {
      errors.push("Current balance cannot exceed credit limit");
    }
  }
  
  return createValidationResult(errors.length === 0, errors);
}

// ============================================================================
// INCOME VALIDATION
// ============================================================================

export function validateIncomeSource(source: Partial<IncomeSource>): ValidationResult {
  const errors: string[] = [];
  
  const sourceNameError = validateRequired(source.sourceName, "Source name");
  if (sourceNameError) errors.push(sourceNameError);
  
  if (source.monthlyAmount !== undefined) {
    const amountError = validateNumber(source.monthlyAmount, "Monthly amount", 0);
    if (amountError) errors.push(amountError);
  }
  
  // Date validations
  if (source.startDate) {
    const startDateError = validateDate(source.startDate, "Start date");
    if (startDateError) errors.push(startDateError);
  }
  
  if (source.endDate) {
    const endDateError = validateDate(source.endDate, "End date");
    if (endDateError) errors.push(endDateError);
  }
  
  // Logical constraint: end date must be after start date
  if (source.startDate && source.endDate) {
    const start = new Date(source.startDate);
    const end = new Date(source.endDate);
    if (end <= start) {
      errors.push("End date must be after start date");
    }
  }
  
  return createValidationResult(errors.length === 0, errors);
}



