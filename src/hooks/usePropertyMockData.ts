import { useMemo } from "react";
import type { Property, Unit, Tenant, Lease } from "@/types";
import { generatePropertyMockData } from "@/lib/mock-data/generators";

export function usePropertyMockData(property: Property | undefined) {
  return useMemo(() => {
    if (!property) {
      return {
        units: [],
        tenants: [],
        leases: [],
        totals: {
          totalUnits: 0,
          occupiedUnits: 0,
          monthlyRentalIncome: 0,
          occupancyRate: 0,
        },
      };
    }

    return generatePropertyMockData(property);
  }, [property]);
}
