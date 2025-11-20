/**
 * Entity Sync Logic
 * 
 * Handles recalculation and propagation of changes across entities.
 * When a field changes, this module ensures all dependent fields are updated.
 */

import type {
  RealEstateProperty,
  InvestmentAccount,
  BusinessEntity,
  CreditLine,
  CreditCard,
  IncomeSource,
} from "../types";
import {
  calculateTotalRealEstateValue,
  calculateTotalMortgageBalance,
  calculateTotalRealEstateEquity,
  calculateLTV,
  calculateNOI,
  calculateDSCR,
  calculateTotalInvestmentValue,
  calculateTotalBusinessEquity,
} from "../calculations";

// ============================================================================
// REAL ESTATE SYNC
// ============================================================================

/**
 * Sync a property after changes (recalculate derived fields)
 */
export function syncRealEstateProperty(
  property: RealEstateProperty
): RealEstateProperty {
  // Recalculate LTV if market value or mortgages changed
  const ltv = calculateLTV(property);
  
  // Recalculate NOI if income/expenses changed
  const noi = calculateNOI(property);
  
  // Recalculate DSCR if NOI or mortgages changed
  const dscr = calculateDSCR(property);
  
  // Return property with any derived fields (if we add them to the type)
  return property;
}

/**
 * Sync all properties and recalculate portfolio-level metrics
 */
export function syncRealEstatePortfolio(
  properties: RealEstateProperty[]
): {
  properties: RealEstateProperty[];
  portfolioMetrics: {
    totalValue: number;
    totalEquity: number;
    totalMortgages: number;
    averageLTV: number;
    totalNOI: number;
    averageDSCR: number;
  };
} {
  const syncedProperties = properties.map(syncRealEstateProperty);
  
  const totalValue = calculateTotalRealEstateValue(syncedProperties);
  const totalEquity = calculateTotalRealEstateEquity(syncedProperties);
  const totalMortgages = calculateTotalMortgageBalance(syncedProperties);
  
  // Calculate average LTV
  const ltvSum = syncedProperties.reduce((sum, prop) => sum + calculateLTV(prop), 0);
  const averageLTV = syncedProperties.length > 0 ? ltvSum / syncedProperties.length : 0;
  
  // Calculate total NOI
  const totalNOI = syncedProperties.reduce((sum, prop) => sum + calculateNOI(prop), 0);
  
  // Calculate average DSCR
  const dscrValues = syncedProperties
    .map(calculateDSCR)
    .filter(dscr => isFinite(dscr));
  const averageDSCR = dscrValues.length > 0
    ? dscrValues.reduce((sum, dscr) => sum + dscr, 0) / dscrValues.length
    : 0;
  
  return {
    properties: syncedProperties,
    portfolioMetrics: {
      totalValue,
      totalEquity,
      totalMortgages,
      averageLTV,
      totalNOI,
      averageDSCR,
    },
  };
}

// ============================================================================
// INVESTMENT SYNC
// ============================================================================

/**
 * Sync an investment account (recalculate total value from holdings)
 */
export function syncInvestmentAccount(
  account: InvestmentAccount
): InvestmentAccount {
  // Recalculate total value from stocks and ETFs
  const stocksValue = account.stocks.reduce(
    (sum, stock) => sum + (stock.currentValue || stock.shares * (stock.currentPrice || stock.averageCost)),
    0
  );
  
  const etfsValue = account.etfs.reduce(
    (sum, etf) => sum + (etf.currentValue || etf.shares * (etf.currentPrice || etf.averageCost)),
    0
  );
  
  const totalValue = stocksValue + etfsValue;
  
  return {
    ...account,
    totalValue,
  };
}

/**
 * Sync all investment accounts
 */
export function syncInvestmentPortfolio(
  accounts: InvestmentAccount[]
): {
  accounts: InvestmentAccount[];
  totalValue: number;
} {
  const syncedAccounts = accounts.map(syncInvestmentAccount);
  const totalValue = calculateTotalInvestmentValue(syncedAccounts);
  
  return {
    accounts: syncedAccounts,
    totalValue,
  };
}

