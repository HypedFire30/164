/**
 * Snapshots Dialog Component
 * Displays historical PFS snapshots with comparison capabilities
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  GitCompare,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { getAllSnapshots, deleteSnapshot } from "@/lib/snapshots/snapshot-repository";
import type { PFSSnapshot } from "@/types/snapshots";
import { SnapshotComparisonView } from "./SnapshotComparisonView";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/domain/utils";

interface SnapshotsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SnapshotsDialog({ open, onOpenChange }: SnapshotsDialogProps) {
  const [snapshots, setSnapshots] = useState<PFSSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<PFSSnapshot | null>(null);
  const [comparisonMode, setComparisonMode] = useState<{
    snapshot1: PFSSnapshot;
    snapshot2: PFSSnapshot | null;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSnapshots();
    }
  }, [open]);

  const loadSnapshots = async () => {
    setIsLoading(true);
    try {
      const data = await getAllSnapshots();
      setSnapshots(data);
    } catch (error) {
      console.error("Error loading snapshots:", error);
      toast({
        title: "Error Loading Snapshots",
        description: error instanceof Error ? error.message : "Failed to load snapshots",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (snapshot: PFSSnapshot) => {
    setSelectedSnapshot(snapshot);
  };

  const handleCompare = (snapshot: PFSSnapshot) => {
    if (comparisonMode && comparisonMode.snapshot1.id === snapshot.id) {
      // Already selected, clear
      setComparisonMode(null);
    } else if (comparisonMode && !comparisonMode.snapshot2) {
      // Select second snapshot
      setComparisonMode({
        snapshot1: comparisonMode.snapshot1,
        snapshot2: snapshot,
      });
    } else {
      // Start new comparison
      setComparisonMode({
        snapshot1: snapshot,
        snapshot2: null,
      });
    }
  };

  const handleDelete = async (snapshot: PFSSnapshot) => {
    if (!confirm(`Are you sure you want to delete snapshot "${snapshot.snapshotName}"?`)) {
      return;
    }

    try {
      await deleteSnapshot(snapshot.id);
      await loadSnapshots();
      toast({
        title: "Snapshot Deleted",
        description: "The snapshot has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting snapshot:", error);
      toast({
        title: "Error Deleting Snapshot",
        description: error instanceof Error ? error.message : "Failed to delete snapshot",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (comparisonMode && comparisonMode.snapshot2) {
    return (
      <SnapshotComparisonView
        snapshot1={comparisonMode.snapshot1}
        snapshot2={comparisonMode.snapshot2}
        onClose={() => {
          setComparisonMode(null);
          setSelectedSnapshot(null);
        }}
        onBack={() => setComparisonMode({ ...comparisonMode, snapshot2: null })}
      />
    );
  }

  if (selectedSnapshot) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSnapshot.snapshotName}</DialogTitle>
            <DialogDescription>
              Snapshot from {formatDate(selectedSnapshot.snapshotDate)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSnapshot.isOutdated && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This snapshot is outdated. {selectedSnapshot.outdatedReason || "Underlying data has changed."}
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Total Assets</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(selectedSnapshot.totals.totalAssets)}
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Total Liabilities</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(selectedSnapshot.totals.totalLiabilities)}
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Net Worth</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(selectedSnapshot.totals.netWorth)}
                </div>
              </div>
            </div>
            {selectedSnapshot.notes && (
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Notes</div>
                <div className="text-sm text-muted-foreground">{selectedSnapshot.notes}</div>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedSnapshot(null)}
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  setComparisonMode({
                    snapshot1: selectedSnapshot,
                    snapshot2: null,
                  });
                  setSelectedSnapshot(null);
                }}
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Compare
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PFS Snapshots</DialogTitle>
          <DialogDescription>
            View and compare historical snapshots of your Personal Financial Statements
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : snapshots.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No snapshots found.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Snapshots are automatically created when you generate a PFS.
            </p>
          </div>
        ) : (
          <>
            {comparisonMode && (
              <Alert>
                <GitCompare className="h-4 w-4" />
                <AlertDescription>
                  Select a second snapshot to compare with{" "}
                  <strong>{comparisonMode.snapshot1.snapshotName}</strong>
                </AlertDescription>
              </Alert>
            )}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Snapshot Name</TableHead>
                    <TableHead className="text-right">Total Assets</TableHead>
                    <TableHead className="text-right">Total Liabilities</TableHead>
                    <TableHead className="text-right">Net Worth</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshots.map((snapshot) => {
                    const isSelectedForComparison =
                      comparisonMode?.snapshot1.id === snapshot.id;
                    return (
                      <TableRow
                        key={snapshot.id}
                        className={isSelectedForComparison ? "bg-primary/10" : ""}
                      >
                        <TableCell>{formatDate(snapshot.snapshotDate)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{snapshot.snapshotName}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(snapshot.totals.totalAssets)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(snapshot.totals.totalLiabilities)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(snapshot.totals.netWorth)}
                        </TableCell>
                        <TableCell>
                          {snapshot.isOutdated ? (
                            <Badge variant="destructive">Outdated</Badge>
                          ) : (
                            <Badge variant="secondary">Current</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(snapshot)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCompare(snapshot)}
                              className={isSelectedForComparison ? "bg-primary text-primary-foreground" : ""}
                            >
                              <GitCompare className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(snapshot)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

