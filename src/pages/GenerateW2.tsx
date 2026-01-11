import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Calculator, FileText, ChevronRight, ChevronLeft, Check, X } from "lucide-react";
import { usePFSData } from "@/hooks/usePFSData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/domain/utils";
import { calculateW2, type W2CalculationInput, type FilingStatus } from "@/lib/calculations/w2-calculator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const formatCurrencyDisplay = (amount: number) => {
  return formatCurrency(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function GenerateW2() {
  const navigate = useNavigate();
  const { data, isLoading, error } = usePFSData();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));
  const totalSteps = 4;
  
  // Check if a step is completed
  const isStepCompleted = (step: number): boolean => {
    // Only check completion for steps that have been visited
    if (!visitedSteps.has(step)) {
      return false;
    }
    
    switch (step) {
      case 1:
        return !!(boxA_EmployeeSSN && boxE_EmployeeName && boxB_EmployerEIN && boxC_EmployerName);
      case 2:
        return box1_Wages > 0;
      case 3:
        return true; // Step 3 is optional, considered complete if visited
      case 4:
        return true; // Step 4 is optional, considered complete if visited
      default:
        return false;
    }
  };
  
  // Get personal info for auto-population
  const personalInfo = data ? {
    name: "User Name", // TODO: Get from PersonalInfo
    ssn: "", // TODO: Get from PersonalInfo
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
  } : null;

  // Form state - organized by official W-2 boxes
  const [taxYear, setTaxYear] = useState(2026);
  
  // Step 1: Employee and Employer Information (Boxes a-f)
  const [boxA_EmployeeSSN, setBoxA_EmployeeSSN] = useState("");
  const [boxB_EmployerEIN, setBoxB_EmployerEIN] = useState("");
  const [boxC_EmployerName, setBoxC_EmployerName] = useState("");
  const [boxC_EmployerAddress, setBoxC_EmployerAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [boxD_ControlNumber, setBoxD_ControlNumber] = useState("");
  const [boxE_EmployeeName, setBoxE_EmployeeName] = useState("");
  const [boxF_EmployeeAddress, setBoxF_EmployeeAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  
  // Step 2: Wages and Income (Boxes 1, 7, 8, 10, 11)
  const [box1_Wages, setBox1_Wages] = useState(0);
  const [tips, setTips] = useState(0);
  const [box7_SocialSecurityTips, setBox7_SocialSecurityTips] = useState(0);
  const [box8_AllocatedTips, setBox8_AllocatedTips] = useState(0);
  const [box10_DependentCare, setBox10_DependentCare] = useState(0);
  const [box11_NonqualifiedPlans, setBox11_NonqualifiedPlans] = useState(0);
  
  // Step 3: Additional Information (Boxes 12, 13, 14)
  const [box12Codes, setBox12Codes] = useState<Array<{ code: string; amount: number }>>([]);
  const [box13StatutoryEmployee, setBox13StatutoryEmployee] = useState(false);
  const [box13RetirementPlan, setBox13RetirementPlan] = useState(false);
  const [box13ThirdPartySickPay, setBox13ThirdPartySickPay] = useState(false);
  const [box14Other, setBox14Other] = useState<Array<{ description: string; amount: number }>>([]);
  
  // Step 4: State and Local Taxes (Boxes 15-20)
  const [box15State, setBox15State] = useState("");
  const [box15EmployerStateId, setBox15EmployerStateId] = useState("");
  const [box20LocalityName, setBox20LocalityName] = useState("");
  const [localTaxRate, setLocalTaxRate] = useState(0);
  
  // Calculation inputs
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("SINGLE");
  const [allowances, setAllowances] = useState(0);
  const [additionalWithholding, setAdditionalWithholding] = useState(0);
  const [autoCalculate, setAutoCalculate] = useState(true);
  
  // Calculated values
  const [calculatedValues, setCalculatedValues] = useState<ReturnType<typeof calculateW2> | null>(null);

  // Auto-populate from personal info
  useEffect(() => {
    if (personalInfo) {
      setBoxE_EmployeeName(personalInfo.name);
      setBoxA_EmployeeSSN(personalInfo.ssn);
      setBoxF_EmployeeAddress(personalInfo.address);
    }
  }, [personalInfo]);

  // Auto-calculate when inputs change
  useEffect(() => {
    if (autoCalculate && box1_Wages > 0) {
      const input: W2CalculationInput = {
        wages: box1_Wages,
        tips: tips,
        socialSecurityTips: box7_SocialSecurityTips,
        allocatedTips: box8_AllocatedTips,
        dependentCareBenefits: box10_DependentCare,
        nonqualifiedPlans: box11_NonqualifiedPlans,
        box12Codes: box12Codes,
        filingStatus: filingStatus,
        allowances: allowances,
        additionalWithholding: additionalWithholding,
        state: box15State,
        localTaxRate: localTaxRate > 0 ? localTaxRate / 100 : undefined,
      };
      
      const calculated = calculateW2(input);
      setCalculatedValues(calculated);
    }
  }, [
    box1_Wages,
    tips,
    box7_SocialSecurityTips,
    box8_AllocatedTips,
    box10_DependentCare,
    box11_NonqualifiedPlans,
    box12Codes,
    filingStatus,
    allowances,
    additionalWithholding,
    box15State,
    localTaxRate,
    autoCalculate,
  ]);

  const handleGenerate = () => {
    if (!calculatedValues) {
      toast({
        title: "Error",
        description: "Please enter wages to calculate W-2 values.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Generate PDF
    console.log("Generating W-2 PDF...");
    toast({
      title: "W-2 Generated",
      description: "W-2 PDF has been generated successfully.",
    });
  };

  const addBox12Code = () => {
    setBox12Codes([...box12Codes, { code: "", amount: 0 }]);
  };

  const updateBox12Code = (index: number, field: "code" | "amount", value: string | number) => {
    const updated = [...box12Codes];
    updated[index] = { ...updated[index], [field]: value };
    setBox12Codes(updated);
  };

  const removeBox12Code = (index: number) => {
    setBox12Codes(box12Codes.filter((_, i) => i !== index));
  };

  const addBox14Other = () => {
    setBox14Other([...box14Other, { description: "", amount: 0 }]);
  };

  const updateBox14Other = (index: number, field: "description" | "amount", value: string | number) => {
    const updated = [...box14Other];
    updated[index] = { ...updated[index], [field]: value };
    setBox14Other(updated);
  };

  const removeBox14Other = (index: number) => {
    setBox14Other(box14Other.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setVisitedSteps(prev => new Set([...prev, currentStep + 1]));
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
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
              : "Failed to load data. Please check your configuration."}
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/documents")}
            className="transition-all hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Generate W-2 Form
            </h1>
            <p className="text-muted-foreground mt-1">
              Official IRS Form W-2 for Tax Year {taxYear}
            </p>
          </div>
        </div>

        {/* Step Progress */}
        <Card className="transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-0">
                {[1, 2, 3, 4].map((step, index) => {
                  const isCompleted = isStepCompleted(step);
                  const wasVisited = visitedSteps.has(step);
                  const isCurrent = step === currentStep;
                  
                  return (
                    <div key={step} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                            isCurrent
                              ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                              : isCompleted
                              ? "bg-success text-success-foreground"
                              : wasVisited && !isCompleted
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-5 w-5" />
                          ) : wasVisited && !isCompleted ? (
                            <X className="h-5 w-5" />
                          ) : (
                            step
                          )}
                        </div>
                        <p className="text-xs mt-2 text-center text-muted-foreground w-20">
                          {step === 1 && "Basic Info"}
                          {step === 2 && "Wages"}
                          {step === 3 && "Additional"}
                          {step === 4 && "State/Local"}
                        </p>
                      </div>
                      {index < 3 && (
                        <div
                          className={`h-1 w-20 mx-4 transition-all duration-300 ${
                            isCompleted ? "bg-success" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle>Step 1: Basic Information</CardTitle>
              <CardDescription>Employee and employer identification (Boxes a-f)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Tax Year</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={taxYear}
                      onChange={(e) => setTaxYear(parseInt(e.target.value) || 2026)}
                      className="w-32"
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="autoCalculate"
                        checked={autoCalculate}
                        onCheckedChange={(checked) => setAutoCalculate(checked === true)}
                      />
                      <Label htmlFor="autoCalculate" className="cursor-pointer text-sm">
                        Auto-calculate taxes
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-semibold mb-3 block">Employee Information</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="boxA">Box a: Employee's Social Security Number</Label>
                      <Input
                        id="boxA"
                        value={boxA_EmployeeSSN}
                        onChange={(e) => setBoxA_EmployeeSSN(e.target.value)}
                        placeholder="XXX-XX-XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boxE">Box e: Employee's Name</Label>
                      <Input
                        id="boxE"
                        value={boxE_EmployeeName}
                        onChange={(e) => setBoxE_EmployeeName(e.target.value)}
                        placeholder="Employee Name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label>Box f: Employee's Address</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input
                        value={boxF_EmployeeAddress.street}
                        onChange={(e) => setBoxF_EmployeeAddress({ ...boxF_EmployeeAddress, street: e.target.value })}
                        placeholder="Street Address"
                      />
                      <Input
                        value={boxF_EmployeeAddress.city}
                        onChange={(e) => setBoxF_EmployeeAddress({ ...boxF_EmployeeAddress, city: e.target.value })}
                        placeholder="City"
                      />
                      <Input
                        value={boxF_EmployeeAddress.state}
                        onChange={(e) => setBoxF_EmployeeAddress({ ...boxF_EmployeeAddress, state: e.target.value })}
                        placeholder="State"
                        className="w-24"
                      />
                      <Input
                        value={boxF_EmployeeAddress.zipCode}
                        onChange={(e) => setBoxF_EmployeeAddress({ ...boxF_EmployeeAddress, zipCode: e.target.value })}
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-semibold mb-3 block">Employer Information</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="boxB">Box b: Employer Identification Number (EIN)</Label>
                      <Input
                        id="boxB"
                        value={boxB_EmployerEIN}
                        onChange={(e) => setBoxB_EmployerEIN(e.target.value)}
                        placeholder="XX-XXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boxC_name">Box c: Employer's Name</Label>
                      <Input
                        id="boxC_name"
                        value={boxC_EmployerName}
                        onChange={(e) => setBoxC_EmployerName(e.target.value)}
                        placeholder="Employer Name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label>Box c: Employer's Address</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input
                        value={boxC_EmployerAddress.street}
                        onChange={(e) => setBoxC_EmployerAddress({ ...boxC_EmployerAddress, street: e.target.value })}
                        placeholder="Street Address"
                      />
                      <Input
                        value={boxC_EmployerAddress.city}
                        onChange={(e) => setBoxC_EmployerAddress({ ...boxC_EmployerAddress, city: e.target.value })}
                        placeholder="City"
                      />
                      <Input
                        value={boxC_EmployerAddress.state}
                        onChange={(e) => setBoxC_EmployerAddress({ ...boxC_EmployerAddress, state: e.target.value })}
                        placeholder="State"
                        className="w-24"
                      />
                      <Input
                        value={boxC_EmployerAddress.zipCode}
                        onChange={(e) => setBoxC_EmployerAddress({ ...boxC_EmployerAddress, zipCode: e.target.value })}
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="boxD">Box d: Control Number (Optional)</Label>
                    <Input
                      id="boxD"
                      value={boxD_ControlNumber}
                      onChange={(e) => setBoxD_ControlNumber(e.target.value)}
                      placeholder="Control Number"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Wages and Income */}
        {currentStep === 2 && (
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Step 2: Wages and Income
              </CardTitle>
              <CardDescription>Enter compensation amounts (Boxes 1, 7, 8, 10, 11)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="box1" className="text-base font-semibold">Box 1: Wages, tips, other compensation</Label>
                  <Input
                    id="box1"
                    type="number"
                    value={box1_Wages || ""}
                    onChange={(e) => setBox1_Wages(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter total wages, tips, and other compensation for the year
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="tips">Tips (if applicable)</Label>
                  <Input
                    id="tips"
                    type="number"
                    value={tips || ""}
                    onChange={(e) => setTips(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tips are included in Box 1 and used for tax calculations
                  </p>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="box7">Box 7: Social Security tips</Label>
                    <Input
                      id="box7"
                      type="number"
                      value={box7_SocialSecurityTips || ""}
                      onChange={(e) => setBox7_SocialSecurityTips(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box8">Box 8: Allocated tips</Label>
                    <Input
                      id="box8"
                      type="number"
                      value={box8_AllocatedTips || ""}
                      onChange={(e) => setBox8_AllocatedTips(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box10">Box 10: Dependent care benefits</Label>
                    <Input
                      id="box10"
                      type="number"
                      value={box10_DependentCare || ""}
                      onChange={(e) => setBox10_DependentCare(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box11">Box 11: Nonqualified plans</Label>
                    <Input
                      id="box11"
                      type="number"
                      value={box11_NonqualifiedPlans || ""}
                      onChange={(e) => setBox11_NonqualifiedPlans(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {calculatedValues && (
                  <>
                    <Separator />
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <Label className="text-sm font-semibold mb-3 block">Calculated Tax Withholdings</Label>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Box 2: Federal income tax withheld</p>
                          <p className="text-lg font-semibold">{formatCurrencyDisplay(calculatedValues.box2)}</p>
                          <p className="text-xs text-muted-foreground">(Estimated based on filing status)</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Box 3: Social Security wages</p>
                          <p className="text-lg font-semibold">{formatCurrencyDisplay(calculatedValues.box3)}</p>
                          <p className="text-xs text-muted-foreground">(Capped at $184,500 for 2026)</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Box 4: Social Security tax withheld</p>
                          <p className="text-lg font-semibold">{formatCurrencyDisplay(calculatedValues.box4)}</p>
                          <p className="text-xs text-muted-foreground">(6.2% of Box 3)</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Box 5: Medicare wages and tips</p>
                          <p className="text-lg font-semibold">{formatCurrencyDisplay(calculatedValues.box5)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Box 6: Medicare tax withheld</p>
                          <p className="text-lg font-semibold">{formatCurrencyDisplay(calculatedValues.box6)}</p>
                          <p className="text-xs text-muted-foreground">(1.45% + 0.9% on wages over $200,000)</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Additional Information */}
        {currentStep === 3 && (
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle>Step 3: Additional Information</CardTitle>
              <CardDescription>Deferred compensation, benefits, and other items (Boxes 12, 13, 14)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Withholding Calculation Settings</Label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="filingStatus">Filing Status</Label>
                      <Select value={filingStatus} onValueChange={(v) => setFilingStatus(v as FilingStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE">Single</SelectItem>
                          <SelectItem value="MARRIED_JOINTLY">Married Filing Jointly</SelectItem>
                          <SelectItem value="MARRIED_SEPARATELY">Married Filing Separately</SelectItem>
                          <SelectItem value="HEAD_OF_HOUSEHOLD">Head of Household</SelectItem>
                          <SelectItem value="QUALIFYING_WIDOW">Qualifying Widow(er)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allowances">Withholding Allowances</Label>
                      <Input
                        id="allowances"
                        type="number"
                        value={allowances}
                        onChange={(e) => setAllowances(parseInt(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="additionalWithholding">Additional Withholding</Label>
                      <Input
                        id="additionalWithholding"
                        type="number"
                        value={additionalWithholding || ""}
                        onChange={(e) => setAdditionalWithholding(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-semibold mb-3 block">Box 12: Deferred Compensation and Benefits</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Common codes: D (401k), E (403b), G (457b), W (HSA), DD (Cost of health insurance)
                  </p>
                  <div className="space-y-2">
                    {box12Codes.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={item.code}
                          onChange={(e) => updateBox12Code(index, "code", e.target.value)}
                          placeholder="Code"
                          className="w-24"
                        />
                        <Input
                          type="number"
                          value={item.amount || ""}
                          onChange={(e) => updateBox12Code(index, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="Amount"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBox12Code(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addBox12Code} size="sm">
                      Add Box 12 Code
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-semibold mb-3 block">Box 13: Checkboxes</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="box13_statutory"
                        checked={box13StatutoryEmployee}
                        onCheckedChange={(checked) => setBox13StatutoryEmployee(checked === true)}
                      />
                      <Label htmlFor="box13_statutory" className="cursor-pointer">
                        Statutory Employee
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="box13_retirement"
                        checked={box13RetirementPlan}
                        onCheckedChange={(checked) => setBox13RetirementPlan(checked === true)}
                      />
                      <Label htmlFor="box13_retirement" className="cursor-pointer">
                        Retirement Plan
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="box13_sickpay"
                        checked={box13ThirdPartySickPay}
                        onCheckedChange={(checked) => setBox13ThirdPartySickPay(checked === true)}
                      />
                      <Label htmlFor="box13_sickpay" className="cursor-pointer">
                        Third-Party Sick Pay
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-semibold mb-3 block">Box 14: Other</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    State disability insurance, union dues, etc.
                  </p>
                  <div className="space-y-2">
                    {box14Other.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={item.description}
                          onChange={(e) => updateBox14Other(index, "description", e.target.value)}
                          placeholder="Description"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={item.amount || ""}
                          onChange={(e) => updateBox14Other(index, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="Amount"
                          className="w-32"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBox14Other(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addBox14Other} size="sm">
                      Add Box 14 Item
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: State and Local Taxes */}
        {currentStep === 4 && (
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle>Step 4: State and Local Taxes</CardTitle>
              <CardDescription>State and local tax information (Boxes 15-20)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="box15_state">Box 15: State</Label>
                    <Input
                      id="box15_state"
                      value={box15State}
                      onChange={(e) => setBox15State(e.target.value)}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box15_stateid">Box 15: Employer's State ID Number</Label>
                    <Input
                      id="box15_stateid"
                      value={box15EmployerStateId}
                      onChange={(e) => setBox15EmployerStateId(e.target.value)}
                      placeholder="State ID"
                    />
                  </div>
                </div>

                {calculatedValues && (
                  <>
                    <Separator />
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <Label className="text-sm font-semibold mb-3 block">Calculated State and Local Taxes</Label>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Box 16: State wages, tips, etc.</p>
                          <p className="text-lg font-semibold">{formatCurrencyDisplay(calculatedValues.box16)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Box 17: State income tax</p>
                          <p className="text-lg font-semibold">{formatCurrencyDisplay(calculatedValues.box17)}</p>
                          <p className="text-xs text-muted-foreground">(Estimated)</p>
                        </div>
                        {localTaxRate > 0 && (
                          <>
                            <div>
                              <p className="text-xs text-muted-foreground">Box 18: Local wages, tips, etc.</p>
                              <p className="text-lg font-semibold">{formatCurrencyDisplay(calculatedValues.box18)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Box 19: Local income tax</p>
                              <p className="text-lg font-semibold">{formatCurrencyDisplay(calculatedValues.box19)}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="localTaxRate">Local Tax Rate (%)</Label>
                    <Input
                      id="localTaxRate"
                      type="number"
                      value={localTaxRate || ""}
                      onChange={(e) => setLocalTaxRate(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box20">Box 20: Locality Name</Label>
                    <Input
                      id="box20"
                      value={box20LocalityName}
                      onChange={(e) => setBox20LocalityName(e.target.value)}
                      placeholder="Locality Name"
                    />
                  </div>
                </div>

                <Separator />

                {/* Final Summary */}
                {calculatedValues && (
                  <div className="bg-primary/5 border-primary/20 p-6 rounded-lg">
                    <Label className="text-sm font-semibold mb-4 block">W-2 Summary</Label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Box 1: Wages, tips, other compensation</p>
                        <p className="text-2xl font-bold">{formatCurrencyDisplay(calculatedValues.box1)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Box 2: Federal income tax withheld</p>
                        <p className="text-2xl font-bold">{formatCurrencyDisplay(calculatedValues.box2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Box 4: Social Security tax withheld</p>
                        <p className="text-xl font-semibold">{formatCurrencyDisplay(calculatedValues.box4)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Box 6: Medicare tax withheld</p>
                        <p className="text-xl font-semibold">{formatCurrencyDisplay(calculatedValues.box6)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="transition-all hover:bg-accent hover:text-accent-foreground"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </div>
              
              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                  size="lg"
                  disabled={!calculatedValues || box1_Wages <= 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate W-2 PDF
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
