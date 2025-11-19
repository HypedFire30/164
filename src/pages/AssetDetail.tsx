import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, DollarSign, Mail, Phone, MapPin, Calendar, User } from "lucide-react";
import { usePFSData } from "@/hooks/usePFSData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/domain/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatCurrencyDisplay = (amount: number) => {
  return formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = usePFSData();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);

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
              : "Failed to load asset data. Please check your Airtable configuration."}
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  if (!data || !id) {
    return (
      <Layout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Asset Not Found</AlertTitle>
          <AlertDescription>
            The asset you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const asset = data.personalAssets.find((a) => a.id === id);

  if (!asset) {
    return (
      <Layout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Asset Not Found</AlertTitle>
          <AlertDescription>
            The asset you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const handleEdit = () => {
    setEditingAsset(asset);
    setIsDialogOpen(true);
  };

  const handleSave = async (formData: any) => {
    // TODO: Implement actual save to Airtable
    toast({
      title: "Asset updated",
      description: "Asset information has been saved successfully.",
    });
    setIsDialogOpen(false);
    setEditingAsset(null);
    refetch();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/assets")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assets
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {asset.description}
              </h1>
              <p className="text-muted-foreground mt-1">
                Asset Details
              </p>
            </div>
          </div>
          <Button
            onClick={handleEdit}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Asset
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asset Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrencyDisplay(asset.value)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Category</CardTitle>
              <Badge variant="secondary" className="text-xs">{asset.category}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{asset.category}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Asset type
              </p>
            </CardContent>
          </Card>

          {asset.dueDate && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Date</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{formatDate(asset.dueDate)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Payment due date
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Asset Information */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Information</CardTitle>
              <CardDescription>Basic asset details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Description</span>
                  <span className="font-medium">{asset.description}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <Badge variant="secondary">{asset.category}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Value</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrencyDisplay(asset.value)}
                  </span>
                </div>
                {asset.dueDate && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Due Date</span>
                      <span className="font-medium">{formatDate(asset.dueDate)}</span>
                    </div>
                  </>
                )}
                {asset.notes && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm text-muted-foreground">Notes</span>
                      <p className="mt-2 text-sm">{asset.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Debtor/Payor Information */}
          {(asset.receivableName || asset.debtorEmail || asset.debtorPhone || asset.debtorAddress) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Debtor/Payor Information
                </CardTitle>
                <CardDescription>Contact details for the debtor or payor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {asset.receivableName && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <span className="font-medium">{asset.receivableName}</span>
                    </div>
                  )}
                  {asset.debtorEmail && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          Email
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{asset.debtorEmail}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0"
                          >
                            <a href={`mailto:${asset.debtorEmail}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                  {asset.debtorPhone && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          Phone
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{asset.debtorPhone}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0"
                          >
                            <a href={`tel:${asset.debtorPhone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                  {asset.debtorAddress && (
                    <>
                      <Separator />
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          Address
                        </span>
                        <span className="font-medium text-right max-w-[60%]">
                          {asset.debtorAddress}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule Information */}
          {(asset.receivableName || asset.dueDate) && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>
                  {asset.category === "Accounts Receivable" ? "Schedule A" : "Schedule B"} Details
                </CardTitle>
                <CardDescription>
                  Information for PFS {asset.category === "Accounts Receivable" ? "Schedule A" : "Schedule B"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {asset.receivableName && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Name of Debtor/Payor</span>
                      <span className="font-medium">{asset.receivableName}</span>
                    </div>
                  )}
                  {asset.dueDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Due Date</span>
                      <span className="font-medium">{formatDate(asset.dueDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center md:col-span-2">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrencyDisplay(asset.value)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Asset</DialogTitle>
              <DialogDescription>
                Update asset information and contact details.
              </DialogDescription>
            </DialogHeader>
            <AssetEditForm
              asset={editingAsset}
              onSave={handleSave}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

function AssetEditForm({ asset, onSave, onCancel }: { asset: any; onSave: (data: any) => void; onCancel: () => void }) {
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
    onSave(formData);
  };

  const needsScheduleFields = formData.category === "Accounts Receivable" || formData.category === "Notes Receivable";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cash">Cash / Bank Account</SelectItem>
            <SelectItem value="Cash Other Institutions">Cash in Other Institutions</SelectItem>
            <SelectItem value="Building Material Inventory">Building Material Inventory</SelectItem>
            <SelectItem value="Life Insurance">Life Insurance (Cash Surrender Value)</SelectItem>
            <SelectItem value="Retirement">Retirement Accounts (401k, IRA, etc.)</SelectItem>
            <SelectItem value="Automobile">Automobiles and Trucks</SelectItem>
            <SelectItem value="Machinery">Machinery and Tools</SelectItem>
            <SelectItem value="Investment">Investments (Stocks, Bonds, etc.)</SelectItem>
            <SelectItem value="Accounts Receivable">Accounts Receivable (Schedule A)</SelectItem>
            <SelectItem value="Notes Receivable">Notes Receivable (Schedule B)</SelectItem>
            <SelectItem value="Other Assets">Other Assets</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., Checking Account, Investment Portfolio"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="value">Value ($) <span className="text-destructive">*</span></Label>
        <Input
          id="value"
          type="number"
          step="0.01"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
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
              {formData.category === "Accounts Receivable" ? "Schedule A" : "Schedule B"} Details
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivableName">
                Name of Debtor/Payor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="receivableName"
                value={formData.receivableName}
                onChange={(e) => setFormData({ ...formData, receivableName: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, debtorEmail: e.target.value })}
            placeholder="debtor@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="debtorPhone">Phone</Label>
          <Input
            id="debtorPhone"
            type="tel"
            value={formData.debtorPhone}
            onChange={(e) => setFormData({ ...formData, debtorPhone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="debtorAddress">Address</Label>
          <Textarea
            id="debtorAddress"
            value={formData.debtorAddress}
            onChange={(e) => setFormData({ ...formData, debtorAddress: e.target.value })}
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

