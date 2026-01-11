/**
 * Loan Calculator Utilities
 * 
 * Handles various loan types and calculates payment schedules, amortization, etc.
 */

export interface LoanTerms {
  principal: number;
  annualInterestRate: number; // As decimal (0.05 = 5%)
  termMonths: number;
  loanType: "Fixed" | "ARM" | "Interest-Only" | "Balloon";
  startDate: Date;
  // ARM specific
  initialRatePeriod?: number; // Months at initial rate
  adjustmentPeriod?: number; // Months between adjustments
  // Interest-only specific
  interestOnlyPeriod?: number; // Months of interest-only payments
  // Balloon specific
  balloonPayment?: number;
  balloonDate?: Date;
}

export interface PaymentSchedule {
  paymentNumber: number;
  date: Date;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  remainingBalance: number;
}

export interface LoanSummary {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  amortizationSchedule: PaymentSchedule[];
  currentBalance: number; // At current date
  nextPaymentDate: Date;
  nextPaymentAmount: number;
  paymentsRemaining: number;
}

/**
 * Calculate monthly payment for fixed-rate loan
 */
function calculateFixedPayment(
  principal: number,
  monthlyRate: number,
  termMonths: number
): number {
  if (monthlyRate === 0) {
    return principal / termMonths;
  }
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return principal * (monthlyRate * factor) / (factor - 1);
}

/**
 * Calculate interest-only payment
 */
function calculateInterestOnlyPayment(
  principal: number,
  monthlyRate: number
): number {
  return principal * monthlyRate;
}

/**
 * Generate full amortization schedule
 */
export function calculateAmortizationSchedule(terms: LoanTerms): PaymentSchedule[] {
  const schedule: PaymentSchedule[] = [];
  const monthlyRate = terms.annualInterestRate / 12;
  let remainingBalance = terms.principal;
  const currentDate = new Date();
  let paymentDate = new Date(terms.startDate);
  
  let paymentNumber = 0;
  
  // Handle different loan types
  if (terms.loanType === "Interest-Only" && terms.interestOnlyPeriod) {
    // Interest-only period
    for (let i = 0; i < terms.interestOnlyPeriod && remainingBalance > 0.01; i++) {
      paymentNumber++;
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = 0;
      const totalPayment = interestPayment;
      
      schedule.push({
        paymentNumber,
        date: new Date(paymentDate),
        principalPayment,
        interestPayment,
        totalPayment,
        remainingBalance,
      });
      
      paymentDate.setMonth(paymentDate.getMonth() + 1);
    }
    
    // Remaining term after interest-only period
    const remainingTerm = terms.termMonths - terms.interestOnlyPeriod;
    const monthlyPayment = calculateFixedPayment(remainingBalance, monthlyRate, remainingTerm);
    
    for (let i = 0; i < remainingTerm && remainingBalance > 0.01; i++) {
      paymentNumber++;
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance);
      const totalPayment = monthlyPayment;
      remainingBalance -= principalPayment;
      
      schedule.push({
        paymentNumber,
        date: new Date(paymentDate),
        principalPayment,
        interestPayment,
        totalPayment,
        remainingBalance: Math.max(0, remainingBalance),
      });
      
      paymentDate.setMonth(paymentDate.getMonth() + 1);
    }
  } else if (terms.loanType === "Balloon" && terms.balloonDate) {
    // Balloon loan: regular payments until balloon date
    const balloonDate = new Date(terms.balloonDate);
    const monthlyPayment = calculateFixedPayment(terms.principal, monthlyRate, terms.termMonths);
    
    while (paymentDate < balloonDate && remainingBalance > 0.01) {
      paymentNumber++;
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance);
      const totalPayment = monthlyPayment;
      remainingBalance -= principalPayment;
      
      schedule.push({
        paymentNumber,
        date: new Date(paymentDate),
        principalPayment,
        interestPayment,
        totalPayment,
        remainingBalance: Math.max(0, remainingBalance),
      });
      
      paymentDate.setMonth(paymentDate.getMonth() + 1);
    }
    
    // Balloon payment
    if (remainingBalance > 0.01) {
      paymentNumber++;
      const balloonPayment = terms.balloonPayment || remainingBalance;
      schedule.push({
        paymentNumber,
        date: new Date(balloonDate),
        principalPayment: remainingBalance,
        interestPayment: 0,
        totalPayment: balloonPayment,
        remainingBalance: 0,
      });
    }
  } else {
    // Standard fixed-rate loan
    const monthlyPayment = calculateFixedPayment(terms.principal, monthlyRate, terms.termMonths);
    
    for (let i = 0; i < terms.termMonths && remainingBalance > 0.01; i++) {
      paymentNumber++;
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance);
      const totalPayment = monthlyPayment;
      remainingBalance -= principalPayment;
      
      schedule.push({
        paymentNumber,
        date: new Date(paymentDate),
        principalPayment,
        interestPayment,
        totalPayment,
        remainingBalance: Math.max(0, remainingBalance),
      });
      
      paymentDate.setMonth(paymentDate.getMonth() + 1);
    }
  }
  
  return schedule;
}