// ============================================================================
// BUSINESS ENTITY SYNC
// ============================================================================

/**
 * Sync a business entity (recalculate totals)
 */
export function syncBusinessEntity(
  entity: BusinessEntity
): BusinessEntity {
  const totalAssets = entity.assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = entity.liabilities.reduce((sum, liability) => sum + liability.balance, 0);
  const netEquity = totalAssets - totalLiabilities;
  
  return {
    ...entity,
    totalAssets,
    totalLiabilities,
    netEquity,
  };
}

/**
 * Sync all business entities
 */
export function syncBusinessPortfolio(
  entities: BusinessEntity[]
): {
  entities: BusinessEntity[];
  totalEquity: number;
} {
  const syncedEntities = entities.map(syncBusinessEntity);
  const totalEquity = calculateTotalBusinessEquity(syncedEntities);
  
  return {
    entities: syncedEntities,
    totalEquity,
  };
}

// ============================================================================
// CREDIT LINE SYNC
// ============================================================================

/**
 * Sync a credit line (recalculate available credit)
 */
export function syncCreditLine(creditLine: CreditLine): CreditLine {
  const availableCredit = creditLine.creditLimit - creditLine.currentBalance;
  
  return {
    ...creditLine,
    availableCredit,
  };
}

/**
 * Sync all credit lines
 */
export function syncCreditLines(creditLines: CreditLine[]): CreditLine[] {
  return creditLines.map(syncCreditLine);
}

// ============================================================================
// CREDIT CARD SYNC
// ============================================================================

/**
 * Sync a credit card (recalculate available credit)
 */
export function syncCreditCard(card: CreditCard): CreditCard {
  const availableCredit = card.creditLimit - card.currentBalance;
  
  return {
    ...card,
    availableCredit,
  };
}

/**
 * Sync all credit cards
 */
export function syncCreditCards(cards: CreditCard[]): CreditCard[] {
  return cards.map(syncCreditCard);
}

// ============================================================================
// INCOME SYNC
// ============================================================================

/**
 * Sync an income source (recalculate annual amount)
 */
export function syncIncomeSource(source: IncomeSource): IncomeSource {
  const annualAmount = source.monthlyAmount * 12;
  
  return {
    ...source,
    annualAmount,
  };
}

/**
 * Sync all income sources
 */
export function syncIncomeSources(sources: IncomeSource[]): IncomeSource[] {
  return sources.map(syncIncomeSource);
}

// ============================================================================
// COMPREHENSIVE SYNC
// ============================================================================

/**
 * Sync all entities in a PFS
 * This is the main function to call after any updates
 */
export function syncAllEntities(data: {
  realEstate?: RealEstateProperty[];
  investments?: InvestmentAccount[];
  businessEntities?: BusinessEntity[];
  creditLines?: CreditLine[];
  creditCards?: CreditCard[];
  incomeSources?: IncomeSource[];
}): {
  realEstate?: RealEstateProperty[];
  investments?: InvestmentAccount[];
  businessEntities?: BusinessEntity[];
  creditLines?: CreditLine[];
  creditCards?: CreditCard[];
  incomeSources?: IncomeSource[];
} {
  const synced: typeof data = {};
  
  if (data.realEstate) {
    synced.realEstate = syncRealEstatePortfolio(data.realEstate).properties;
  }
  
  if (data.investments) {
    synced.investments = syncInvestmentPortfolio(data.investments).accounts;
  }
  
  if (data.businessEntities) {
    synced.businessEntities = syncBusinessPortfolio(data.businessEntities).entities;
  }
  
  if (data.creditLines) {
    synced.creditLines = syncCreditLines(data.creditLines);
  }
  
  if (data.creditCards) {
    synced.creditCards = syncCreditCards(data.creditCards);
  }
  
  if (data.incomeSources) {
    synced.incomeSources = syncIncomeSources(data.incomeSources);
  }
  
  return synced;
}





