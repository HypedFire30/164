/**
 * Side-by-Side Comparison Component
 * Multi-column comparison view with independent filtering per column
 */

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  X,
  Search,
  Filter,
} from "lucide-react";
import type { PFSSnapshot } from "@/types/snapshots";
import { formatCurrency } from "@/domain/utils";
import { compareSnapshots, getChangeColor } from "@/lib/snapshots/snapshot-comparison";

interface ColumnState {
  id: string;
  searchQuery: string;
  templateFilter: string;
  statusFilter: string;
  selectedSnapshot: PFSSnapshot | null;
}

interface SideBySideComparisonProps {
  snapshots: PFSSnapshot[];
  availableTemplates: string[];
  onAddColumnRef?: (addColumnFn: () => void) => void;
  onColumnCountChange?: (count: number) => void;
}

export function SideBySideComparison({
  snapshots,
  availableTemplates,
  onAddColumnRef,
  onColumnCountChange,
}: SideBySideComparisonProps) {
  const [columns, setColumns] = useState<ColumnState[]>([
    {
      id: "col-1",
      searchQuery: "",
      templateFilter: "all",
      statusFilter: "all",
      selectedSnapshot: null,
    },
    {
      id: "col-2",
      searchQuery: "",
      templateFilter: "all",
      statusFilter: "all",
      selectedSnapshot: null,
    },
  ]);

  // Filter snapshots for a column
  const getFilteredSnapshots = (column: ColumnState) => {
    let filtered = [...snapshots];

    if (column.searchQuery) {
      const query = column.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.snapshotName.toLowerCase().includes(query) ||
          s.templateName?.toLowerCase().includes(query) ||
          s.notes?.toLowerCase().includes(query)
      );
    }

    if (column.templateFilter !== "all") {
      filtered = filtered.filter((s) => s.templateName === column.templateFilter);
    }

    if (column.statusFilter !== "all") {
      filtered = filtered.filter(
        (s) =>
          (column.statusFilter === "outdated" && s.isOutdated) ||
          (column.statusFilter === "current" && !s.isOutdated)
      );
    }

    return filtered;
  };

  // Calculate comparison metrics
  const comparisonMetrics = useMemo(() => {
    const selectedSnapshots = columns
      .map((col) => col.selectedSnapshot)
      .filter((s): s is PFSSnapshot => s !== null);

    if (selectedSnapshots.length < 2) {
      return null;
    }

    // Compare first two selected snapshots (can be extended for more)
    const first = selectedSnapshots[0];
    const last = selectedSnapshots[selectedSnapshots.length - 1];

    const comparison = compareSnapshots(first, last);

    return {
      totalAssetsDelta: comparison.summary.totalAssetsDelta,
      totalLiabilitiesDelta: comparison.summary.totalLiabilitiesDelta,
      netWorthDelta: comparison.summary.netWorthDelta,
      firstSnapshot: first,
      lastSnapshot: last,
    };
  }, [columns]);

  const addColumn = () => {
    if (columns.length >= 4) return;
    setColumns([
      ...columns,
      {
        id: `col-${Date.now()}`,
        searchQuery: "",
        templateFilter: "all",
        statusFilter: "all",
        selectedSnapshot: null,
      },
    ]);
  };

  // Expose addColumn to parent
  useEffect(() => {
    if (onAddColumnRef) {
      onAddColumnRef(addColumn);
    }
  }, [onAddColumnRef]);

  const removeColumn = (columnId: string) => {
    if (columns.length <= 2) return;
    setColumns(columns.filter((col) => col.id !== columnId));
  };

  const updateColumn = (columnId: string, updates: Partial<ColumnState>) => {
    setColumns(
      columns.map((col) => (col.id === columnId ? { ...col, ...updates } : col))
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Comparison Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Comparison Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {comparisonMetrics ? (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Assets</div>
                <div className="text-2xl font-bold mb-1">
                  {formatCurrency(comparisonMetrics.lastSnapshot.totals.totalAssets)}
                </div>
                <div
                  className={`text-sm ${getChangeColor(
                    comparisonMetrics.totalAssetsDelta,
                    true
                  )}`}
                >
                  {comparisonMetrics.totalAssetsDelta !== 0 && (
                    <>
                      {comparisonMetrics.totalAssetsDelta > 0 ? "+" : ""}
                      {formatCurrency(comparisonMetrics.totalAssetsDelta)}
                    </>
                  )}
                  {comparisonMetrics.totalAssetsDelta === 0 && "No change"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Liabilities</div>
                <div className="text-2xl font-bold mb-1">
                  {formatCurrency(comparisonMetrics.lastSnapshot.totals.totalLiabilities)}
                </div>
                <div
                  className={`text-sm ${getChangeColor(
                    comparisonMetrics.totalLiabilitiesDelta,
                    false
                  )}`}
                >
                  {comparisonMetrics.totalLiabilitiesDelta !== 0 && (
                    <>
                      {comparisonMetrics.totalLiabilitiesDelta > 0 ? "+" : ""}
                      {formatCurrency(comparisonMetrics.totalLiabilitiesDelta)}
                    </>
                  )}
                  {comparisonMetrics.totalLiabilitiesDelta === 0 && "No change"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Net Worth</div>
                <div className="text-2xl font-bold mb-1">
                  {formatCurrency(comparisonMetrics.lastSnapshot.totals.netWorth)}
                </div>
                <div
                  className={`text-sm ${getChangeColor(
                    comparisonMetrics.netWorthDelta,
                    true
                  )}`}
                >
                  {comparisonMetrics.netWorthDelta !== 0 && (
                    <>
                      {comparisonMetrics.netWorthDelta > 0 ? "+" : ""}
                      {formatCurrency(comparisonMetrics.netWorthDelta)}
                    </>
                  )}
                  {comparisonMetrics.netWorthDelta === 0 && "No change"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Select at least 2 snapshots to see comparison metrics
            </p>
          )}
        </CardContent>
      </Card>

      {/* Columns */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
        {columns.map((column, index) => {
          const filteredSnapshots = getFilteredSnapshots(column);
          return (
            <Card key={column.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Column {index + 1}</CardTitle>
                  {columns.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeColumn(column.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                {/* Filters */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={column.searchQuery}
                      onChange={(e) =>
                        updateColumn(column.id, { searchQuery: e.target.value })
                      }
                      className="pl-8"
                    />
                  </div>
                  <Select
                    value={column.templateFilter}
                    onValueChange={(value) =>
                      updateColumn(column.id, { templateFilter: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Templates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Templates</SelectItem>
                      {availableTemplates.map((template) => (
                        <SelectItem key={template} value={template}>
                          {template}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={column.statusFilter}
                    onValueChange={(value) =>
                      updateColumn(column.id, { statusFilter: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="outdated">Outdated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Snapshot Info */}
                {column.selectedSnapshot && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Selected</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="font-medium text-sm">
                        {column.selectedSnapshot.snapshotName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(column.selectedSnapshot.snapshotDate)}
                      </div>
                      {column.selectedSnapshot.templateName && (
                        <Badge variant="outline" className="text-xs">
                          {column.selectedSnapshot.templateName}
                        </Badge>
                      )}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                        <div>
                          <div className="text-xs text-muted-foreground">Assets</div>
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(column.selectedSnapshot.totals.totalAssets)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Liabilities</div>
                          <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(column.selectedSnapshot.totals.totalLiabilities)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Net Worth</div>
                          <div className="text-sm font-semibold">
                            {formatCurrency(column.selectedSnapshot.totals.netWorth)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => updateColumn(column.id, { selectedSnapshot: null })}
                      >
                        Clear Selection
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Snapshot List */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px]">
                  {filteredSnapshots.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No snapshots found
                    </p>
                  ) : (
                    filteredSnapshots.map((snapshot) => {
                      const isSelected = column.selectedSnapshot?.id === snapshot.id;
                      return (
                        <Card
                          key={snapshot.id}
                          className={`cursor-pointer transition-all hover:border-primary ${
                            isSelected ? "border-primary bg-primary/5" : ""
                          }`}
                          onClick={() =>
                            updateColumn(column.id, { selectedSnapshot: snapshot })
                          }
                        >
                          <CardContent className="p-3">
                            <div className="font-medium text-sm mb-1">
                              {snapshot.snapshotName}
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {formatDate(snapshot.snapshotDate)}
                            </div>
                            {snapshot.templateName && (
                              <Badge variant="outline" className="text-xs mb-2">
                                {snapshot.templateName}
                              </Badge>
                            )}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Net Worth:</span>
                              <span className="font-semibold">
                                {formatCurrency(snapshot.totals.netWorth)}
                              </span>
                            </div>
                            {snapshot.isOutdated && (
                              <Badge variant="destructive" className="text-xs mt-2">
                                Outdated
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

      </div>
    </div>
  );
}

