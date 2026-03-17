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
  X,
  CalendarDays,
  BarChart3,
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
import { PieChart as RechartsPieChart, Cell, Pie, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

function StatChip({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-center min-w-[110px]">
      <div className={cn("text-base font-semibold leading-tight", colorClass ?? "text-foreground")}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

const fmt = (amount: number) =>
  formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Yearly row type for amortization table
interface YearlyPayment {
  year: number;
  startBalance: number;
  principal: number;
  interest: number;
  totalPaid: number;
  endBalance: number;
}

function OccupancyDonut({ occupied, vacant }: { occupied: number; vacant: number }) {
  const total = occupied + vacant;
  if (total === 0) return null;
  const data = [
    { name: "Occupied", value: occupied },
    { name: "Vacant", value: vacant },
  ];
  const COLORS = ["hsl(142.1 76.2% 36.3%)", "hsl(var(--muted))"];
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={80} height={80}>
        <RechartsPieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={24} outerRadius={38} dataKey="value" strokeWidth={0}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [`${v} units`, ""]} />
        </RechartsPieChart>
      </ResponsiveContainer>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-success inline-block" />
          <span className="text-muted-foreground">{occupied} Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-muted inline-block" />
          <span className="text-muted-foreground">{vacant} Vacant</span>
        </div>
      </div>
    </div>
  );
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = usePFSData();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [refiRate, setRefiRate] = useState("");
  const [refiLTV, setRefiLTV] = useState("75");
  const [refiTerm, setRefiTerm] = useState("30");
  const [whatIfOccupancy, setWhatIfOccupancy] = useState<number | null>(null);
  const [whatIfRentDelta, setWhatIfRentDelta] = useState(0);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-32" />
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
            {error instanceof Error ? error.message : "Failed to load property data."}
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
          <AlertDescription>The property you're looking for doesn't exist.</AlertDescription>
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
          <AlertDescription>The property you're looking for doesn't exist.</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const equity = calculatePropertyEquity(property, mortgage);
  const ltv =
    mortgage && property.currentValue > 0
      ? (mortgage.principalBalance / property.currentValue) * 100
      : 0;

  const mockData = usePropertyMockData(property);
  const { units, tenants, leases, totals: mockTotals } = mockData;

  const propertyWithTotals = {
    ...property,
    totalUnits: mockTotals.totalUnits || property.totalUnits,
    occupiedUnits: mockTotals.occupiedUnits || property.occupiedUnits,
    monthlyRentalIncome: mockTotals.monthlyRentalIncome || property.monthlyRentalIncome,
    occupancyRate: mockTotals.occupancyRate || null,
  };

  const occupancyRate =
    propertyWithTotals.totalUnits && propertyWithTotals.totalUnits > 0
      ? ((propertyWithTotals.occupiedUnits || 0) / propertyWithTotals.totalUnits) * 100
      : null;

  const loanSummary = mortgage
    ? (() => {
        try {
          const terms: LoanTerms = {
            principal: mortgage.principalBalance,
            annualInterestRate: mortgage.interestRate,
            termMonths: 360,
            loanType: "Fixed",
            startDate: new Date(mortgage.lastUpdated),
          };
          return calculateLoanSummary(terms);
        } catch {
          return null;
        }
      })()
    : null;

  // Cap Rate & Cash-on-Cash calculations
  const hasActualExpenses = !!(property.monthlyPropertyTax || property.monthlyInsurance ||
    property.monthlyHOA || property.monthlyMaintenance || property.monthlyPropertyManagement);
  const totalMonthlyExpenses = hasActualExpenses
    ? (property.monthlyPropertyTax || 0) + (property.monthlyInsurance || 0) +
      (property.monthlyHOA || 0) + (property.monthlyMaintenance || 0) +
      (property.monthlyPropertyManagement || 0) + (property.monthlyUtilities || 0) +
      (property.monthlyOtherExpenses || 0)
    : (propertyWithTotals.monthlyRentalIncome || 0) * 0.4;
  const estimatedMonthlyExpenses = totalMonthlyExpenses;
  const annualNOI =
    ((propertyWithTotals.monthlyRentalIncome || 0) - estimatedMonthlyExpenses) * 12;
  const capRate =
    property.currentValue > 0 ? (annualNOI / property.currentValue) * 100 : 0;

  const estimatedDownPayment = Math.max(
    property.purchasePrice - (mortgage?.principalBalance ?? 0),
    property.purchasePrice * 0.1
  );
  const annualCashFlow =
    ((propertyWithTotals.monthlyRentalIncome || 0) - (mortgage?.paymentAmount ?? 0)) * 12;
  const cashOnCash =
    estimatedDownPayment > 0 ? (annualCashFlow / estimatedDownPayment) * 100 : 0;

  // DSCR, GRM, Payoff Year
  const annualDebtService = (mortgage?.paymentAmount ?? 0) * 12;
  const dscr = annualDebtService > 0 ? annualNOI / annualDebtService : null;
  const grm = propertyWithTotals.monthlyRentalIncome && propertyWithTotals.monthlyRentalIncome > 0
    ? property.currentValue / (propertyWithTotals.monthlyRentalIncome * 12)
    : null;
  const remainingPayments = loanSummary?.amortizationSchedule?.length ?? 0;
  const payoffYear = remainingPayments > 0
    ? new Date().getFullYear() + Math.ceil(remainingPayments / 12)
    : null;

  // Build yearly amortization table
  const yearlySchedule: YearlyPayment[] = [];
  if (loanSummary?.amortizationSchedule) {
    const map: Record<number, YearlyPayment> = {};
    for (const payment of loanSummary.amortizationSchedule) {
      const year = Math.ceil(payment.paymentNumber / 12);
      if (!map[year]) {
        map[year] = {
          year,
          startBalance: payment.remainingBalance + payment.principalPayment,
          principal: 0,
          interest: 0,
          totalPaid: 0,
          endBalance: 0,
        };
      }
      map[year].principal += payment.principalPayment;
      map[year].interest += payment.interestPayment;
      map[year].totalPaid += payment.totalPayment;
      map[year].endBalance = payment.remainingBalance;
    }
    Object.values(map)
      .sort((a, b) => a.year - b.year)
      .forEach((y) => yearlySchedule.push(y));
  }

  // Inline editing
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
      const numericValue = parseFloat(editValue);
      if (isNaN(numericValue) && field !== "address" && field !== "notes") {
        toast({ title: "Invalid value", description: "Please enter a valid number.", variant: "destructive" });
        return;
      }
      toast({ title: "Property updated", description: "Property information has been saved successfully." });
      setEditingField(null);
      setEditValue("");
      refetch();
    } catch {
      toast({ title: "Error saving", description: "Failed to save changes.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: string) => {
    if (e.key === "Enter") { e.preventDefault(); saveField(field); }
    else if (e.key === "Escape") { e.preventDefault(); cancelEditing(); }
  };

  const EditableField = ({
    field,
    value,
    type = "text",
    formatValue = (v: any) => String(v),
  }: {
    field: string;
    value: any;
    type?: "text" | "number" | "currency";
    formatValue?: (v: any) => string;
  }) => {
    const isEditing = editingField === field;
    const displayValue = type === "currency" ? fmt(value || 0) : formatValue(value);
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type={type === "text" ? "text" : "number"}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, field)}
            className="h-8 w-36"
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={() => saveField(field)} disabled={isSaving}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEditing}>
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

  const vacantUnits = (propertyWithTotals.totalUnits || 0) - (propertyWithTotals.occupiedUnits || 0);

  return (
    <Layout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/properties/cards")}
            className="h-8 px-2 -ml-2 mb-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Properties
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {property.address}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {property.ownershipPercentage}% ownership
                {mortgage && ` · ${mortgage.lender}`}
                {occupancyRate !== null && (
                  <> · <span className={occupancyRate >= 90 ? "text-success" : occupancyRate >= 75 ? "text-warning" : "text-destructive"}>{occupancyRate.toFixed(0)}% occupied</span></>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end shrink-0">
              <StatChip
                label="Monthly Income"
                value={propertyWithTotals.monthlyRentalIncome ? fmt(propertyWithTotals.monthlyRentalIncome) : "—"}
                colorClass="text-success"
              />
              <StatChip label="Current Value" value={fmt(property.currentValue)} />
              <StatChip label="Equity" value={fmt(equity)} colorClass="text-blue-600 dark:text-blue-400" />
              <StatChip
                label="Mortgage"
                value={mortgage ? fmt(mortgage.principalBalance) : "—"}
                colorClass="text-destructive"
              />
            </div>
          </div>
        </div>

        {/* Financial Summary Card */}
        <Card className="border-l-4 border-l-success bg-success/5 group">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-success" />
              Financial Overview
            </CardTitle>
            <CardDescription>Key performance metrics for this property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
              <div className="space-y-1 p-3 rounded-lg bg-background/60 hover:bg-background transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Monthly Income</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing("monthlyRentalIncome", propertyWithTotals.monthlyRentalIncome || 0)}
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <EditableField
                  field="monthlyRentalIncome"
                  value={propertyWithTotals.monthlyRentalIncome || 0}
                  type="currency"
                />
                <p className="text-xs text-muted-foreground">
                  Annual: {fmt((propertyWithTotals.monthlyRentalIncome || 0) * 12)}
                </p>
              </div>

              <div className="space-y-1 p-3 rounded-lg bg-primary/5">
                <p className="text-xs text-muted-foreground mb-1">Property Value</p>
                <p className="text-base font-semibold text-primary">{fmt(property.currentValue)}</p>
                <p className="text-xs text-muted-foreground">Purchased {fmt(property.purchasePrice)}</p>
              </div>

              <div className="space-y-1 p-3 rounded-lg bg-success/10">
                <p className="text-xs text-muted-foreground mb-1">Net Equity</p>
                <p className="text-base font-semibold text-success">{fmt(equity)}</p>
                <p className="text-xs text-muted-foreground">LTV: {ltv.toFixed(1)}%</p>
              </div>

              <div className="space-y-1 p-3 rounded-lg bg-background/60">
                <p className="text-xs text-muted-foreground mb-1">Monthly Cash Flow</p>
                <p className={`text-base font-semibold ${annualCashFlow / 12 >= 0 ? "text-success" : "text-destructive"}`}>
                  {fmt(annualCashFlow / 12)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {mortgage ? `After ${fmt(mortgage.paymentAmount)} mortgage` : "No mortgage"}
                </p>
              </div>

              <div className="space-y-1 p-3 rounded-lg bg-background/60">
                <p className="text-xs text-muted-foreground mb-1">Cap Rate</p>
                <p className={`text-base font-semibold ${capRate >= 6 ? "text-success" : capRate >= 4 ? "text-warning" : "text-destructive"}`}>
                  {propertyWithTotals.monthlyRentalIncome ? `${capRate.toFixed(2)}%` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">NOI / Value</p>
              </div>

              <div className="space-y-1 p-3 rounded-lg bg-background/60">
                <p className="text-xs text-muted-foreground mb-1">Cash-on-Cash</p>
                <p className={`text-base font-semibold ${cashOnCash >= 8 ? "text-success" : cashOnCash >= 4 ? "text-warning" : "text-destructive"}`}>
                  {propertyWithTotals.monthlyRentalIncome && mortgage ? `${cashOnCash.toFixed(2)}%` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Annual return on equity</p>
              </div>

              <div className="space-y-1 p-3 rounded-lg bg-background/60">
                <p className="text-xs text-muted-foreground mb-1">DSCR</p>
                <p className={`text-base font-semibold ${dscr === null ? "text-muted-foreground" : dscr >= 1.25 ? "text-success" : dscr >= 1.0 ? "text-warning" : "text-destructive"}`}>
                  {dscr !== null ? `${dscr.toFixed(2)}x` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">NOI ÷ debt service</p>
              </div>

              <div className="space-y-1 p-3 rounded-lg bg-background/60">
                <p className="text-xs text-muted-foreground mb-1">Gross Rent Mult.</p>
                <p className="text-base font-semibold">
                  {grm !== null ? `${grm.toFixed(1)}x` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Value ÷ annual rent</p>
              </div>

              <div className="space-y-1 p-3 rounded-lg bg-background/60">
                <p className="text-xs text-muted-foreground mb-1">Est. Payoff</p>
                <p className="text-base font-semibold">
                  {payoffYear ? payoffYear : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {payoffYear ? `${payoffYear - new Date().getFullYear()} yrs remaining` : "No mortgage"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="gap-1.5 flex-shrink-0">
              <Home className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="units" className="gap-1.5 flex-shrink-0">
              <Building2 className="h-3.5 w-3.5" />
              Units
            </TabsTrigger>
            <TabsTrigger value="leases" className="gap-1.5 flex-shrink-0">
              <FileText className="h-3.5 w-3.5" />
              Leases
            </TabsTrigger>
            <TabsTrigger value="rentroll" className="gap-1.5 flex-shrink-0">
              <Users className="h-3.5 w-3.5" />
              Rent Roll
            </TabsTrigger>
            <TabsTrigger value="mortgages" className="gap-1.5 flex-shrink-0">
              <CreditCard className="h-3.5 w-3.5" />
              Mortgage
            </TabsTrigger>
            <TabsTrigger value="amortization" className="gap-1.5 flex-shrink-0">
              <BarChart3 className="h-3.5 w-3.5" />
              Amortization
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1.5 flex-shrink-0">
              <DollarSign className="h-3.5 w-3.5" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="gap-1.5 flex-shrink-0">
              <TrendingUp className="h-3.5 w-3.5" />
              Refinance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Property Information</CardTitle>
                      <CardDescription>Basic property details</CardDescription>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => startEditing("address", property.address)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
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
                    <span className="text-sm text-muted-foreground">Ownership %</span>
                    <div className="text-right min-w-[80px]">
                      <EditableField
                        field="ownershipPercentage"
                        value={property.ownershipPercentage}
                        type="number"
                        formatValue={(v) => `${v}%`}
                      />
                    </div>
                  </div>
                  {propertyWithTotals.totalUnits && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Units</span>
                        <span className="font-medium text-sm">{propertyWithTotals.totalUnits}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Occupied Units</span>
                        <span className="font-medium text-sm">{propertyWithTotals.occupiedUnits || 0}</span>
                      </div>
                      {occupancyRate !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                          <Badge variant={occupancyRate >= 90 ? "default" : occupancyRate >= 75 ? "secondary" : "destructive"}>
                            {occupancyRate.toFixed(1)}%
                          </Badge>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Financial Summary</CardTitle>
                      <CardDescription>Income, equity & returns</CardDescription>
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
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Property Value</span>
                    <span className="font-medium text-sm">{fmt(property.currentValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Your Ownership Value</span>
                    <span className="font-medium text-sm text-success">
                      {fmt(property.currentValue * (property.ownershipPercentage / 100))}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Net Equity</span>
                    <span className="font-medium text-sm text-success">{fmt(equity)}</span>
                  </div>
                  {propertyWithTotals.monthlyRentalIncome && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Monthly Rental Income</span>
                        <span className="font-medium text-sm">{fmt(propertyWithTotals.monthlyRentalIncome)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Annual Rental Income</span>
                        <span className="font-medium text-sm">{fmt(propertyWithTotals.monthlyRentalIncome * 12)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Est. Annual NOI</span>
                        <span className={`font-medium text-sm ${annualNOI >= 0 ? "text-success" : "text-destructive"}`}>
                          {fmt(annualNOI)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Cap Rate</span>
                        <Badge variant={capRate >= 6 ? "default" : "secondary"}>
                          {capRate.toFixed(2)}%
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* What-If Analysis */}
              {(propertyWithTotals.monthlyRentalIncome || 0) > 0 && (() => {
                const currentOccupancy = property.totalUnits && property.totalUnits > 0
                  ? (property.occupiedUnits || 0) / property.totalUnits
                  : 1;
                const effOccupancy = (whatIfOccupancy ?? Math.round(currentOccupancy * 100)) / 100;
                const effRent = (propertyWithTotals.monthlyRentalIncome || 0) * (1 + whatIfRentDelta / 100);
                const adjIncome = effRent * effOccupancy;
                const adjCashFlow = adjIncome - totalMonthlyExpenses - (mortgage?.paymentAmount || 0);
                const currentCashFlow = (propertyWithTotals.monthlyRentalIncome || 0) - totalMonthlyExpenses - (mortgage?.paymentAmount || 0);
                const delta = adjCashFlow - currentCashFlow;
                return (
                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        What-If Analysis
                      </CardTitle>
                      <CardDescription className="text-xs">Adjust occupancy or rent to see projected impact</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">Occupancy %</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={whatIfOccupancy ?? Math.round(currentOccupancy * 100)}
                              onChange={(e) => setWhatIfOccupancy(Number(e.target.value))}
                              className="flex-1 accent-primary"
                            />
                            <span className="text-sm font-semibold w-10 text-right">
                              {whatIfOccupancy ?? Math.round(currentOccupancy * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">Rent Change %</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={-20}
                              max={30}
                              step={1}
                              value={whatIfRentDelta}
                              onChange={(e) => setWhatIfRentDelta(Number(e.target.value))}
                              className="flex-1 accent-primary"
                            />
                            <span className={`text-sm font-semibold w-12 text-right ${whatIfRentDelta > 0 ? "text-success" : whatIfRentDelta < 0 ? "text-destructive" : ""}`}>
                              {whatIfRentDelta > 0 ? "+" : ""}{whatIfRentDelta}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <div className="rounded-lg bg-muted/40 p-3 text-center">
                          <p className="text-xs text-muted-foreground">Adj. Income</p>
                          <p className="text-sm font-bold">{fmt(adjIncome)}</p>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-3 text-center">
                          <p className="text-xs text-muted-foreground">Adj. Cash Flow</p>
                          <p className={`text-sm font-bold ${adjCashFlow >= 0 ? "text-success" : "text-destructive"}`}>{fmt(adjCashFlow)}</p>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-3 text-center">
                          <p className="text-xs text-muted-foreground">vs. Current</p>
                          <p className={`text-sm font-bold ${delta >= 0 ? "text-success" : "text-destructive"}`}>
                            {delta >= 0 ? "+" : ""}{fmt(delta)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          </TabsContent>

          {/* Units Tab */}
          <TabsContent value="units" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Units & Tenants</CardTitle>
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
                ) : units.length <= 20 ? (
                  // Card grid for smaller properties
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {units.map((unit) => {
                      const unitLease = leases.find(
                        (l) => l.unitId === unit.id && l.status === "Active"
                      );
                      const tenant = unitLease?.tenant;
                      const isOccupied = !!unitLease;
                      return (
                        <div
                          key={unit.id}
                          className={`rounded-lg border p-4 space-y-2 ${
                            isOccupied
                              ? "border-success/20 bg-success/5"
                              : "border-border bg-muted/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">Unit {unit.unitNumber}</span>
                            <Badge variant={isOccupied ? "default" : "secondary"} className="text-xs">
                              {isOccupied ? "Occupied" : "Vacant"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                              <span>{unit.unitType}</span>
                              <span>{unit.bedrooms}BR / {unit.bathrooms}BA</span>
                            </div>
                            {unit.squareFootage && (
                              <div>{unit.squareFootage.toLocaleString()} sq ft</div>
                            )}
                          </div>
                          {tenant && (
                            <div className="pt-1 border-t border-border/50">
                              <p className="text-xs font-medium text-foreground">{tenant.name}</p>
                              <p className="text-xs text-muted-foreground">{tenant.email}</p>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-xs text-muted-foreground">
                              {isOccupied ? "Rent" : "Market"}
                            </span>
                            <span className="text-sm font-semibold">
                              {fmt(
                                isOccupied
                                  ? unitLease.totalMonthlyRent
                                  : unit.marketRent || 0
                              )}
                              /mo
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Table fallback for large properties
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
                        const unitLease = leases.find(
                          (l) => l.unitId === unit.id && l.status === "Active"
                        );
                        const tenant = unitLease?.tenant;
                        return (
                          <TableRow key={unit.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                            <TableCell>{unit.unitType}</TableCell>
                            <TableCell>{unit.squareFootage?.toLocaleString() || "—"}</TableCell>
                            <TableCell>{unit.bedrooms || 0}BR / {unit.bathrooms || 0}BA</TableCell>
                            <TableCell>{unit.marketRent ? fmt(unit.marketRent) : "—"}</TableCell>
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
          <TabsContent value="leases" className="space-y-4 mt-4">
            {(() => {
              const daysUntil = (d: string) =>
                Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
              const expiringLeases = leases.filter((l) => {
                const d = daysUntil(l.endDate);
                return d >= 0 && d <= 60;
              });
              return (
                <>
                  {expiringLeases.length > 0 && (
                    <Alert className="border-warning/40 bg-warning/5">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <AlertTitle className="text-warning text-sm">Leases Expiring Soon</AlertTitle>
                      <AlertDescription className="text-sm">
                        {expiringLeases.length} lease{expiringLeases.length !== 1 ? "s" : ""} expiring within 60 days — review renewal options.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">Current Leases</CardTitle>
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
                              <TableHead>Start</TableHead>
                              <TableHead>End</TableHead>
                              <TableHead>Monthly Rent</TableHead>
                              <TableHead>Payment</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {leases.map((lease) => {
                              const unit = units.find((u) => u.id === lease.unitId);
                              const days = daysUntil(lease.endDate);
                              const expiryBadge =
                                days < 0 ? (
                                  <Badge variant="destructive" className="text-xs ml-1">Expired</Badge>
                                ) : days <= 30 ? (
                                  <Badge variant="destructive" className="text-xs ml-1">Expiring Soon</Badge>
                                ) : days <= 60 ? (
                                  <Badge variant="outline" className="text-xs ml-1 text-warning border-warning/40">Expiring</Badge>
                                ) : null;
                              return (
                                <TableRow key={lease.id} className="hover:bg-muted/50 transition-colors">
                                  <TableCell className="font-medium">{unit?.unitNumber || "—"}</TableCell>
                                  <TableCell>{lease.tenant.name}</TableCell>
                                  <TableCell className="text-sm">{formatDate(lease.startDate)}</TableCell>
                                  <TableCell className="text-sm">
                                    {formatDate(lease.endDate)}
                                    {expiryBadge}
                                  </TableCell>
                                  <TableCell>{fmt(lease.totalMonthlyRent)}</TableCell>
                                  <TableCell>
                                    <Badge variant={lease.paymentStatus === "Current" ? "default" : "destructive"} className="text-xs">
                                      {lease.paymentStatus || "—"}
                                      {lease.daysPastDue && ` (${lease.daysPastDue}d)`}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={lease.status === "Active" ? "default" : "secondary"} className="text-xs">
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
                </>
              );
            })()}
          </TabsContent>

          {/* Rent Roll Tab */}
          <TabsContent value="rentroll" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Rent Roll</CardTitle>
                    <CardDescription>Current occupancy and rental income by unit</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary strip */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <OccupancyDonut
                    occupied={propertyWithTotals.occupiedUnits || 0}
                    vacant={vacantUnits}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                    <div className="rounded-lg bg-muted/40 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Total Units</p>
                      <p className="text-xl font-bold mt-0.5">{propertyWithTotals.totalUnits || 0}</p>
                    </div>
                    <div className="rounded-lg bg-success/10 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Occupied</p>
                      <p className="text-xl font-bold text-success mt-0.5">{propertyWithTotals.occupiedUnits || 0}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Vacant</p>
                      <p className="text-xl font-bold mt-0.5">{vacantUnits}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Occupancy</p>
                      <p className="text-xl font-bold mt-0.5">
                        {occupancyRate !== null ? `${occupancyRate.toFixed(0)}%` : "—"}
                      </p>
                    </div>
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
                      const unitLease = leases.find(
                        (l) => l.unitId === unit.id && l.status === "Active"
                      );
                      return (
                        <TableRow key={unit.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                          <TableCell className="text-sm">{unit.unitType}</TableCell>
                          <TableCell>{unitLease?.tenant.name || <span className="text-muted-foreground">Vacant</span>}</TableCell>
                          <TableCell className="text-sm">{unitLease ? formatDate(unitLease.startDate) : "—"}</TableCell>
                          <TableCell className="text-sm">{unitLease ? formatDate(unitLease.endDate) : "—"}</TableCell>
                          <TableCell className="font-medium">
                            {unitLease
                              ? fmt(unitLease.totalMonthlyRent)
                              : <span className="text-muted-foreground">{fmt(unit.marketRent || 0)} (market)</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={unitLease ? "default" : "secondary"} className="text-xs">
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
          <TabsContent value="mortgages" className="space-y-4 mt-4">
            {mortgage ? (
              <>
                <Card className="border-l-4 border-l-primary bg-primary/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <CreditCard className="h-5 w-5 text-primary" />
                          Mortgage Summary
                        </CardTitle>
                        <CardDescription>Key loan details and metrics</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing("mortgageBalance", mortgage.principalBalance)}
                        className="hover:bg-primary/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Lender</p>
                        <p className="font-semibold">{mortgage.lender}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Principal Balance</p>
                        <EditableField field="mortgageBalance" value={mortgage.principalBalance} type="currency" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Interest Rate</p>
                        <Badge variant="secondary" className="text-sm px-2 py-0.5">
                          {(mortgage.interestRate * 100).toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Monthly Payment</p>
                        <p className="font-semibold text-destructive">{fmt(mortgage.paymentAmount)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Loan-to-Value (LTV)</p>
                        <Badge
                          variant={ltv > 80 ? "destructive" : ltv > 70 ? "default" : "secondary"}
                          className="text-sm px-2 py-0.5"
                        >
                          {ltv.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Annual Payment</p>
                        <p className="font-semibold">{fmt(mortgage.paymentAmount * 12)}</p>
                      </div>
                      {loanSummary && (
                        <>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Payments Remaining</p>
                            <p className="font-semibold">{loanSummary.paymentsRemaining}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Total Interest</p>
                            <p className="font-semibold text-warning">{fmt(loanSummary.totalInterest)}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

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
                    <Button variant="outline" size="sm">Add Mortgage</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Amortization Tab */}
          <TabsContent value="amortization" className="space-y-4 mt-4">
            {loanSummary && mortgage ? (
              <>
                {/* Summary stats */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <CalendarDays className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Payoff Date</p>
                          <p className="font-semibold text-sm">
                            {loanSummary.amortizationSchedule.length > 0
                              ? new Date(loanSummary.amortizationSchedule[loanSummary.amortizationSchedule.length - 1].date).toLocaleDateString("en-US", { year: "numeric", month: "short" })
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
                          <DollarSign className="h-4 w-4 text-warning" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Interest Remaining</p>
                          <p className="font-semibold text-sm text-warning">{fmt(loanSummary.totalInterest)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                          <TrendingUp className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Principal Paid Down</p>
                          <p className="font-semibold text-sm text-success">
                            {loanSummary.amortizationSchedule.length > 0 && yearlySchedule.length > 0
                              ? `${(((yearlySchedule[0].startBalance - mortgage.principalBalance) / yearlySchedule[0].startBalance) * 100).toFixed(1)}%`
                              : "0%"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Yearly amortization table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Yearly Amortization Schedule</CardTitle>
                    <CardDescription>
                      {mortgage.lender} · {(mortgage.interestRate * 100).toFixed(2)}% fixed · {fmt(mortgage.paymentAmount)}/mo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Year</TableHead>
                            <TableHead className="text-right">Starting Balance</TableHead>
                            <TableHead className="text-right">Principal Paid</TableHead>
                            <TableHead className="text-right">Interest Paid</TableHead>
                            <TableHead className="text-right">Total Paid</TableHead>
                            <TableHead className="text-right">Ending Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {yearlySchedule.map((row) => (
                            <TableRow key={row.year} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="font-medium">Year {row.year}</TableCell>
                              <TableCell className="text-right text-sm">{fmt(row.startBalance)}</TableCell>
                              <TableCell className="text-right text-sm text-success">{fmt(row.principal)}</TableCell>
                              <TableCell className="text-right text-sm text-warning">{fmt(row.interest)}</TableCell>
                              <TableCell className="text-right text-sm">{fmt(row.totalPaid)}</TableCell>
                              <TableCell className="text-right text-sm font-medium">{fmt(row.endBalance)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No mortgage data available for amortization schedule.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4 mt-4">
            {(() => {
              const expenseItems = [
                { label: "Property Tax", value: property.monthlyPropertyTax || 0, color: "hsl(217 91% 50%)" },
                { label: "Insurance", value: property.monthlyInsurance || 0, color: "hsl(142.1 76.2% 36.3%)" },
                { label: "HOA", value: property.monthlyHOA || 0, color: "hsl(38 92% 50%)" },
                { label: "Maintenance", value: property.monthlyMaintenance || 0, color: "hsl(280 87% 55%)" },
                { label: "Prop. Mgmt", value: property.monthlyPropertyManagement || 0, color: "hsl(0 84% 60%)" },
                { label: "Utilities", value: property.monthlyUtilities || 0, color: "hsl(190 80% 45%)" },
                { label: "Other", value: property.monthlyOtherExpenses || 0, color: "hsl(240 60% 60%)" },
              ].filter(e => e.value > 0);

              const expenseTotal = expenseItems.reduce((s, e) => s + e.value, 0);
              const income = propertyWithTotals.monthlyRentalIncome || 0;
              const actualNOI = income - expenseTotal;
              const debtService = mortgage?.paymentAmount || 0;
              const netCashFlow = actualNOI - debtService;
              const annualDepreciation = property.purchasePrice > 0
                ? Math.round((property.purchasePrice * 0.8) / 27.5 / 12)
                : null;

              return (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Monthly Income</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-success">{income > 0 ? fmt(income) : "—"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Gross rental income</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Total Operating Expenses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-destructive">{expenseTotal > 0 ? fmt(expenseTotal) : "—"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {income > 0 && expenseTotal > 0 ? `${((expenseTotal / income) * 100).toFixed(0)}% expense ratio` : "No expense data"}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className={netCashFlow >= 0 ? "border-l-4 border-l-success" : "border-l-4 border-l-destructive"}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Net Cash Flow</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-success" : "text-destructive"}`}>
                          {income > 0 ? (netCashFlow >= 0 ? "+" : "") + fmt(netCashFlow) : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">After expenses + debt service</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <DollarSign className="h-4 w-4 text-primary" />
                          Expense Breakdown
                        </CardTitle>
                        <CardDescription>
                          {hasActualExpenses ? "Actual expenses from property data" : "Estimated at 40% of gross income"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {expenseItems.length > 0 ? (
                          <div className="flex items-center gap-4">
                            <ResponsiveContainer width={120} height={120}>
                              <RechartsPieChart>
                                <Pie data={expenseItems} cx="50%" cy="50%" innerRadius={28} outerRadius={54} dataKey="value" strokeWidth={0}>
                                  {expenseItems.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => [fmt(v), "Monthly"]} contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                            <div className="flex-1 space-y-1.5">
                              {expenseItems.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
                                    <span className="text-muted-foreground">{item.label}</span>
                                  </div>
                                  <span className="font-medium">{fmt(item.value)}/mo</span>
                                </div>
                              ))}
                              <Separator className="my-1" />
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span>Total</span>
                                <span className="text-destructive">{fmt(expenseTotal)}/mo</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-6">No expense data. Add expenses to see breakdown.</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          Income Statement
                        </CardTitle>
                        <CardDescription>Monthly P&L summary</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {[
                          { label: "Gross Rental Income", value: income, color: "text-success" },
                          { label: "Operating Expenses", value: -expenseTotal, color: "text-destructive" },
                          { label: "Net Operating Income", value: actualNOI, color: actualNOI >= 0 ? "text-foreground font-semibold" : "text-destructive font-semibold", divider: true },
                          { label: "Mortgage Payment", value: -(debtService), color: "text-destructive" },
                          { label: "Net Cash Flow", value: netCashFlow, color: netCashFlow >= 0 ? "text-success font-bold" : "text-destructive font-bold", divider: true },
                        ].map((row, i) => (
                          <div key={i}>
                            {row.divider && <Separator className="my-1" />}
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">{row.label}</span>
                              <span className={row.color}>
                                {row.value >= 0 ? "" : "("}{fmt(Math.abs(row.value))}{row.value < 0 ? ")" : ""}
                              </span>
                            </div>
                          </div>
                        ))}
                        {annualDepreciation && (
                          <>
                            <Separator className="my-1" />
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>Est. depreciation (27.5 yr)</span>
                              <span>({fmt(annualDepreciation)}/mo)</span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Edit expenses hint */}
                  {!hasActualExpenses && (
                    <Card className="border-dashed">
                      <CardContent className="py-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          Expenses are estimated at 40% of income. Add actual expenses in your Airtable base for accurate NOI and DSCR calculations.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })()}
          </TabsContent>

          {/* Scenarios Tab — Refinance Calculator */}
          <TabsContent value="scenarios" className="space-y-4 mt-4">
            {(() => {
              const currentRate = mortgage ? (mortgage.interestRate * 100) : 0;
              const effectiveRate = parseFloat(refiRate) || currentRate || 6.5;
              const effectiveLTV = parseFloat(refiLTV) || 75;
              const effectiveTerm = parseFloat(refiTerm) || 30;
              const newLoanAmount = Math.round(property.currentValue * (effectiveLTV / 100));
              const cashOut = newLoanAmount - (mortgage?.principalBalance ?? 0);

              let refiPayment = 0;
              let refiSummary = null;
              try {
                refiSummary = calculateLoanSummary({
                  principal: newLoanAmount,
                  annualInterestRate: effectiveRate / 100,
                  termMonths: effectiveTerm * 12,
                  loanType: "Fixed",
                  startDate: new Date(),
                });
                refiPayment = refiSummary.monthlyPayment;
              } catch { /* noop */ }

              const refiDSCR = refiPayment > 0 ? annualNOI / (refiPayment * 12) : null;
              const refiCashFlow = (propertyWithTotals.monthlyRentalIncome || 0) - refiPayment - totalMonthlyExpenses;
              const currentCashFlow = (propertyWithTotals.monthlyRentalIncome || 0) - (mortgage?.paymentAmount || 0) - totalMonthlyExpenses;
              const paymentDelta = refiPayment - (mortgage?.paymentAmount || 0);
              const newTotalInterest = refiSummary ? refiSummary.totalInterest : 0;

              return (
                <div className="space-y-4">
                  {/* Inputs */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Refinance Scenario
                      </CardTitle>
                      <CardDescription>
                        Model a refinance or new loan scenario for {property.address.split(",")[0]}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">New Interest Rate (%)</label>
                          <Input
                            type="number"
                            step="0.125"
                            min="0"
                            max="20"
                            placeholder={currentRate > 0 ? currentRate.toFixed(3) : "6.500"}
                            value={refiRate}
                            onChange={e => setRefiRate(e.target.value)}
                          />
                          {mortgage && currentRate > 0 && (
                            <p className="text-[11px] text-muted-foreground">Current: {currentRate.toFixed(3)}%</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Target LTV (%)</label>
                          <Input
                            type="number"
                            step="5"
                            min="50"
                            max="95"
                            placeholder="75"
                            value={refiLTV}
                            onChange={e => setRefiLTV(e.target.value)}
                          />
                          {mortgage && (
                            <p className="text-[11px] text-muted-foreground">
                              Current LTV: {((mortgage.principalBalance / property.currentValue) * 100).toFixed(0)}%
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">New Term (years)</label>
                          <Input
                            type="number"
                            step="5"
                            min="10"
                            max="30"
                            placeholder="30"
                            value={refiTerm}
                            onChange={e => setRefiTerm(e.target.value)}
                          />
                          <p className="text-[11px] text-muted-foreground">Property value: {fmt(property.currentValue)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comparison */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Current */}
                    <Card className="border-l-4 border-l-muted">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-muted-foreground">Current Loan</CardTitle>
                        {mortgage && <CardDescription>{mortgage.lender} · {(mortgage.interestRate * 100).toFixed(3)}%</CardDescription>}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {[
                          { label: "Loan Balance", value: mortgage ? fmt(mortgage.principalBalance) : "—" },
                          { label: "Monthly Payment", value: mortgage ? fmt(mortgage.paymentAmount) : "—" },
                          { label: "LTV", value: mortgage ? `${((mortgage.principalBalance / property.currentValue) * 100).toFixed(1)}%` : "—" },
                          { label: "DSCR", value: dscr !== null ? `${dscr.toFixed(2)}x` : "—" },
                          { label: "Net Cash Flow", value: mortgage ? (currentCashFlow >= 0 ? "+" : "") + fmt(currentCashFlow) + "/mo" : "—" },
                        ].map((row, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{row.label}</span>
                            <span className="font-medium">{row.value}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Proposed */}
                    <Card className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-primary">Proposed Scenario</CardTitle>
                        <CardDescription>{effectiveRate.toFixed(3)}% · {effectiveTerm}yr · {effectiveLTV}% LTV</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {[
                          { label: "New Loan Amount", value: fmt(newLoanAmount) },
                          { label: "Monthly Payment", value: refiPayment > 0 ? fmt(refiPayment) : "—" },
                          { label: "Payment Change", value: refiPayment > 0 ? (paymentDelta >= 0 ? "+" : "") + fmt(paymentDelta) + "/mo" : "—", color: paymentDelta <= 0 ? "text-success" : "text-destructive" },
                          { label: "New DSCR", value: refiDSCR !== null ? `${refiDSCR.toFixed(2)}x` : "—", color: refiDSCR !== null ? (refiDSCR >= 1.25 ? "text-success" : refiDSCR >= 1.0 ? "text-warning" : "text-destructive") : "" },
                          { label: "Net Cash Flow", value: refiPayment > 0 ? (refiCashFlow >= 0 ? "+" : "") + fmt(refiCashFlow) + "/mo" : "—", color: refiCashFlow >= 0 ? "text-success" : "text-destructive" },
                        ].map((row, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{row.label}</span>
                            <span className={`font-medium ${(row as any).color || ""}`}>{row.value}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Cash-out + Interest summary */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className={cashOut > 0 ? "border-l-4 border-l-success" : "border-l-4 border-l-muted"}>
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                          {cashOut >= 0 ? "Cash Out Available" : "Additional Cash Required"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className={`text-2xl font-bold ${cashOut >= 0 ? "text-success" : "text-destructive"}`}>
                          {fmt(Math.abs(cashOut))}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cashOut >= 0 ? "New loan minus current balance" : "To buy down to target LTV"}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Total Interest (New)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{newTotalInterest > 0 ? fmt(newTotalInterest) : "—"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Over {effectiveTerm} years</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Break-Even</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {refiPayment > 0 && mortgage && paymentDelta < 0 && cashOut < 0
                            ? `${Math.ceil(Math.abs(cashOut) / Math.abs(paymentDelta))} mo`
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {paymentDelta < 0 ? "Months to recover closing costs" : "Lower payment required"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
