import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, Building2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Business() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Business
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage business entities, properties, finances, and documents
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] duration-200 border-l-4 border-l-primary bg-primary/5"
            onClick={() => navigate("/properties")}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Properties</CardTitle>
                    <CardDescription>Manage all business properties</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage all properties owned by your business entities. Track rent rolls, leases, mortgages, and property details.
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg hover:scale-[1.02] duration-200 border-l-4 border-l-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Business Entities</CardTitle>
                  <CardDescription>Manage business entities and structures</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and manage business entities (LLCs, corporations, partnerships). Track ownership structures and business finances.
              </p>
              <div className="mt-4">
                <Button variant="outline" size="sm" className="transition-all hover:bg-accent hover:text-accent-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Business Entity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
