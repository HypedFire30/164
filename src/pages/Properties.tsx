import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, AlertCircle, Edit, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePFSData } from "@/hooks/usePFSData";
import { calculatePropertyEquity } from "@/lib/calculations/totals";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyEditDialog } from "@/components/PropertyEditDialog";
import { MortgageEditDialog } from "@/components/MortgageEditDialog";
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
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [editingMortgage, setEditingMortgage] = useState<{ mortgage: any; propertyId: string } | null>(null);
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const [isMortgageDialogOpen, setIsMortgageDialogOpen] = useState(false);

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
    return {
      property,
      mortgage,
      equity,
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

        {/* Search */}
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
            {propertiesWithDetails.map(({ property, mortgage, equity }) => (
              <Card 
                key={property.id} 
                className="transition-all hover:shadow-md cursor-pointer"
                onClick={() => navigate(`/properties/${property.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg hover:text-primary">{property.address}</CardTitle>
                      <CardDescription>
                        {mortgage ? `Lender: ${mortgage.lender} • ` : ""}
                        {property.ownershipPercentage}% Ownership
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Purchase Price</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(property.purchasePrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Value</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(property.currentValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mortgage Balance</p>
                      <p className="text-lg font-semibold text-destructive">
                        {mortgage
                          ? formatCurrency(mortgage.principalBalance)
                          : "No Mortgage"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Equity</p>
                      <p className="text-lg font-semibold text-success">
                        {formatCurrency(equity)}
                      </p>
                    </div>
                    <div className="flex items-end justify-end col-span-2 md:col-span-1 gap-2">
                      {mortgage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMortgage({ mortgage, propertyId: property.id });
                            setIsMortgageDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Update Balance
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProperty(property);
                          setIsPropertyDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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

        {/* Edit Dialogs */}
        <PropertyEditDialog
          property={editingProperty}
          open={isPropertyDialogOpen}
          onOpenChange={setIsPropertyDialogOpen}
          onSave={async (data) => {
            // TODO: Implement actual save to Airtable
            toast({
              title: "Property updated",
              description: "Property information has been saved successfully.",
            });
            setEditingProperty(null);
            refetch();
          }}
        />
        {editingMortgage && (
          <MortgageEditDialog
            mortgage={editingMortgage.mortgage}
            propertyId={editingMortgage.propertyId}
            open={isMortgageDialogOpen}
            onOpenChange={setIsMortgageDialogOpen}
            onSave={async (data) => {
              // TODO: Implement actual save to Airtable
              toast({
                title: "Mortgage updated",
                description: "Mortgage balance has been updated successfully.",
              });
              setEditingMortgage(null);
              refetch();
            }}
          />
        )}
      </div>
    </Layout>
  );
}
