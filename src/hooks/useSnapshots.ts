import { useQuery } from "@tanstack/react-query";
import { getAllSnapshots } from "@/lib/snapshots/snapshot-repository";

export function useSnapshots() {
  return useQuery({
    queryKey: ["snapshots"],
    queryFn: () => getAllSnapshots(),
    staleTime: 60_000,
  });
}
