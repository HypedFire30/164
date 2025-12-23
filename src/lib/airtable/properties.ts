import { getAirtableBase, TABLES } from "./client";
import type { Property } from "@/types";
import { markSnapshotsOutdated } from "@/lib/snapshots/snapshot-repository";

/**
 * Fetch all properties from Airtable
 */
export async function getProperties(): Promise<Property[]> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error("Airtable not configured");
  }
  
  try {
    const records = await base(TABLES.PROPERTIES)
      .select({
        view: "Grid view", // Update to your view name if different
      })
      .all();

    return records.map((record) => ({
      id: record.id,
      address: (record.fields.address as string) || "",
      purchasePrice: (record.fields.purchase_price as number) || 0,
      currentValue: (record.fields.current_value as number) || 0,
      ownershipPercentage: (record.fields.ownership_percentage as number) || 100,
      mortgageId: (record.fields.mortgage_id as string) || undefined,
      notes: (record.fields.notes as string) || undefined,
      scheduleEDebtorName: (record.fields.schedule_e_debtor_name as string) || undefined,
      scheduleEPaymentSchedule: (record.fields.schedule_e_payment_schedule as string) || undefined,
      scheduleEAmountPastDue: (record.fields.schedule_e_amount_past_due as number) || undefined,
      scheduleEOriginalBalance: (record.fields.schedule_e_original_balance as number) || undefined,
      scheduleEPresentBalance: (record.fields.schedule_e_present_balance as number) || undefined,
      scheduleEInterestRate: (record.fields.schedule_e_interest_rate as number) || undefined,
    }));
  } catch (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }
}

/**
 * Get a single property by ID
 */
export async function getProperty(id: string): Promise<Property | null> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error("Airtable not configured");
  }
  
  try {
    const record = await base(TABLES.PROPERTIES).find(id);
    return {
      id: record.id,
      address: (record.fields.address as string) || "",
      purchasePrice: (record.fields.purchase_price as number) || 0,
      currentValue: (record.fields.current_value as number) || 0,
      ownershipPercentage: (record.fields.ownership_percentage as number) || 100,
      mortgageId: (record.fields.mortgage_id as string) || undefined,
      notes: (record.fields.notes as string) || undefined,
      scheduleEDebtorName: (record.fields.schedule_e_debtor_name as string) || undefined,
      scheduleEPaymentSchedule: (record.fields.schedule_e_payment_schedule as string) || undefined,
      scheduleEAmountPastDue: (record.fields.schedule_e_amount_past_due as number) || undefined,
      scheduleEOriginalBalance: (record.fields.schedule_e_original_balance as number) || undefined,
      scheduleEPresentBalance: (record.fields.schedule_e_present_balance as number) || undefined,
      scheduleEInterestRate: (record.fields.schedule_e_interest_rate as number) || undefined,
    };
  } catch (error) {
    console.error("Error fetching property:", error);
    return null;
  }
}

/**
 * Update a property's current value
 */
export async function updatePropertyValue(
  id: string,
  newValue: number
): Promise<Property> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error("Airtable not configured");
  }
  
  try {
    const record = await base(TABLES.PROPERTIES).update(id, {
      current_value: newValue,
    });

    // Mark snapshots as outdated
    try {
      await markSnapshotsOutdated(`Property value updated: ${id}`);
    } catch (error) {
      console.error("Error marking snapshots outdated:", error);
      // Don't fail the update if snapshot marking fails
    }

    return {
      id: record.id,
      address: (record.fields.address as string) || "",
      purchasePrice: (record.fields.purchase_price as number) || 0,
      currentValue: (record.fields.current_value as number) || 0,
      ownershipPercentage: (record.fields.ownership_percentage as number) || 100,
      mortgageId: (record.fields.mortgage_id as string) || undefined,
      notes: (record.fields.notes as string) || undefined,
      scheduleEDebtorName: (record.fields.schedule_e_debtor_name as string) || undefined,
      scheduleEPaymentSchedule: (record.fields.schedule_e_payment_schedule as string) || undefined,
      scheduleEAmountPastDue: (record.fields.schedule_e_amount_past_due as number) || undefined,
      scheduleEOriginalBalance: (record.fields.schedule_e_original_balance as number) || undefined,
      scheduleEPresentBalance: (record.fields.schedule_e_present_balance as number) || undefined,
      scheduleEInterestRate: (record.fields.schedule_e_interest_rate as number) || undefined,
    };
  } catch (error) {
    console.error("Error updating property value:", error);
    throw error;
  }
}

/**
 * Update a property with partial data
 */
