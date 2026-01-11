import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Download, FileText, Building2, Users } from "lucide-react";
import { usePFSData } from "@/hooks/usePFSData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/domain/utils";

const formatCurrencyDisplay = (amount: number) => {
  return formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export default function GenerateRentRoll() {
  const navigate = useNavigate();
  const { data, isLoading, error } = usePFSData();
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

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

  const { properties } = data;

  // Filter properties by search query
  const filteredProperties = properties.filter((property) =>
    property.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Properties with units (for rent roll)
  const propertiesWithUnits = filteredProperties.filter(
    (p) => p.totalUnits && p.totalUnits > 0
  );

  // Toggle property selection
  const toggleProperty = (propertyId: string) => {
    setSelectedProperties((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  // Select all / Deselect all
  const toggleAll = () => {
    if (selectedProperties.size === propertiesWithUnits.length) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(propertiesWithUnits.map((p) => p.id)));
    }
  };

  // Calculate totals for selected properties
  const selectedPropertiesData = properties.filter((p) => selectedProperties.has(p.id));
  const totals = {
    totalProperties: selectedPropertiesData.length,
    totalUnits: selectedPropertiesData.reduce((sum, p) => sum + (p.totalUnits || 0), 0),
    occupiedUnits: selectedPropertiesData.reduce((sum, p) => sum + (p.occupiedUnits || 0), 0),
    monthlyIncome: selectedPropertiesData.reduce((sum, p) => sum + (p.monthlyRentalIncome || 0), 0),
  };
  const occupancyRate = totals.totalUnits > 0 
    ? (totals.occupiedUnits / totals.totalUnits) * 100 
    : 0;

  const handleGenerate = () => {
    // TODO: Implement PDF generation
    console.log("Generating rent roll for properties:", Array.from(selectedProperties));
    // This will be implemented when PDF template is ready
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
              onClick={() => navigate("/documents")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Generate Rent Roll
              </h1>
              <p className="text-muted-foreground mt-1">
                Select properties to include in the rent roll document
              </p>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        {selectedProperties.size > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Selected Properties Summary</CardTitle>
              <CardDescription>
                Totals for {selectedProperties.size} propert{selectedProperties.size === 1 ? 'y' : 'ies'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Units</p>
                  <p className="text-2xl font-bold">{totals.totalUnits}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Occupied Units</p>
                  <p className="text-2xl font-bold text-success">{totals.occupiedUnits}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                  <p className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="text-2xl font-bold">{formatCurrencyDisplay(totals.monthlyIncome)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
          {propertiesWithUnits.length > 0 && (
            <Button variant="outline" onClick={toggleAll}>
              {selectedProperties.size === propertiesWithUnits.length ? "Deselect All" : "Select All"}
            </Button>
          )}
        </div>

        {/* Properties List */}
        {propertiesWithUnits.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "No properties with units match your search."
                    : "No properties with units found. Add units to properties to generate rent rolls."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {propertiesWithUnits.map((property) => {
              const isSelected = selectedProperties.has(property.id);
              const occupancyRate = property.totalUnits && property.totalUnits > 0
                ? ((property.occupiedUnits || 0) / property.totalUnits) * 100
                : 0;

              return (
                <Card
                  key={property.id}
                  className={`transition-all hover:shadow-md ${
                    isSelected ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleProperty(property.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{property.address}</h3>
                            <p className="text-sm text-muted-foreground">
                              {property.ownershipPercentage}% Ownership
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {occupancyRate > 0 && (
                              <Badge
                                variant={occupancyRate >= 90 ? "default" : occupancyRate >= 75 ? "secondary" : "destructive"}
                                className="flex items-center gap-1"
                              >
                                <Users className="h-3 w-3" />
                                {occupancyRate.toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Units</p>
                            <p className="font-semibold">
                              {property.occupiedUnits || 0}/{property.totalUnits} occupied
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Monthly Income</p>
                            <p className="font-semibold">
                              {property.monthlyRentalIncome
                                ? formatCurrencyDisplay(property.monthlyRentalIncome)
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Current Value</p>
                            <p className="font-semibold">
                              {formatCurrencyDisplay(property.currentValue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Equity</p>
                            <p className="font-semibold text-success">
                              {formatCurrencyDisplay(
                                property.currentValue * (property.ownershipPercentage / 100) -
                                (property.mortgageId ? 0 : 0) // TODO: Calculate actual equity
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Generate Button */}
        {selectedProperties.size > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {selectedProperties.size} propert{selectedProperties.size === 1 ? 'y' : 'ies'} selected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total monthly income: {formatCurrencyDisplay(totals.monthlyIncome)}
                  </p>
                </div>
                <Button
                  onClick={handleGenerate}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Rent Roll PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
