import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Building2, Briefcase, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
            <TabsTrigger value="property">Property Documents</TabsTrigger>
            <TabsTrigger value="business">Business Documents</TabsTrigger>
            <TabsTrigger value="personal">Personal Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="property" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="transition-all hover:shadow-lg hover:scale-[1.02] duration-200 border-l-4 border-l-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Rent Roll
                  </CardTitle>
                  <CardDescription>
                    Current occupancy and rental income by unit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a rent roll showing all units, tenants, lease terms, and rental income.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full transition-all hover:bg-accent hover:text-accent-foreground"
                    onClick={() => navigate("/documents/rent-roll")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Rent Roll
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-all hover:shadow-lg hover:scale-[1.02] duration-200 border-l-4 border-l-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Current Leases
                  </CardTitle>
                  <CardDescription>
                    Active lease agreements for apartment buildings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a document listing all current leases with terms and tenant information.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full transition-all hover:bg-accent hover:text-accent-foreground"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Leases Document
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Business Tax Returns
                  </CardTitle>
                  <CardDescription>
                    State and Federal business tax returns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Coming soon: Generate business tax returns with all schedules and K-1s.
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Business Debt Schedule
                  </CardTitle>
                  <CardDescription>
                    Complete business debt and loan schedule
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Coming soon: Generate business debt schedule for loan applications.
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Profit & Loss Statement
                  </CardTitle>
                  <CardDescription>
                    Interim profit & loss and income statement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Coming soon: Generate interim P&L statements.
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
              <Card className="transition-all hover:shadow-lg hover:scale-[1.02] duration-200 border-l-4 border-l-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Personal Finance Statement
                  </CardTitle>
                  <CardDescription>
                    Complete personal financial statement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a personal finance statement for loan applications.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full transition-all hover:bg-accent hover:text-accent-foreground"
                    onClick={() => navigate("/generate")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate PFS
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-all hover:shadow-lg hover:scale-[1.02] duration-200 border-l-4 border-l-success bg-success/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-success" />
                    Schedule E (Rental Income)
                  </CardTitle>
                  <CardDescription>
                    Generate Schedule E from your rental properties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Step-by-step wizard to generate Schedule E. Select properties, review rental income, expenses, and depreciation calculations.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full transition-all hover:bg-accent hover:text-accent-foreground"
                    onClick={() => navigate("/documents/schedule-e")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Schedule E
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-all hover:shadow-lg hover:scale-[1.02] duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    W-2 Forms
                  </CardTitle>
                  <CardDescription>
                    Employment income documentation with auto-calculated taxes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Step-by-step wizard to generate W-2 forms. Auto-calculates Social Security (6.2%), Medicare (1.45% + 0.9% on high earners), and estimated federal/state withholding for 2026.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full transition-all hover:bg-accent hover:text-accent-foreground"
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
