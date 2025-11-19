import { getAirtableBase, TABLES } from "./client";
import type { PersonalAsset, Liability } from "@/types";

/**
 * Fetch all personal assets from Airtable
 */
export async function getPersonalAssets(): Promise<PersonalAsset[]> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error("Airtable not configured");
  }
  
  try {
    const records = await base(TABLES.PERSONAL_ASSETS)
      .select({
        view: "Grid view",
      })
      .all();

    return records.map((record) => ({
      id: record.id,
      category: (record.fields.category as string) || "",
      description: (record.fields.description as string) || "",
      value: (record.fields.value as number) || 0,
      receivableName: (record.fields.receivable_name as string) || undefined,
      dueDate: (record.fields.due_date as string) || undefined,
      debtorEmail: (record.fields.debtor_email as string) || undefined,
      debtorPhone: (record.fields.debtor_phone as string) || undefined,
      debtorAddress: (record.fields.debtor_address as string) || undefined,
      notes: (record.fields.notes as string) || undefined,
    }));
  } catch (error) {
    console.error("Error fetching personal assets:", error);
    throw error;
  }
}

/**
 * Fetch all liabilities from Airtable
 */
export async function getLiabilities(): Promise<Liability[]> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error("Airtable not configured");
  }
  
  try {
    const records = await base(TABLES.LIABILITIES)
      .select({
        view: "Grid view",
      })
      .all();

    return records.map((record) => ({
      id: record.id,
      category: (record.fields.category as string) || "",
      description: (record.fields.description as string) || "",
      balance: (record.fields.balance as number) || 0,
      payableTo: (record.fields.payable_to as string) || undefined,
      dueDate: (record.fields.due_date as string) || undefined,
      collateral: (record.fields.collateral as string) || undefined,
      finalDueDate: (record.fields.final_due_date as string) || undefined,
      monthlyPayment: (record.fields.monthly_payment as number) || undefined,
      creditorEmail: (record.fields.creditor_email as string) || undefined,
      creditorPhone: (record.fields.creditor_phone as string) || undefined,
      creditorAddress: (record.fields.creditor_address as string) || undefined,
      notes: (record.fields.notes as string) || undefined,
    }));
  } catch (error) {
    console.error("Error fetching liabilities:", error);
    throw error;
  }
}

/**
 * Update a personal asset value
 */
export async function updatePersonalAsset(
  id: string,
  updates: Partial<Omit<PersonalAsset, "id">>
): Promise<PersonalAsset> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error("Airtable not configured");
  }
  
  try {
    const fields: Record<string, unknown> = {};
    if (updates.category !== undefined) fields.category = updates.category;
    if (updates.description !== undefined) fields.description = updates.description;
    if (updates.value !== undefined) fields.value = updates.value;
    if (updates.receivableName !== undefined) fields.receivable_name = updates.receivableName || null;
    if (updates.dueDate !== undefined) fields.due_date = updates.dueDate || null;
    if (updates.debtorEmail !== undefined) fields.debtor_email = updates.debtorEmail || null;
    if (updates.debtorPhone !== undefined) fields.debtor_phone = updates.debtorPhone || null;
    if (updates.debtorAddress !== undefined) fields.debtor_address = updates.debtorAddress || null;
    if (updates.notes !== undefined) fields.notes = updates.notes || null;

    const record = await base(TABLES.PERSONAL_ASSETS).update(id, fields);

    return {
      id: record.id,
      category: (record.fields.category as string) || "",
      description: (record.fields.description as string) || "",
      value: (record.fields.value as number) || 0,
      receivableName: (record.fields.receivable_name as string) || undefined,
      dueDate: (record.fields.due_date as string) || undefined,
      debtorEmail: (record.fields.debtor_email as string) || undefined,
      debtorPhone: (record.fields.debtor_phone as string) || undefined,
      debtorAddress: (record.fields.debtor_address as string) || undefined,
      notes: (record.fields.notes as string) || undefined,
    };
  } catch (error) {
    console.error("Error updating personal asset:", error);
    throw error;
  }
}

/**
 * Update a liability balance
 */
export async function updateLiability(
  id: string,
  updates: Partial<Omit<Liability, "id">>
): Promise<Liability> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error("Airtable not configured");
  }
  
  try {
    const fields: Record<string, unknown> = {};
    if (updates.category !== undefined) fields.category = updates.category;
    if (updates.description !== undefined) fields.description = updates.description;
    if (updates.balance !== undefined) fields.balance = updates.balance;
    if (updates.payableTo !== undefined) fields.payable_to = updates.payableTo || null;
    if (updates.dueDate !== undefined) fields.due_date = updates.dueDate || null;
    if (updates.collateral !== undefined) fields.collateral = updates.collateral || null;
    if (updates.finalDueDate !== undefined) fields.final_due_date = updates.finalDueDate || null;
    if (updates.monthlyPayment !== undefined) fields.monthly_payment = updates.monthlyPayment || null;
    if (updates.creditorEmail !== undefined) fields.creditor_email = updates.creditorEmail || null;
    if (updates.creditorPhone !== undefined) fields.creditor_phone = updates.creditorPhone || null;
    if (updates.creditorAddress !== undefined) fields.creditor_address = updates.creditorAddress || null;
    if (updates.notes !== undefined) fields.notes = updates.notes || null;

    const record = await base(TABLES.LIABILITIES).update(id, fields);

    return {
      id: record.id,
      category: (record.fields.category as string) || "",
      description: (record.fields.description as string) || "",
      balance: (record.fields.balance as number) || 0,
      payableTo: (record.fields.payable_to as string) || undefined,
      dueDate: (record.fields.due_date as string) || undefined,
      collateral: (record.fields.collateral as string) || undefined,
      finalDueDate: (record.fields.final_due_date as string) || undefined,
      monthlyPayment: (record.fields.monthly_payment as number) || undefined,
      creditorEmail: (record.fields.creditor_email as string) || undefined,
      creditorPhone: (record.fields.creditor_phone as string) || undefined,
      creditorAddress: (record.fields.creditor_address as string) || undefined,
      notes: (record.fields.notes as string) || undefined,
    };
  } catch (error) {
    console.error("Error updating liability:", error);
    throw error;
  }
}

