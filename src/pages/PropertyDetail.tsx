import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Building2, DollarSign } from "lucide-react";
import { usePFSData } from "@/hooks/usePFSData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { PropertyEditDialog } from "@/components/PropertyEditDialog";
import { MortgageEditDialog } from "@/components/MortgageEditDialog";
import { useToast } from "@/hooks/use-toast";
import { calculatePropertyEquity } from "@/lib/calculations/totals";
import { formatCurrency, formatDate } from "@/domain/utils";

const formatCurrencyDisplay = (amount: number) => {
  return formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = usePFSData();
  const { toast } = useToast();
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [editingMortgage, setEditingMortgage] = useState<{ mortgage: any; propertyId: string } | null>(null);
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const [isMortgageDialogOpen, setIsMortgageDialogOpen] = useState(false);

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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/properties")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {property.address}
              </h1>
              <p className="text-muted-foreground mt-1">
                Property Details
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingProperty(property);
              setIsPropertyDialogOpen(true);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Property
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrencyDisplay(property.currentValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ownership: {property.ownershipPercentage}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mortgage Balance</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {mortgage ? formatCurrencyDisplay(mortgage.principalBalance) : "No Mortgage"}
              </div>
              {mortgage && (
                <p className="text-xs text-muted-foreground mt-1">
                  LTV: {ltv.toFixed(1)}%
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equity</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrencyDisplay(equity)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {property.ownershipPercentage}% ownership
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchase Price</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrencyDisplay(property.purchasePrice)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {property.currentValue > property.purchasePrice ? (
                  <span className="text-success">
                    +{formatCurrencyDisplay(property.currentValue - property.purchasePrice)} gain
                  </span>
                ) : (
                  <span className="text-destructive">
                    {formatCurrencyDisplay(property.currentValue - property.purchasePrice)} loss
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
              <CardDescription>Basic property details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <span className="font-medium">{property.address}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Purchase Price</span>
                  <span className="font-medium">{formatCurrencyDisplay(property.purchasePrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Value</span>
                  <span className="font-medium">{formatCurrencyDisplay(property.currentValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ownership Percentage</span>
                  <Badge variant="secondary">{property.ownershipPercentage}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ownership Value</span>
                  <span className="font-medium">
                    {formatCurrencyDisplay(property.currentValue * (property.ownershipPercentage / 100))}
                  </span>
                </div>
                {property.notes && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm text-muted-foreground">Notes</span>
                      <p className="mt-2 text-sm">{property.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mortgage Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mortgage Information</CardTitle>
                  <CardDescription>Loan and payment details</CardDescription>
                </div>
                {mortgage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingMortgage({ mortgage, propertyId: property.id });
                      setIsMortgageDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mortgage ? (
                <div className="grid gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Lender</span>
                    <span className="font-medium">{mortgage.lender}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Principal Balance</span>
                    <span className="font-medium text-destructive">
                      {formatCurrencyDisplay(mortgage.principalBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Interest Rate</span>
                    <Badge variant="secondary">{(mortgage.interestRate * 100).toFixed(2)}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Monthly Payment</span>
                    <span className="font-medium">{formatCurrencyDisplay(mortgage.paymentAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm">{formatDate(mortgage.lastUpdated)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Loan-to-Value (LTV)</span>
                    <Badge variant={ltv > 80 ? "destructive" : ltv > 70 ? "default" : "secondary"}>
                      {ltv.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No mortgage information available</p>
                  <Button variant="outline" size="sm">
                    Add Mortgage
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Schedule E Information */}
        {(property.scheduleEDebtorName || 
          property.scheduleEOriginalBalance || 
          property.scheduleEPresentBalance) && (
          <Card>
            <CardHeader>
              <CardTitle>Schedule E - Contracts and Mortgages Receivable</CardTitle>
              <CardDescription>Information for PFS Schedule E</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Name of Debtor</span>
                  <span className="font-medium">{property.scheduleEDebtorName || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Payment Schedule</span>
                  <Badge variant="secondary">{property.scheduleEPaymentSchedule || "—"}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount Past Due</span>
                  <span className="font-medium">
                    {property.scheduleEAmountPastDue 
                      ? formatCurrencyDisplay(property.scheduleEAmountPastDue)
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Original Balance</span>
                  <span className="font-medium">
                    {property.scheduleEOriginalBalance 
                      ? formatCurrencyDisplay(property.scheduleEOriginalBalance)
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Present Balance</span>
                  <span className="font-medium">
                    {property.scheduleEPresentBalance 
                      ? formatCurrencyDisplay(property.scheduleEPresentBalance)
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Interest Rate</span>
                  <Badge variant="secondary">
                    {property.scheduleEInterestRate 
                      ? `${property.scheduleEInterestRate.toFixed(2)}%`
                      : "—"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Calculated financial metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Property Value</p>
                <p className="text-2xl font-bold">{formatCurrencyDisplay(property.currentValue)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Your Ownership Value</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrencyDisplay(property.currentValue * (property.ownershipPercentage / 100))}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Net Equity</p>
                <p className="text-2xl font-bold text-success">{formatCurrencyDisplay(equity)}</p>
              </div>
            </div>
            {mortgage && (
              <>
                <Separator className="my-4" />
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Loan-to-Value Ratio</p>
                    <p className="text-xl font-semibold">{ltv.toFixed(2)}%</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Annual Payment</p>
                    <p className="text-xl font-semibold">
                      {formatCurrencyDisplay(mortgage.paymentAmount * 12)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Remaining Principal</p>
                    <p className="text-xl font-semibold text-destructive">
                      {formatCurrencyDisplay(mortgage.principalBalance)}
                    </p>
                  </div>
                </div>
              </>
            )}
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

