import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingDown,
  BarChart3,
  Download,
  CheckCircle,
  ChevronRight,
  Pencil,
  Plus,
  Wallet,
  AlertCircle,
  FileText,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePFSData } from "@/hooks/usePFSData";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from "@/domain/utils";
import { cn } from "@/lib/utils";

const fmt = (amount: number) =>
  formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function Personal() {
  const navigate = useNavigate();
  const { data, isLoading, error } = usePFSData();

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
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
            {error instanceof Error ? error.message : "Failed to load personal information."}
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const personalAssets = data?.personalAssets ?? [];
  const liabilities = data?.liabilities ?? [];
  const totals = data?.totals ?? { totalPersonalAssets: 0, totalLiabilities: 0 };
  const netPosition = totals.totalPersonalAssets - totals.totalLiabilities;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Personal Finance</h1>
          <p className="text-muted-foreground mt-1">Assets, liabilities, and personal documents</p>
        </div>

        {/* KPI strip */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/12">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-success">{fmt(totals.totalPersonalAssets)}</div>
              <p className="text-xs text-muted-foreground mt-1">{personalAssets.length} items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Liabilities</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-destructive">{fmt(totals.totalLiabilities)}</div>
              <p className="text-xs text-muted-foreground mt-1">{liabilities.length} items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Position</CardTitle>
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", netPosition >= 0 ? "bg-primary/12" : "bg-destructive/10")}>
                <BarChart3 className={cn("h-4 w-4", netPosition >= 0 ? "text-primary" : "text-destructive")} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold tracking-tight", netPosition >= 0 ? "text-primary" : "text-destructive")}>
                {fmt(netPosition)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Assets minus liabilities</p>
            </CardContent>
          </Card>
        </div>

        {/* 2-column: Assets | Liabilities */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Assets */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="h-4 w-4 text-success" />
                  Assets
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/personal/assets")}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {personalAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <Wallet className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No assets tracked yet</p>
                  <Button size="sm" variant="outline" onClick={() => navigate("/personal/assets")}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add your first asset
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {personalAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="group flex items-center gap-3 px-6 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => navigate(`/assets/asset/${asset.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{asset.description}</p>
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0 mt-0.5 font-normal">
                          {asset.category}
                        </Badge>
                      </div>
                      <span className="text-sm font-semibold text-success shrink-0">{fmt(asset.value)}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/assets/asset/${asset.id}`); }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  <div className="px-6 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs text-muted-foreground border border-dashed border-border hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors"
                      onClick={() => navigate("/personal/assets")}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add asset
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Liabilities */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Liabilities
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/personal/assets")}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {liabilities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <TrendingDown className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No liabilities tracked yet</p>
                  <Button size="sm" variant="outline" onClick={() => navigate("/personal/assets")}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add liability
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {liabilities.map((liability) => (
                    <div
                      key={liability.id}
                      className="group flex items-center gap-3 px-6 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => navigate(`/assets/liability/${liability.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{liability.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[11px] px-1.5 py-0 font-normal">
                            {liability.category}
                          </Badge>
                          {liability.monthlyPayment && (
                            <span className="text-[11px] text-muted-foreground">
                              {fmt(liability.monthlyPayment)}/mo
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-destructive shrink-0">{fmt(liability.balance)}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/assets/liability/${liability.id}`); }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  <div className="px-6 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs text-muted-foreground border border-dashed border-border hover:border-destructive/40 hover:text-destructive hover:bg-destructive/5 transition-colors"
                      onClick={() => navigate("/personal/assets")}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add liability
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Documents — compact horizontal strip */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Personal Documents
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                icon: User,
                label: "Personal Finance Statement",
                sub: "CCCU format · Ready",
                iconColor: "text-primary",
                href: "/generate",
              },
              {
                icon: FileText,
                label: "Schedule E",
                sub: "Rental income · Ready",
                iconColor: "text-success",
                href: "/documents/schedule-e",
              },
              {
                icon: FileText,
                label: "W-2 Forms",
                sub: "Employment income · Ready",
                iconColor: "text-warning",
                href: "/documents/w2",
              },
            ].map(({ icon: Icon, label, sub, iconColor, href }) => (
              <Card
                key={label}
                className="cursor-pointer hover:shadow-card-hover transition-shadow duration-150 group"
                onClick={() => navigate(href)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted shrink-0">
                    <Icon className={cn("h-4 w-4", iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-success shrink-0" />
                      {sub}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
