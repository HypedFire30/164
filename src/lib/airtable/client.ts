import Airtable from "airtable";

// Initialize Airtable client
// These will be set via environment variables
const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY || "";
const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID || "";

// Only initialize Airtable if both API key and base ID are provided
let base: Airtable.Base | null = null;

if (apiKey && baseId) {
  try {
    base = new Airtable({ apiKey }).base(baseId);
  } catch (error) {
    console.warn("Failed to initialize Airtable:", error);
  }
} else {
  console.log(
    "Airtable not configured. Using mock data. Set VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID in your .env file to use Airtable."
  );
}

// Export a getter function that returns null if not configured
export function getAirtableBase(): Airtable.Base | null {
  return base;
}

// Table names - update these to match your Airtable base
export const TABLES = {
  PROPERTIES: "Properties",
  MORTGAGES: "Mortgages",
  PERSONAL_ASSETS: "PersonalAssets",
  LIABILITIES: "Liabilities",
  VALUATION_HISTORY: "ValuationHistory",
  PFS_SNAPSHOTS: "PFSSnapshots",
} as const;

