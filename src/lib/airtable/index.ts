// Centralized data fetching for PFS
import { getProperties } from "./properties";
import { getMortgages } from "./mortgages";
import { getPersonalAssets, getLiabilities } from "./assets";
import { calculatePFSTotals } from "../calculations/totals";
import { generateMockPFSData } from "../mockData";
import type { PFSData } from "@/types";

/**
 * Check if Airtable is configured
 */
function isAirtableConfigured(): boolean {
  const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
  const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
  return !!(apiKey && baseId && apiKey !== "" && baseId !== "");
}

/**
 * Fetch all PFS data from Airtable and calculate totals
 * Falls back to mock data if Airtable is not configured
 */
export async function getPFSData(): Promise<PFSData> {
  // Use mock data if Airtable is not configured
  if (!isAirtableConfigured()) {
    console.log("Airtable not configured, using mock data");
    try {
      const mockData = generateMockPFSData();
      const totals = calculatePFSTotals(
        mockData.properties,
        mockData.mortgages,
        mockData.personalAssets,
        mockData.liabilities
      );
      console.log("Mock data generated successfully:", { 
        properties: mockData.properties.length,
        mortgages: mockData.mortgages.length 
      });
      return {
        ...mockData,
        totals,
      };
    } catch (error) {
      console.error("Error generating mock data:", error);
      throw error;
    }
  }

  // Fetch from Airtable
  try {
    const [properties, mortgages, personalAssets, liabilities] = await Promise.all([
      getProperties(),
      getMortgages(),
      getPersonalAssets(),
      getLiabilities(),
    ]);

    const totals = calculatePFSTotals(properties, mortgages, personalAssets, liabilities);

    return {
      properties,
      mortgages,
      personalAssets,
      liabilities,
      totals,
    };
  } catch (error) {
    console.error("Error fetching from Airtable, falling back to mock data:", error);
    // Fallback to mock data on error
    const mockData = generateMockPFSData();
    const totals = calculatePFSTotals(
      mockData.properties,
      mockData.mortgages,
      mockData.personalAssets,
      mockData.liabilities
    );
    return {
      ...mockData,
      totals,
    };
  }
}

