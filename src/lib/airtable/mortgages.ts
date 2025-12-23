import { getAirtableBase, TABLES } from "./client";
import type { Mortgage } from "@/types";
import { markSnapshotsOutdated } from "@/lib/snapshots/snapshot-repository";

/**
 * Fetch all mortgages from Airtable
 */
export async function getMortgages(): Promise<Mortgage[]> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error("Airtable not configured");
  }
  
  try {
    const records = await base(TABLES.MORTGAGES)
      .select({
        view: "Grid view",
      })
      .all();

    return records.map((record) => ({
      id: record.id,
      propertyId: (record.fields.property_id as string) || "",
      lender: (record.fields.lender as string) || "",
      principalBalance: (record.fields.principal_balance as number) || 0,
      interestRate: (record.fields.interest_rate as number) || 0,
      paymentAmount: (record.fields.payment_amount as number) || 0,
      lastUpdated: (record.fields.last_updated as string) || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching mortgages:", error);
    throw error;
  }
}

/**
 * Get mortgages for a specific property
 */
export async function getMortgagesByProperty(propertyId: string): Promise<Mortgage[]> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error("Airtable not configured");
  }
  
  try {
    const records = await base(TABLES.MORTGAGES)
      .select({
        filterByFormula: `{property_id} = "${propertyId}"`,
      })
      .all();

    return records.map((record) => ({
      id: record.id,
      propertyId: (record.fields.property_id as string) || "",
      lender: (record.fields.lender as string) || "",
      principalBalance: (record.fields.principal_balance as number) || 0,
      interestRate: (record.fields.interest_rate as number) || 0,
      paymentAmount: (record.fields.payment_amount as number) || 0,
      lastUpdated: (record.fields.last_updated as string) || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching mortgages by property:", error);
    throw error;
  }
}

/**
 * Update mortgage balance - this is the key function for monthly updates
 */
export async function updateMortgageBalance(
  id: string,
  newBalance: number
): Promise<Mortgage> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error("Airtable not configured");
  }
  
  try {
    const record = await base(TABLES.MORTGAGES).update(id, {
      principal_balance: newBalance,
      last_updated: new Date().toISOString(),
    });

    // Mark snapshots as outdated
    try {
      await markSnapshotsOutdated(`Mortgage balance updated: ${id}`);
    } catch (error) {
      console.error("Error marking snapshots outdated:", error);
      // Don't fail the update if snapshot marking fails
    }

    return {
      id: record.id,
      propertyId: (record.fields.property_id as string) || "",
      lender: (record.fields.lender as string) || "",
      principalBalance: (record.fields.principal_balance as number) || 0,
      interestRate: (record.fields.interest_rate as number) || 0,
      paymentAmount: (record.fields.payment_amount as number) || 0,
      lastUpdated: (record.fields.last_updated as string) || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error updating mortgage balance:", error);
    throw error;
  }
}

/**
 * Create a new mortgage
 */
export async function createMortgage(mortgage: Omit<Mortgage, "id">): Promise<Mortgage> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error("Airtable not configured");
  }
  
  try {
    const record = await base(TABLES.MORTGAGES).create({
      property_id: mortgage.propertyId,
      lender: mortgage.lender,
      principal_balance: mortgage.principalBalance,
      interest_rate: mortgage.interestRate,
      payment_amount: mortgage.paymentAmount,
      last_updated: mortgage.lastUpdated || new Date().toISOString(),
    });

    // Mark snapshots as outdated
    try {
      await markSnapshotsOutdated(`New mortgage created: ${record.id}`);
    } catch (error) {
      console.error("Error marking snapshots outdated:", error);
      // Don't fail the create if snapshot marking fails
    }

    return {
      id: record.id,
      propertyId: (record.fields.property_id as string) || "",
      lender: (record.fields.lender as string) || "",
      principalBalance: (record.fields.principal_balance as number) || 0,
      interestRate: (record.fields.interest_rate as number) || 0,
      paymentAmount: (record.fields.payment_amount as number) || 0,
      lastUpdated: (record.fields.last_updated as string) || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error creating mortgage:", error);
    throw error;
  }
}

