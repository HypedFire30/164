/**
 * Enhanced Airtable Data Layer
 * 
 * Generic repository pattern for Airtable CRUD operations.
 * Fully typed and decoupled from domain logic.
 */

import { getAirtableBase, TABLES } from "@/lib/airtable/client";
import type { BaseEntity } from "../types";
import { createVersionedEntity, updateVersionedEntity, softDeleteEntity } from "../versioning";

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface AirtableRepository<T extends BaseEntity> {
  fetchAll(userId?: string): Promise<T[]>;
  fetchById(id: string): Promise<T | null>;
  create(data: Omit<T, keyof BaseEntity>): Promise<T>;
  update(id: string, updates: Partial<Omit<T, keyof BaseEntity>>): Promise<T>;
  delete(id: string): Promise<void>;
  findByField(field: string, value: unknown): Promise<T[]>;
}

// ============================================================================
// FIELD MAPPING
// ============================================================================

/**
 * Map TypeScript camelCase to Airtable snake_case
 */
export function toAirtableField(tsField: string): string {
  return tsField
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

/**
 * Map Airtable snake_case to TypeScript camelCase
 */
export function fromAirtableField(airtableField: string): string {
  return airtableField
    .split("_")
    .map((word, index) => {
      if (index === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
}

// ============================================================================
// GENERIC REPOSITORY IMPLEMENTATION
// ============================================================================

export class GenericAirtableRepository<T extends BaseEntity> implements AirtableRepository<T> {
  constructor(
    private tableName: string,
    private fieldMapper: {
      toAirtable: (field: string) => string;
      fromAirtable: (field: string) => string;
    } = {
      toAirtable: toAirtableField,
      fromAirtable: fromAirtableField,
    }
  ) {}

  async fetchAll(userId?: string): Promise<T[]> {
    const base = getAirtableBase();
    if (!base) {
      throw new Error("Airtable not configured");
    }

    try {
      let query = base(this.tableName).select({
        view: "Grid view",
      });

      // Filter by userId if provided
      if (userId) {
        query = query.filterByFormula(`{user_id} = "${userId}"`);
      }

      const records = await query.all();

      return records.map(record => this.mapRecordToEntity(record));
    } catch (error) {
      console.error(`Error fetching all from ${this.tableName}:`, error);
      throw error;
    }
  }

  async fetchById(id: string): Promise<T | null> {
    const base = getAirtableBase();
    if (!base) {
      throw new Error("Airtable not configured");
    }

    try {
      const record = await base(this.tableName).find(id);
      return this.mapRecordToEntity(record);
    } catch (error) {
      console.error(`Error fetching ${id} from ${this.tableName}:`, error);
      return null;
    }
  }

  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    const base = getAirtableBase();
    if (!base) {
      throw new Error("Airtable not configured");
    }

    try {
      // Create versioned entity
      const entity = createVersionedEntity<T>(data as T);

      // Map to Airtable format
      const airtableFields = this.mapEntityToFields(entity);

      // Create record
      const record = await base(this.tableName).create(airtableFields);

      return this.mapRecordToEntity(record);
    } catch (error) {
      console.error(`Error creating in ${this.tableName}:`, error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Omit<T, keyof BaseEntity>>): Promise<T> {
    const base = getAirtableBase();
    if (!base) {
      throw new Error("Airtable not configured");
    }

    try {
      // Fetch existing entity
      const existing = await this.fetchById(id);
      if (!existing) {
        throw new Error(`Entity with id ${id} not found`);
      }

      // Update with versioning
      const updated = updateVersionedEntity(existing, updates as Partial<T>);

      // Map to Airtable format (only changed fields)
      const airtableFields = this.mapEntityToFields(updated, Object.keys(updates));

      // Update record
      const record = await base(this.tableName).update(id, airtableFields);

      return this.mapRecordToEntity(record);
    } catch (error) {
      console.error(`Error updating ${id} in ${this.tableName}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const base = getAirtableBase();
    if (!base) {
      throw new Error("Airtable not configured");
    }

    try {
      // Soft delete
      const existing = await this.fetchById(id);
      if (!existing) {
        throw new Error(`Entity with id ${id} not found`);
      }

      const deleted = softDeleteEntity(existing);
      const airtableFields = this.mapEntityToFields(deleted, ["deletedAt"]);

      await base(this.tableName).update(id, airtableFields);
    } catch (error) {
      console.error(`Error deleting ${id} from ${this.tableName}:`, error);
      throw error;
    }
  }

  async findByField(field: string, value: unknown): Promise<T[]> {
    const base = getAirtableBase();
    if (!base) {
      throw new Error("Airtable not configured");
    }

    try {
      const airtableField = this.fieldMapper.toAirtable(field);
      const formula = `{${airtableField}} = "${value}"`;
      
      const records = await base(this.tableName)
        .select({
          filterByFormula: formula,
        })
        .all();

      return records.map(record => this.mapRecordToEntity(record));
    } catch (error) {
      console.error(`Error finding by ${field} in ${this.tableName}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private mapRecordToEntity(record: any): T {
    const entity: any = {
      id: record.id,
    };

    // Map all fields from Airtable to TypeScript
    Object.keys(record.fields).forEach(airtableField => {
      const tsField = this.fieldMapper.fromAirtable(airtableField);
      entity[tsField] = record.fields[airtableField];
    });

    // Ensure base entity fields
    entity.createdAt = entity.createdAt || record.createdTime;
    entity.updatedAt = entity.updatedAt || record.createdTime;
    entity.version = entity.version || 1;

    return entity as T;
  }

  private mapEntityToFields(
    entity: T,
    fieldsToInclude?: string[]
  ): Record<string, unknown> {
    const fields: Record<string, unknown> = {};
    const entityObj = entity as Record<string, unknown>;

    // If fieldsToInclude is specified, only map those fields
    const fieldsToMap = fieldsToInclude || Object.keys(entityObj);

    fieldsToMap.forEach(tsField => {
      // Skip base entity fields that Airtable handles
      if (["id", "createdAt", "updatedAt", "version", "snapshot"].includes(tsField)) {
        return;
      }

      const airtableField = this.fieldMapper.toAirtable(tsField);
      const value = entityObj[tsField];

      // Handle nested objects (convert to JSON string or handle specially)
      if (value !== undefined && value !== null) {
        if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
          // For complex objects, store as JSON string
          fields[airtableField] = JSON.stringify(value);
        } else {
          fields[airtableField] = value;
        }
      }
    });

    return fields;
  }
}

// ============================================================================
// FACTORY FUNCTIONS FOR SPECIFIC ENTITIES
// ============================================================================

export function createRealEstateRepository() {
  return new GenericAirtableRepository<any>("Properties");
}

export function createBankAccountRepository() {
  return new GenericAirtableRepository<any>("BankAccounts");
}

export function createInvestmentRepository() {
  return new GenericAirtableRepository<any>("Investments");
}

export function createBusinessEntityRepository() {
  return new GenericAirtableRepository<any>("BusinessEntities");
}

export function createPersonalLoanRepository() {
  return new GenericAirtableRepository<any>("PersonalLoans");
}

export function createCreditLineRepository() {
  return new GenericAirtableRepository<any>("CreditLines");
}

export function createCreditCardRepository() {
  return new GenericAirtableRepository<any>("CreditCards");
}

export function createIncomeSourceRepository() {
  return new GenericAirtableRepository<any>("IncomeSources");
}



