import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp, DollarSign, Percent, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePFSData } from "@/hooks/usePFSData";
import { calculatePropertyEquity } from "@/lib/calculations/totals";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

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

  const { properties, mortgages, totals } = data;

  // Get recent properties (last 5, sorted by current value)
  const recentProperties = [...properties]
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5)
    .map((property) => {
      const mortgage = mortgages.find((m) => m.propertyId === property.id);
      const equity = calculatePropertyEquity(property, mortgage);
      return {
        property,
        equity,
      };
    });

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Portfolio Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Overview of your investment portfolio and financial position
            </p>
          </div>
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate("/pfs")}
          >
            Generate PFS
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Properties"
            value={properties.length.toString()}
            description="Active investments"
            icon={Building2}
          />
          <StatCard
            title="Total Value"
            value={formatCurrency(totals.totalRealEstateValue)}
            description="Current market value"
            icon={TrendingUp}
          />
          <StatCard
            title="Total Equity"
            value={formatCurrency(totals.totalEquity)}
            description="Property equity"
            icon={DollarSign}
          />
          <StatCard
            title="Net Worth"
            value={formatCurrency(totals.netWorth)}
            description="Assets minus liabilities"
            icon={Percent}
          />
        </div>

        {/* Recent Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Top Properties by Value</CardTitle>
            <CardDescription>
              Your highest valued investment properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentProperties.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No properties found. Add your first property to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {recentProperties.map(({ property, equity }) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{property.address}</p>
                      <p className="text-sm text-muted-foreground">
                        Current Value: {formatCurrency(property.currentValue)} •{" "}
                        {property.ownershipPercentage}% Ownership
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-success">{formatCurrency(equity)}</p>
                      <p className="text-xs text-muted-foreground">Equity</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => navigate("/properties")}
          >
            <CardHeader>
              <CardTitle className="text-lg">Update Property Values</CardTitle>
              <CardDescription>
                Refresh current market valuations
              </CardDescription>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => navigate("/properties")}
          >
            <CardHeader>
              <CardTitle className="text-lg">Update Mortgage Balances</CardTitle>
              <CardDescription>
                Enter latest principal balances ({mortgages.length} mortgages)
              </CardDescription>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => navigate("/assets")}
          >
            <CardHeader>
              <CardTitle className="text-lg">Manage Assets</CardTitle>
              <CardDescription>
                Review personal assets & liabilities
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