/**
 * Calculate loan summary at current date
 */
export function calculateLoanSummary(
  terms: LoanTerms,
  currentDate: Date = new Date()
): LoanSummary {
  const schedule = calculateAmortizationSchedule(terms);
  const monthlyRate = terms.annualInterestRate / 12;
  
  // Find current payment
  let currentBalance = terms.principal;
  let nextPaymentIndex = 0;
  let totalInterest = 0;
  
  for (let i = 0; i < schedule.length; i++) {
    const payment = schedule[i];
    if (payment.date <= currentDate) {
      currentBalance = payment.remainingBalance;
      totalInterest += payment.interestPayment;
      nextPaymentIndex = i + 1;
    } else {
      break;
    }
  }
  
  const nextPayment = schedule[nextPaymentIndex] || schedule[0];
  const paymentsRemaining = schedule.length - nextPaymentIndex;
  
  // Calculate monthly payment (average of remaining payments)
  const monthlyPayment = schedule.length > 0 
    ? schedule[0].totalPayment 
    : calculateFixedPayment(terms.principal, monthlyRate, terms.termMonths);
  
  return {
    monthlyPayment,
    totalPayments: schedule.reduce((sum, p) => sum + p.totalPayment, 0),
    totalInterest: schedule.reduce((sum, p) => sum + p.interestPayment, 0),
    amortizationSchedule: schedule,
    currentBalance,
    nextPaymentDate: nextPayment.date,
    nextPaymentAmount: nextPayment.totalPayment,
    paymentsRemaining,
  };
}

/**
 * Calculate payment for given loan terms
 */
export function calculateLoanPayment(terms: LoanTerms): number {
  const monthlyRate = terms.annualInterestRate / 12;
  
  if (terms.loanType === "Interest-Only" && terms.interestOnlyPeriod) {
    return calculateInterestOnlyPayment(terms.principal, monthlyRate);
  }
  
  return calculateFixedPayment(terms.principal, monthlyRate, terms.termMonths);
}

/**
 * Calculate remaining balance at a specific date
 */
export function calculateBalanceAtDate(
  terms: LoanTerms,
  targetDate: Date
): number {
  const schedule = calculateAmortizationSchedule(terms);
  const payment = schedule.find(p => p.date > targetDate);
  return payment ? payment.remainingBalance : 0;
}

/**
 * Calculate principal paid between two dates
 */
export function calculatePrincipalPaid(
  terms: LoanTerms,
  startDate: Date,
  endDate: Date
): number {
  const schedule = calculateAmortizationSchedule(terms);
  const relevantPayments = schedule.filter(
    p => p.date >= startDate && p.date <= endDate
  );
  return relevantPayments.reduce((sum, p) => sum + p.principalPayment, 0);
}

/**
 * Calculate interest paid between two dates
 */
export function calculateInterestPaid(
  terms: LoanTerms,
  startDate: Date,
  endDate: Date
): number {
  const schedule = calculateAmortizationSchedule(terms);
  const relevantPayments = schedule.filter(
    p => p.date >= startDate && p.date <= endDate
  );
  return relevantPayments.reduce((sum, p) => sum + p.interestPayment, 0);
}
