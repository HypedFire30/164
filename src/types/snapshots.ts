/**
 * Snapshot types for PFS history tracking
 */

import type { PFSFormData } from "@/lib/pdf/pdf-filler";

export interface PFSSnapshot {
  id: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  version: number;
  userId?: string;
  snapshotName: string; // User-provided name or auto-generated
  snapshotDate: string; // ISO date string - when the snapshot was taken
  templateId?: string; // ID of the template used (e.g., 'default' for CC Credit Union)
  templateName?: string; // Name of the template/lender (e.g., 'CC Credit Union')
  formData: PFSFormData; // Complete form state
  totals: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  };
  isOutdated: boolean; // Flagged when underlying data changes
  outdatedReason?: string; // Why it's outdated
  notes?: string; // Optional user notes
  deletedAt?: string | null; // Soft delete
}

export interface SnapshotComparison {
  snapshot1: PFSSnapshot;
  snapshot2: PFSSnapshot;
  deltas: {
    field: string;
    value1: any;
    value2: any;
    delta: number; // For numeric fields
    changeType: "added" | "removed" | "modified" | "unchanged";
  }[];
  summary: {
    totalAssetsDelta: number;
    totalLiabilitiesDelta: number;
    netWorthDelta: number;
  };
}

