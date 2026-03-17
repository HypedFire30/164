import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Briefcase, BarChart3, FileText, Clock, Building2 } from "lucide-react";

export default function Business() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Business Documents
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate business financial documents for commercial loan applications
          </p>
        </div>

        {/* Document Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-muted/40">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <BarChart3 className="h-5 w-5" />
                    Profit & Loss Statement
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Interim P&amp;L and income statement
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  Coming Soon
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Generate interim profit & loss statements for business loan applications. Includes income, expenses, and net operating income.
              </p>
              <Button variant="outline" className="w-full" disabled>
                <Download className="h-4 w-4 mr-2" />
                Generate P&amp;L
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/40">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-5 w-5" />
                    Business Tax Returns
                  </CardTitle>
                  <CardDescription className="mt-1">
                    State and Federal business tax returns
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  Coming Soon
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Generate business tax returns with all schedules and K-1s for lender submission.
              </p>
              <Button variant="outline" className="w-full" disabled>
                <Download className="h-4 w-4 mr-2" />
                Generate Tax Returns
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/40">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-5 w-5" />
                    Business Debt Schedule
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Complete business debt and loan schedule
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  Coming Soon
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Generate a full business debt schedule showing all loans, balances, rates, and monthly payments.
              </p>
              <Button variant="outline" className="w-full" disabled>
                <Download className="h-4 w-4 mr-2" />
                Generate Debt Schedule
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Entity Tracking Placeholder */}
        <Card className="bg-muted/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-muted-foreground">Business Entity Tracking</CardTitle>
                  <CardDescription>Track properties by LLC or business entity</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage ownership structures across multiple business entities (LLCs, partnerships, corporations). Associate properties with specific entities and generate entity-level financial statements for commercial lending.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
