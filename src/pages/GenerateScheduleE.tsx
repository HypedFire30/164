import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Building2, Search, ChevronDown, ChevronUp, CheckSquare, Square } from "lucide-react";
import { usePFSData } from "@/hooks/usePFSData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/domain/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { generateScheduleEPDF, downloadScheduleEPDF, type ScheduleEProperty } from "@/lib/pdf/generators/schedule-e-generator";

const fmt = (n: number) => formatCurrency(n, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const EXPENSE_FIELDS: Array<{ key: keyof ScheduleEProperty; label: string; lineNo: number }> = [
  { key: 'advertising', label: 'Advertising', lineNo: 5 },
  { key: 'autoAndTravel', label: 'Auto and travel', lineNo: 6 },
  { key: 'cleaningAndMaintenance', label: 'Cleaning and maintenance', lineNo: 7 },
  { key: 'commissions', label: 'Commissions', lineNo: 8 },
  { key: 'insurance', label: 'Insurance', lineNo: 9 },
  { key: 'legalAndProfessional', label: 'Legal and professional fees', lineNo: 10 },
  { key: 'managementFees', label: 'Management fees', lineNo: 11 },
  { key: 'mortgageInterest', label: 'Mortgage interest (banks)', lineNo: 12 },
  { key: 'otherInterest', label: 'Other interest', lineNo: 13 },
  { key: 'repairs', label: 'Repairs', lineNo: 14 },
  { key: 'supplies', label: 'Supplies', lineNo: 15 },
  { key: 'taxes', label: 'Taxes', lineNo: 16 },
  { key: 'utilities', label: 'Utilities', lineNo: 17 },
  { key: 'depreciation', label: 'Depreciation expense (auto)', lineNo: 18 },
  { key: 'other', label: 'Other expenses', lineNo: 19 },
];

function calcDepreciation(purchasePrice: number, propertyType: 'Residential' | 'Commercial') {
  const years = propertyType === 'Residential' ? 27.5 : 39;
  const landValue = purchasePrice * 0.2;
  return (purchasePrice - landValue) / years;
}

function calcTotalExpenses(p: ScheduleEProperty) {
  return EXPENSE_FIELDS.reduce((s, f) => s + (p[f.key] as number || 0), 0);
}

interface PropertyExpenses {
  propertyId: string;
  data: ScheduleEProperty;
  expanded: boolean;
}

export default function GenerateScheduleE() {
  const navigate = useNavigate();
  const { data, isLoading, error } = usePFSData();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [taxYear, setTaxYear] = useState(2026);
  const [taxpayerName, setTaxpayerName] = useState("");
  const [taxpayerSSN, setTaxpayerSSN] = useState("");
  const [generating, setGenerating] = useState(false);
  const [propertyExpenses, setPropertyExpenses] = useState<Record<string, PropertyExpenses>>({});

  const properties = data?.properties ?? [];

  const filteredProperties = useMemo(
    () => properties.filter(p => p.address.toLowerCase().includes(searchQuery.toLowerCase())),
    [properties, searchQuery]
  );

  const getExpenses = useCallback((propId: string): PropertyExpenses => {
    if (propertyExpenses[propId]) return propertyExpenses[propId];
    const prop = properties.find(p => p.id === propId);
    if (!prop) return { propertyId: propId, expanded: false, data: {} as ScheduleEProperty };
    const annualRent = (prop.monthlyRentalIncome || 0) * 12;
    const depr = calcDepreciation(prop.purchasePrice || 0, 'Residential');

    // Auto-populate mortgage interest from linked mortgages (annual interest = principalBalance × interestRate / 100)
    const propertyMortgages = (data?.mortgages ?? []).filter(m => m.propertyId === propId);
    const mortgageInterest = Math.round(
      propertyMortgages.reduce((sum, m) => sum + (m.principalBalance * m.interestRate) / 100, 0)
    );

    return {
      propertyId: propId,
      expanded: false,
      data: {
        address: prop.address,
        propertyType: 'Residential',
        purchasePrice: prop.purchasePrice || 0,
        rentsReceived: annualRent,
        advertising: 0,
        autoAndTravel: 0,
        cleaningAndMaintenance: (prop.monthlyMaintenance || 0) * 12,
        commissions: 0,
        insurance: (prop.monthlyInsurance || 0) * 12,
        legalAndProfessional: 0,
        managementFees: (prop.monthlyPropertyManagement || 0) * 12,
        mortgageInterest,
        otherInterest: 0,
        repairs: 0,
        supplies: 0,
        taxes: (prop.monthlyPropertyTax || 0) * 12,
        utilities: (prop.monthlyUtilities || 0) * 12,
        depreciation: Math.round(depr),
        other: ((prop.monthlyHOA || 0) + (prop.monthlyOtherExpenses || 0)) * 12,
      },
    };
  }, [properties, propertyExpenses, data?.mortgages]);

  const updateExpense = (propId: string, field: keyof ScheduleEProperty, value: number | string) => {
    const current = getExpenses(propId);
    setPropertyExpenses(prev => ({
      ...prev,
      [propId]: { ...current, data: { ...current.data, [field]: typeof value === 'string' ? parseFloat(value) || 0 : value } },
    }));
  };

  const toggleExpanded = (propId: string) => {
    const current = getExpenses(propId);
    setPropertyExpenses(prev => ({ ...prev, [propId]: { ...current, expanded: !current.expanded } }));
  };

  const toggleProperty = (id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else { s.add(id); if (!propertyExpenses[id]) { const ex = getExpenses(id); setPropertyExpenses(p => ({ ...p, [id]: ex })); } }
      return s;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredProperties.length) {
      setSelectedIds(new Set());
    } else {
      const newIds = new Set(filteredProperties.map(p => p.id));
      const newExpenses: Record<string, PropertyExpenses> = { ...propertyExpenses };
      for (const id of newIds) { if (!newExpenses[id]) newExpenses[id] = getExpenses(id); }
      setPropertyExpenses(newExpenses);
      setSelectedIds(newIds);
    }
  };

  const selectedExpenses = Array.from(selectedIds).map(id => getExpenses(id)).filter(Boolean);

  const totals = {
    income: selectedExpenses.reduce((s, e) => s + (e.data.rentsReceived || 0), 0),
    expenses: selectedExpenses.reduce((s, e) => s + calcTotalExpenses(e.data), 0),
    depreciation: selectedExpenses.reduce((s, e) => s + (e.data.depreciation || 0), 0),
    net: selectedExpenses.reduce((s, e) => s + ((e.data.rentsReceived || 0) - calcTotalExpenses(e.data)), 0),
  };

  const handleGenerate = async () => {
    if (selectedIds.size === 0) {
      toast({ title: "No properties selected", description: "Select at least one property.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const pdfData = {
        taxYear, taxpayerName, taxpayerSSN,
        properties: selectedExpenses.map(e => e.data),
      };
      const pdfBytes = await generateScheduleEPDF(pdfData);
      downloadScheduleEPDF(pdfBytes, taxYear);
      toast({ title: "Schedule E Generated", description: `Downloaded Schedule E for ${selectedIds.size} propert${selectedIds.size === 1 ? 'y' : 'ies'}.` });
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
              <h1 className="text-2xl font-bold tracking-tight">Generate Schedule E</h1>
              <p className="text-sm text-muted-foreground mt-0.5">IRS Schedule E (Form 1040) — Supplemental Income and Loss · Tax Year {taxYear}</p>
            </div>
            <Button onClick={handleGenerate} disabled={generating || selectedIds.size === 0} size="lg">
              <Download className="h-4 w-4 mr-2" />
              {generating ? "Generating…" : "Generate Schedule E PDF"}
            </Button>
          </div>
        </div>

        {/* Taxpayer + Tax Year */}
        <Card>
          <CardContent className="pt-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Tax Year</Label>
                <Input type="number" value={taxYear} onChange={e => setTaxYear(parseInt(e.target.value) || 2026)} className="w-28" />
              </div>
              <div className="space-y-1.5">
                <Label>Taxpayer Name</Label>
                <Input value={taxpayerName} onChange={e => setTaxpayerName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-1.5">
                <Label>Social Security Number</Label>
                <Input value={taxpayerSSN} onChange={e => setTaxpayerSSN(e.target.value)} placeholder="XXX-XX-XXXX" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Selection */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold">Select Properties</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Choose which properties to include in Schedule E</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search…" className="pl-8 w-48 h-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {selectedIds.size === filteredProperties.length
                    ? <><CheckSquare className="h-3.5 w-3.5 mr-1" />Deselect All</>
                    : <><Square className="h-3.5 w-3.5 mr-1" />Select All</>}
                </Button>
              </div>
            </div>

            {filteredProperties.length === 0 ? (
              <div className="text-center py-10">
                <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No properties found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Annual Income</TableHead>
                    <TableHead className="text-right">Total Expenses</TableHead>
                    <TableHead className="text-right">Depreciation</TableHead>
                    <TableHead className="text-right">Net Income/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map(property => {
                    const isSelected = selectedIds.has(property.id);
                    const ex = getExpenses(property.id);
                    const totalExp = calcTotalExpenses(ex.data);
                    const net = (ex.data.rentsReceived || 0) - totalExp;
                    return (
                      <TableRow key={property.id} className={isSelected ? "bg-primary/5" : ""}>
                        <TableCell><Checkbox checked={isSelected} onCheckedChange={() => toggleProperty(property.id)} /></TableCell>
                        <TableCell className="font-medium text-sm">{property.address}</TableCell>
                        <TableCell className="text-right text-sm">{fmt(ex.data.rentsReceived || 0)}</TableCell>
                        <TableCell className="text-right text-sm text-destructive">{fmt(totalExp)}</TableCell>
                        <TableCell className="text-right text-sm text-destructive">{fmt(ex.data.depreciation || 0)}</TableCell>
                        <TableCell className={`text-right text-sm font-semibold ${net >= 0 ? "text-success" : "text-destructive"}`}>
                          {net < 0 ? `(${fmt(Math.abs(net))})` : fmt(net)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Expense Detail per Selected Property */}
        {selectedIds.size > 0 && (
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Expense Detail</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Review and adjust Schedule E line items per property (auto-populated from property data)</p>
            </div>
            {Array.from(selectedIds).map(id => {
              const prop = properties.find(p => p.id === id);
              if (!prop) return null;
              const ex = getExpenses(id);
              const totalExp = calcTotalExpenses(ex.data);
              const net = (ex.data.rentsReceived || 0) - totalExp;
              const isExpanded = ex.expanded;

              return (
                <Card key={id}>
                  <CardHeader className="py-3 px-5 cursor-pointer" onClick={() => toggleExpanded(id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{prop.address}</p>
                          <p className="text-xs text-muted-foreground">
                            Income: {fmt(ex.data.rentsReceived || 0)} · Expenses: {fmt(totalExp)} · Net:&nbsp;
                            <span className={net >= 0 ? "text-success" : "text-destructive"}>
                              {net < 0 ? `(${fmt(Math.abs(net))})` : fmt(net)}
                            </span>
                          </p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-0 px-5 pb-5">
                      <Separator className="mb-4" />
                      <div className="grid gap-3 md:grid-cols-2 mb-4">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold text-success">Line 3 — Rents received (annual)</Label>
                          <Input type="number" value={ex.data.rentsReceived || ""} onChange={e => updateExpense(id, 'rentsReceived', e.target.value)} placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm">Property Type</Label>
                          <select
                            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                            value={ex.data.propertyType}
                            onChange={e => {
                              const type = e.target.value as 'Residential' | 'Commercial';
                              const depr = Math.round(calcDepreciation(ex.data.purchasePrice, type));
                              updateExpense(id, 'propertyType', type);
                              updateExpense(id, 'depreciation', depr);
                            }}
                          >
                            <option value="Residential">Residential (27.5 yr)</option>
                            <option value="Commercial">Commercial (39 yr)</option>
                          </select>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Expenses (Lines 5–19)</p>
                      <div className="grid gap-3 md:grid-cols-3">
                        {EXPENSE_FIELDS.map(f => {
                          const isMortgage = f.key === 'mortgageInterest';
                          const hasMortgageData = isMortgage && (ex.data.mortgageInterest || 0) > 0;
                          return (
                          <div key={f.key} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Line {f.lineNo} — {f.label}
                              {hasMortgageData && <span className="ml-1 text-primary/70">(auto)</span>}
                            </Label>
                            <Input
                              type="number"
                              value={(ex.data[f.key] as number) || ""}
                              onChange={e => updateExpense(id, f.key, e.target.value)}
                              placeholder="0"
                              disabled={f.key === 'depreciation'}
                              className={f.key === 'depreciation' ? "bg-muted/50 text-muted-foreground" : ""}
                            />
                          </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 p-3 rounded-lg bg-muted/40 flex gap-6 flex-wrap">
                        <div><p className="text-xs text-muted-foreground">Total Expenses</p><p className="font-semibold text-destructive">{fmt(totalExp)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Net Income/Loss</p><p className={`font-semibold ${net >= 0 ? "text-success" : "text-destructive"}`}>{net < 0 ? `(${fmt(Math.abs(net))})` : fmt(net)}</p></div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {selectedIds.size > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-5">
              <h2 className="text-base font-semibold mb-4">Schedule E Summary — {selectedIds.size} Propert{selectedIds.size === 1 ? 'y' : 'ies'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Rental Income</p>
                  <p className="text-xl font-bold text-success">{fmt(totals.income)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-xl font-bold text-destructive">{fmt(totals.expenses)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Depreciation</p>
                  <p className="text-xl font-bold text-destructive">{fmt(totals.depreciation)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Rental Income/Loss</p>
                  <p className={`text-xl font-bold ${totals.net >= 0 ? "text-success" : "text-destructive"}`}>
                    {totals.net < 0 ? `(${fmt(Math.abs(totals.net))})` : fmt(totals.net)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom generate button */}
        <div className="flex justify-end pb-4">
          <Button onClick={handleGenerate} disabled={generating || selectedIds.size === 0} size="lg" className="gap-2">
            <Download className="h-4 w-4" />
            {generating ? "Generating PDF…" : `Generate Schedule E (${taxYear})`}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
