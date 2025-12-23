/**
 * Snapshot Repository for storing and retrieving PFS snapshots
 */

import { getAirtableBase, TABLES } from "@/lib/airtable/client";
import type { PFSSnapshot } from "@/types/snapshots";

// For now, we'll use localStorage as a fallback when Airtable is not configured
// In production, this would be stored in Airtable or a dedicated database

const STORAGE_KEY = "pfs_snapshots";

/**
 * Get all snapshots
 */
export async function getAllSnapshots(userId?: string): Promise<PFSSnapshot[]> {
  const base = getAirtableBase();
  
  if (base) {
    // Use Airtable
    try {
      const records = await base(TABLES.PFS_SNAPSHOTS)
        .select({
          view: "Grid view",
          sort: [{ field: "snapshot_date", direction: "desc" }],
        })
        .all();

      return records.map((record) => ({
        id: record.id,
        createdAt: record.fields.created_at || record.createdTime,
        updatedAt: record.fields.updated_at || record.createdTime,
        version: record.fields.version || 1,
        userId: record.fields.user_id || userId,
        snapshotName: record.fields.snapshot_name || `Snapshot ${new Date(record.fields.snapshot_date as string).toLocaleDateString()}`,
        snapshotDate: record.fields.snapshot_date as string,
        templateId: (record.fields.template_id as string) || undefined,
        templateName: (record.fields.template_name as string) || undefined,
        formData: JSON.parse(record.fields.form_data as string),
        totals: {
          totalAssets: record.fields.total_assets as number,
          totalLiabilities: record.fields.total_liabilities as number,
          netWorth: record.fields.net_worth as number,
        },
        isOutdated: record.fields.is_outdated === true,
        outdatedReason: record.fields.outdated_reason as string | undefined,
        notes: record.fields.notes as string | undefined,
        deletedAt: record.fields.deleted_at as string | null | undefined,
      })).filter(s => !s.deletedAt);
    } catch (error) {
      console.error("Error fetching snapshots from Airtable:", error);
      // Fall back to localStorage
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const snapshots: PFSSnapshot[] = JSON.parse(stored);
    return snapshots
      .filter(s => !s.deletedAt && (!userId || s.userId === userId))
      .sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime());
  } catch (error) {
    console.error("Error reading snapshots from localStorage:", error);
    return [];
  }
}

/**
 * Get a snapshot by ID
 */
