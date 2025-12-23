/**
 * Snapshot Comparison View Component
 * Side-by-side comparison with delta highlighting
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { PFSSnapshot } from "@/types/snapshots";
import { compareSnapshots, formatFieldName, getChangeColor } from "@/lib/snapshots/snapshot-comparison";
import { formatCurrency } from "@/domain/utils";

interface SnapshotComparisonViewProps {
  snapshot1: PFSSnapshot;
  snapshot2: PFSSnapshot;
  onClose: () => void;
  onBack: () => void;
  asPage?: boolean; // If true, render as page content instead of dialog
}

export function SnapshotComparisonView({
  snapshot1,
  snapshot2,
  onClose,
  onBack,
  asPage = false,
}: SnapshotComparisonViewProps) {
  const comparison = compareSnapshots(snapshot1, snapshot2);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatValue = (value: any): string => {
    if (typeof value === "number") {
      return formatCurrency(value);
    }
    if (Array.isArray(value)) {
      return `${value.length} items`;
    }
    return String(value || "-");
  };

  const changedFields = comparison.deltas.filter(
    (d) => d.changeType !== "unchanged"
  );

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compare Snapshots</h1>
          <p className="text-muted-foreground mt-1">
            Side-by-side comparison of your PFS snapshots
          </p>
        </div>
        {asPage && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">
                  {formatCurrency(comparison.snapshot2.totals.totalAssets)}
                </div>
                <div
                  className={`text-sm ${
                    comparison.summary.totalAssetsDelta !== 0
                      ? getChangeColor(comparison.summary.totalAssetsDelta, true)
                      : "text-muted-foreground"
                  }`}
                >
                  {comparison.summary.totalAssetsDelta !== 0 && (
                    <>
                      {comparison.summary.totalAssetsDelta > 0 ? "+" : ""}
                      {formatCurrency(comparison.summary.totalAssetsDelta)}
                    </>
                  )}
                  {comparison.summary.totalAssetsDelta === 0 && "No change"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Liabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">
                  {formatCurrency(comparison.snapshot2.totals.totalLiabilities)}
                </div>
                <div
                  className={`text-sm ${
                    comparison.summary.totalLiabilitiesDelta !== 0
                      ? getChangeColor(comparison.summary.totalLiabilitiesDelta, false)
                      : "text-muted-foreground"
                  }`}
                >
                  {comparison.summary.totalLiabilitiesDelta !== 0 && (
                    <>
                      {comparison.summary.totalLiabilitiesDelta > 0 ? "+" : ""}
                      {formatCurrency(comparison.summary.totalLiabilitiesDelta)}
                    </>
                  )}
                  {comparison.summary.totalLiabilitiesDelta === 0 && "No change"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Net Worth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">
                  {formatCurrency(comparison.snapshot2.totals.netWorth)}
                </div>
                <div
                  className={`text-sm ${
                    comparison.summary.netWorthDelta !== 0
                      ? getChangeColor(comparison.summary.netWorthDelta, true)
                      : "text-muted-foreground"
                  }`}
                >
                  {comparison.summary.netWorthDelta !== 0 && (
                    <>
                      {comparison.summary.netWorthDelta > 0 ? "+" : ""}
                      {formatCurrency(comparison.summary.netWorthDelta)}
                    </>
                  )}
                  {comparison.summary.netWorthDelta === 0 && "No change"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Snapshot 1 */}
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="font-semibold mb-1">{snapshot1.snapshotName}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(snapshot1.snapshotDate)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Key Values
                </div>
                {changedFields.slice(0, 10).map((delta) => (
                  <div
                    key={delta.field}
                    className="p-2 border rounded text-sm"
                  >
                    <div className="font-medium mb-1">
                      {formatFieldName(delta.field)}
                    </div>
                    <div className="text-muted-foreground">
                      {formatValue(delta.value1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Snapshot 2 */}
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="font-semibold mb-1">{snapshot2.snapshotName}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(snapshot2.snapshotDate)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Key Values
                </div>
                {changedFields.slice(0, 10).map((delta) => {
                  const hasChanged = delta.changeType !== "unchanged";
                  return (
                    <div
                      key={delta.field}
                      className={`p-2 border rounded text-sm ${
                        hasChanged
                          ? delta.delta > 0
                            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                          : ""
                      }`}
                    >
                      <div className="font-medium mb-1">
                        {formatFieldName(delta.field)}
                      </div>
                      <div
                        className={
                          hasChanged
                            ? getChangeColor(delta.delta, true)
                            : "text-muted-foreground"
                        }
                      >
                        {formatValue(delta.value2)}
                        {hasChanged && typeof delta.delta === "number" && delta.delta !== 0 && (
                          <span className="ml-2 text-xs">
                            ({delta.delta > 0 ? "+" : ""}
                            {formatCurrency(delta.delta)})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Change Summary */}
          {changedFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Change Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {changedFields.map((delta) => (
                    <div
                      key={delta.field}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{formatFieldName(delta.field)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatValue(delta.value1)} → {formatValue(delta.value2)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <Badge
                          variant={
                            delta.changeType === "added"
                              ? "default"
                              : delta.changeType === "removed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {delta.changeType}
                        </Badge>
                        {typeof delta.delta === "number" && delta.delta !== 0 && (
                          <div
                            className={`text-sm mt-1 ${getChangeColor(delta.delta, true)}`}
                          >
                            {delta.delta > 0 ? "+" : ""}
                            {formatCurrency(delta.delta)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!asPage && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={onClose}>Close</Button>
            </div>
          )}
        </div>
  );

  if (asPage) {
    return <div className="space-y-6">{content}</div>;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Snapshots</DialogTitle>
          <DialogDescription>
            Side-by-side comparison of your PFS snapshots
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

