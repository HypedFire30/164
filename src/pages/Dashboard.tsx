import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  TrendingUp,
  DollarSign,
  Wallet,
  FileText,
  ArrowRight,
  AlertCircle,
  CreditCard,
  BarChart3,
  Users,
  History,
  ChevronRight,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePFSData } from "@/hooks/usePFSData";
import { useSnapshots } from "@/hooks/useSnapshots";
import { calculatePropertyEquity } from "@/lib/calculations/totals";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

function getPropertyType(totalUnits: number | null | undefined): string {
  if (!totalUnits || totalUnits <= 1) return "Single Family";
  if (totalUnits <= 4) return "Small Multi";
  if (totalUnits <= 12) return "Multi-Family";
  return "Apartment";
}

export default function Dashboard() {
  const { data, isLoading, error } = usePFSData();
  const { data: snapshots } = useSnapshots();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-96" />
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
              : "Failed to load financial data. Please check your Airtable configuration."}
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

  const { properties, mortgages, totals } = data;

  // KPI calculations
  const totalMonthlyIncome = properties.reduce(
    (sum, p) => sum + (p.monthlyRentalIncome || 0),
    0,
  );

  const propertiesWithUnits = properties.filter(
    (p) => p.totalUnits && p.totalUnits > 0,
  );
  const avgOccupancy =
    propertiesWithUnits.length > 0
      ? propertiesWithUnits.reduce(
          (sum, p) =>
            sum + ((p.occupiedUnits || 0) / (p.totalUnits || 1)) * 100,
          0,
        ) / propertiesWithUnits.length
      : null;

  // Properties table data
  const propertyRows = properties
    .sort((a, b) => b.currentValue - a.currentValue)
    .map((property) => {
      const mortgage = mortgages.find((m) => m.propertyId === property.id);
      const equity = calculatePropertyEquity(property, mortgage);
      const cashFlow =
        (property.monthlyRentalIncome || 0) - (mortgage?.paymentAmount || 0);
      const occupancyRate =
        property.totalUnits && property.totalUnits > 0
          ? ((property.occupiedUnits || 0) / property.totalUnits) * 100
          : null;
      return { property, mortgage, equity, cashFlow, occupancyRate };
    });

  // Mortgage summary
  const totalMonthlyPayments = mortgages.reduce(
    (sum, m) => sum + (m.paymentAmount || 0),
    0,
  );

  const debtToAssetRatio =
    totals.totalAssets > 0
      ? ((totals.totalMortgageBalance + totals.totalLiabilities) /
          totals.totalAssets) *
        100
      : 0;

  // Portfolio analytics
  const totalMonthlyDebtService = mortgages.reduce(
    (sum, m) => sum + (m.paymentAmount || 0),
    0,
  );
  const netMonthlyCashFlow = totalMonthlyIncome - totalMonthlyDebtService;
  const totalPortfolioUnits = properties.reduce(
    (sum, p) => sum + (p.totalUnits || 0),
    0,
  );
  const totalOccupiedUnits = properties.reduce(
    (sum, p) => sum + (p.occupiedUnits || 0),
    0,
  );
  const avgRentPerUnit =
    totalPortfolioUnits > 0 && totalMonthlyIncome > 0
      ? totalMonthlyIncome / totalPortfolioUnits
      : 0;
  const monthlyVacancyLoss =
    (totalPortfolioUnits - totalOccupiedUnits) * avgRentPerUnit;
  const annualNOI = totalMonthlyIncome > 0 ? totalMonthlyIncome * 0.6 * 12 : 0; // 40% expense ratio
  const annualDebtService = totalMonthlyDebtService * 12;
  const portfolioDSCR =
    annualDebtService > 0 ? annualNOI / annualDebtService : 0;

  // Portfolio health score (0–100)
  const occupancyScore = Math.min(33, ((avgOccupancy ?? 0) / 100) * 33);
  const dscrScore = Math.min(33, Math.min(portfolioDSCR / 1.5, 1) * 33);
  const ltvScore = Math.min(34, Math.max(0, (1 - debtToAssetRatio / 100) * 34));
  const healthScore = Math.round(occupancyScore + dscrScore + ltvScore);

  // Cash flow chart data
  const cashFlowChartData = properties
    .filter((p) => (p.monthlyRentalIncome || 0) > 0)
    .sort((a, b) => (b.monthlyRentalIncome || 0) - (a.monthlyRentalIncome || 0))
    .slice(0, 6)
    .map((p) => {
      const m = mortgages.find((m) => m.propertyId === p.id);
      const street = p.address.split(",")[0];
      return {
        name: street.length > 16 ? street.slice(0, 14) + "…" : street,
        income: p.monthlyRentalIncome || 0,
        debt: m?.paymentAmount || 0,
      };
    });

  // Net worth trend from snapshots
  const netWorthTrendData =
    snapshots && snapshots.length >= 2
      ? snapshots
          .slice()
          .sort(
            (a, b) =>
              new Date(a.snapshotDate).getTime() -
              new Date(b.snapshotDate).getTime(),
          )
          .slice(-12)
          .map((s) => ({
            date: new Date(s.snapshotDate).toLocaleDateString("en-US", {
              month: "short",
              year: "2-digit",
            }),
            netWorth: s.totals.netWorth,
            assets: s.totals.totalAssets,
          }))
      : null;

  // Equity distribution (horizontal bar) chart
  const equityChartData = propertyRows
    .filter((r) => r.property.currentValue > 0)
    .sort((a, b) => b.equity - a.equity)
    .slice(0, 8)
    .map(({ property, mortgage, equity }) => ({
      name:
        property.address.split(",")[0].length > 20
          ? property.address.split(",")[0].slice(0, 18) + "…"
          : property.address.split(",")[0],
      equity: Math.max(equity, 0),
      debt: mortgage?.principalBalance || 0,
    }));

  // Portfolio allocation chart
  const CHART_COLORS = [
    "hsl(217 91% 50%)",
    "hsl(142.1 76.2% 36.3%)",
    "hsl(38 92% 50%)",
    "hsl(280 87% 55%)",
    "hsl(0 84% 60%)",
    "hsl(190 80% 45%)",
  ];
  const allocationData = properties
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 6)
    .map((p, i) => ({
      name:
        p.address.split(",")[0].length > 18
          ? p.address.split(",")[0].slice(0, 16) + "…"
          : p.address.split(",")[0],
      value: p.currentValue,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  // Portfolio insights
  type InsightType = "success" | "warning" | "destructive";
  const insights: Array<{ type: InsightType; text: string }> = [];
  const negativeCashFlowCount = propertyRows.filter(
    (r) => r.cashFlow < 0,
  ).length;
  if (negativeCashFlowCount > 0)
    insights.push({
      type: "warning",
      text: `${negativeCashFlowCount} propert${negativeCashFlowCount > 1 ? "ies" : "y"} with negative cash flow`,
    });
  const highLTVCount = propertyRows.filter(
    (r) =>
      r.mortgage &&
      r.property.currentValue > 0 &&
      (r.mortgage.principalBalance / r.property.currentValue) * 100 > 80,
  ).length;
  if (highLTVCount > 0)
    insights.push({
      type: "warning",
      text: `${highLTVCount} propert${highLTVCount > 1 ? "ies" : "y"} with LTV above 80%`,
    });
  if (avgOccupancy !== null && avgOccupancy >= 90)
    insights.push({
      type: "success",
      text: `Strong portfolio occupancy: ${avgOccupancy.toFixed(0)}%`,
    });
  else if (avgOccupancy !== null && avgOccupancy < 80)
    insights.push({
      type: "destructive",
      text: `Low occupancy: ${avgOccupancy.toFixed(0)}% — review pricing`,
    });
  if (portfolioDSCR >= 1.25)
    insights.push({
      type: "success",
      text: `Portfolio DSCR ${portfolioDSCR.toFixed(2)}x — well covered`,
    });
  else if (portfolioDSCR > 0 && portfolioDSCR < 1.0)
    insights.push({
      type: "destructive",
      text: `DSCR ${portfolioDSCR.toFixed(2)}x — income below debt service`,
    });
  if (netMonthlyCashFlow > 500)
    insights.push({
      type: "success",
      text: `Net positive cash flow: +${formatCurrency(netMonthlyCashFlow)}/mo`,
    });
  else if (netMonthlyCashFlow < -500)
    insights.push({
      type: "destructive",
      text: `Negative portfolio cash flow: ${formatCurrency(netMonthlyCashFlow)}/mo`,
    });

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Portfolio Overview
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {properties.length}{" "}
              {properties.length === 1 ? "property" : "properties"} ·{" "}
              {mortgages.length}{" "}
              {mortgages.length === 1 ? "mortgage" : "mortgages"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/snapshots")}>
              <History className="h-4 w-4 mr-2" />
              Snapshots
            </Button>
            <Button onClick={() => navigate("/generate")}>
              <FileText className="h-4 w-4 mr-2" />
              Generate PFS
            </Button>
          </div>
        </div>

        {/* KPI Tiles */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Portfolio Value"
            value={formatCurrency(totals.totalRealEstateValue)}
            icon={Building2}
            variant="primary"
            description={`${properties.length} ${properties.length === 1 ? "property" : "properties"}`}
          />
          <StatCard
            title="Total Equity"
            value={formatCurrency(totals.totalEquity)}
            icon={TrendingUp}
            variant="success"
            description="Across all properties"
          />
          <StatCard
            title="Monthly Income"
            value={
              totalMonthlyIncome > 0 ? formatCurrency(totalMonthlyIncome) : "—"
            }
            icon={DollarSign}
            variant="success"
            description="Gross rental income"
          />
          <StatCard
            title="Avg Occupancy"
            value={avgOccupancy !== null ? `${avgOccupancy.toFixed(0)}%` : "—"}
            icon={Users}
            variant={
              avgOccupancy === null
                ? "default"
                : avgOccupancy >= 90
                  ? "success"
                  : avgOccupancy >= 75
                    ? "warning"
                    : "destructive"
            }
            description="Tracked units"
          />
          <StatCard
            title="Vacancy Loss/Mo"
            value={
              monthlyVacancyLoss > 0 ? formatCurrency(monthlyVacancyLoss) : "—"
            }
            icon={AlertCircle}
            variant={monthlyVacancyLoss > 0 ? "destructive" : "default"}
            description={`${totalPortfolioUnits - totalOccupiedUnits} vacant unit${totalPortfolioUnits - totalOccupiedUnits !== 1 ? "s" : ""}`}
          />
        </div>

        {/* Main Content: Properties table + Sidebar */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Properties Table + Equity (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Properties
                  </CardTitle>
                  <CardDescription>Sorted by current value</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => navigate("/properties")}
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {propertyRows.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">
                      No properties found. Add your first property to get
                      started.
                    </p>
                    <Button onClick={() => navigate("/properties")}>
                      Add Property
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-6 py-2 border-b bg-muted/40">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Property
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">
                        Value
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right hidden md:block">
                        Equity
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right hidden lg:block">
                        Income
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right hidden lg:block">
                        Cash Flow
                      </span>
                    </div>
                    {propertyRows.map(
                      ({ property, equity, cashFlow, occupancyRate }) => (
                        <div
                          key={property.id}
                          className="group grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-4 px-6 py-3.5 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors items-center"
                          onClick={() => navigate(`/properties/${property.id}`)}
                        >
                          {/* Address + badges */}
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                              {property.address}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-xs text-muted-foreground">
                                {getPropertyType(property.totalUnits)}
                              </span>
                              {occupancyRate !== null && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs px-1.5 py-0 ${
                                    occupancyRate >= 90
                                      ? "text-success border-success/40"
                                      : occupancyRate >= 75
                                        ? "text-warning border-warning/40"
                                        : "text-destructive border-destructive/40"
                                  }`}
                                >
                                  <Users className="h-2.5 w-2.5 mr-0.5" />
                                  {occupancyRate.toFixed(0)}%
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Value */}
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {formatCurrency(property.currentValue)}
                            </p>
                          </div>

                          {/* Equity */}
                          <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-success">
                              {formatCurrency(equity)}
                            </p>
                          </div>

                          {/* Income */}
                          <div className="text-right hidden lg:block">
                            <p className="text-sm font-semibold">
                              {property.monthlyRentalIncome
                                ? formatCurrency(property.monthlyRentalIncome)
                                : "—"}
                            </p>
                          </div>

                          {/* Cash Flow */}
                          <div className="text-right hidden lg:block">
                            <p
                              className={`text-sm font-semibold ${
                                cashFlow >= 0
                                  ? "text-success"
                                  : "text-destructive"
                              }`}
                            >
                              {property.monthlyRentalIncome
                                ? `${cashFlow >= 0 ? "+" : ""}${formatCurrency(cashFlow)}`
                                : "—"}
                            </p>
                          </div>

                          {/* Chevron */}
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Equity Distribution — directly under properties */}
            {equityChartData.length > 1 && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    Equity Distribution
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Equity vs. mortgage balance by property
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2 pb-3">
                  <ResponsiveContainer
                    width="100%"
                    height={equityChartData.length * 36 + 16}
                  >
                    <BarChart
                      data={equityChartData}
                      layout="vertical"
                      margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
                      barCategoryGap="25%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{
                          fontSize: 9,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        tickLine={false}
                        axisLine={false}
                        width={130}
                      />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === "equity" ? "Equity" : "Mortgage Balance",
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          fontSize: "11px",
                          background: "hsl(var(--card))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Bar
                        dataKey="equity"
                        name="equity"
                        fill="hsl(142.1 76.2% 36.3%)"
                        radius={[0, 3, 3, 0]}
                        stackId="a"
                      />
                      <Bar
                        dataKey="debt"
                        name="debt"
                        fill="hsl(var(--destructive))"
                        radius={[0, 3, 3, 0]}
                        stackId="a"
                        opacity={0.7}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-1 justify-center">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-sm bg-success inline-block" />
                      Equity
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-sm bg-destructive inline-block opacity-70" />
                      Mortgage Balance
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-4">
            {/* Net Worth */}
            <Card
              className="cursor-pointer hover:shadow-card-hover transition-shadow duration-150"
              onClick={() => navigate("/personal")}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Net Worth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(totals.netWorth)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total assets minus all liabilities
                </p>
              </CardContent>
            </Card>

            {/* Income vs Debt Chart */}
            {cashFlowChartData.length > 1 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4" />
                    Income vs Debt Service
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Monthly by property
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2 pb-3">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={cashFlowChartData}
                      margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
                      barCategoryGap="30%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 9,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{
                          fontSize: 9,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        width={32}
                      />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === "income" ? "Rental Income" : "Debt Service",
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          fontSize: "11px",
                          background: "hsl(var(--card))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Bar
                        dataKey="income"
                        name="income"
                        fill="hsl(142.1 76.2% 36.3%)"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={20}
                      />
                      <Bar
                        dataKey="debt"
                        name="debt"
                        fill="hsl(var(--destructive))"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={20}
                        opacity={0.75}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-3 mt-2 justify-center">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-sm bg-success inline-block" />
                      Income
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-sm bg-destructive inline-block opacity-75" />
                      Debt Service
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Health */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Financial Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Health score badge */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold shrink-0 ${
                      healthScore >= 70
                        ? "bg-success/15 text-success"
                        : healthScore >= 40
                          ? "bg-warning/15 text-amber-600 dark:text-amber-400"
                          : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {healthScore}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {healthScore >= 70
                        ? "Healthy"
                        : healthScore >= 40
                          ? "Fair"
                          : "At Risk"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Portfolio health score
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-muted-foreground">
                      Debt-to-Asset Ratio
                    </span>
                    <span className="text-xs font-semibold">
                      {debtToAssetRatio.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        debtToAssetRatio < 40
                          ? "bg-success"
                          : debtToAssetRatio < 65
                            ? "bg-warning"
                            : "bg-destructive"
                      }`}
                      style={{ width: `${Math.min(debtToAssetRatio, 100)}%` }}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Real Estate</span>
                    <span className="font-medium">
                      {formatCurrency(totals.totalRealEstateValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Personal Assets
                    </span>
                    <span className="font-medium">
                      {formatCurrency(totals.totalPersonalAssets)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mortgages</span>
                    <span className="font-medium text-destructive">
                      {formatCurrency(totals.totalMortgageBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Other Liabilities
                    </span>
                    <span className="font-medium text-destructive">
                      {formatCurrency(totals.totalLiabilities)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Insights */}
            {insights.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-primary" />
                    Portfolio Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {insights.map((insight, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-2 px-2.5 py-2 rounded-lg text-xs",
                        {
                          "bg-success/8 text-success":
                            insight.type === "success",
                          "bg-warning/10 text-amber-700 dark:text-amber-400":
                            insight.type === "warning",
                          "bg-destructive/8 text-destructive":
                            insight.type === "destructive",
                        },
                      )}
                    >
                      {insight.type === "success" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      ) : insight.type === "warning" ? (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      )}
                      <span className="leading-relaxed">{insight.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
