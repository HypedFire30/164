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
  Plus,
  ArrowRight,
  AlertCircle,
  Home,
  CreditCard,
  BarChart3,
  Eye,
  Edit,
  CheckCircle2,
  PieChart,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePFSData } from "@/hooks/usePFSData";
import { calculatePropertyEquity } from "@/lib/calculations/totals";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Cell, Pie } from "recharts";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Dashboard() {
  const { data, isLoading, error } = usePFSData();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
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

  const { properties, mortgages, personalAssets, liabilities, totals } = data;

  // Get top properties (sorted by current value)
  const topProperties = [...properties]
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5)
    .map((property) => {
      const mortgage = mortgages.find((m) => m.propertyId === property.id);
      const equity = calculatePropertyEquity(property, mortgage);
      return {
        property,
        mortgage,
        equity,
      };
    });

  // Calculate debt-to-asset ratio
  const debtToAssetRatio =
    totals.totalAssets > 0
      ? ((totals.totalMortgageBalance + totals.totalLiabilities) /
          totals.totalAssets) *
        100
      : 0;

  // Quick stats
  const totalDebt = totals.totalMortgageBalance + totals.totalLiabilities;
  const hasProperties = properties.length > 0;
  const hasAssets = personalAssets.length > 0;
  const hasLiabilities = liabilities.length > 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Portfolio Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Your complete financial overview at a glance
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/snapshots")}
              className="hidden sm:flex"
            >
              <History className="h-4 w-4 mr-2" />
              Snapshots
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/properties")}
              className="hidden sm:flex"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => navigate("/generate")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate PFS
            </Button>
          </div>
        </div>

        {/* Main Chart and Financial Overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Asset Allocation Chart - Takes 2/3 width */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <PieChart className="h-6 w-6 text-primary" />
                      Asset Allocation
                    </CardTitle>
                    <CardDescription>
                      Breakdown of your total assets
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {totals.totalAssets > 0 ? (
                  <AssetAllocationChart
                    realEstateValue={totals.totalRealEstateValue}
                    personalAssetsValue={totals.totalPersonalAssets}
                    totalAssets={totals.totalAssets}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                    <div className="text-center">
                      <PieChart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>No assets to display</p>
                      <p className="text-sm mt-2">
                        Add properties or assets to see your allocation
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Financial Overview - Takes 1/3 width */}
          <div className="space-y-4 flex flex-col">
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Net Worth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(totals.netWorth)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total assets minus liabilities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  Total Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(totals.totalAssets)}
                </div>
                <div className="mt-3 space-y-2 text-sm">
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-destructive" />
                  Total Debt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(totalDebt)}
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mortgages</span>
                    <span className="font-medium">
                      {formatCurrency(totals.totalMortgageBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Other Liabilities
                    </span>
                    <span className="font-medium">
                      {formatCurrency(totals.totalLiabilities)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  Property Equity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totals.totalEquity)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {properties.length}{" "}
                  {properties.length === 1 ? "property" : "properties"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quick Actions
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] group"
              onClick={() => navigate("/properties")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Building2 className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-lg mt-2">Properties</CardTitle>
                <CardDescription>
                  View and manage {properties.length}{" "}
                  {properties.length === 1 ? "property" : "properties"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Total Value:</span>
                  <span className="font-semibold">
                    {formatCurrency(totals.totalRealEstateValue)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] group"
              onClick={() => navigate("/assets")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Wallet className="h-8 w-8 text-green-500 group-hover:scale-110 transition-transform" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-lg mt-2">
                  Assets & Liabilities
                </CardTitle>
                <CardDescription>
                  Manage personal assets and debts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">Assets:</span>
                    <span className="font-semibold text-success ml-1">
                      {formatCurrency(totals.totalPersonalAssets)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Debts:</span>
                    <span className="font-semibold text-destructive ml-1">
                      {formatCurrency(totals.totalLiabilities)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] group"
              onClick={() => navigate("/generate")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <FileText className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-lg mt-2">Generate PFS</CardTitle>
                <CardDescription>
                  Create your Personal Financial Statement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="w-full justify-center">
                  Ready to Generate
                </Badge>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] group"
              onClick={() => navigate("/properties")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CreditCard className="h-8 w-8 text-orange-500 group-hover:scale-110 transition-transform" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-lg mt-2">Mortgage Summary</CardTitle>
                <CardDescription>
                  {mortgages.length}{" "}
                  {mortgages.length === 1 ? "mortgage" : "mortgages"} active
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Total Balance:</span>
                  <span className="font-semibold text-destructive">
                    {formatCurrency(totals.totalMortgageBalance)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Properties - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Top Properties
                  </CardTitle>
                  <CardDescription>
                    Your highest valued investment properties
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/properties")}
                  className="text-primary"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {topProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No properties found. Add your first property to get
                      started.
                    </p>
                    <Button onClick={() => navigate("/properties")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Property
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topProperties.map(({ property, mortgage, equity }) => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/properties/${property.id}`)}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {property.address}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {property.ownershipPercentage}% owned
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              Value:{" "}
                              <span className="font-medium text-foreground">
                                {formatCurrency(property.currentValue)}
                              </span>
                            </span>
                            {mortgage && (
                              <span>
                                Mortgage:{" "}
                                <span className="font-medium text-foreground">
                                  {formatCurrency(mortgage.principalBalance)}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xl font-bold text-success">
                            {formatCurrency(equity)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Equity
                          </p>
                        </div>
                        <Eye className="h-5 w-5 text-muted-foreground ml-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary - Takes 1 column */}
          <div className="space-y-6">
            {/* Financial Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Financial Health
                </CardTitle>
                <CardDescription>Key metrics and ratios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">
                      Debt-to-Asset Ratio
                    </span>
                    <span className="text-sm font-semibold">
                      {debtToAssetRatio.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        debtToAssetRatio < 30
                          ? "bg-success"
                          : debtToAssetRatio < 60
                          ? "bg-yellow-500"
                          : "bg-destructive"
                      }`}
                      style={{ width: `${Math.min(debtToAssetRatio, 100)}%` }}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Real Estate Value
                    </span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(totals.totalRealEstateValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Personal Assets
                    </span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(totals.totalPersonalAssets)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Mortgage Balance
                    </span>
                    <span className="text-sm font-semibold text-destructive">
                      {formatCurrency(totals.totalMortgageBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Other Liabilities
                    </span>
                    <span className="text-sm font-semibold text-destructive">
                      {formatCurrency(totals.totalLiabilities)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Summary</CardTitle>
                <CardDescription>Quick overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">Properties</span>
                  </div>
                  <Badge variant="secondary">{properties.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Mortgages</span>
                  </div>
                  <Badge variant="secondary">{mortgages.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Assets</span>
                  </div>
                  <Badge variant="secondary">{personalAssets.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Liabilities</span>
                  </div>
                  <Badge variant="secondary">{liabilities.length}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/properties")}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Properties
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/assets")}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Manage Assets
              </Button>
              <Button
                className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => navigate("/generate")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate PFS
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Asset Allocation Chart Component
function AssetAllocationChart({
  realEstateValue,
  personalAssetsValue,
  totalAssets,
}: {
  realEstateValue: number;
  personalAssetsValue: number;
  totalAssets: number;
}) {
  const chartData = [
    {
      name: "Real Estate",
      value: realEstateValue,
      fill: "#3b82f6", // blue-500
    },
    {
      name: "Personal Assets",
      value: personalAssetsValue,
      fill: "#22c55e", // green-500
    },
  ];

  const chartConfig = {
    "Real Estate": {
      label: "Real Estate",
      color: "#3b82f6",
    },
    "Personal Assets": {
      label: "Personal Assets",
      color: "#22c55e",
    },
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return ((value / totalAssets) * 100).toFixed(1);
  };

  return (
    <div className="w-full">
      <ChartContainer config={chartConfig} className="h-[500px] w-full">
        <RechartsPieChart>
          <ChartTooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0];
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium">{data.name}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">
                          Value
                        </span>
                        <span className="text-sm font-bold">
                          {formatValue(data.value as number)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">
                          Percentage
                        </span>
                        <span className="text-sm font-semibold">
                          {formatPercentage(data.value as number)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(1)}%`
            }
            outerRadius={160}
            innerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </RechartsPieChart>
      </ChartContainer>
      <div className="flex items-center justify-center gap-8 px-6 pb-6">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: item.fill }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatValue(item.value)} ({formatPercentage(item.value)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
