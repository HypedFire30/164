import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Edit, 
  Building2, 
  DollarSign, 
  Home, 
  Users, 
  FileText, 
  TrendingUp,
  CreditCard,
  Plus,
  Check,
  X
} from "lucide-react";
import { usePFSData } from "@/hooks/usePFSData";
import { usePropertyMockData } from "@/hooks/usePropertyMockData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculatePropertyEquity } from "@/lib/calculations/totals";
import { formatCurrency, formatDate } from "@/domain/utils";
import { calculateLoanSummary, type LoanTerms } from "@/lib/calculations/loan-calculator";
import { MortgageCharts } from "@/components/MortgageCharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatCurrencyDisplay = (amount: number) => {
  return formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = usePFSData();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

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
              : "Failed to load property data. Please check your Airtable configuration."}
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
          <AlertTitle>Property Not Found</AlertTitle>
          <AlertDescription>
            The property you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const property = data.properties.find((p) => p.id === id);
  const mortgage = data.mortgages.find((m) => m.propertyId === id);

  if (!property) {
    return (
      <Layout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Property Not Found</AlertTitle>
          <AlertDescription>
            The property you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const equity = calculatePropertyEquity(property, mortgage);
  const ltv = mortgage && property.currentValue > 0 
    ? (mortgage.principalBalance / property.currentValue) * 100 
    : 0;
  
  // Get mock data for units, tenants, and leases
  const mockData = usePropertyMockData(property);
  const { units, tenants, leases, totals } = mockData;
  
  // Update property with calculated totals (for display consistency)
  const propertyWithTotals = {
    ...property,
    totalUnits: totals.totalUnits || property.totalUnits,
    occupiedUnits: totals.occupiedUnits || property.occupiedUnits,
    monthlyRentalIncome: totals.monthlyRentalIncome || property.monthlyRentalIncome,
    occupancyRate: totals.occupancyRate || null,
  };
  
  // Calculate occupancy metrics
  const occupancyRate = propertyWithTotals.totalUnits && propertyWithTotals.totalUnits > 0
    ? ((propertyWithTotals.occupiedUnits || 0) / propertyWithTotals.totalUnits) * 100
    : null;
  
  // Calculate loan summary if mortgage exists
  const loanSummary = mortgage ? (() => {
    try {
      const terms: LoanTerms = {
        principal: mortgage.principalBalance,
        annualInterestRate: mortgage.interestRate,
        termMonths: 360, // Default 30 years, will be editable
        loanType: "Fixed",
        startDate: new Date(mortgage.lastUpdated),
      };
      return calculateLoanSummary(terms);
    } catch (e) {
      return null;
    }
  })() : null;

  // Inline editing handlers
  const startEditing = (field: string, currentValue: string | number) => {
    setEditingField(field);
    setEditValue(String(currentValue));
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveField = async (field: string) => {
    if (!property) return;
    
    setIsSaving(true);
    try {
      // TODO: Implement actual save to Airtable
      const numericValue = parseFloat(editValue);
      if (isNaN(numericValue) && field !== "address" && field !== "notes") {
        toast({
          title: "Invalid value",
          description: "Please enter a valid number.",
          variant: "destructive",
        });
        return;
      }

      // Here you would call your update function
      // await updateProperty(property.id, { [field]: field === "address" ? editValue : numericValue });
      
      toast({
        title: "Property updated",
        description: "Property information has been saved successfully.",
      });
      
      setEditingField(null);
      setEditValue("");
      refetch();
    } catch (error) {
      toast({
        title: "Error saving",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveField(field);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  };

  // Editable field component
  const EditableField = ({ 
    field, 
    value, 
    type = "text",
    formatValue = (v: any) => String(v),
    parseValue = (v: string) => v
  }: { 
    field: string; 
    value: any; 
    type?: "text" | "number" | "currency";
    formatValue?: (v: any) => string;
    parseValue?: (v: string) => any;
  }) => {
    const isEditing = editingField === field;
    const displayValue = type === "currency" ? formatCurrencyDisplay(value || 0) : formatValue(value);

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          {type === "currency" || type === "number" ? (
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, field)}
              className="h-8 w-32"
              autoFocus
            />
          ) : (
            <Input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, field)}
              className="h-8 flex-1"
              autoFocus
            />
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => saveField(field)}
            disabled={isSaving}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={cancelEditing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <span 
        className="text-sm font-medium cursor-pointer hover:text-primary transition-colors text-right block"
        onClick={() => startEditing(field, value)}
      >
        {displayValue || "—"}
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Compact Header with Metrics */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/properties")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex-1">
            {property.address}
          </h1>
          <div className="flex items-center gap-4 text-base">
            <div className="text-right min-w-[100px]">
              <p className="text-xs text-muted-foreground mb-1">Monthly Income</p>
              <p className="text-lg font-semibold">
                {property.monthlyRentalIncome 
                  ? formatCurrencyDisplay(property.monthlyRentalIncome)
                  : "—"}
              </p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="text-right min-w-[100px]">
              <p className="text-xs text-muted-foreground mb-1">Current Value</p>
              <p className="text-lg font-semibold">{formatCurrencyDisplay(property.currentValue)}</p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="text-right min-w-[100px]">
              <p className="text-xs text-muted-foreground mb-1">Equity</p>
              <p className="text-lg font-semibold text-success">{formatCurrencyDisplay(equity)}</p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="text-right min-w-[100px]">
              <p className="text-xs text-muted-foreground mb-1">Mortgage</p>
              <p className="text-lg font-semibold text-destructive">
                {mortgage ? formatCurrencyDisplay(mortgage.principalBalance) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Summary Card - Quick Access */}
        <Card className="border-l-4 border-l-success bg-success/5 group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              Financial Summary
            </CardTitle>
            <CardDescription>Quick access to key financial metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Monthly Rental Income</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing("monthlyRentalIncome", propertyWithTotals.monthlyRentalIncome || 0)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <EditableField 
                  field="monthlyRentalIncome" 
                  value={propertyWithTotals.monthlyRentalIncome || 0} 
                  type="currency"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Annual: {formatCurrencyDisplay((propertyWithTotals.monthlyRentalIncome || 0) * 12)}
                </p>
              </div>
              <div className="space-y-1 p-3 rounded-lg bg-primary/5">
                <p className="text-xs text-muted-foreground mb-2">Property Value</p>
                <p className="text-lg font-semibold text-primary">
                  {formatCurrencyDisplay(property.currentValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Purchase: {formatCurrencyDisplay(property.purchasePrice)}
                </p>
              </div>
              <div className="space-y-1 p-3 rounded-lg bg-success/10">
                <p className="text-xs text-muted-foreground mb-2">Equity</p>
                <p className="text-lg font-semibold text-success">
                  {formatCurrencyDisplay(equity)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  LTV: {ltv.toFixed(1)}%
                </p>
              </div>
              <div className="space-y-1 p-3 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground mb-2">Cash Flow (Monthly)</p>
                <p className={`text-lg font-semibold ${
                  ((propertyWithTotals.monthlyRentalIncome || 0) - (mortgage?.paymentAmount || 0)) >= 0 
                    ? "text-success" 
                    : "text-destructive"
                }`}>
                  {formatCurrencyDisplay(
                    (propertyWithTotals.monthlyRentalIncome || 0) - (mortgage?.paymentAmount || 0)
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {mortgage ? `After ${formatCurrencyDisplay(mortgage.paymentAmount)} mortgage` : "No mortgage"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="units">Units & Tenants</TabsTrigger>
            <TabsTrigger value="leases">Leases</TabsTrigger>
            <TabsTrigger value="rentroll">Rent Roll</TabsTrigger>
            <TabsTrigger value="mortgages">Mortgages</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Property Information</CardTitle>
                      <CardDescription>Basic property details</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing("address", property.address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Address</span>
                      <div className="text-right min-w-[200px]">
                        <EditableField field="address" value={property.address} />
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Purchase Price</span>
                      <div className="text-right min-w-[120px]">
                        <EditableField field="purchasePrice" value={property.purchasePrice} type="currency" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Current Value</span>
                      <div className="text-right min-w-[120px]">
                        <EditableField field="currentValue" value={property.currentValue} type="currency" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Ownership Percentage</span>
                      <div className="text-right min-w-[80px]">
                        <EditableField field="ownershipPercentage" value={property.ownershipPercentage} type="number" />
                      </div>
                    </div>
                        {propertyWithTotals.totalUnits && (
                          <>
                            <Separator />
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Total Units</span>
                              <div className="text-right min-w-[80px]">
                                <span className="font-medium">{propertyWithTotals.totalUnits}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Occupied Units</span>
                              <div className="text-right min-w-[80px]">
                                <span className="font-medium">{propertyWithTotals.occupiedUnits || 0}</span>
                              </div>
                            </div>
                            {occupancyRate !== null && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                                <div className="text-right min-w-[80px]">
                                  <Badge variant={occupancyRate >= 90 ? "default" : occupancyRate >= 75 ? "secondary" : "destructive"}>
                                    {occupancyRate.toFixed(1)}%
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                    {property.notes && (
                      <>
                        <Separator />
                        <div>
                          <span className="text-sm text-muted-foreground">Notes</span>
                          <EditableField field="notes" value={property.notes} />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Financial Summary</CardTitle>
                      <CardDescription>Income and expenses</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing("monthlyRentalIncome", property.monthlyRentalIncome || 0)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Property Value</span>
                      <span className="font-medium">{formatCurrencyDisplay(property.currentValue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Your Ownership Value</span>
                      <span className="font-medium text-success">
                        {formatCurrencyDisplay(property.currentValue * (property.ownershipPercentage / 100))}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Net Equity</span>
                      <span className="font-medium text-success">{formatCurrencyDisplay(equity)}</span>
                    </div>
                    {propertyWithTotals.monthlyRentalIncome && (
                      <>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Monthly Rental Income</span>
                          <span className="font-medium">{formatCurrencyDisplay(propertyWithTotals.monthlyRentalIncome)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Annual Rental Income</span>
                          <span className="font-medium">{formatCurrencyDisplay(propertyWithTotals.monthlyRentalIncome * 12)}</span>
                        </div>
                      </>
                    )}
                    {property.monthlyExpenses && (
                      <>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Monthly Expenses</span>
                          <EditableField field="monthlyExpenses" value={property.monthlyExpenses} type="currency" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Net Operating Income (NOI)</span>
                          <span className="font-medium text-success">
                            {formatCurrencyDisplay(((propertyWithTotals.monthlyRentalIncome || 0) - property.monthlyExpenses) * 12)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Units & Tenants Tab */}
          <TabsContent value="units" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Units & Tenants</CardTitle>
                    <CardDescription>Manage property units and tenant information</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {units.length === 0 ? (
                  <div className="text-center py-12">
                    <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No units added yet</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Unit
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Sq Ft</TableHead>
                        <TableHead>Bed/Bath</TableHead>
                        <TableHead>Market Rent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tenant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {units.map((unit) => {
                        const unitLease = leases.find(l => l.unitId === unit.id && l.status === "Active");
                        const tenant = unitLease?.tenant;
                        return (
                          <TableRow key={unit.id}>
                            <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                            <TableCell>{unit.unitType}</TableCell>
                            <TableCell>{unit.squareFootage?.toLocaleString() || "—"}</TableCell>
                            <TableCell>{unit.bedrooms || 0}BR / {unit.bathrooms || 0}BA</TableCell>
                            <TableCell>{unit.marketRent ? formatCurrencyDisplay(unit.marketRent) : "—"}</TableCell>
                            <TableCell>
                              <Badge variant={unitLease ? "default" : "secondary"}>
                                {unitLease ? "Occupied" : "Vacant"}
                              </Badge>
                            </TableCell>
                            <TableCell>{tenant?.name || "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leases Tab */}
          <TabsContent value="leases" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Leases</CardTitle>
                    <CardDescription>Active and expired lease agreements</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lease
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {leases.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No leases added yet</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Lease
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Monthly Rent</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leases.map((lease) => {
                        const unit = units.find(u => u.id === lease.unitId);
                        return (
                          <TableRow key={lease.id}>
                            <TableCell className="font-medium">{unit?.unitNumber || "—"}</TableCell>
                            <TableCell>{lease.tenant.name}</TableCell>
                            <TableCell>{formatDate(lease.startDate)}</TableCell>
                            <TableCell>{formatDate(lease.endDate)}</TableCell>
                            <TableCell>{formatCurrencyDisplay(lease.totalMonthlyRent)}</TableCell>
                            <TableCell>
                              <Badge variant={lease.paymentStatus === "Current" ? "default" : "destructive"}>
                                {lease.paymentStatus || "—"}
                                {lease.daysPastDue && ` (${lease.daysPastDue} days)`}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={lease.status === "Active" ? "default" : "secondary"}>
                                {lease.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rent Roll Tab */}
          <TabsContent value="rentroll" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Rent Roll</CardTitle>
                    <CardDescription>Current occupancy and rental income by unit</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Units</p>
                    <p className="text-2xl font-bold">{propertyWithTotals.totalUnits || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Occupied</p>
                    <p className="text-2xl font-bold text-success">{propertyWithTotals.occupiedUnits || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vacant</p>
                    <p className="text-2xl font-bold text-destructive">
                      {(propertyWithTotals.totalUnits || 0) - (propertyWithTotals.occupiedUnits || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                    <p className="text-2xl font-bold">
                      {occupancyRate !== null ? `${occupancyRate.toFixed(1)}%` : "—"}
                    </p>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Lease Start</TableHead>
                      <TableHead>Lease End</TableHead>
                      <TableHead>Monthly Rent</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit) => {
                      const unitLease = leases.find(l => l.unitId === unit.id && l.status === "Active");
                      return (
                        <TableRow key={unit.id}>
                          <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                          <TableCell>{unit.unitType}</TableCell>
                          <TableCell>{unitLease?.tenant.name || "Vacant"}</TableCell>
                          <TableCell>{unitLease ? formatDate(unitLease.startDate) : "—"}</TableCell>
                          <TableCell>{unitLease ? formatDate(unitLease.endDate) : "—"}</TableCell>
                          <TableCell>{unitLease ? formatCurrencyDisplay(unitLease.totalMonthlyRent) : formatCurrencyDisplay(unit.marketRent || 0)}</TableCell>
                          <TableCell>
                            <Badge variant={unitLease ? "default" : "secondary"}>
                              {unitLease ? "Occupied" : "Vacant"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mortgages Tab */}
          <TabsContent value="mortgages" className="space-y-4">
            {mortgage ? (
              <>
                {/* Mortgage Summary Card */}
                <Card className="border-l-4 border-l-primary bg-primary/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                          Mortgage Summary
                        </CardTitle>
                        <CardDescription>Key loan details and metrics</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing("mortgageBalance", mortgage.principalBalance)}
                        className="transition-all hover:bg-primary/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Lender</p>
                        <p className="font-semibold text-base">{mortgage.lender}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Principal Balance</p>
                        <EditableField field="mortgageBalance" value={mortgage.principalBalance} type="currency" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Interest Rate</p>
                        <Badge variant="secondary" className="text-base px-3 py-1">
                          {(mortgage.interestRate * 100).toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Monthly Payment</p>
                        <p className="font-semibold text-base text-destructive">
                          {formatCurrencyDisplay(mortgage.paymentAmount)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Loan-to-Value (LTV)</p>
                        <Badge variant={ltv > 80 ? "destructive" : ltv > 70 ? "default" : "secondary"} className="text-base px-3 py-1">
                          {ltv.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Annual Payment</p>
                        <p className="font-semibold text-base">
                          {formatCurrencyDisplay(mortgage.paymentAmount * 12)}
                        </p>
                      </div>
                      {loanSummary && (
                        <>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Payments Remaining</p>
                            <p className="font-semibold text-base">{loanSummary.paymentsRemaining}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Total Interest</p>
                            <p className="font-semibold text-base text-warning">
                              {formatCurrencyDisplay(loanSummary.totalInterest)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Interactive Charts */}
                {loanSummary && (
                  <MortgageCharts
                    loanSummary={loanSummary}
                    propertyValue={property.currentValue}
                    currentBalance={mortgage.principalBalance}
                    monthlyPayment={mortgage.paymentAmount}
                  />
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No mortgage information available</p>
                    <Button variant="outline" size="sm">
                      Add Mortgage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
