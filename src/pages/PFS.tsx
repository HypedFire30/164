import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { usePFSData } from "@/hooks/usePFSData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/domain/utils";
import { assemblePFSFromData } from "@/domain/assembler";
import type { FullPFS } from "@/domain/types";

const formatCurrencyDisplay = (amount: number) => {
  return formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export default function PFS() {
  const { data, isLoading, error } = usePFSData();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPFS, setGeneratedPFS] = useState<FullPFS | null>(null);

  const handleGeneratePFS = async () => {
    if (!data) return;

    setIsGenerating(true);
    try {
      // Assemble complete PFS using domain layer
      const pfs = assemblePFSFromData({
        userId: "current-user", // TODO: Get from auth
        personalInfo: {
          id: "personal-info",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          userId: "current-user",
          name: "164 Investments",
          dateOfBirth: null,
          address: null,
        },
        realEstate: data.properties.map((p) => ({
          id: p.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          address: p.address,
          propertyType: "Residential" as const,
          acquisitionDate: null,
          purchasePrice: p.purchasePrice,
          marketValue: p.currentValue,
          mortgages: data.mortgages.filter((m) => m.propertyId === p.id).map((m) => ({
            id: m.id,
            lender: m.lender,
            principalBalance: m.principalBalance,
            interestRate: m.interestRate,
            monthlyPayment: m.paymentAmount,
            termMonths: null,
            startDate: null,
            maturityDate: null,
            propertyId: m.propertyId,
          })),
          monthlyIncome: null,
          monthlyExpenses: null,
          ownershipStructure: "Personal" as const,
          entityId: null,
          owners: [{ ownerId: "current-user", ownerName: "164 Investments", ownershipPercentage: p.ownershipPercentage }],
          notes: p.notes || null,
        })),
        bankAccounts: [],
        investments: [],
        rsus: [],
        privateEquity: [],
        capTables: [],
        businessEntities: [],
        personalLoans: [],
        creditLines: [],
        creditCards: [],
        incomeSources: [],
      });

      setGeneratedPFS(pfs);
      toast({
        title: "PFS Generated",
        description: "Your Personal Financial Statement has been generated successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate PFS",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!generatedPFS) return;

    // TODO: Implement PDF generation using pdf-lib
    toast({
      title: "PDF Export",
      description: "PDF export will be implemented with pdf-lib integration.",
    });
  };

  const handleExportJSON = () => {
    if (!generatedPFS) return;

    const json = JSON.stringify(generatedPFS, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pfs-${generatedPFS.generatedAt}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "PFS exported as JSON file.",
    });
  };

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

  const { totals } = data;
  const summaries = generatedPFS?.summaries || totals;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Generate PFS
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate and export your Personal Financial Statement
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleGeneratePFS}
              disabled={isGenerating}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate PFS
                </>
              )}
            </Button>
            {generatedPFS && (
              <>
                <Button onClick={handleExportPDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button onClick={handleExportJSON} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </>
            )}
          </div>
        </div>

        {generatedPFS && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>PFS Generated Successfully</AlertTitle>
            <AlertDescription>
              Generated on {formatDate(generatedPFS.generatedAt)}. Ready for export.
            </AlertDescription>
          </Alert>
        )}

        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Assets Summary</CardTitle>
              <CardDescription>Total value of all assets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Real Estate Value</span>
                <span className="font-semibold">{formatCurrencyDisplay(summaries.totalRealEstateValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bank Accounts</span>
                <span className="font-semibold">{formatCurrencyDisplay(summaries.totalBankAccountBalance)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Investments</span>
                <span className="font-semibold">{formatCurrencyDisplay(summaries.totalInvestmentValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Personal Assets</span>
                <span className="font-semibold">{formatCurrencyDisplay(summaries.totalPersonalAssets)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Assets</span>
                <span className="text-lg font-bold text-success">{formatCurrencyDisplay(summaries.totalAssets)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Liabilities Summary</CardTitle>
              <CardDescription>Total amount of all liabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mortgages</span>
                <span className="font-semibold">{formatCurrencyDisplay(summaries.totalMortgageBalance)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Personal Loans</span>
                <span className="font-semibold">{formatCurrencyDisplay(summaries.totalPersonalLoanBalance)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Credit Lines</span>
                <span className="font-semibold">{formatCurrencyDisplay(summaries.totalCreditLineBalance)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Credit Cards</span>
                <span className="font-semibold">{formatCurrencyDisplay(summaries.totalCreditCardBalance)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Liabilities</span>
                <span className="text-lg font-bold text-destructive">{formatCurrencyDisplay(summaries.totalLiabilities)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Metrics</CardTitle>
            <CardDescription>Key financial indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Net Worth</p>
                <p className="text-2xl font-bold">{formatCurrencyDisplay(summaries.netWorth)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Debt-to-Asset Ratio</p>
                <p className="text-2xl font-bold">{summaries.debtToAssetRatio.toFixed(2)}%</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Liquidity</p>
                <p className="text-2xl font-bold">{formatCurrencyDisplay(summaries.liquidity)}</p>
              </div>
            </div>
            {summaries.averageLTV > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Average LTV</p>
                    <p className="text-xl font-semibold">{summaries.averageLTV.toFixed(2)}%</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total NOI</p>
                    <p className="text-xl font-semibold">{formatCurrencyDisplay(summaries.totalNOI)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Average DSCR</p>
                    <p className="text-xl font-semibold">{summaries.averageDSCR.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income Summary */}
        {summaries.totalAnnualIncome > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Income Summary</CardTitle>
              <CardDescription>Annual and monthly income</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="text-2xl font-bold">{formatCurrencyDisplay(summaries.totalMonthlyIncome)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Annual Income</p>
                  <p className="text-2xl font-bold">{formatCurrencyDisplay(summaries.totalAnnualIncome)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PFS Details */}
        {generatedPFS && (
          <Card>
            <CardHeader>
              <CardTitle>PFS Details</CardTitle>
              <CardDescription>Complete financial statement breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Properties</p>
                  <Badge variant="secondary">{generatedPFS.realEstate.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Generated</p>
                  <Badge>{formatDate(generatedPFS.generatedAt)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

