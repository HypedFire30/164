/**
 * Versioning System
 * 
 * Handles version tracking, snapshots, and rollback functionality for all entities.
 */

import type { BaseEntity } from "../types";

// ============================================================================
// VERSION MANAGEMENT
// ============================================================================

/**
 * Create a new entity with initial version metadata
 */
export function createVersionedEntity<T extends BaseEntity>(
  data: Omit<T, "id" | "createdAt" | "updatedAt" | "version" | "snapshot">
): Omit<T, "snapshot"> {
  const now = new Date().toISOString();
  const id = generateId();
  
  return {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
    version: 1,
  } as Omit<T, "snapshot">;
}

/**
 * Update an entity with version increment and snapshot
 */
export function updateVersionedEntity<T extends BaseEntity>(
  entity: T,
  updates: Partial<Omit<T, "id" | "createdAt" | "updatedAt" | "version" | "snapshot">>
): T {
  // Create snapshot before update
  const snapshot = createSnapshot(entity);
  
  return {
    ...entity,
    ...updates,
    updatedAt: new Date().toISOString(),
    version: entity.version + 1,
    snapshot,
  };
}

/**
 * Create a snapshot of an entity for rollback
 */
export function createSnapshot<T extends BaseEntity>(entity: T): Record<string, unknown> {
  // Exclude snapshot and deletedAt from snapshot
  const { snapshot, deletedAt, ...snapshotData } = entity;
  return snapshotData as Record<string, unknown>;
}

/**
 * Restore an entity from a snapshot
 */
export function restoreFromSnapshot<T extends BaseEntity>(
  entity: T,
  snapshot: Record<string, unknown>
): T {
  if (!snapshot) {
    throw new Error("No snapshot available for rollback");
  }
  
  return {
    ...snapshot,
    updatedAt: new Date().toISOString(),
    version: entity.version + 1,
    snapshot: createSnapshot(entity), // Save current state before rollback
  } as T;
}

/**
 * Soft delete an entity
 */
export function softDeleteEntity<T extends BaseEntity>(entity: T): T {
  return {
    ...entity,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: entity.version + 1,
  };
}

/**
 * Restore a soft-deleted entity
 */
export function restoreEntity<T extends BaseEntity>(entity: T): T {
  return {
    ...entity,
    deletedAt: null,
    updatedAt: new Date().toISOString(),
    version: entity.version + 1,
  };
}

/**
 * Check if entity is deleted
 */
export function isEntityDeleted(entity: BaseEntity): boolean {
  return entity.deletedAt !== null && entity.deletedAt !== undefined;
}

/**
 * Filter out deleted entities
 */
export function filterActiveEntities<T extends BaseEntity>(entities: T[]): T[] {
  return entities.filter(entity => !isEntityDeleted(entity));
}

// ============================================================================
// VERSION HISTORY
// ============================================================================

export interface VersionHistoryEntry {
  version: number;
  timestamp: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  userId?: string;
}

/**
 * Compare two versions of an entity and extract changes
 */
export function extractChanges<T extends BaseEntity>(
  oldEntity: T,
  newEntity: T
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  
  // Compare all fields except version metadata
  const fieldsToCompare = Object.keys(newEntity).filter(
    key => !["id", "createdAt", "updatedAt", "version", "snapshot", "deletedAt"].includes(key)
  );
  
  for (const field of fieldsToCompare) {
    const oldValue = (oldEntity as Record<string, unknown>)[field];
    const newValue = (newEntity as Record<string, unknown>)[field];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[field] = { from: oldValue, to: newValue };
    }
  }
  
  return changes;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID (simple implementation - use UUID in production)
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get entity age in days
 */
export function getEntityAge(entity: BaseEntity): number {
  const created = new Date(entity.createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get time since last update in days
 */
export function getTimeSinceUpdate(entity: BaseEntity): number {
  const updated = new Date(entity.updatedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - updated.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}





