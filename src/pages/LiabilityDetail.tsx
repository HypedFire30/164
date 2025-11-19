import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, DollarSign, Mail, Phone, MapPin, Calendar, User, CreditCard, Shield } from "lucide-react";
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

export default function LiabilityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = usePFSData();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<any>(null);

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
              : "Failed to load liability data. Please check your Airtable configuration."}
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
          <AlertTitle>Liability Not Found</AlertTitle>
          <AlertDescription>
            The liability you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const liability = data.liabilities.find((l) => l.id === id);

  if (!liability) {
    return (
      <Layout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Liability Not Found</AlertTitle>
          <AlertDescription>
            The liability you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const handleEdit = () => {
    setEditingLiability(liability);
    setIsDialogOpen(true);
  };

  const handleSave = async (formData: any) => {
    // TODO: Implement actual save to Airtable
    toast({
      title: "Liability updated",
      description: "Liability information has been saved successfully.",
    });
    setIsDialogOpen(false);
    setEditingLiability(null);
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
              Back to Assets & Liabilities
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {liability.description}
              </h1>
              <p className="text-muted-foreground mt-1">
                Liability Details
              </p>
            </div>
          </div>
          <Button
            onClick={handleEdit}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Liability
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrencyDisplay(liability.balance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current balance
              </p>
            </CardContent>
          </Card>

          {liability.monthlyPayment && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Payment</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrencyDisplay(liability.monthlyPayment)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per month
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Category</CardTitle>
              <Badge variant="secondary" className="text-xs">{liability.category}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{liability.category}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Liability type
              </p>
            </CardContent>
          </Card>

          {liability.dueDate && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Date</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{formatDate(liability.dueDate)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Payment due date
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Liability Information */}
          <Card>
            <CardHeader>
              <CardTitle>Liability Information</CardTitle>
              <CardDescription>Basic liability details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Description</span>
                  <span className="font-medium">{liability.description}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <Badge variant="secondary">{liability.category}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Balance</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {formatCurrencyDisplay(liability.balance)}
                  </span>
                </div>
                {liability.monthlyPayment && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monthly Payment</span>
                      <span className="font-medium">{formatCurrencyDisplay(liability.monthlyPayment)}</span>
                    </div>
                  </>
                )}
                {liability.dueDate && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Due Date</span>
                      <span className="font-medium">{formatDate(liability.dueDate)}</span>
                    </div>
                  </>
                )}
                {liability.finalDueDate && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Final Due Date</span>
                      <span className="font-medium">{formatDate(liability.finalDueDate)}</span>
                    </div>
                  </>
                )}
                {liability.collateral && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Collateral</span>
                      <span className="font-medium">{liability.collateral}</span>
                    </div>
                  </>
                )}
                {liability.notes && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm text-muted-foreground">Notes</span>
                      <p className="mt-2 text-sm">{liability.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Creditor Information */}
          {(liability.payableTo || liability.creditorEmail || liability.creditorPhone || liability.creditorAddress) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Creditor Information
                </CardTitle>
                <CardDescription>Contact details for the creditor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {liability.payableTo && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <span className="font-medium">{liability.payableTo}</span>
                    </div>
                  )}
                  {liability.creditorEmail && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          Email
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{liability.creditorEmail}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0"
                          >
                            <a href={`mailto:${liability.creditorEmail}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                  {liability.creditorPhone && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          Phone
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{liability.creditorPhone}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0"
                          >
                            <a href={`tel:${liability.creditorPhone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                  {liability.creditorAddress && (
                    <>
                      <Separator />
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          Address
                        </span>
                        <span className="font-medium text-right max-w-[60%]">
                          {liability.creditorAddress}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule Information */}
          {(liability.payableTo || liability.dueDate || liability.collateral || liability.monthlyPayment) && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>
                  {liability.category === "Accounts Payable" 
                    ? "Schedule G" 
                    : liability.category === "Notes Payable"
                    ? "Schedule H"
                    : liability.category === "Installment Obligations"
                    ? "Schedule I"
                    : "Schedule"} Details
                </CardTitle>
                <CardDescription>
                  Information for PFS {liability.category === "Accounts Payable" 
                    ? "Schedule G" 
                    : liability.category === "Notes Payable"
                    ? "Schedule H"
                    : liability.category === "Installment Obligations"
                    ? "Schedule I"
                    : "Schedule"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {liability.payableTo && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Payable To (Creditor Name)</span>
                      <span className="font-medium">{liability.payableTo}</span>
                    </div>
                  )}
                  {liability.dueDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Due Date</span>
                      <span className="font-medium">{formatDate(liability.dueDate)}</span>
                    </div>
                  )}
                  {liability.collateral && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Collateral</span>
                      <span className="font-medium">{liability.collateral}</span>
                    </div>
                  )}
                  {liability.finalDueDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Final Due Date (Maturity)</span>
                      <span className="font-medium">{formatDate(liability.finalDueDate)}</span>
                    </div>
                  )}
                  {liability.monthlyPayment && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monthly Payment</span>
                      <span className="font-medium">{formatCurrencyDisplay(liability.monthlyPayment)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center md:col-span-2">
                    <span className="text-sm text-muted-foreground">Balance</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {formatCurrencyDisplay(liability.balance)}
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
              <DialogTitle>Edit Liability</DialogTitle>
              <DialogDescription>
                Update liability information and contact details.
              </DialogDescription>
            </DialogHeader>
            <LiabilityEditForm
              liability={editingLiability}
              onSave={handleSave}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

function LiabilityEditForm({ liability, onSave, onCancel }: { liability: any; onSave: (data: any) => void; onCancel: () => void }) {
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
    onSave(formData);
  };

  const needsScheduleGorHFields = formData.category === "Accounts Payable" || formData.category === "Notes Payable";
  const needsScheduleIFields = formData.category === "Installment Obligations";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ 
            ...formData, 
            category: value, 
            payableTo: "", 
            dueDate: "", 
            collateral: "", 
            finalDueDate: "", 
            monthlyPayment: 0 
          })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Note Payable - Relative">Notes Payable to Relatives and Friends</SelectItem>
            <SelectItem value="Accrued Interest">Accrued Interest</SelectItem>
            <SelectItem value="Accrued Salary">Accrued Salary and Wages</SelectItem>
            <SelectItem value="Accrued Tax">Accrued Taxes (other than Income)</SelectItem>
            <SelectItem value="Income Tax Payable">Income Tax Payable</SelectItem>
            <SelectItem value="Chattel Mortgage">Chattel Mortgage and Contract on Equipment</SelectItem>
            <SelectItem value="Guaranteed Loan">Guaranteed or Cosigned Loans</SelectItem>
            <SelectItem value="Surety Bond">Surety Bonds</SelectItem>
            <SelectItem value="Credit Cards">Credit Cards</SelectItem>
            <SelectItem value="Personal Loans">Personal Loans</SelectItem>
            <SelectItem value="Accounts Payable">Accounts Payable (Schedule G)</SelectItem>
            <SelectItem value="Notes Payable">Notes Payable to Others (Schedule H)</SelectItem>
            <SelectItem value="Installment Obligations">Installment Obligations (Schedule I)</SelectItem>
            <SelectItem value="Other Liabilities">Other Liabilities</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., Credit Card Balance, Personal Loan"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="balance">Balance ($) <span className="text-destructive">*</span></Label>
        <Input
          id="balance"
          type="number"
          step="0.01"
          value={formData.balance}
          onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
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
              {formData.category === "Accounts Payable" ? "Schedule G" : "Schedule H"} Details
            </div>
            <div className="space-y-2">
              <Label htmlFor="payableTo">
                Payable To (Creditor Name) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="payableTo"
                value={formData.payableTo}
                onChange={(e) => setFormData({ ...formData, payableTo: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                Payable To (Creditor Name) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="payableTo"
                value={formData.payableTo}
                onChange={(e) => setFormData({ ...formData, payableTo: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, collateral: e.target.value })}
                placeholder="e.g., 2020 Toyota Camry, Office Equipment"
                required={needsScheduleIFields}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finalDueDate">
                Final Due Date (Maturity Date) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="finalDueDate"
                type="date"
                value={formData.finalDueDate}
                onChange={(e) => setFormData({ ...formData, finalDueDate: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, monthlyPayment: parseFloat(e.target.value) || 0 })}
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
            onChange={(e) => setFormData({ ...formData, creditorEmail: e.target.value })}
            placeholder="creditor@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditorPhone">Phone</Label>
          <Input
            id="creditorPhone"
            type="tel"
            value={formData.creditorPhone}
            onChange={(e) => setFormData({ ...formData, creditorPhone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditorAddress">Address</Label>
          <Textarea
            id="creditorAddress"
            value={formData.creditorAddress}
            onChange={(e) => setFormData({ ...formData, creditorAddress: e.target.value })}
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

