/**
 * PFS Assembler
 * 
 * Aggregates all PFS modules into a fully structured PFS object.
 * This is the main function used by UI, export, and future PDF generation.
 */

import type { FullPFS, PFSSummaries } from "../types";
import { calculatePFSSummaries } from "../calculations";
import { syncAllEntities } from "../sync";

// ============================================================================
// DATA FETCHERS (These will be implemented by the data layer)
// ============================================================================

export interface PFSDataFetchers {
  getPersonalInfo: (userId: string) => Promise<any>;
  getRealEstate: (userId: string) => Promise<any[]>;
  getBankAccounts: (userId: string) => Promise<any[]>;
  getInvestments: (userId: string) => Promise<any[]>;
  getRSUs: (userId: string) => Promise<any[]>;
  getPrivateEquity: (userId: string) => Promise<any[]>;
  getCapTables: (userId: string) => Promise<any[]>;
  getBusinessEntities: (userId: string) => Promise<any[]>;
  getPersonalLoans: (userId: string) => Promise<any[]>;
  getCreditLines: (userId: string) => Promise<any[]>;
  getCreditCards: (userId: string) => Promise<any[]>;
  getIncomeSources: (userId: string) => Promise<any[]>;
}

// ============================================================================
// PFS ASSEMBLER
// ============================================================================

/**
 * Assemble a complete PFS from all data sources
 * 
 * This is the main function that:
 * 1. Fetches all data for a user
 * 2. Syncs all entities (recalculates derived fields)
 * 3. Calculates all summaries
 * 4. Returns a complete, ready-to-use PFS object
 */
export async function assemblePFS(
  userId: string,
  fetchers: PFSDataFetchers
): Promise<FullPFS> {
  // Fetch all data in parallel
  const [
    personalInfo,
    realEstate,
    bankAccounts,
    investments,
    rsus,
    privateEquity,
    capTables,
    businessEntities,
    personalLoans,
    creditLines,
    creditCards,
    incomeSources,
  ] = await Promise.all([
    fetchers.getPersonalInfo(userId),
    fetchers.getRealEstate(userId),
    fetchers.getBankAccounts(userId),
    fetchers.getInvestments(userId),
    fetchers.getRSUs(userId),
    fetchers.getPrivateEquity(userId),
    fetchers.getCapTables(userId),
    fetchers.getBusinessEntities(userId),
    fetchers.getPersonalLoans(userId),
    fetchers.getCreditLines(userId),
    fetchers.getCreditCards(userId),
    fetchers.getIncomeSources(userId),
  ]);
  
  // Sync all entities (recalculate derived fields)
  const synced = syncAllEntities({
    realEstate,
    investments,
    businessEntities,
    creditLines,
    creditCards,
    incomeSources,
  });
  
  // Use synced data for calculations
  const syncedRealEstate = synced.realEstate || realEstate;
  const syncedInvestments = synced.investments || investments;
  const syncedBusinessEntities = synced.businessEntities || businessEntities;
  const syncedCreditLines = synced.creditLines || creditLines;
  const syncedCreditCards = synced.creditCards || creditCards;
  const syncedIncomeSources = synced.incomeSources || incomeSources;
  
  // Calculate all summaries
  const summaries = calculatePFSSummaries(
    syncedRealEstate,
    bankAccounts,
    syncedInvestments,
    rsus,
    privateEquity,
    capTables,
    syncedBusinessEntities,
    personalLoans,
    syncedCreditLines,
    syncedCreditCards,
    syncedIncomeSources
  );
  
  // Assemble the complete PFS
  const pfs: FullPFS = {
    id: `pfs-${userId}-${Date.now()}`,
    userId,
    generatedAt: new Date().toISOString(),
    personalInfo,
    realEstate: syncedRealEstate,
    bankAccounts,
    investments: syncedInvestments,
    rsuRestrictedStock: rsus,
    privateEquity,
    capTables,
    businessEntities: syncedBusinessEntities,
    personalLoans,
    creditLines: syncedCreditLines,
    creditCards: syncedCreditCards,
    incomeSources: syncedIncomeSources,
    summaries,
  };
  
  return pfs;
}

/**
 * Assemble PFS from already-fetched data (useful for testing or when data is already loaded)
 */
export function assemblePFSFromData(data: {
  personalInfo: any;
  realEstate?: any[];
  bankAccounts?: any[];
  investments?: any[];
  rsus?: any[];
  privateEquity?: any[];
  capTables?: any[];
  businessEntities?: any[];
  personalLoans?: any[];
  creditLines?: any[];
  creditCards?: any[];
  incomeSources?: any[];
  userId: string;
}): FullPFS {
  const {
    personalInfo,
    realEstate = [],
    bankAccounts = [],
    investments = [],
    rsus = [],
    privateEquity = [],
    capTables = [],
    businessEntities = [],
    personalLoans = [],
    creditLines = [],
    creditCards = [],
    incomeSources = [],
    userId,
  } = data;
  
  // Sync all entities
  const synced = syncAllEntities({
    realEstate,
    investments,
    businessEntities,
    creditLines,
    creditCards,
    incomeSources,
  });
  
  const syncedRealEstate = synced.realEstate || realEstate;
  const syncedInvestments = synced.investments || investments;
  const syncedBusinessEntities = synced.businessEntities || businessEntities;
  const syncedCreditLines = synced.creditLines || creditLines;
  const syncedCreditCards = synced.creditCards || creditCards;
  const syncedIncomeSources = synced.incomeSources || incomeSources;
  
  // Calculate summaries
  const summaries = calculatePFSSummaries(
    syncedRealEstate,
    bankAccounts,
    syncedInvestments,
    rsus,
    privateEquity,
    capTables,
    syncedBusinessEntities,
    personalLoans,
    syncedCreditLines,
    syncedCreditCards,
    syncedIncomeSources
  );
  
  return {
    id: `pfs-${userId}-${Date.now()}`,
    userId,
    generatedAt: new Date().toISOString(),
    personalInfo,
    realEstate: syncedRealEstate,
    bankAccounts,
    investments: syncedInvestments,
    rsuRestrictedStock: rsus,
    privateEquity,
    capTables,
    businessEntities: syncedBusinessEntities,
    personalLoans,
    creditLines: syncedCreditLines,
    creditCards: syncedCreditCards,
    incomeSources: syncedIncomeSources,
    summaries,
  };
}

/**
 * Get a summary-only view of the PFS (lighter weight)
 */
export async function assemblePFSSummary(
  userId: string,
  fetchers: PFSDataFetchers
): Promise<PFSSummaries> {
  const pfs = await assemblePFS(userId, fetchers);
  return pfs.summaries;
}





