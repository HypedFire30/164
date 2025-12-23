/**
 * Snapshots Page Component
 * Full page view for historical PFS snapshots with filtering and sorting
 */

import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  GitCompare,
  AlertCircle,
  Trash2,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns,
  List,
  Plus,
} from "lucide-react";
import { getAllSnapshots, deleteSnapshot } from "@/lib/snapshots/snapshot-repository";
import type { PFSSnapshot } from "@/types/snapshots";
import { SnapshotComparisonView } from "@/components/SnapshotComparisonView";
import { SideBySideComparison } from "@/components/SideBySideComparison";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/domain/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SortField = "date" | "name" | "totalAssets" | "totalLiabilities" | "netWorth" | "template";
type SortDirection = "asc" | "desc";

export default function Snapshots() {
  const [snapshots, setSnapshots] = useState<PFSSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<PFSSnapshot | null>(null);
  const [comparisonMode, setComparisonMode] = useState<{
    snapshot1: PFSSnapshot;
    snapshot2: PFSSnapshot | null;
  } | null>(null);
  const [sideBySideMode, setSideBySideMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const { toast } = useToast();
  const [addColumnFn, setAddColumnFn] = useState<(() => void) | null>(null);
  const [columnCount, setColumnCount] = useState(2);

  useEffect(() => {
    loadSnapshots();
  }, []);

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

  // Get unique templates for filter
  const availableTemplates = useMemo(() => {
    const templates = new Set<string>();
    snapshots.forEach((s) => {
      if (s.templateName) {
        templates.add(s.templateName);
      }
    });
    return Array.from(templates).sort();
  }, [snapshots]);

  // Filter and sort snapshots
  const filteredAndSortedSnapshots = useMemo(() => {
    let filtered = [...snapshots];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.snapshotName.toLowerCase().includes(query) ||
          s.templateName?.toLowerCase().includes(query) ||
          s.notes?.toLowerCase().includes(query)
      );
    }

    // Template filter
    if (templateFilter !== "all") {
      filtered = filtered.filter((s) => s.templateName === templateFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (s) => (statusFilter === "outdated" && s.isOutdated) || (statusFilter === "current" && !s.isOutdated)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison =
            new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime();
          break;
        case "name":
          comparison = a.snapshotName.localeCompare(b.snapshotName);
          break;
        case "totalAssets":
          comparison = a.totals.totalAssets - b.totals.totalAssets;
          break;
        case "totalLiabilities":
          comparison = a.totals.totalLiabilities - b.totals.totalLiabilities;
          break;
        case "netWorth":
          comparison = a.totals.netWorth - b.totals.netWorth;
          break;
        case "template":
          comparison = (a.templateName || "").localeCompare(b.templateName || "");
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [snapshots, searchQuery, templateFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  if (comparisonMode && comparisonMode.snapshot2) {
    return (
      <Layout>
        <SnapshotComparisonView
          snapshot1={comparisonMode.snapshot1}
          snapshot2={comparisonMode.snapshot2}
          onClose={() => {
            setComparisonMode(null);
            setSelectedSnapshot(null);
          }}
          onBack={() => setComparisonMode({ ...comparisonMode, snapshot2: null })}
          asPage={true}
        />
      </Layout>
    );
  }

  if (selectedSnapshot) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{selectedSnapshot.snapshotName}</h1>
              <p className="text-muted-foreground mt-1">
                Snapshot from {formatDate(selectedSnapshot.snapshotDate)}
              </p>
            </div>
            <Button variant="outline" onClick={() => setSelectedSnapshot(null)}>
              Back
            </Button>
          </div>

          {selectedSnapshot.isOutdated && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This snapshot is outdated. {selectedSnapshot.outdatedReason || "Underlying data has changed."}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(selectedSnapshot.totals.totalAssets)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Liabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(selectedSnapshot.totals.totalLiabilities)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Net Worth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(selectedSnapshot.totals.netWorth)}
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedSnapshot.templateName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Template / Lender</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">{selectedSnapshot.templateName}</Badge>
              </CardContent>
            </Card>
          )}

          {selectedSnapshot.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{selectedSnapshot.notes}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
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
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PFS Snapshots</h1>
            <p className="text-muted-foreground mt-1">
              View and compare historical snapshots of your Personal Financial Statements
            </p>
          </div>
          <div className="flex items-center gap-2">
            {sideBySideMode && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (addColumnFn) {
                    addColumnFn();
                  }
                }}
                disabled={snapshots.length === 0 || !addColumnFn || columnCount >= 4}
                title="Add Column (max 4)"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant={sideBySideMode ? "default" : "outline"}
              size="icon"
              onClick={() => setSideBySideMode(!sideBySideMode)}
            >
              {sideBySideMode ? (
                <List className="h-4 w-4" />
              ) : (
                <Columns className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Side-by-Side Comparison Mode */}
        {sideBySideMode ? (
          <SideBySideComparison
            snapshots={snapshots}
            availableTemplates={availableTemplates}
            onAddColumnRef={(fn) => {
              setAddColumnFn(() => fn);
            }}
            onColumnCountChange={setColumnCount}
          />
        ) : (
          <>
            {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search by name, template, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={templateFilter} onValueChange={setTemplateFilter}>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
          </CardContent>
        </Card>

        {/* Comparison Mode Alert */}
        {comparisonMode && (
          <Alert>
            <GitCompare className="h-4 w-4" />
            <AlertDescription>
              Select a second snapshot to compare with{" "}
              <strong>{comparisonMode.snapshot1.snapshotName}</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredAndSortedSnapshots.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No snapshots found.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {snapshots.length === 0
                    ? "Snapshots are automatically created when you generate a PFS."
                    : "Try adjusting your filters."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() => handleSort("date")}
                        >
                          Date
                          <SortIcon field="date" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() => handleSort("name")}
                        >
                          Snapshot Name
                          <SortIcon field="name" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() => handleSort("template")}
                        >
                          Template / Lender
                          <SortIcon field="template" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() => handleSort("totalAssets")}
                        >
                          Total Assets
                          <SortIcon field="totalAssets" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() => handleSort("totalLiabilities")}
                        >
                          Total Liabilities
                          <SortIcon field="totalLiabilities" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() => handleSort("netWorth")}
                        >
                          Net Worth
                          <SortIcon field="netWorth" />
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedSnapshots.map((snapshot) => {
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
                          <TableCell>
                            {snapshot.templateName ? (
                              <Badge variant="outline">{snapshot.templateName}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
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
            </CardContent>
          </Card>
        )}
          </>
        )}
      </div>
    </Layout>
  );
}

