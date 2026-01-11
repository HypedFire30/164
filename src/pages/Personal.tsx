import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Wallet, FileText, ArrowRight, DollarSign, TrendingUp, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePFSData } from "@/hooks/usePFSData";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/domain/utils";
import { Badge } from "@/components/ui/badge";

const formatCurrencyDisplay = (amount: number) => {
  return formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export default function Personal() {
  const navigate = useNavigate();
  const { data, isLoading, error } = usePFSData();

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
              : "Failed to load personal information."}
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const totals = data?.totals || {
    totalPersonalAssets: 0,
    totalLiabilities: 0,
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Personal
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information, assets, and liabilities
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="transition-all hover:shadow-lg hover:scale-[1.02] duration-200 border-l-4 border-l-success bg-success/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrencyDisplay(totals.totalPersonalAssets)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Personal assets only
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg hover:scale-[1.02] duration-200 border-l-4 border-l-destructive bg-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
              <TrendingUp className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrencyDisplay(totals.totalLiabilities)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All liabilities
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg hover:scale-[1.02] duration-200 border-l-4 border-l-primary bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Position</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrencyDisplay(totals.totalPersonalAssets - totals.totalLiabilities)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Assets minus liabilities
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Information Sections */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] duration-200 border-l-4 border-l-primary bg-primary/5"
            onClick={() => navigate("/personal/assets")}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Assets & Liabilities</CardTitle>
                    <CardDescription>Manage personal financial assets and liabilities</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track cash, investments, retirement accounts, vehicles, and other personal assets. 
                Also manage debts, loans, credit cards, and other liabilities.
              </p>
              <div className="mt-4 flex gap-2">
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  {data?.personalAssets?.length || 0} Assets
                </Badge>
                <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
                  {data?.liabilities?.length || 0} Liabilities
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg hover:scale-[1.02] duration-200 border-l-4 border-l-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Basic personal details and contact information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Name, date of birth, address, contact information, and other personal details. 
                Most of this information is set up during account creation.
              </p>
              <div className="mt-4">
                <Badge variant="outline" className="border-primary/20 text-primary">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
