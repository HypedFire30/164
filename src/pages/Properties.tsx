import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, AlertCircle, Edit, List, Home, TrendingUp, Users, CheckSquare, Square } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePFSData } from "@/hooks/usePFSData";
import { calculatePropertyEquity } from "@/lib/calculations/totals";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Properties() {
  const { data, isLoading, error, refetch } = usePFSData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-10 w-64" />
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

  // Filter properties by search query
  const filteredProperties = properties.filter((property) =>
    property.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get property with mortgage and equity info
  const propertiesWithDetails = filteredProperties.map((property) => {
    const mortgage = mortgages.find((m) => m.propertyId === property.id);
    const equity = calculatePropertyEquity(property, mortgage);
    // Calculate occupancy rate if units exist
    const occupancyRate = property.totalUnits && property.totalUnits > 0
      ? ((property.occupiedUnits || 0) / property.totalUnits) * 100
      : null;
    return {
      property,
      mortgage,
      equity,
      occupancyRate,
    };
  });

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
            <Button
              variant="outline"
              onClick={() => navigate("/properties")}
            >
              <List className="h-4 w-4 mr-2" />
              Table View
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Search and Select All */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {filteredProperties.length > 0 && (
            <Button variant="outline" onClick={() => {
              if (selectedProperties.size === filteredProperties.length) {
                setSelectedProperties(new Set());
              } else {
                setSelectedProperties(new Set(filteredProperties.map(p => p.property.id)));
              }
            }}>
              {selectedProperties.size === filteredProperties.length ? (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Deselect All
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Select All
                </>
              )}
            </Button>
          )}
        </div>

        {/* Properties List */}
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
          <div className="grid gap-4">
            {propertiesWithDetails.map(({ property, mortgage, equity, occupancyRate }) => {
              const isSelected = selectedProperties.has(property.id);
              return (
                <Card 
                  key={property.id} 
                  className={`transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 mt-6 ml-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProperties(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(property.id)) {
                            newSet.delete(property.id);
                          } else {
                            newSet.add(property.id);
                          }
                          return newSet;
                        });
                      }}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                    <div 
                      className="cursor-pointer flex-1"
                      onClick={() => navigate(`/properties/${property.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-lg hover:text-primary">{property.address}</CardTitle>
                            <CardDescription className="flex items-center gap-3 flex-wrap">
                              {property.ownershipPercentage}% Ownership
                              {mortgage && (
                                <>
                                  <span>•</span>
                                  <span>{mortgage.lender}</span>
                                </>
                              )}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {occupancyRate !== null && (
                              <Badge 
                                variant={occupancyRate >= 90 ? "default" : occupancyRate >= 75 ? "secondary" : "destructive"}
                                className="flex items-center gap-1"
                              >
                                <Users className="h-3 w-3" />
                                {occupancyRate.toFixed(0)}%
                              </Badge>
                            )}
                            <Badge variant="secondary">Active</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Monthly Rental Income - Most Important for Rent Roll */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Monthly Income</p>
                            <p className="text-xl font-bold text-foreground">
                              {property.monthlyRentalIncome 
                                ? formatCurrency(property.monthlyRentalIncome)
                                : "—"}
                            </p>
                            {property.totalUnits && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {property.occupiedUnits || 0}/{property.totalUnits} units
                              </p>
                            )}
                          </div>
                          
                          {/* Current Value */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Current Value</p>
                            <p className="text-xl font-bold text-foreground">
                              {formatCurrency(property.currentValue)}
                            </p>
                          </div>
                          
                          {/* Equity */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Equity</p>
                            <p className="text-xl font-bold text-success">
                              {formatCurrency(equity)}
                            </p>
                          </div>
                          
                          {/* Mortgage Balance */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Mortgage</p>
                            <p className="text-xl font-semibold text-destructive">
                              {mortgage
                                ? formatCurrency(mortgage.principalBalance)
                                : "No Mortgage"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(totals.totalRealEstateValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Mortgages</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(totals.totalMortgageBalance)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Equity</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(totals.totalEquity)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