export async function getSnapshotById(id: string): Promise<PFSSnapshot | null> {
  const base = getAirtableBase();
  
  if (base) {
    try {
      const record = await base(TABLES.PFS_SNAPSHOTS).find(id);
      return {
        id: record.id,
        createdAt: record.fields.created_at || record.createdTime,
        updatedAt: record.fields.updated_at || record.createdTime,
        version: record.fields.version || 1,
        userId: record.fields.user_id as string | undefined,
        snapshotName: record.fields.snapshot_name as string,
        snapshotDate: record.fields.snapshot_date as string,
        templateId: (record.fields.template_id as string) || undefined,
        templateName: (record.fields.template_name as string) || undefined,
        formData: JSON.parse(record.fields.form_data as string),
        totals: {
          totalAssets: record.fields.total_assets as number,
          totalLiabilities: record.fields.total_liabilities as number,
          netWorth: record.fields.net_worth as number,
        },
        isOutdated: record.fields.is_outdated === true,
        outdatedReason: record.fields.outdated_reason as string | undefined,
        notes: record.fields.notes as string | undefined,
        deletedAt: record.fields.deleted_at as string | null | undefined,
      };
    } catch (error) {
      console.error("Error fetching snapshot from Airtable:", error);
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const snapshots: PFSSnapshot[] = JSON.parse(stored);
    return snapshots.find(s => s.id === id) || null;
  } catch (error) {
    console.error("Error reading snapshot from localStorage:", error);
    return null;
  }
}

/**
 * Save a new snapshot
 */
export async function saveSnapshot(snapshot: Omit<PFSSnapshot, "id" | "createdAt" | "updatedAt" | "version">): Promise<PFSSnapshot> {
  const base = getAirtableBase();
  const now = new Date().toISOString();
  const newSnapshot: PFSSnapshot = {
    ...snapshot,
    id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  if (base) {
    try {
      const record = await base(TABLES.PFS_SNAPSHOTS).create({
        user_id: snapshot.userId || "default",
        snapshot_name: snapshot.snapshotName,
        snapshot_date: snapshot.snapshotDate,
        template_id: snapshot.templateId || null,
        template_name: snapshot.templateName || null,
        form_data: JSON.stringify(snapshot.formData),
        total_assets: snapshot.totals.totalAssets,
        total_liabilities: snapshot.totals.totalLiabilities,
        net_worth: snapshot.totals.netWorth,
        is_outdated: snapshot.isOutdated || false,
        outdated_reason: snapshot.outdatedReason || null,
        notes: snapshot.notes || null,
        created_at: now,
        updated_at: now,
        version: 1,
      });

      return {
        ...newSnapshot,
        id: record.id,
      };
    } catch (error) {
      console.error("Error saving snapshot to Airtable:", error);
      // Fall back to localStorage
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const snapshots: PFSSnapshot[] = stored ? JSON.parse(stored) : [];
    snapshots.push(newSnapshot);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
    return newSnapshot;
  } catch (error) {
    console.error("Error saving snapshot to localStorage:", error);
    throw error;
  }
}

/**
 * Update a snapshot (e.g., to mark as outdated)
 */
export async function updateSnapshot(
  id: string,
  updates: Partial<Omit<PFSSnapshot, "id" | "createdAt">>
): Promise<PFSSnapshot> {
  const base = getAirtableBase();
  const now = new Date().toISOString();

  if (base) {
    try {
      const existing = await base(TABLES.PFS_SNAPSHOTS).find(id);
      const updateFields: Record<string, any> = {
        updated_at: now,
      };

      if (updates.snapshotName !== undefined) updateFields.snapshot_name = updates.snapshotName;
      if (updates.isOutdated !== undefined) updateFields.is_outdated = updates.isOutdated;
      if (updates.outdatedReason !== undefined) updateFields.outdated_reason = updates.outdatedReason;
      if (updates.notes !== undefined) updateFields.notes = updates.notes;
      if (updates.deletedAt !== undefined) updateFields.deleted_at = updates.deletedAt;
      if (updates.version !== undefined) updateFields.version = updates.version;

      const record = await base(TABLES.PFS_SNAPSHOTS).update(id, updateFields);
      
      const snapshot = await getSnapshotById(id);
      if (!snapshot) throw new Error("Snapshot not found after update");
      return snapshot;
    } catch (error) {
      console.error("Error updating snapshot in Airtable:", error);
      // Fall back to localStorage
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) throw new Error("Snapshot not found");
    
    const snapshots: PFSSnapshot[] = JSON.parse(stored);
    const index = snapshots.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Snapshot not found");
    
    snapshots[index] = {
      ...snapshots[index],
      ...updates,
      updatedAt: now,
      version: (snapshots[index].version || 1) + 1,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
    return snapshots[index];
  } catch (error) {
    console.error("Error updating snapshot in localStorage:", error);
    throw error;
  }
}

/**
 * Delete a snapshot (soft delete)
 */
export async function deleteSnapshot(id: string): Promise<void> {
  await updateSnapshot(id, { deletedAt: new Date().toISOString() });
}

/**
 * Mark snapshots as outdated when underlying data changes
 */
export async function markSnapshotsOutdated(reason: string): Promise<void> {
  const snapshots = await getAllSnapshots();
  const now = new Date().toISOString();
  
  for (const snapshot of snapshots) {
    if (!snapshot.isOutdated) {
      await updateSnapshot(snapshot.id, {
        isOutdated: true,
        outdatedReason: reason,
      });
    }
  }
}

