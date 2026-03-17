import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Plus, Trash2, Calculator } from "lucide-react";
import { usePFSData } from "@/hooks/usePFSData";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/domain/utils";
import {
  calculateW2,
  type W2CalculationInput,
  type FilingStatus,
} from "@/lib/calculations/w2-calculator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  generateW2PDF,
  downloadW2PDF,
  type W2FormData,
} from "@/lib/pdf/generators/w2-generator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const fmt2 = (n: number) =>
  formatCurrency(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
  );
}

export default function GenerateW2() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  // Settings
  const [taxYear, setTaxYear] = useState(2026);
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("SINGLE");
  const [allowances, setAllowances] = useState(0);
  const [additionalWithholding, setAdditionalWithholding] = useState(0);
  const [autoCalculate, setAutoCalculate] = useState(true);

  // Employer
  const [boxB_EmployerEIN, setBoxB_EmployerEIN] = useState("");
  const [boxC_EmployerName, setBoxC_EmployerName] = useState("");
  const [boxC_EmployerStreet, setBoxC_EmployerStreet] = useState("");
  const [boxC_EmployerCity, setBoxC_EmployerCity] = useState("");
  const [boxC_EmployerState, setBoxC_EmployerState] = useState("OR");
  const [boxC_EmployerZip, setBoxC_EmployerZip] = useState("");
  const [boxD_ControlNumber, setBoxD_ControlNumber] = useState("");
  const [box15_EmployerStateId, setBox15_EmployerStateId] = useState("");

  // Employee
  const [boxA_EmployeeSSN, setBoxA_EmployeeSSN] = useState("");
  const [boxE_EmployeeName, setBoxE_EmployeeName] = useState("");
  const [boxF_EmployeeStreet, setBoxF_EmployeeStreet] = useState("");
  const [boxF_EmployeeCity, setBoxF_EmployeeCity] = useState("");
  const [boxF_EmployeeState, setBoxF_EmployeeState] = useState("OR");
  const [boxF_EmployeeZip, setBoxF_EmployeeZip] = useState("");

  // Wages
  const [box1_Wages, setBox1_Wages] = useState(0);
  const [tips, setTips] = useState(0);
  const [box7_SSTips, setBox7_SSTips] = useState(0);
  const [box8_AllocatedTips, setBox8_AllocatedTips] = useState(0);
  const [box10_DependentCare, setBox10_DependentCare] = useState(0);
  const [box11_NonqualifiedPlans, setBox11_NonqualifiedPlans] = useState(0);

  // Box 12, 13, 14
  const [box12Codes, setBox12Codes] = useState<
    Array<{ code: string; amount: number }>
  >([]);
  const [box13_StatutoryEmployee, setBox13_StatutoryEmployee] = useState(false);
  const [box13_RetirementPlan, setBox13_RetirementPlan] = useState(false);
  const [box13_ThirdPartySickPay, setBox13_ThirdPartySickPay] = useState(false);
  const [box14Other, setBox14Other] = useState<
    Array<{ description: string; amount: number }>
  >([]);

  // State/local
  const [box15_State, setBox15_State] = useState("OR");
  const [box20_LocalityName, setBox20_LocalityName] = useState("");
  const [localTaxRate, setLocalTaxRate] = useState(0);

  // Calculated values
  const [calc, setCalc] = useState<ReturnType<typeof calculateW2> | null>(null);

  useEffect(() => {
    if (autoCalculate && box1_Wages > 0) {
      const input: W2CalculationInput = {
        wages: box1_Wages,
        tips,
        socialSecurityTips: box7_SSTips,
        allocatedTips: box8_AllocatedTips,
        dependentCareBenefits: box10_DependentCare,
        nonqualifiedPlans: box11_NonqualifiedPlans,
        box12Codes,
        filingStatus,
        allowances,
        additionalWithholding,
        state: box15_State,
        localTaxRate: localTaxRate > 0 ? localTaxRate / 100 : undefined,
      };
      setCalc(calculateW2(input));
    } else if (!autoCalculate) {
      setCalc(null);
    }
  }, [
    box1_Wages,
    tips,
    box7_SSTips,
    box8_AllocatedTips,
    box10_DependentCare,
    box11_NonqualifiedPlans,
    box12Codes,
    filingStatus,
    allowances,
    additionalWithholding,
    box15_State,
    localTaxRate,
    autoCalculate,
  ]);

  // Oregon STT auto-calculation
  const oregonSTT =
    box15_State === "OR" && box1_Wages > 0
      ? {
          wages: box1_Wages,
          withheld: Math.round(box1_Wages * 0.001 * 100) / 100,
        }
      : null;

  const handleGenerate = async () => {
    if (!box1_Wages || box1_Wages <= 0) {
      toast({
        title: "Missing wages",
        description: "Please enter Box 1 wages.",
        variant: "destructive",
      });
      return;
    }
    setGenerating(true);
    try {
      const formData: W2FormData = {
        taxYear,
        boxA_EmployeeSSN,
        boxB_EmployerEIN,
        boxC_EmployerName,
        boxC_EmployerStreet,
        boxC_EmployerCity,
        boxC_EmployerState,
        boxC_EmployerZip,
        boxD_ControlNumber,
        boxE_EmployeeName,
        boxF_EmployeeStreet,
        boxF_EmployeeCity,
        boxF_EmployeeState,
        boxF_EmployeeZip,
        box1_Wages: calc?.box1 ?? box1_Wages,
        box2_FederalTax: calc?.box2 ?? 0,
        box3_SSWages: calc?.box3 ?? 0,
        box4_SSTax: calc?.box4 ?? 0,
        box5_MedicareWages: calc?.box5 ?? 0,
        box6_MedicareTax: calc?.box6 ?? 0,
        box7_SSTips: calc?.box7 ?? box7_SSTips,
        box8_AllocatedTips: calc?.box8 ?? box8_AllocatedTips,
        box10_DependentCare: calc?.box10 ?? box10_DependentCare,
        box11_NonqualifiedPlans: calc?.box11 ?? box11_NonqualifiedPlans,
        box12Codes,
        box13_StatutoryEmployee,
        box13_RetirementPlan,
        box13_ThirdPartySickPay,
        box14Other,
        box15_State,
        box15_EmployerStateId: box15_EmployerStateId,
        box16_StateWages: calc?.box16 ?? 0,
        box17_StateTax: calc?.box17 ?? 0,
        box18_LocalWages: calc?.box18 ?? 0,
        box19_LocalTax: calc?.box19 ?? 0,
        box20_LocalityName,
      };
      const pdfBytes = await generateW2PDF(formData);
      downloadW2PDF(pdfBytes, taxYear, boxE_EmployeeName);
      toast({
        title: "W-2 Generated",
        description: "3 copies (B, C, 2) downloaded as PDF.",
      });
    } catch (err) {
      toast({
        title: "Generation failed",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/documents")}
            className="h-8 px-2 -ml-2 mb-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Documents
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Generate W-2 Form
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                IRS Form W-2 — Oregon · Tax Year {taxYear}
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating || box1_Wages <= 0}
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              {generating ? "Generating…" : "Generate W-2 PDF"}
            </Button>
          </div>
        </div>

        {/* Settings */}
        <Card>
          <CardContent className="pt-5">
            <SectionHeader title="Settings" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Tax Year</Label>
                <Input
                  type="number"
                  value={taxYear}
                  onChange={(e) => setTaxYear(parseInt(e.target.value) || 2026)}
                  className="w-28"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Filing Status</Label>
                <Select
                  value={filingStatus}
                  onValueChange={(v) => setFilingStatus(v as FilingStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Single</SelectItem>
                    <SelectItem value="MARRIED_JOINTLY">
                      Married Filing Jointly
                    </SelectItem>
                    <SelectItem value="MARRIED_SEPARATELY">
                      Married Filing Separately
                    </SelectItem>
                    <SelectItem value="HEAD_OF_HOUSEHOLD">
                      Head of Household
                    </SelectItem>
                    <SelectItem value="QUALIFYING_WIDOW">
                      Qualifying Widow(er)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <Checkbox
                  id="autoCalc"
                  checked={autoCalculate}
                  onCheckedChange={(c) => setAutoCalculate(c === true)}
                />
                <Label htmlFor="autoCalc" className="cursor-pointer">
                  Auto-calculate taxes
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employer */}
        <Card>
          <CardContent className="pt-5">
            <SectionHeader
              title="Employer Information"
              description="Boxes b & c — Employer EIN, name, and address"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Box b — Employer EIN</Label>
                <Input
                  value={boxB_EmployerEIN}
                  onChange={(e) => setBoxB_EmployerEIN(e.target.value)}
                  placeholder="XX-XXXXXXX"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Box c — Employer Name</Label>
                <Input
                  value={boxC_EmployerName}
                  onChange={(e) => setBoxC_EmployerName(e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Street Address</Label>
                <Input
                  value={boxC_EmployerStreet}
                  onChange={(e) => setBoxC_EmployerStreet(e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={boxC_EmployerCity}
                  onChange={(e) => setBoxC_EmployerCity(e.target.value)}
                  placeholder="Portland"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input
                    value={boxC_EmployerState}
                    onChange={(e) => setBoxC_EmployerState(e.target.value)}
                    placeholder="OR"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>ZIP</Label>
                  <Input
                    value={boxC_EmployerZip}
                    onChange={(e) => setBoxC_EmployerZip(e.target.value)}
                    placeholder="97201"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Box d — Control Number (optional)</Label>
                <Input
                  value={boxD_ControlNumber}
                  onChange={(e) => setBoxD_ControlNumber(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee */}
        <Card>
          <CardContent className="pt-5">
            <SectionHeader
              title="Employee Information"
              description="Boxes a, e & f — SSN, name, and address"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Box a — Employee SSN</Label>
                <Input
                  value={boxA_EmployeeSSN}
                  onChange={(e) => setBoxA_EmployeeSSN(e.target.value)}
                  placeholder="XXX-XX-XXXX"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Box e — Employee Name</Label>
                <Input
                  value={boxE_EmployeeName}
                  onChange={(e) => setBoxE_EmployeeName(e.target.value)}
                  placeholder="First Last"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Box f — Street Address</Label>
                <Input
                  value={boxF_EmployeeStreet}
                  onChange={(e) => setBoxF_EmployeeStreet(e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={boxF_EmployeeCity}
                  onChange={(e) => setBoxF_EmployeeCity(e.target.value)}
                  placeholder="Portland"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input
                    value={boxF_EmployeeState}
                    onChange={(e) => setBoxF_EmployeeState(e.target.value)}
                    placeholder="OR"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>ZIP</Label>
                  <Input
                    value={boxF_EmployeeZip}
                    onChange={(e) => setBoxF_EmployeeZip(e.target.value)}
                    placeholder="97201"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wages */}
        <Card>
          <CardContent className="pt-5">
            <SectionHeader
              title="Wages & Compensation"
              description="Boxes 1–11 — Enter wages; taxes auto-calculated"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="font-semibold">
                  Box 1 — Wages, tips, other compensation *
                </Label>
                <Input
                  type="number"
                  value={box1_Wages || ""}
                  onChange={(e) =>
                    setBox1_Wages(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  className="text-lg font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tips (included in Box 1)</Label>
                <Input
                  type="number"
                  value={tips || ""}
                  onChange={(e) => setTips(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Box 7 — Social Security tips</Label>
                <Input
                  type="number"
                  value={box7_SSTips || ""}
                  onChange={(e) =>
                    setBox7_SSTips(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Box 8 — Allocated tips</Label>
                <Input
                  type="number"
                  value={box8_AllocatedTips || ""}
                  onChange={(e) =>
                    setBox8_AllocatedTips(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Box 10 — Dependent care benefits</Label>
                <Input
                  type="number"
                  value={box10_DependentCare || ""}
                  onChange={(e) =>
                    setBox10_DependentCare(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Box 11 — Nonqualified plans</Label>
                <Input
                  type="number"
                  value={box11_NonqualifiedPlans || ""}
                  onChange={(e) =>
                    setBox11_NonqualifiedPlans(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Withholding allowances</Label>
                <Input
                  type="number"
                  value={allowances}
                  onChange={(e) => setAllowances(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Additional withholding</Label>
                <Input
                  type="number"
                  value={additionalWithholding || ""}
                  onChange={(e) =>
                    setAdditionalWithholding(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            {calc && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">
                    Calculated Tax Withholdings
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Auto
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    {
                      label: "Box 2 — Federal income tax",
                      value: calc.box2,
                      note: "Estimated",
                    },
                    {
                      label: "Box 3 — Social Security wages",
                      value: calc.box3,
                      note: `Cap $${(184500).toLocaleString()}`,
                    },
                    {
                      label: "Box 4 — Social Security tax",
                      value: calc.box4,
                      note: "6.2%",
                    },
                    {
                      label: "Box 5 — Medicare wages",
                      value: calc.box5,
                      note: "No cap",
                    },
                    {
                      label: "Box 6 — Medicare tax",
                      value: calc.box6,
                      note: "1.45% + 0.9%",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <p className="text-xs text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-base font-semibold">
                        {fmt2(item.value)}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {item.note}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Box 12, 13, 14 */}
        <Card>
          <CardContent className="pt-5">
            <SectionHeader
              title="Deferred Compensation & Benefits"
              description="Boxes 12–14"
            />

            <div className="space-y-2 mb-4">
              <Label className="text-sm font-medium">
                Box 12 — Deferred compensation codes
              </Label>
              <p className="text-xs text-muted-foreground">
                Common: D=401(k) · E=403(b) · G=457(b) · W=HSA · DD=Health ins.
                cost
              </p>
              {box12Codes.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={item.code}
                    onChange={(e) => {
                      const u = [...box12Codes];
                      u[i] = { ...u[i], code: e.target.value };
                      setBox12Codes(u);
                    }}
                    placeholder="Code"
                    className="w-20"
                  />
                  <Input
                    type="number"
                    value={item.amount || ""}
                    onChange={(e) => {
                      const u = [...box12Codes];
                      u[i] = {
                        ...u[i],
                        amount: parseFloat(e.target.value) || 0,
                      };
                      setBox12Codes(u);
                    }}
                    placeholder="Amount"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setBox12Codes(box12Codes.filter((_, j) => j !== i))
                    }
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setBox12Codes([...box12Codes, { code: "", amount: 0 }])
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Box 12 Code
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 mb-4">
              <Label className="text-sm font-medium">Box 13 — Checkboxes</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {[
                  {
                    id: "stat",
                    label: "Statutory Employee",
                    val: box13_StatutoryEmployee,
                    set: setBox13_StatutoryEmployee,
                  },
                  {
                    id: "ret",
                    label: "Retirement Plan",
                    val: box13_RetirementPlan,
                    set: setBox13_RetirementPlan,
                  },
                  {
                    id: "sick",
                    label: "Third-Party Sick Pay",
                    val: box13_ThirdPartySickPay,
                    set: setBox13_ThirdPartySickPay,
                  },
                ].map((cb) => (
                  <div key={cb.id} className="flex items-center gap-2">
                    <Checkbox
                      id={cb.id}
                      checked={cb.val}
                      onCheckedChange={(c) => cb.set(c === true)}
                    />
                    <Label htmlFor={cb.id} className="cursor-pointer text-sm">
                      {cb.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Box 14 — Other</Label>
              <p className="text-xs text-muted-foreground">
                State disability insurance, union dues, etc.
              </p>
              {box15_State === "OR" && oregonSTT && (
                <Alert className="py-2">
                  <AlertDescription className="text-xs">
                    Oregon STT auto-added:{" "}
                    <strong>STT {fmt2(oregonSTT.wages)}</strong> /{" "}
                    <strong>STP {fmt2(oregonSTT.withheld)}</strong> (0.1%
                    statewide transit tax)
                  </AlertDescription>
                </Alert>
              )}
              {box14Other.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={item.description}
                    onChange={(e) => {
                      const u = [...box14Other];
                      u[i] = { ...u[i], description: e.target.value };
                      setBox14Other(u);
                    }}
                    placeholder="Description"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={item.amount || ""}
                    onChange={(e) => {
                      const u = [...box14Other];
                      u[i] = {
                        ...u[i],
                        amount: parseFloat(e.target.value) || 0,
                      };
                      setBox14Other(u);
                    }}
                    placeholder="Amount"
                    className="w-32"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setBox14Other(box14Other.filter((_, j) => j !== i))
                    }
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setBox14Other([...box14Other, { description: "", amount: 0 }])
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Box 14 Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* State & Local — Oregon */}
        <Card>
          <CardContent className="pt-5">
            <SectionHeader
              title="State & Local — Oregon"
              description="Boxes 15–20 · Oregon income tax auto-calculated (9%)"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Box 15 — State</Label>
                <Input
                  value={box15_State}
                  onChange={(e) => setBox15_State(e.target.value.toUpperCase())}
                  placeholder="OR"
                  className="w-24"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Box 15 — Employer's State ID Number</Label>
                <Input
                  value={box15_EmployerStateId}
                  onChange={(e) => setBox15_EmployerStateId(e.target.value)}
                  placeholder="State employer ID"
                />
              </div>
              {calc && (
                <>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Box 16 — State wages
                    </p>
                    <p className="text-base font-semibold">
                      {fmt2(calc.box16)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Box 17 — State income tax withheld
                    </p>
                    <p className="text-base font-semibold">
                      {fmt2(calc.box17)}
                    </p>
                  </div>
                </>
              )}
              {oregonSTT && (
                <>
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Oregon STT — Statewide Transit Tax Wages
                    </p>
                    <p className="text-base font-semibold">
                      {fmt2(oregonSTT.wages)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Box 14 code: STT
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Oregon STT — Withheld (0.1%)
                    </p>
                    <p className="text-base font-semibold">
                      {fmt2(oregonSTT.withheld)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Box 14 code: STP
                    </p>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label>Local Tax Rate (%)</Label>
                <Input
                  type="number"
                  value={localTaxRate || ""}
                  onChange={(e) =>
                    setLocalTaxRate(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Box 20 — Locality Name</Label>
                <Input
                  value={box20_LocalityName}
                  onChange={(e) => setBox20_LocalityName(e.target.value)}
                  placeholder="Locality name"
                />
              </div>
              {calc && localTaxRate > 0 && (
                <>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Box 18 — Local wages
                    </p>
                    <p className="text-base font-semibold">
                      {fmt2(calc.box18)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Box 19 — Local income tax
                    </p>
                    <p className="text-base font-semibold">
                      {fmt2(calc.box19)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Generate button (bottom) */}
        <div className="flex justify-end pb-4">
          <Button
            onClick={handleGenerate}
            disabled={generating || box1_Wages <= 0}
            size="lg"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {generating ? "Generating PDF…" : `Generate W-2 PDF (${taxYear})`}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
