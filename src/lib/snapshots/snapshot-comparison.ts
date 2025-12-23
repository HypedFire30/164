/**
 * Snapshot comparison utilities
 */

import type { PFSSnapshot, SnapshotComparison } from "@/types/snapshots";

/**
 * Compare two snapshots and generate deltas
 */
export function compareSnapshots(
  snapshot1: PFSSnapshot,
  snapshot2: PFSSnapshot
): SnapshotComparison {
  const deltas: SnapshotComparison["deltas"] = [];
  
  // Compare form data fields
  const formData1 = snapshot1.formData;
  const formData2 = snapshot2.formData;

  // Compare simple numeric fields
  const numericFields: (keyof typeof formData1)[] = [
    "cashOnHand",
    "cashOtherInstitutions",
    "buildingMaterialInventory",
    "lifeInsuranceCashValue",
    "retirementAccounts",
    "automobilesTrucks",
    "machineryTools",
    "otherAssetsValue",
    "notesPayableRelatives",
    "accruedInterest",
    "accruedSalaryWages",
    "accruedTaxesOther",
    "incomeTaxPayable",
    "chattelMortgage",
    "otherLiabilitiesValue",
    "guaranteedLoans",
    "suretyBonds",
    "contingentOtherValue",
    "insuranceAmount",
    "lifeInsuranceFaceValue",
    "lifeInsuranceBorrowed",
    "salaryWages",
    "proprietorshipDraws",
    "commissionsBonus",
    "dividendsInterest",
    "rentals",
    "otherIncome",
  ];

  for (const field of numericFields) {
    const val1 = formData1[field] as number || 0;
    const val2 = formData2[field] as number || 0;
    const delta = val2 - val1;
    
    if (delta !== 0) {
      deltas.push({
        field: field as string,
        value1: val1,
        value2: val2,
        delta,
        changeType: "modified",
      });
    } else {
      deltas.push({
        field: field as string,
        value1: val1,
        value2: val2,
        delta: 0,
        changeType: "unchanged",
      });
    }
  }

  // Compare string fields
  const stringFields: (keyof typeof formData1)[] = [
    "borrowerName",
    "otherAssets",
    "otherLiabilities",
    "contingentOther",
    "insuranceDescription",
  ];

  for (const field of stringFields) {
    const val1 = (formData1[field] as string || "").trim();
    const val2 = (formData2[field] as string || "").trim();
    
    if (val1 !== val2) {
      deltas.push({
        field: field as string,
        value1: val1,
        value2: val2,
        delta: 0,
        changeType: val1 === "" ? "added" : val2 === "" ? "removed" : "modified",
      });
    }
  }

  // Compare arrays (schedules)
  const arrayFields: (keyof typeof formData1)[] = [
    "scheduleA",
    "scheduleB",
    "scheduleC",
    "scheduleD",
    "scheduleE",
    "scheduleG",
    "scheduleH",
    "scheduleI",
    "selectedProperties",
  ];

  for (const field of arrayFields) {
    const arr1 = (formData1[field] as any[]) || [];
    const arr2 = (formData2[field] as any[]) || [];
    
    if (arr1.length !== arr2.length) {
      deltas.push({
        field: field as string,
        value1: arr1.length,
        value2: arr2.length,
        delta: arr2.length - arr1.length,
        changeType: arr2.length > arr1.length ? "added" : "removed",
      });
    } else {
      // Compare array contents (simplified - just check if different)
      const str1 = JSON.stringify(arr1);
      const str2 = JSON.stringify(arr2);
      if (str1 !== str2) {
        deltas.push({
          field: field as string,
          value1: arr1.length,
          value2: arr2.length,
          delta: 0,
          changeType: "modified",
        });
      }
    }
  }

  // Calculate summary deltas
  const summary = {
    totalAssetsDelta: snapshot2.totals.totalAssets - snapshot1.totals.totalAssets,
    totalLiabilitiesDelta: snapshot2.totals.totalLiabilities - snapshot1.totals.totalLiabilities,
    netWorthDelta: snapshot2.totals.netWorth - snapshot1.totals.netWorth,
  };

  return {
    snapshot1,
    snapshot2,
    deltas,
    summary,
  };
}

/**
 * Format field name for display
 */
export function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Get change color for delta
 */
export function getChangeColor(delta: number, isPositive: boolean = true): string {
  if (delta === 0) return "text-muted-foreground";
  if (isPositive) {
    return delta > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  } else {
    // For liabilities, positive delta is bad
    return delta > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400";
  }
}

