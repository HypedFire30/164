import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, AlertCircle, List, Users, TrendingUp, Building2, Home, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePFSData } from "@/hooks/usePFSData";
import { calculatePropertyEquity } from "@/lib/calculations/totals";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

function getPropertyType(totalUnits: number | null | undefined): string {
  if (!totalUnits || totalUnits <= 1) return "Single Family";
  if (totalUnits <= 4) return "Small Multi-Family";
  if (totalUnits <= 12) return "Multi-Family";
  return "Apartment Complex";
}

function OccupancyBar({ rate }: { rate: number }) {
  const color = rate >= 90 ? "bg-success" : rate >= 75 ? "bg-warning" : "bg-destructive";
  return (
    <div className="w-full bg-muted rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(rate, 100)}%` }}
      />
    </div>
  );
}

type SortOption = "value" | "equity" | "cashflow" | "occupancy" | "income";
type FilterType = "all" | "single" | "small-multi" | "multi" | "apartment";

export default function Properties() {
  const { data, isLoading, error } = usePFSData();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("value");
  const [filterType, setFilterType] = useState<FilterType>("all");

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
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
              : "Failed to load properties. Please check your Airtable configuration."}
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
            Please configure Airtable or add properties to your base.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const { properties, mortgages, totals } = data;

  const typeMatchMap: Record<FilterType, (units: number | null | undefined) => boolean> = {
    all: () => true,
    single: u => !u || u <= 1,
    "small-multi": u => !!u && u >= 2 && u <= 4,
    multi: u => !!u && u >= 5 && u <= 12,
    apartment: u => !!u && u > 12,
  };

  const filteredProperties = properties.filter((property) =>
    property.address.toLowerCase().includes(searchQuery.toLowerCase()) &&
    typeMatchMap[filterType](property.totalUnits)
  );

  const propertiesWithDetails = filteredProperties.map((property) => {
    const mortgage = mortgages.find((m) => m.propertyId === property.id);
    const equity = calculatePropertyEquity(property, mortgage);
    const occupancyRate =
      property.totalUnits && property.totalUnits > 0
        ? ((property.occupiedUnits || 0) / property.totalUnits) * 100
        : null;
    const cashFlow =
      (property.monthlyRentalIncome || 0) - (mortgage?.paymentAmount || 0);
    const annualNOI = ((property.monthlyRentalIncome || 0) * 0.6) * 12;
    const capRate = property.currentValue > 0 && property.monthlyRentalIncome
      ? (annualNOI / property.currentValue) * 100 : null;
    return { property, mortgage, equity, occupancyRate, cashFlow, capRate };
  }).sort((a, b) => {
    switch (sortBy) {
      case "equity": return b.equity - a.equity;
      case "cashflow": return b.cashFlow - a.cashFlow;
      case "occupancy": return (b.occupancyRate ?? -1) - (a.occupancyRate ?? -1);
      case "income": return (b.property.monthlyRentalIncome || 0) - (a.property.monthlyRentalIncome || 0);
      default: return b.property.currentValue - a.property.currentValue;
    }
  });

  const totalProperties = properties.length;
  const avgOccupancy =
    properties.filter((p) => p.totalUnits).length > 0
      ? properties
          .filter((p) => p.totalUnits && p.totalUnits > 0)
          .reduce(
            (sum, p) =>
              sum + ((p.occupiedUnits || 0) / (p.totalUnits || 1)) * 100,
            0
          ) / properties.filter((p) => p.totalUnits).length
      : null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Properties
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your investment property portfolio
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/properties")}>
              <List className="h-4 w-4 mr-2" />
              Table View
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Portfolio Summary KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Portfolio Value"
            value={formatCurrency(totals.totalRealEstateValue)}
            icon={Building2}
            variant="primary"
            description={`${totalProperties} ${totalProperties === 1 ? "property" : "properties"}`}
          />
          <StatCard
            title="Total Equity"
            value={formatCurrency(totals.totalEquity)}
            icon={TrendingUp}
            variant="success"
            description="Across all properties"
          />
          <StatCard
            title="Total Mortgage Balance"
            value={formatCurrency(totals.totalMortgageBalance)}
            icon={Home}
            variant="destructive"
            description="Outstanding principal"
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
            description="Across tracked units"
          />
        </div>

        {/* Search + Filter + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="single">Single Family</SelectItem>
              <SelectItem value="small-multi">Small Multi (2–4)</SelectItem>
              <SelectItem value="multi">Multi-Family (5–12)</SelectItem>
              <SelectItem value="apartment">Apartment (12+)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-44">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value">Sort: Value</SelectItem>
              <SelectItem value="equity">Sort: Equity</SelectItem>
              <SelectItem value="cashflow">Sort: Cash Flow</SelectItem>
              <SelectItem value="income">Sort: Income</SelectItem>
              <SelectItem value="occupancy">Sort: Occupancy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Property Cards */}
        {propertiesWithDetails.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">
                {searchQuery
                  ? "No properties match your search."
                  : "No properties found. Add your first property to get started."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {propertiesWithDetails.map(
              ({ property, mortgage, equity, occupancyRate, cashFlow, capRate }) => {
                const propertyType = getPropertyType(property.totalUnits);
                return (
                  <Card
                    key={property.id}
                    className="cursor-pointer transition-all hover:shadow-card-hover hover:border-border/60 duration-150 overflow-hidden"
                    onClick={() => navigate(`/properties/${property.id}`)}
                  >
                    {/* Card top accent bar */}
                    <div className="h-1 w-full bg-primary" />

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base leading-tight text-foreground truncate">
                            {property.address}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {property.ownershipPercentage}% ownership
                            {mortgage && ` · ${mortgage.lender}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className="text-xs font-normal">
                            {propertyType}
                          </Badge>
                          {occupancyRate !== null && (
                            <Badge
                              variant={
                                occupancyRate >= 90
                                  ? "default"
                                  : occupancyRate >= 75
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-xs gap-1"
                            >
                              <Users className="h-3 w-3" />
                              {occupancyRate.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Metrics grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Monthly Income</p>
                          <p className="text-lg font-bold text-foreground">
                            {property.monthlyRentalIncome
                              ? formatCurrency(property.monthlyRentalIncome)
                              : "—"}
                          </p>
                          {property.totalUnits && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {property.occupiedUnits || 0}/{property.totalUnits} units
                            </p>
                          )}
                        </div>
                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Current Value</p>
                          <p className="text-lg font-bold text-foreground">
                            {formatCurrency(property.currentValue)}
                          </p>
                          {property.purchasePrice > 0 && (() => {
                            const appreciation = ((property.currentValue - property.purchasePrice) / property.purchasePrice) * 100;
                            return (
                              <p className={`text-xs mt-0.5 font-medium ${appreciation >= 0 ? "text-success" : "text-destructive"}`}>
                                {appreciation >= 0 ? "+" : ""}{appreciation.toFixed(1)}% from purchase
                              </p>
                            );
                          })()}
                        </div>
                        <div className="rounded-lg bg-success/8 border border-success/15 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Equity</p>
                          <p className="text-lg font-bold text-success">
                            {formatCurrency(equity)}
                          </p>
                          {mortgage && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              LTV {((mortgage.principalBalance / property.currentValue) * 100).toFixed(0)}%
                            </p>
                          )}
                        </div>
                        <div className="rounded-lg bg-destructive/5 border border-destructive/15 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Mortgage</p>
                          <p className="text-lg font-bold text-destructive">
                            {mortgage ? formatCurrency(mortgage.principalBalance) : "—"}
                          </p>
                          {mortgage && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatCurrency(mortgage.paymentAmount)}/mo
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Occupancy bar + cash flow */}
                      {(occupancyRate !== null || mortgage) && (
                        <div className="space-y-2">
                          {occupancyRate !== null && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Occupancy</span>
                                <span>{occupancyRate.toFixed(0)}%</span>
                              </div>
                              <OccupancyBar rate={occupancyRate} />
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-muted-foreground">Monthly cash flow</span>
                            {property.monthlyRentalIncome && mortgage ? (
                              <span className={`text-sm font-semibold ${cashFlow >= 0 ? "text-success" : "text-destructive"}`}>
                                {cashFlow >= 0 ? "+" : ""}{formatCurrency(cashFlow)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </div>
                          {capRate !== null && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Cap rate (est.)</span>
                              <span className={`text-sm font-semibold ${capRate >= 6 ? "text-success" : capRate >= 4 ? "text-warning" : "text-destructive"}`}>
                                {capRate.toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              }
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
