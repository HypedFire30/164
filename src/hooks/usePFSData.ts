import { useQuery } from "@tanstack/react-query";
import { getPFSData } from "@/lib/airtable";
import type { PFSData } from "@/types";

/**
 * React Query hook to fetch all PFS data
 */
export function usePFSData() {
  return useQuery<PFSData>({
    queryKey: ["pfs-data"],
    queryFn: getPFSData,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: true,
  });
}

