import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Building2, Briefcase, User, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

function StatusBadge({ ready }: { ready: boolean }) {
  return ready ? (
    <Badge variant="default" className="bg-success/15 text-success border-success/30 hover:bg-success/20 gap-1">
      <CheckCircle className="h-3 w-3" />
      Ready
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <Clock className="h-3 w-3" />
      Coming Soon
    </Badge>
  );
}

export default function Documents() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Documents
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage loan application documents
          </p>
        </div>

        <Tabs defaultValue="property" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="property" className="gap-2">
              <Building2 className="h-4 w-4" />
              Property
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Business
            </TabsTrigger>
            <TabsTrigger value="personal" className="gap-2">
              <User className="h-4 w-4" />
              Personal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="property" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="transition-shadow hover:shadow-card-hover duration-150 border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Rent Roll
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Current occupancy and rental income by unit
                      </CardDescription>
                    </div>
                    <StatusBadge ready={true} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a rent roll showing all units, tenants, lease terms, and rental income.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/documents/rent-roll")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Rent Roll
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-shadow duration-150 border-l-4 border-l-muted bg-muted/40">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        Current Leases
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Active lease agreements for apartment buildings
                      </CardDescription>
                    </div>
                    <StatusBadge ready={false} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a document listing all current leases with terms and tenant information.
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Leases Document
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="transition-shadow duration-150 border-l-4 border-l-muted bg-muted/40">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        Business Tax Returns
                      </CardTitle>
                      <CardDescription className="mt-1">
                        State and Federal business tax returns
                      </CardDescription>
                    </div>
                    <StatusBadge ready={false} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate business tax returns with all schedules and K-1s.
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-shadow duration-150 border-l-4 border-l-muted bg-muted/40">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        Business Debt Schedule
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Complete business debt and loan schedule
                      </CardDescription>
                    </div>
                    <StatusBadge ready={false} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate business debt schedule for loan applications.
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-shadow duration-150 border-l-4 border-l-muted bg-muted/40">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        Profit & Loss Statement
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Interim profit & loss and income statement
                      </CardDescription>
                    </div>
                    <StatusBadge ready={false} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate interim P&L statements for loan applications.
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="personal" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="transition-shadow hover:shadow-card-hover duration-150 border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Personal Finance Statement
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Complete personal financial statement
                      </CardDescription>
                    </div>
                    <StatusBadge ready={true} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a personal finance statement for loan applications. Mapped for Consolidated Community Credit Union.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/generate")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate PFS
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-shadow hover:shadow-card-hover duration-150 border-l-4 border-l-success">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-success" />
                        Schedule E (Rental Income)
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Generate Schedule E from your rental properties
                      </CardDescription>
                    </div>
                    <StatusBadge ready={true} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Step-by-step wizard to generate Schedule E. Select properties, review rental income, expenses, and depreciation calculations.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/documents/schedule-e")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Schedule E
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-shadow hover:shadow-card-hover duration-150 border-l-4 border-l-warning">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-warning" />
                        W-2 Forms
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Employment income documentation with auto-calculated taxes
                      </CardDescription>
                    </div>
                    <StatusBadge ready={true} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Step-by-step wizard to generate W-2 forms. Auto-calculates Social Security (6.2%), Medicare (1.45% + 0.9%), and estimated withholding for 2026.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/documents/w2")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate W-2
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