export async function updateProperty(
  id: string,
  updates: Partial<Omit<Property, "id">>
): Promise<Property> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error("Airtable not configured");
  }
  
  try {
    const fields: Record<string, unknown> = {};
    if (updates.address !== undefined) fields.address = updates.address;
    if (updates.purchasePrice !== undefined) fields.purchase_price = updates.purchasePrice;
    if (updates.currentValue !== undefined) fields.current_value = updates.currentValue;
    if (updates.ownershipPercentage !== undefined) fields.ownership_percentage = updates.ownershipPercentage;
    if (updates.mortgageId !== undefined) fields.mortgage_id = updates.mortgageId || null;
    if (updates.notes !== undefined) fields.notes = updates.notes;
    if (updates.scheduleEDebtorName !== undefined) fields.schedule_e_debtor_name = updates.scheduleEDebtorName || null;
    if (updates.scheduleEPaymentSchedule !== undefined) fields.schedule_e_payment_schedule = updates.scheduleEPaymentSchedule || null;
    if (updates.scheduleEAmountPastDue !== undefined) fields.schedule_e_amount_past_due = updates.scheduleEAmountPastDue || null;
    if (updates.scheduleEOriginalBalance !== undefined) fields.schedule_e_original_balance = updates.scheduleEOriginalBalance || null;
    if (updates.scheduleEPresentBalance !== undefined) fields.schedule_e_present_balance = updates.scheduleEPresentBalance || null;
    if (updates.scheduleEInterestRate !== undefined) fields.schedule_e_interest_rate = updates.scheduleEInterestRate || null;

    const record = await base(TABLES.PROPERTIES).update(id, fields);

    // Mark snapshots as outdated
    try {
      await markSnapshotsOutdated(`Property updated: ${id}`);
    } catch (error) {
      console.error("Error marking snapshots outdated:", error);
      // Don't fail the update if snapshot marking fails
    }

    return {
      id: record.id,
      address: (record.fields.address as string) || "",
      purchasePrice: (record.fields.purchase_price as number) || 0,
      currentValue: (record.fields.current_value as number) || 0,
      ownershipPercentage: (record.fields.ownership_percentage as number) || 100,
      mortgageId: (record.fields.mortgage_id as string) || undefined,
      notes: (record.fields.notes as string) || undefined,
      scheduleEDebtorName: (record.fields.schedule_e_debtor_name as string) || undefined,
      scheduleEPaymentSchedule: (record.fields.schedule_e_payment_schedule as string) || undefined,
      scheduleEAmountPastDue: (record.fields.schedule_e_amount_past_due as number) || undefined,
      scheduleEOriginalBalance: (record.fields.schedule_e_original_balance as number) || undefined,
      scheduleEPresentBalance: (record.fields.schedule_e_present_balance as number) || undefined,
      scheduleEInterestRate: (record.fields.schedule_e_interest_rate as number) || undefined,
    };
  } catch (error) {
    console.error("Error updating property:", error);
    throw error;
  }
}

/**
 * Create a new property
 */
export async function createProperty(property: Omit<Property, "id">): Promise<Property> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error("Airtable not configured");
  }
  
  try {
    const record = await base(TABLES.PROPERTIES).create({
      address: property.address,
      purchase_price: property.purchasePrice,
      current_value: property.currentValue,
      ownership_percentage: property.ownershipPercentage,
      mortgage_id: property.mortgageId || undefined,
      notes: property.notes || undefined,
      schedule_e_debtor_name: property.scheduleEDebtorName || undefined,
      schedule_e_payment_schedule: property.scheduleEPaymentSchedule || undefined,
      schedule_e_amount_past_due: property.scheduleEAmountPastDue || undefined,
      schedule_e_original_balance: property.scheduleEOriginalBalance || undefined,
      schedule_e_present_balance: property.scheduleEPresentBalance || undefined,
      schedule_e_interest_rate: property.scheduleEInterestRate || undefined,
    });

    // Mark snapshots as outdated
    try {
      await markSnapshotsOutdated(`New property created: ${record.id}`);
    } catch (error) {
      console.error("Error marking snapshots outdated:", error);
      // Don't fail the create if snapshot marking fails
    }

    return {
      id: record.id,
      address: (record.fields.address as string) || "",
      purchasePrice: (record.fields.purchase_price as number) || 0,
      currentValue: (record.fields.current_value as number) || 0,
      ownershipPercentage: (record.fields.ownership_percentage as number) || 100,
      mortgageId: (record.fields.mortgage_id as string) || undefined,
      notes: (record.fields.notes as string) || undefined,
      scheduleEDebtorName: (record.fields.schedule_e_debtor_name as string) || undefined,
      scheduleEPaymentSchedule: (record.fields.schedule_e_payment_schedule as string) || undefined,
      scheduleEAmountPastDue: (record.fields.schedule_e_amount_past_due as number) || undefined,
      scheduleEOriginalBalance: (record.fields.schedule_e_original_balance as number) || undefined,
      scheduleEPresentBalance: (record.fields.schedule_e_present_balance as number) || undefined,
      scheduleEInterestRate: (record.fields.schedule_e_interest_rate as number) || undefined,
    };
  } catch (error) {
    console.error("Error creating property:", error);
    throw error;
  }
}

/**
 * Delete a property
 */
export async function deleteProperty(id: string): Promise<void> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error("Airtable not configured");
  }
  
  try {
    await base(TABLES.PROPERTIES).destroy(id);
  } catch (error) {
    console.error("Error deleting property:", error);
    throw error;
  }
}

