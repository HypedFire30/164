import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Search, Download, Building2, Users, ChevronDown, ChevronUp, CheckSquare, Square } from "lucide-react";
import { usePFSData } from "@/hooks/usePFSData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/domain/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generatePropertyMockData } from "@/lib/mock-data/generators";
import { generateRentRollPDF, downloadRentRollPDF, type RentRollUnit } from "@/lib/pdf/generators/rent-roll-generator";

const fmt = (n: number) => formatCurrency(n, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const statusColor = (status: string) =>
  status === 'Current' ? 'text-success border-success/40' :
  status === 'Past Due' ? 'text-destructive border-destructive/40' :
  status === 'Vacant' ? 'text-muted-foreground border-muted-foreground/40' :
  'text-warning border-warning/40';

export default function GenerateRentRoll() {
  const navigate = useNavigate();
  const { data, isLoading, error } = usePFSData();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [asOfDate, setAsOfDate] = useState(() => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
  const [portfolioName, setPortfolioName] = useState("164 Investments");

  const properties = data?.properties ?? [];

  const propertiesWithUnits = useMemo(
    () => properties.filter(p => (p.totalUnits ?? 0) > 0),
    [properties]
  );

  const filteredProperties = useMemo(
    () => propertiesWithUnits.filter(p => p.address.toLowerCase().includes(searchQuery.toLowerCase())),
    [propertiesWithUnits, searchQuery]
  );

  // Generate mock unit data for each property (deterministic seeding)
  const propertyMockData = useMemo(() => {
    const cache: Record<string, ReturnType<typeof generatePropertyMockData>> = {};
    for (const p of propertiesWithUnits) {
      cache[p.id] = generatePropertyMockData(p);
    }
    return cache;
  }, [propertiesWithUnits]);

  const toggleProperty = (id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredProperties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProperties.map(p => p.id)));
    }
  };

  const selectedData = properties.filter(p => selectedIds.has(p.id));
  const totals = {
    units: selectedData.reduce((s, p) => s + (p.totalUnits || 0), 0),
    occupied: selectedData.reduce((s, p) => s + (p.occupiedUnits || 0), 0),
    monthlyIncome: selectedData.reduce((s, p) => s + (p.monthlyRentalIncome || 0), 0),
  };
  const occupancyRate = totals.units > 0 ? (totals.occupied / totals.units) * 100 : 0;

  const handleGenerate = async () => {
    if (selectedIds.size === 0) {
      toast({ title: "No properties selected", description: "Select at least one property.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const rentRollProperties = selectedData.map(prop => {
        const mockData = propertyMockData[prop.id];
        const units: RentRollUnit[] = mockData?.units.map((unit, i) => {
          const lease = mockData.leases.find(l => l.unitId === unit.id);
          const tenant = lease ? mockData.tenants.find(t => t.id === lease.tenantId) : null;
          return {
            unitNumber: unit.unitNumber,
            unitType: unit.unitType,
            squareFootage: unit.squareFootage,
            tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : '',
            leaseStart: lease?.startDate ?? '',
            leaseEnd: lease?.endDate ?? '',
            marketRent: unit.marketRent,
            actualRent: lease?.monthlyRent ?? 0,
            status: !lease ? 'Vacant' : lease.isPastDue ? 'Past Due' : 'Current',
            notes: '',
          } as RentRollUnit;
        }) ?? [];

        return {
          address: prop.address,
          ownershipPercentage: prop.ownershipPercentage || 100,
          units,
        };
      });

      const pdfBytes = await generateRentRollPDF({ portfolioName, asOfDate, properties: rentRollProperties });
      downloadRentRollPDF(pdfBytes, portfolioName);
      toast({ title: "Rent Roll Generated", description: `Downloaded rent roll for ${selectedIds.size} propert${selectedIds.size === 1 ? 'y' : 'ies'}.` });
    } catch (err) {
      toast({ title: "Generation failed", description: String(err), variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) return <Layout><div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64" /></div></Layout>;
  if (error) return <Layout><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{String(error)}</AlertDescription></Alert></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/documents")} className="h-8 px-2 -ml-2 mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Documents
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Generate Rent Roll</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Select properties to include in the rent roll document</p>
            </div>
            <Button onClick={handleGenerate} disabled={generating || selectedIds.size === 0} size="lg">
              <Download className="h-4 w-4 mr-2" />
              {generating ? "Generating…" : "Generate Rent Roll PDF"}
            </Button>
          </div>
        </div>

        {/* Document settings */}
        <Card>
          <CardContent className="pt-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Portfolio Name</Label>
                <Input value={portfolioName} onChange={e => setPortfolioName(e.target.value)} placeholder="164 Investments" />
              </div>
              <div className="space-y-1.5">
                <Label>As-of Date</Label>
                <Input value={asOfDate} onChange={e => setAsOfDate(e.target.value)} placeholder="March 15, 2026" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary (when properties selected) */}
        {selectedIds.size > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Selected Properties</p>
                  <p className="text-xl font-bold">{selectedIds.size}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Units</p>
                  <p className="text-xl font-bold">{totals.units}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Occupancy</p>
                  <p className="text-xl font-bold">{occupancyRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">{totals.occupied}/{totals.units} occupied</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Income</p>
                  <p className="text-xl font-bold text-success">{fmt(totals.monthlyIncome)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mock data disclaimer */}
        <Alert className="border-warning/40 bg-warning/5">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning text-sm">Illustrative Data</AlertTitle>
          <AlertDescription className="text-sm">
            Unit, tenant, and lease data below is generated for layout preview only. Replace with actual tenant records before submitting to lenders.
          </AlertDescription>
        </Alert>

        {/* Search + select controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search properties…" className="pl-8 h-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          {filteredProperties.length > 0 && (
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {selectedIds.size === filteredProperties.length
                ? <><CheckSquare className="h-3.5 w-3.5 mr-1.5" />Deselect All</>
                : <><Square className="h-3.5 w-3.5 mr-1.5" />Select All</>}
            </Button>
          )}
        </div>

        {/* Properties list */}
        {filteredProperties.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No multi-unit properties found. Add units to properties to generate rent rolls.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filteredProperties.map(property => {
              const isSelected = selectedIds.has(property.id);
              const isExpanded = expandedIds.has(property.id);
              const mockData = propertyMockData[property.id];
              const occRate = property.totalUnits && property.totalUnits > 0
                ? ((property.occupiedUnits || 0) / property.totalUnits) * 100
                : 0;

              return (
                <Card key={property.id} className={`transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleProperty(property.id)} className="mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        {/* Property header row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">{property.address}</h3>
                            <p className="text-xs text-muted-foreground">{property.ownershipPercentage}% ownership</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className={`text-xs ${occRate >= 90 ? "text-success border-success/40" : occRate >= 75 ? "text-warning border-warning/40" : "text-destructive border-destructive/40"}`}>
                              <Users className="h-3 w-3 mr-0.5" />{occRate.toFixed(0)}%
                            </Badge>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => toggleExpanded(property.id)}>
                              {isExpanded ? <><ChevronUp className="h-3.5 w-3.5" />Hide units</> : <><ChevronDown className="h-3.5 w-3.5" />Show units</>}
                            </Button>
                          </div>
                        </div>

                        {/* Summary stats */}
                        <div className="grid grid-cols-3 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Units</p>
                            <p className="text-sm font-semibold">{property.occupiedUnits || 0}/{property.totalUnits} occupied</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Monthly Income</p>
                            <p className="text-sm font-semibold">{property.monthlyRentalIncome ? fmt(property.monthlyRentalIncome) : "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Current Value</p>
                            <p className="text-sm font-semibold">{fmt(property.currentValue)}</p>
                          </div>
                        </div>

                        {/* Unit detail table */}
                        {isExpanded && mockData && (
                          <>
                            <Separator className="my-3" />
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs w-14">Unit</TableHead>
                                    <TableHead className="text-xs">Type</TableHead>
                                    <TableHead className="text-xs">Sq Ft</TableHead>
                                    <TableHead className="text-xs">Tenant</TableHead>
                                    <TableHead className="text-xs">Lease Start</TableHead>
                                    <TableHead className="text-xs">Lease End</TableHead>
                                    <TableHead className="text-xs text-right">Market Rent</TableHead>
                                    <TableHead className="text-xs text-right">Actual Rent</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {mockData.units.map(unit => {
                                    const lease = mockData.leases.find(l => l.unitId === unit.id);
                                    const tenant = lease ? mockData.tenants.find(t => t.id === lease.tenantId) : null;
                                    const status = !lease ? 'Vacant' : lease.isPastDue ? 'Past Due' : 'Current';
                                    const fmtD = (iso: string) => {
                                      if (!iso) return '—';
                                      const d = new Date(iso);
                                      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;
                                    };
                                    return (
                                      <TableRow key={unit.id} className="text-xs">
                                        <TableCell className="font-mono">{unit.unitNumber}</TableCell>
                                        <TableCell>{unit.unitType}</TableCell>
                                        <TableCell>{unit.squareFootage.toLocaleString()}</TableCell>
                                        <TableCell>{tenant ? `${tenant.firstName} ${tenant.lastName}` : <span className="text-muted-foreground italic">Vacant</span>}</TableCell>
                                        <TableCell>{lease ? fmtD(lease.startDate) : '—'}</TableCell>
                                        <TableCell>{lease ? fmtD(lease.endDate) : '—'}</TableCell>
                                        <TableCell className="text-right">{fmt(unit.marketRent)}</TableCell>
                                        <TableCell className="text-right">{lease ? fmt(lease.monthlyRent) : '—'}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className={`text-xs px-1.5 py-0 ${statusColor(status)}`}>{status}</Badge>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Bottom generate */}
        <div className="flex justify-end pb-4">
          <Button onClick={handleGenerate} disabled={generating || selectedIds.size === 0} size="lg" className="gap-2">
            <Download className="h-4 w-4" />
            {generating ? "Generating PDF…" : `Generate Rent Roll PDF`}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
