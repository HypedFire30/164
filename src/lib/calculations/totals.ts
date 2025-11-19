import type { Property, Mortgage, PersonalAsset, Liability, PFSData } from "@/types";

/**
 * Calculate total real estate value (adjusted for ownership percentage)
 */
export function calculateTotalRealEstateValue(properties: Property[]): number {
  return properties.reduce((total, property) => {
    const adjustedValue = property.currentValue * (property.ownershipPercentage / 100);
    return total + adjustedValue;
  }, 0);
}

/**
 * Calculate total mortgage balance
 */
export function calculateTotalMortgageBalance(mortgages: Mortgage[]): number {
  return mortgages.reduce((total, mortgage) => total + mortgage.principalBalance, 0);
}

/**
 * Calculate total equity across all properties
 */
export function calculateTotalEquity(
  properties: Property[],
  mortgages: Mortgage[]
): number {
  const totalValue = calculateTotalRealEstateValue(properties);
  const totalMortgages = calculateTotalMortgageBalance(mortgages);
  return totalValue - totalMortgages;
}

/**
 * Calculate total personal assets
 */
export function calculateTotalPersonalAssets(assets: PersonalAsset[]): number {
  return assets.reduce((total, asset) => total + asset.value, 0);
}

/**
 * Calculate total liabilities
 */
export function calculateTotalLiabilities(liabilities: Liability[]): number {
  return liabilities.reduce((total, liability) => total + liability.balance, 0);
}

/**
 * Calculate net worth
 */
export function calculateNetWorth(
  properties: Property[],
  mortgages: Mortgage[],
  personalAssets: PersonalAsset[],
  liabilities: Liability[]
): number {
  const totalRealEstateValue = calculateTotalRealEstateValue(properties);
  const totalMortgageBalance = calculateTotalMortgageBalance(mortgages);
  const totalPersonalAssets = calculateTotalPersonalAssets(personalAssets);
  const totalLiabilities = calculateTotalLiabilities(liabilities);

  const totalAssets = totalRealEstateValue + totalPersonalAssets;
  const totalDebt = totalMortgageBalance + totalLiabilities;

  return totalAssets - totalDebt;
}

/**
 * Calculate per-property equity
 */
export function calculatePropertyEquity(
  property: Property,
  mortgage?: Mortgage
): number {
  const adjustedValue = property.currentValue * (property.ownershipPercentage / 100);
  const mortgageBalance = mortgage?.principalBalance || 0;
  return adjustedValue - mortgageBalance;
}

/**
 * Get all calculated totals for PFS
 */
export function calculatePFSTotals(
  properties: Property[],
  mortgages: Mortgage[],
  personalAssets: PersonalAsset[],
  liabilities: Liability[]
): PFSData["totals"] {
  const totalRealEstateValue = calculateTotalRealEstateValue(properties);
  const totalMortgageBalance = calculateTotalMortgageBalance(mortgages);
  const totalEquity = calculateTotalEquity(properties, mortgages);
  const totalPersonalAssets = calculateTotalPersonalAssets(personalAssets);
  const totalLiabilities = calculateTotalLiabilities(liabilities);
  const totalAssets = totalRealEstateValue + totalPersonalAssets;
  const netWorth = calculateNetWorth(properties, mortgages, personalAssets, liabilities);

  return {
    totalRealEstateValue,
    totalMortgageBalance,
    totalEquity,
    totalPersonalAssets,
    totalLiabilities,
    totalAssets,
    netWorth,
  };
}

