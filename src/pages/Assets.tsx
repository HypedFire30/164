import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  DollarSign,
  TrendingDown,
  Search,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { usePFSData } from "@/hooks/usePFSData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/domain/utils";

const formatCurrencyDisplay = (amount: number) => {
  return formatCurrency(amount, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export default function Assets() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = usePFSData();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [editingLiability, setEditingLiability] = useState<any>(null);
  const [assetSearch, setAssetSearch] = useState("");
  const [liabilitySearch, setLiabilitySearch] = useState("");
  const [assetSort, setAssetSort] = useState<
    "value-desc" | "value-asc" | "category" | "description"
  >("value-desc");
  const [liabilitySort, setLiabilitySort] = useState<
    "balance-desc" | "balance-asc" | "category" | "description"
  >("balance-desc");
  const [dialogType, setDialogType] = useState<"asset" | "liability">("asset");

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Failed to load assets and liabilities. Please check your Airtable configuration."}
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            Please configure Airtable or add data to your base.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const { personalAssets, liabilities, totals } = data;

  // Filter and sort assets
  const filteredAndSortedAssets = useMemo(() => {
    let filtered = personalAssets.filter(
      (asset) =>
        asset.description.toLowerCase().includes(assetSearch.toLowerCase()) ||
        asset.category.toLowerCase().includes(assetSearch.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (assetSort) {
        case "value-desc":
          return b.value - a.value;
        case "value-asc":
          return a.value - b.value;
        case "category":
          return a.category.localeCompare(b.category);
        case "description":
          return a.description.localeCompare(b.description);
        default:
          return 0;
      }
    });
  }, [personalAssets, assetSearch, assetSort]);

  // Filter and sort liabilities
  const filteredAndSortedLiabilities = useMemo(() => {
    let filtered = liabilities.filter(
      (liability) =>
        liability.description
          .toLowerCase()
          .includes(liabilitySearch.toLowerCase()) ||
        liability.category.toLowerCase().includes(liabilitySearch.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (liabilitySort) {
        case "balance-desc":
          return b.balance - a.balance;
        case "balance-asc":
          return a.balance - b.balance;
        case "category":
          return a.category.localeCompare(b.category);
        case "description":
          return a.description.localeCompare(b.description);
        default:
          return 0;
      }
    });
  }, [liabilities, liabilitySearch, liabilitySort]);

  const handleAddAsset = () => {
    setEditingAsset(null);
    setEditingLiability(null);
    setDialogType("asset");
    setIsDialogOpen(true);
  };

  const handleAddLiability = () => {
    setEditingLiability(null);
    setEditingAsset(null);
    setDialogType("liability");
    setIsDialogOpen(true);
  };

  const handleEditAsset = (asset: any) => {
    setEditingAsset(asset);
    setEditingLiability(null);
    setDialogType("asset");
    setIsDialogOpen(true);
  };

  const handleEditLiability = (liability: any) => {
    setEditingLiability(liability);
    setEditingAsset(null);
    setDialogType("liability");
    setIsDialogOpen(true);
  };

  const handleSave = async (formData: any, type: "asset" | "liability") => {
    // TODO: Implement actual save to Airtable
    toast({
      title: type === "asset" ? "Asset saved" : "Liability saved",
      description: "Changes have been saved successfully.",
    });
    setIsDialogOpen(false);
    setEditingAsset(null);
    setEditingLiability(null);
    refetch();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Assets & Liabilities
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal assets and liabilities. These will
            automatically populate in the Generate PFS form.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Assets
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrencyDisplay(totals.totalPersonalAssets)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Personal assets only
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Liabilities
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrencyDisplay(totals.totalLiabilities)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All liabilities
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Net Position
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrencyDisplay(
                  totals.totalPersonalAssets - totals.totalLiabilities
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Assets minus liabilities
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets Column */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Assets</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredAndSortedAssets.length} of {personalAssets.length}{" "}
                  items
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddAsset}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {/* Search and Sort Controls */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={assetSort}
                onValueChange={(v) => setAssetSort(v as typeof assetSort)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value-desc">
                    <div className="flex items-center gap-2">
                      <SortDesc className="h-3 w-3" />
                      Value (High)
                    </div>
                  </SelectItem>
                  <SelectItem value="value-asc">
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-3 w-3" />
                      Value (Low)
                    </div>
                  </SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scrollable Assets List */}
            <ScrollArea
              className="flex-1 border rounded-lg p-4"
              style={{ maxHeight: "calc(100vh - 400px)", minHeight: "400px" }}
            >
              <div className="space-y-4">
                {filteredAndSortedAssets.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground text-center py-8">
                        {personalAssets.length === 0
                          ? "No assets found. Add your first asset to get started."
                          : "No assets match your search."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredAndSortedAssets.map((asset) => (
                    <Card
                      key={asset.id}
                      className="transition-all hover:shadow-md border-l-4 border-l-green-500 cursor-pointer"
                      onClick={() => navigate(`/assets/asset/${asset.id}`)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-base hover:text-primary">
                              {asset.description}
                            </CardTitle>
                            <CardDescription>
                              <Badge variant="secondary" className="text-xs">
                                {asset.category}
                              </Badge>
                            </CardDescription>
                          </div>
                          <div
                            className="flex gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAsset(asset)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrencyDisplay(asset.value)}
                        </div>
                        {asset.receivableName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Debtor: {asset.receivableName}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Liabilities Column */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Liabilities</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredAndSortedLiabilities.length} of {liabilities.length}{" "}
                  items
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddLiability}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {/* Search and Sort Controls */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search liabilities..."
                  value={liabilitySearch}
                  onChange={(e) => setLiabilitySearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={liabilitySort}
                onValueChange={(v) =>
                  setLiabilitySort(v as typeof liabilitySort)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance-desc">
                    <div className="flex items-center gap-2">
                      <SortDesc className="h-3 w-3" />
                      Balance (High)
                    </div>
                  </SelectItem>
                  <SelectItem value="balance-asc">
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-3 w-3" />
                      Balance (Low)
                    </div>
                  </SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scrollable Liabilities List */}
            <ScrollArea
              className="flex-1 border rounded-lg p-4"
              style={{ maxHeight: "calc(100vh - 400px)", minHeight: "400px" }}
            >
              <div className="space-y-4">
                {filteredAndSortedLiabilities.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground text-center py-8">
                        {liabilities.length === 0
                          ? "No liabilities found. Add your first liability to get started."
                          : "No liabilities match your search."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredAndSortedLiabilities.map((liability) => (
                    <Card
                      key={liability.id}
                      className="transition-all hover:shadow-md border-l-4 border-l-red-500 cursor-pointer"
                      onClick={() =>
                        navigate(`/assets/liability/${liability.id}`)
                      }
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-base hover:text-primary">
                              {liability.description}
                            </CardTitle>
                            <CardDescription>
                              <Badge variant="secondary" className="text-xs">
                                {liability.category}
                              </Badge>
                            </CardDescription>
                          </div>
                          <div
                            className="flex gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLiability(liability)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-xl font-bold text-red-600 dark:text-red-400">
                          {formatCurrencyDisplay(liability.balance)}
                        </div>
                        {liability.payableTo && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Creditor: {liability.payableTo}
                          </p>
                        )}
                        {liability.monthlyPayment && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Monthly:{" "}
                            {formatCurrencyDisplay(liability.monthlyPayment)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAsset
                  ? "Edit Asset"
                  : editingLiability
                  ? "Edit Liability"
                  : dialogType === "asset"
                  ? "Add Asset"
                  : "Add Liability"}
              </DialogTitle>
              <DialogDescription>
                {dialogType === "asset" || editingAsset
                  ? "Add or update a personal asset. Select the category that matches the PFS form field you want this to auto-fill."
                  : "Add or update a liability. Select the category that matches the PFS form field you want this to auto-fill."}
              </DialogDescription>
            </DialogHeader>
            {dialogType === "asset" || editingAsset ? (
              <AssetForm
                asset={editingAsset}
                onSave={(data) => handleSave(data, "asset")}
                onCancel={() => setIsDialogOpen(false)}
              />
            ) : (
              <LiabilityForm
                liability={editingLiability}
                onSave={(data) => handleSave(data, "liability")}
                onCancel={() => setIsDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

function AssetForm({
  asset,
  onSave,
  onCancel,
}: {
  asset: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    category: asset?.category || "",
    description: asset?.description || "",
    value: asset?.value || 0,
    receivableName: asset?.receivableName || "",
    dueDate: asset?.dueDate || "",
    debtorEmail: asset?.debtorEmail || "",
    debtorPhone: asset?.debtorPhone || "",
    debtorAddress: asset?.debtorAddress || "",
    notes: asset?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields based on category
    if (
      (formData.category === "Accounts Receivable" ||
        formData.category === "Notes Receivable") &&
      !formData.receivableName
    ) {
      alert("Name of debtor/payor is required for this category.");
      return;
    }

    if (
      (formData.category === "Accounts Receivable" ||
        formData.category === "Notes Receivable") &&
      !formData.dueDate
    ) {
      alert("Due date is required for this category.");
      return;
    }

    onSave(formData);
  };

  const needsScheduleFields =
    formData.category === "Accounts Receivable" ||
    formData.category === "Notes Receivable";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">
          Category <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.category}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              category: value,
              receivableName: "",
              dueDate: "",
            })
          }
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cash">Cash / Bank Account</SelectItem>
            <SelectItem value="Cash Other Institutions">
              Cash in Other Institutions
            </SelectItem>
            <SelectItem value="Building Material Inventory">
              Building Material Inventory
            </SelectItem>
            <SelectItem value="Life Insurance">
              Life Insurance (Cash Surrender Value)
            </SelectItem>
            <SelectItem value="Retirement">
              Retirement Accounts (401k, IRA, etc.)
            </SelectItem>
            <SelectItem value="Automobile">Automobiles and Trucks</SelectItem>
            <SelectItem value="Machinery">Machinery and Tools</SelectItem>
            <SelectItem value="Investment">
              Investments (Stocks, Bonds, etc.)
            </SelectItem>
            <SelectItem value="Accounts Receivable">
              Accounts Receivable (Schedule A)
            </SelectItem>
            <SelectItem value="Notes Receivable">
              Notes Receivable (Schedule B)
            </SelectItem>
            <SelectItem value="Other Assets">Other Assets</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="e.g., Checking Account, Investment Portfolio"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="value">
          Value ($) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="value"
          type="number"
          step="0.01"
          value={formData.value}
          onChange={(e) =>
            setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
          }
          placeholder="0.00"
          required
        />
      </div>

      {/* Schedule A & B Fields */}
      {needsScheduleFields && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="text-sm font-semibold text-muted-foreground">
              {formData.category === "Accounts Receivable"
                ? "Schedule A"
                : "Schedule B"}{" "}
              Details
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivableName">
                Name of Debtor/Payor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="receivableName"
                value={formData.receivableName}
                onChange={(e) =>
                  setFormData({ ...formData, receivableName: e.target.value })
                }
                placeholder="Enter name of person/company who owes you"
                required={needsScheduleFields}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">
                Due Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required={needsScheduleFields}
              />
            </div>
          </div>
        </>
      )}

      {/* Contact Information */}
      <Separator />
      <div className="space-y-4">
        <div className="text-sm font-semibold text-muted-foreground">
          Debtor/Payor Contact Information
        </div>
        <div className="space-y-2">
          <Label htmlFor="debtorEmail">Email</Label>
          <Input
            id="debtorEmail"
            type="email"
            value={formData.debtorEmail}
            onChange={(e) =>
              setFormData({ ...formData, debtorEmail: e.target.value })
            }
            placeholder="debtor@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="debtorPhone">Phone</Label>
          <Input
            id="debtorPhone"
            type="tel"
            value={formData.debtorPhone}
            onChange={(e) =>
              setFormData({ ...formData, debtorPhone: e.target.value })
            }
            placeholder="(555) 123-4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="debtorAddress">Address</Label>
          <Textarea
            id="debtorAddress"
            value={formData.debtorAddress}
            onChange={(e) =>
              setFormData({ ...formData, debtorAddress: e.target.value })
            }
            placeholder="Street address, City, State, ZIP"
            rows={2}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about this asset..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

function LiabilityForm({
  liability,
  onSave,
  onCancel,
}: {
  liability: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    category: liability?.category || "",
    description: liability?.description || "",
    balance: liability?.balance || 0,
    payableTo: liability?.payableTo || "",
    dueDate: liability?.dueDate || "",
    collateral: liability?.collateral || "",
    finalDueDate: liability?.finalDueDate || "",
    monthlyPayment: liability?.monthlyPayment || 0,
    creditorEmail: liability?.creditorEmail || "",
    creditorPhone: liability?.creditorPhone || "",
    creditorAddress: liability?.creditorAddress || "",
    notes: liability?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields based on category
    if (
      (formData.category === "Accounts Payable" ||
        formData.category === "Notes Payable") &&
      !formData.payableTo
    ) {
      alert("Payable to (creditor name) is required for this category.");
      return;
    }

    if (
      (formData.category === "Accounts Payable" ||
        formData.category === "Notes Payable") &&
      !formData.dueDate
    ) {
      alert("Due date is required for this category.");
      return;
    }

    if (
      formData.category === "Installment Obligations" &&
      !formData.payableTo
    ) {
      alert(
        "Payable to (creditor name) is required for installment obligations."
      );
      return;
    }

    if (
      formData.category === "Installment Obligations" &&
      !formData.collateral
    ) {
      alert("Collateral description is required for installment obligations.");
      return;
    }

    if (
      formData.category === "Installment Obligations" &&
      !formData.finalDueDate
    ) {
      alert("Final due date is required for installment obligations.");
      return;
    }

    if (
      formData.category === "Installment Obligations" &&
      !formData.monthlyPayment
    ) {
      alert("Monthly payment amount is required for installment obligations.");
      return;
    }

    onSave(formData);
  };

  const needsScheduleGorHFields =
    formData.category === "Accounts Payable" ||
    formData.category === "Notes Payable";
  const needsScheduleIFields = formData.category === "Installment Obligations";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">
          Category <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.category}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              category: value,
              payableTo: "",
              dueDate: "",
              collateral: "",
              finalDueDate: "",
              monthlyPayment: 0,
            })
          }
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Note Payable - Relative">
              Notes Payable to Relatives and Friends
            </SelectItem>
            <SelectItem value="Accrued Interest">Accrued Interest</SelectItem>
            <SelectItem value="Accrued Salary">
              Accrued Salary and Wages
            </SelectItem>
            <SelectItem value="Accrued Tax">
              Accrued Taxes (other than Income)
            </SelectItem>
            <SelectItem value="Income Tax Payable">
              Income Tax Payable
            </SelectItem>
            <SelectItem value="Chattel Mortgage">
              Chattel Mortgage and Contract on Equipment
            </SelectItem>
            <SelectItem value="Guaranteed Loan">
              Guaranteed or Cosigned Loans
            </SelectItem>
            <SelectItem value="Surety Bond">Surety Bonds</SelectItem>
            <SelectItem value="Credit Cards">Credit Cards</SelectItem>
            <SelectItem value="Personal Loans">Personal Loans</SelectItem>
            <SelectItem value="Accounts Payable">
              Accounts Payable (Schedule G)
            </SelectItem>
            <SelectItem value="Notes Payable">
              Notes Payable to Others (Schedule H)
            </SelectItem>
            <SelectItem value="Installment Obligations">
              Installment Obligations (Schedule I)
            </SelectItem>
            <SelectItem value="Other Liabilities">Other Liabilities</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="e.g., Credit Card Balance, Personal Loan"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="balance">
          Balance ($) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="balance"
          type="number"
          step="0.01"
          value={formData.balance}
          onChange={(e) =>
            setFormData({
              ...formData,
              balance: parseFloat(e.target.value) || 0,
            })
          }
          placeholder="0.00"
          required
        />
      </div>

      {/* Schedule G & H Fields */}
      {needsScheduleGorHFields && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="text-sm font-semibold text-muted-foreground">
              {formData.category === "Accounts Payable"
                ? "Schedule G"
                : "Schedule H"}{" "}
              Details
            </div>
            <div className="space-y-2">
              <Label htmlFor="payableTo">
                Payable To (Creditor Name){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="payableTo"
                value={formData.payableTo}
                onChange={(e) =>
                  setFormData({ ...formData, payableTo: e.target.value })
                }
                placeholder="Enter name of creditor/company you owe"
                required={needsScheduleGorHFields}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">
                Due Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required={needsScheduleGorHFields}
              />
            </div>
          </div>
        </>
      )}

      {/* Schedule I Fields */}
      {needsScheduleIFields && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="text-sm font-semibold text-muted-foreground">
              Schedule I Details
            </div>
            <div className="space-y-2">
              <Label htmlFor="payableTo">
                Payable To (Creditor Name){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="payableTo"
                value={formData.payableTo}
                onChange={(e) =>
                  setFormData({ ...formData, payableTo: e.target.value })
                }
                placeholder="Enter name of creditor/lender"
                required={needsScheduleIFields}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collateral">
                Collateral <span className="text-destructive">*</span>
              </Label>
              <Input
                id="collateral"
                value={formData.collateral}
                onChange={(e) =>
                  setFormData({ ...formData, collateral: e.target.value })
                }
                placeholder="e.g., 2020 Toyota Camry, Office Equipment"
                required={needsScheduleIFields}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finalDueDate">
                Final Due Date (Maturity Date){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="finalDueDate"
                type="date"
                value={formData.finalDueDate}
                onChange={(e) =>
                  setFormData({ ...formData, finalDueDate: e.target.value })
                }
                required={needsScheduleIFields}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyPayment">
                Monthly Payment ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="monthlyPayment"
                type="number"
                step="0.01"
                value={formData.monthlyPayment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monthlyPayment: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                required={needsScheduleIFields}
              />
            </div>
          </div>
        </>
      )}

      {/* Contact Information */}
      <Separator />
      <div className="space-y-4">
        <div className="text-sm font-semibold text-muted-foreground">
          Creditor Contact Information
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditorEmail">Email</Label>
          <Input
            id="creditorEmail"
            type="email"
            value={formData.creditorEmail}
            onChange={(e) =>
              setFormData({ ...formData, creditorEmail: e.target.value })
            }
            placeholder="creditor@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditorPhone">Phone</Label>
          <Input
            id="creditorPhone"
            type="tel"
            value={formData.creditorPhone}
            onChange={(e) =>
              setFormData({ ...formData, creditorPhone: e.target.value })
            }
            placeholder="(555) 123-4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditorAddress">Address</Label>
          <Textarea
            id="creditorAddress"
            value={formData.creditorAddress}
            onChange={(e) =>
              setFormData({ ...formData, creditorAddress: e.target.value })
            }
            placeholder="Street address, City, State, ZIP"
            rows={2}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about this liability..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
