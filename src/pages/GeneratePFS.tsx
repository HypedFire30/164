import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Search,
  CheckSquare,
  Square,
  Download,
  Loader2,
  Database,
} from "lucide-react";
import { usePFSData } from "@/hooks/usePFSData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/domain/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getAvailableTemplates,
  loadTemplate,
  type PDFTemplate,
} from "@/lib/pdf/template-manager";
import {
  fillPFSForm,
  downloadPDF,
  type PFSFormData,
} from "@/lib/pdf/pdf-filler";
import { saveSnapshot } from "@/lib/snapshots/snapshot-repository";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatCurrencyDisplay = (amount: number) => {
  return formatCurrency(amount, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Helper component for auto-filled indicator with tooltip
function AutoFilledIndicator({ source }: { source: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 cursor-help">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Auto-filled</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Auto-filled from:</p>
          <p>{source}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function GeneratePFS() {
  const { data, isLoading, error } = usePFSData();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfTemplate, setPdfTemplate] = useState<Uint8Array | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<PDFTemplate[]>(
    []
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Property selection state
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(
    new Set()
  );
  const [propertySearchQuery, setPropertySearchQuery] = useState("");

  // Track which fields are auto-populated
  const [autoPopulatedFields, setAutoPopulatedFields] = useState<Set<string>>(
    new Set()
  );

  // Personal Information
  const [borrowerName, setBorrowerName] = useState("");

  // Current Assets
  const [cashOnHand, setCashOnHand] = useState(0);
  const [cashOtherInstitutions, setCashOtherInstitutions] = useState(0);
  const [buildingMaterialInventory, setBuildingMaterialInventory] = useState(0);
  const [lifeInsuranceCashValue, setLifeInsuranceCashValue] = useState(0);
  const [retirementAccounts, setRetirementAccounts] = useState(0);

  // Other Assets
  const [automobilesTrucks, setAutomobilesTrucks] = useState(0);
  const [machineryTools, setMachineryTools] = useState(0);
  const [otherAssets, setOtherAssets] = useState("");
  const [otherAssetsValue, setOtherAssetsValue] = useState(0);

  // Current Liabilities
  const [notesPayableRelatives, setNotesPayableRelatives] = useState(0);
  const [accruedInterest, setAccruedInterest] = useState(0);
  const [accruedSalaryWages, setAccruedSalaryWages] = useState(0);
  const [accruedTaxesOther, setAccruedTaxesOther] = useState(0);
  const [incomeTaxPayable, setIncomeTaxPayable] = useState(0);

  // Other Liabilities
  const [chattelMortgage, setChattelMortgage] = useState(0);
  const [otherLiabilities, setOtherLiabilities] = useState("");
  const [otherLiabilitiesValue, setOtherLiabilitiesValue] = useState(0);

  // Auto-populate from database when data loads
  useEffect(() => {
    if (!data) return;

    const newAutoPopulated = new Set<string>();

    // Auto-populate assets from PersonalAssets table
    // Map exact category names to PFS fields
    const cashAssets = data.personalAssets.filter(
      (asset) => asset.category === "Cash"
    );
    if (cashAssets.length > 0) {
      const totalCash = cashAssets.reduce((sum, a) => sum + a.value, 0);
      setCashOnHand(totalCash);
      newAutoPopulated.add("cashOnHand");
    }

    const cashOtherAssets = data.personalAssets.filter(
      (asset) => asset.category === "Cash Other Institutions"
    );
    if (cashOtherAssets.length > 0) {
      const totalCashOther = cashOtherAssets.reduce(
        (sum, a) => sum + a.value,
        0
      );
      setCashOtherInstitutions(totalCashOther);
      newAutoPopulated.add("cashOtherInstitutions");
    }

    const inventoryAssets = data.personalAssets.filter(
      (asset) => asset.category === "Building Material Inventory"
    );
    if (inventoryAssets.length > 0) {
      const totalInventory = inventoryAssets.reduce(
        (sum, a) => sum + a.value,
        0
      );
      setBuildingMaterialInventory(totalInventory);
      newAutoPopulated.add("buildingMaterialInventory");
    }

    const lifeInsuranceAssets = data.personalAssets.filter(
      (asset) => asset.category === "Life Insurance"
    );
    if (lifeInsuranceAssets.length > 0) {
      const totalInsurance = lifeInsuranceAssets.reduce(
        (sum, a) => sum + a.value,
        0
      );
      setLifeInsuranceCashValue(totalInsurance);
      newAutoPopulated.add("lifeInsuranceCashValue");
    }

    const retirementAssets = data.personalAssets.filter(
      (asset) => asset.category === "Retirement"
    );
    if (retirementAssets.length > 0) {
      const totalRetirement = retirementAssets.reduce(
        (sum, a) => sum + a.value,
        0
      );
      setRetirementAccounts(totalRetirement);
      newAutoPopulated.add("retirementAccounts");
    }

    const vehicleAssets = data.personalAssets.filter(
      (asset) => asset.category === "Automobile"
    );
    if (vehicleAssets.length > 0) {
      const totalVehicles = vehicleAssets.reduce((sum, a) => sum + a.value, 0);
      setAutomobilesTrucks(totalVehicles);
      newAutoPopulated.add("automobilesTrucks");
    }

    const machineryAssets = data.personalAssets.filter(
      (asset) => asset.category === "Machinery"
    );
    if (machineryAssets.length > 0) {
      const totalMachinery = machineryAssets.reduce(
        (sum, a) => sum + a.value,
        0
      );
      setMachineryTools(totalMachinery);
      newAutoPopulated.add("machineryTools");
    }

    // Auto-populate liabilities from Liabilities table
    // Map exact category names to PFS fields
    const relativeNotes = data.liabilities.filter(
      (liability) => liability.category === "Note Payable - Relative"
    );
    if (relativeNotes.length > 0) {
      const totalRelativeNotes = relativeNotes.reduce(
        (sum, l) => sum + l.balance,
        0
      );
      setNotesPayableRelatives(totalRelativeNotes);
      newAutoPopulated.add("notesPayableRelatives");
    }

    const accruedInterestLiabilities = data.liabilities.filter(
      (liability) => liability.category === "Accrued Interest"
    );
    if (accruedInterestLiabilities.length > 0) {
      const totalAccruedInterest = accruedInterestLiabilities.reduce(
        (sum, l) => sum + l.balance,
        0
      );
      setAccruedInterest(totalAccruedInterest);
      newAutoPopulated.add("accruedInterest");
    }

    const accruedSalaryLiabilities = data.liabilities.filter(
      (liability) => liability.category === "Accrued Salary"
    );
    if (accruedSalaryLiabilities.length > 0) {
      const totalAccruedSalary = accruedSalaryLiabilities.reduce(
        (sum, l) => sum + l.balance,
        0
      );
      setAccruedSalaryWages(totalAccruedSalary);
      newAutoPopulated.add("accruedSalaryWages");
    }

    const accruedTaxLiabilities = data.liabilities.filter(
      (liability) => liability.category === "Accrued Tax"
    );
    if (accruedTaxLiabilities.length > 0) {
      const totalAccruedTax = accruedTaxLiabilities.reduce(
        (sum, l) => sum + l.balance,
        0
      );
      setAccruedTaxesOther(totalAccruedTax);
      newAutoPopulated.add("accruedTaxesOther");
    }

    const incomeTaxLiabilities = data.liabilities.filter(
      (liability) => liability.category === "Income Tax Payable"
    );
    if (incomeTaxLiabilities.length > 0) {
      const totalIncomeTax = incomeTaxLiabilities.reduce(
        (sum, l) => sum + l.balance,
        0
      );
      setIncomeTaxPayable(totalIncomeTax);
      newAutoPopulated.add("incomeTaxPayable");
    }

    const chattelLiabilities = data.liabilities.filter(
      (liability) => liability.category === "Chattel Mortgage"
    );
    if (chattelLiabilities.length > 0) {
      const totalChattel = chattelLiabilities.reduce(
        (sum, l) => sum + l.balance,
        0
      );
      setChattelMortgage(totalChattel);
      newAutoPopulated.add("chattelMortgage");
    }

    const guaranteedLoanLiabilities = data.liabilities.filter(
      (liability) => liability.category === "Guaranteed Loan"
    );
    if (guaranteedLoanLiabilities.length > 0) {
      const totalGuaranteed = guaranteedLoanLiabilities.reduce(
        (sum, l) => sum + l.balance,
        0
      );
      setGuaranteedLoans(totalGuaranteed);
      newAutoPopulated.add("guaranteedLoans");
    }

    const suretyBondLiabilities = data.liabilities.filter(
      (liability) => liability.category === "Surety Bond"
    );
    if (suretyBondLiabilities.length > 0) {
      const totalSurety = suretyBondLiabilities.reduce(
        (sum, l) => sum + l.balance,
        0
      );
      setSuretyBonds(totalSurety);
      newAutoPopulated.add("suretyBonds");
    }

    setAutoPopulatedFields(newAutoPopulated);
  }, [data]);

  // Auto-populate Schedule E from selected properties when they change
  useEffect(() => {
    if (!data) return;

    const selectedPropertiesList = data.properties.filter((p) =>
      selectedProperties.has(p.id)
    );

    if (selectedPropertiesList.length > 0) {
      const newScheduleE = selectedPropertiesList
        .slice(0, 3)
        .map((property) => {
          const mortgage = data.mortgages.find(
            (m) => m.propertyId === property.id
          );
          return {
            description: property.address,
            debtorName: property.scheduleEDebtorName || mortgage?.lender || "",
            paymentSchedule: property.scheduleEPaymentSchedule || "Monthly",
            pastDue: property.scheduleEAmountPastDue || 0,
            originalBalance:
              property.scheduleEOriginalBalance || property.purchasePrice || 0,
            presentBalance:
              property.scheduleEPresentBalance ||
              mortgage?.principalBalance ||
              0,
            interestRate:
              property.scheduleEInterestRate ||
              (mortgage ? mortgage.interestRate * 100 : 0),
          };
        });

      // Fill remaining slots with empty entries
      while (newScheduleE.length < 3) {
        newScheduleE.push({
          description: "",
          debtorName: "",
          paymentSchedule: "",
          pastDue: 0,
          originalBalance: 0,
          presentBalance: 0,
          interestRate: 0,
        });
      }

      setScheduleE(newScheduleE);
    } else {
      // Clear Schedule E if no properties selected
      setScheduleE([
        {
          description: "",
          debtorName: "",
          paymentSchedule: "",
          pastDue: 0,
          originalBalance: 0,
          presentBalance: 0,
          interestRate: 0,
        },
        {
          description: "",
          debtorName: "",
          paymentSchedule: "",
          pastDue: 0,
          originalBalance: 0,
          presentBalance: 0,
          interestRate: 0,
        },
        {
          description: "",
          debtorName: "",
          paymentSchedule: "",
          pastDue: 0,
          originalBalance: 0,
          presentBalance: 0,
          interestRate: 0,
        },
      ]);
    }
  }, [selectedProperties, data]);

  // Track which schedules are auto-filled
  const [autoFilledSchedules, setAutoFilledSchedules] = useState<Set<string>>(
    new Set()
  );

  // Auto-populate Schedule A (Accounts Receivable) from assets
  useEffect(() => {
    if (!data) return;

    const accountsReceivable = data.personalAssets.filter(
      (asset) =>
        asset.category === "Accounts Receivable" &&
        asset.receivableName &&
        asset.dueDate
    );

    if (accountsReceivable.length > 0) {
      const newScheduleA = accountsReceivable.slice(0, 3).map((asset) => ({
        name: asset.receivableName || "",
        amount: asset.value || 0,
        dueDate: asset.dueDate || "",
      }));

      // Fill remaining slots with empty entries
      while (newScheduleA.length < 3) {
        newScheduleA.push({ name: "", amount: 0, dueDate: "" });
      }

      setScheduleA(newScheduleA);
      setAutoFilledSchedules((prev) => {
        const next = new Set(prev);
        next.add("scheduleA");
        return next;
      });
    } else {
      setAutoFilledSchedules((prev) => {
        const next = new Set(prev);
        next.delete("scheduleA");
        return next;
      });
    }
  }, [data]);

  // Auto-populate Schedule B (Notes Receivable) from assets
  useEffect(() => {
    if (!data) return;

    const notesReceivable = data.personalAssets.filter(
      (asset) =>
        asset.category === "Notes Receivable" &&
        asset.receivableName &&
        asset.dueDate
    );

    if (notesReceivable.length > 0) {
      const newScheduleB = notesReceivable.slice(0, 3).map((asset) => ({
        name: asset.receivableName || "",
        amount: asset.value || 0,
        dueDate: asset.dueDate || "",
      }));

      // Fill remaining slots with empty entries
      while (newScheduleB.length < 3) {
        newScheduleB.push({ name: "", amount: 0, dueDate: "" });
      }

      setScheduleB(newScheduleB);
      setAutoFilledSchedules((prev) => {
        const next = new Set(prev);
        next.add("scheduleB");
        return next;
      });
    } else {
      setAutoFilledSchedules((prev) => {
        const next = new Set(prev);
        next.delete("scheduleB");
        return next;
      });
    }
  }, [data]);

  // Auto-populate Schedule G (Accounts Payable) from liabilities
  useEffect(() => {
    if (!data) return;

    const accountsPayable = data.liabilities.filter(
      (liability) =>
        liability.category === "Accounts Payable" &&
        liability.payableTo &&
        liability.dueDate
    );

    if (accountsPayable.length > 0) {
      const newScheduleG = accountsPayable.slice(0, 3).map((liability) => ({
        payableTo: liability.payableTo || "",
        amount: liability.balance || 0,
        dueDate: liability.dueDate || "",
      }));

      // Fill remaining slots with empty entries
      while (newScheduleG.length < 3) {
        newScheduleG.push({ payableTo: "", amount: 0, dueDate: "" });
      }

      setScheduleG(newScheduleG);
      setAutoFilledSchedules((prev) => {
        const next = new Set(prev);
        next.add("scheduleG");
        return next;
      });
    } else {
      setAutoFilledSchedules((prev) => {
        const next = new Set(prev);
        next.delete("scheduleG");
        return next;
      });
    }
  }, [data]);

  // Auto-populate Schedule H (Notes Payable to Others) from liabilities
  useEffect(() => {
    if (!data) return;

    const notesPayable = data.liabilities.filter(
      (liability) =>
        liability.category === "Notes Payable" &&
        liability.payableTo &&
        liability.dueDate
    );

    if (notesPayable.length > 0) {
      const newScheduleH = notesPayable.slice(0, 3).map((liability) => ({
        payableTo: liability.payableTo || "",
        amount: liability.balance || 0,
        dueDate: liability.dueDate || "",
      }));

      // Fill remaining slots with empty entries
      while (newScheduleH.length < 3) {
        newScheduleH.push({ payableTo: "", amount: 0, dueDate: "" });
      }

      setScheduleH(newScheduleH);
      setAutoFilledSchedules((prev) => {
        const next = new Set(prev);
        next.add("scheduleH");
        return next;
      });
    } else {
      setAutoFilledSchedules((prev) => {
        const next = new Set(prev);
        next.delete("scheduleH");
        return next;
      });
    }
  }, [data]);

  // Auto-populate Schedule I (Installment Obligations) from liabilities
  useEffect(() => {
    if (!data) return;

    const installmentObligations = data.liabilities.filter(
      (liability) =>
        liability.category === "Installment Obligations" &&
        liability.payableTo &&
        liability.collateral &&
        liability.finalDueDate &&
        liability.monthlyPayment !== undefined
    );

    if (installmentObligations.length > 0) {
      const newScheduleI = installmentObligations
        .slice(0, 8)
        .map((liability) => ({
          payableTo: liability.payableTo || "",
          collateral: liability.collateral || "",
          balance: liability.balance || 0,
          finalDueDate: liability.finalDueDate || "",
          monthlyPayment: liability.monthlyPayment || 0,
        }));

      // Fill remaining slots with empty entries
      while (newScheduleI.length < 8) {
        newScheduleI.push({
          payableTo: "",
          collateral: "",
          balance: 0,
          finalDueDate: "",
          monthlyPayment: 0,
        });
      }

      setScheduleI(newScheduleI);
      setAutoFilledSchedules((prev) => {
        const next = new Set(prev);
        next.add("scheduleI");
        return next;
      });
    } else {
      setAutoFilledSchedules((prev) => {
        const next = new Set(prev);
        next.delete("scheduleI");
        return next;
      });
    }
  }, [data]);

  // Contingent Liabilities
  const [guaranteedLoans, setGuaranteedLoans] = useState(0);
  const [suretyBonds, setSuretyBonds] = useState(0);
  const [contingentOther, setContingentOther] = useState("");
  const [contingentOtherValue, setContingentOtherValue] = useState(0);

  // Insurance
  const [lifeInsuranceFaceValue, setLifeInsuranceFaceValue] = useState(0);
  const [lifeInsuranceBorrowed, setLifeInsuranceBorrowed] = useState(0);

  // Income
  const [salaryWages, setSalaryWages] = useState(0);
  const [proprietorshipDraws, setProprietorshipDraws] = useState(0);
  const [commissionsBonus, setCommissionsBonus] = useState(0);
  const [dividendsInterest, setDividendsInterest] = useState(0);
  const [rentals, setRentals] = useState(0);
  const [otherIncome, setOtherIncome] = useState(0);

  // Schedules
  const [scheduleA, setScheduleA] = useState<
    Array<{ name: string; amount: number; dueDate: string }>
  >([
    { name: "", amount: 0, dueDate: "" },
    { name: "", amount: 0, dueDate: "" },
    { name: "", amount: 0, dueDate: "" },
  ]);
  const [scheduleB, setScheduleB] = useState<
    Array<{ name: string; amount: number; dueDate: string }>
  >([
    { name: "", amount: 0, dueDate: "" },
    { name: "", amount: 0, dueDate: "" },
    { name: "", amount: 0, dueDate: "" },
  ]);
  const [scheduleC, setScheduleC] = useState<
    Array<{
      registeredName: string;
      shares: number;
      marketPerShare: number;
      totalValue: number;
    }>
  >([
    { registeredName: "", shares: 0, marketPerShare: 0, totalValue: 0 },
    { registeredName: "", shares: 0, marketPerShare: 0, totalValue: 0 },
    { registeredName: "", shares: 0, marketPerShare: 0, totalValue: 0 },
  ]);
  const [scheduleD, setScheduleD] = useState<
    Array<{
      registeredName: string;
      shares: number;
      marketPerShare: number;
      totalValue: number;
    }>
  >([
    { registeredName: "", shares: 0, marketPerShare: 0, totalValue: 0 },
    { registeredName: "", shares: 0, marketPerShare: 0, totalValue: 0 },
    { registeredName: "", shares: 0, marketPerShare: 0, totalValue: 0 },
  ]);
  const [scheduleE, setScheduleE] = useState<
    Array<{
      description: string;
      debtorName: string;
      paymentSchedule: string;
      pastDue: number;
      originalBalance: number;
      presentBalance: number;
      interestRate: number;
    }>
  >([
    {
      description: "",
      debtorName: "",
      paymentSchedule: "",
      pastDue: 0,
      originalBalance: 0,
      presentBalance: 0,
      interestRate: 0,
    },
    {
      description: "",
      debtorName: "",
      paymentSchedule: "",
      pastDue: 0,
      originalBalance: 0,
      presentBalance: 0,
      interestRate: 0,
    },
    {
      description: "",
      debtorName: "",
      paymentSchedule: "",
      pastDue: 0,
      originalBalance: 0,
      presentBalance: 0,
      interestRate: 0,
    },
  ]);
  const [scheduleG, setScheduleG] = useState<
    Array<{ payableTo: string; amount: number; dueDate: string }>
  >([
    { payableTo: "", amount: 0, dueDate: "" },
    { payableTo: "", amount: 0, dueDate: "" },
    { payableTo: "", amount: 0, dueDate: "" },
  ]);
  const [scheduleH, setScheduleH] = useState<
    Array<{ payableTo: string; amount: number; dueDate: string }>
  >([
    { payableTo: "", amount: 0, dueDate: "" },
    { payableTo: "", amount: 0, dueDate: "" },
    { payableTo: "", amount: 0, dueDate: "" },
  ]);
  const [scheduleI, setScheduleI] = useState<
    Array<{
      payableTo: string;
      collateral: string;
      balance: number;
      finalDueDate: string;
      monthlyPayment: number;
    }>
  >([
    {
      payableTo: "",
      collateral: "",
      balance: 0,
      finalDueDate: "",
      monthlyPayment: 0,
    },
    {
      payableTo: "",
      collateral: "",
      balance: 0,
      finalDueDate: "",
      monthlyPayment: 0,
    },
    {
      payableTo: "",
      collateral: "",
      balance: 0,
      finalDueDate: "",
      monthlyPayment: 0,
    },
    {
      payableTo: "",
      collateral: "",
      balance: 0,
      finalDueDate: "",
      monthlyPayment: 0,
    },
    {
      payableTo: "",
      collateral: "",
      balance: 0,
      finalDueDate: "",
      monthlyPayment: 0,
    },
    {
      payableTo: "",
      collateral: "",
      balance: 0,
      finalDueDate: "",
      monthlyPayment: 0,
    },
    {
      payableTo: "",
      collateral: "",
      balance: 0,
      finalDueDate: "",
      monthlyPayment: 0,
    },
    {
      payableTo: "",
      collateral: "",
      balance: 0,
      finalDueDate: "",
      monthlyPayment: 0,
    },
  ]);

  // Filter properties based on search
  const filteredProperties = useMemo(() => {
    if (!data) return [];
    if (!propertySearchQuery) return data.properties;
    return data.properties.filter((property) =>
      property.address.toLowerCase().includes(propertySearchQuery.toLowerCase())
    );
  }, [data, propertySearchQuery]);

  // Select all/none handlers
  const handleSelectAll = () => {
    if (!data) return;
    if (selectedProperties.size === filteredProperties.length) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(filteredProperties.map((p) => p.id)));
    }
  };

  const handleToggleProperty = (propertyId: string) => {
    const newSelected = new Set(selectedProperties);
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId);
    } else {
      newSelected.add(propertyId);
    }
    setSelectedProperties(newSelected);
  };

  // Handle template selection from dropdown
  const handleTemplateSelect = async (templateId: string) => {
    setIsLoadingTemplate(true);
    try {
      const templateBytes = await loadTemplate(templateId);
      if (templateBytes) {
        setPdfTemplate(templateBytes);
        setSelectedTemplateId(templateId);
        toast({
          title: "Template Loaded",
          description: "PDF template has been loaded successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load selected template.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load PDF template.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  // Load available templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        const templates = await getAvailableTemplates();
        // Only show pre-loaded templates (CCCU.pdf)
        const preloadedOnly = templates.filter((t) => t.isPreloaded);
        setAvailableTemplates(preloadedOnly);
        // Auto-select default template if available
        if (preloadedOnly.length > 0 && !selectedTemplateId) {
          const defaultTemplate =
            preloadedOnly.find((t) => t.id === "default") || preloadedOnly[0];
          setSelectedTemplateId(defaultTemplate.id);
          await handleTemplateSelect(defaultTemplate.id);
        }
      } catch (error) {
        console.error("Failed to load templates:", error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    if (!pdfTemplate) {
      toast({
        title: "Template Required",
        description: "Please select a PDF template first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Assemble form data from all state variables
      const selectedPropertiesList =
        data?.properties.filter((p) => selectedProperties.has(p.id)) || [];

      // Prepare selected properties with mortgage data
      const propertiesWithMortgages = selectedPropertiesList.map((property) => {
        const mortgage = data?.mortgages.find(
          (m) => m.propertyId === property.id
        );
        return {
          id: property.id,
          address: property.address,
          propertyType: "Residential", // Default, could be enhanced
          yearAcquired: "", // Not currently tracked in Property type
          originalCost: property.purchasePrice,
          currentValue: property.currentValue,
          ownershipPercentage: property.ownershipPercentage,
          lender: mortgage?.lender,
          balance: mortgage?.principalBalance,
          payment: mortgage?.paymentAmount,
        };
      });

      // Calculate summaries
      const totalAssets =
        cashOnHand +
        cashOtherInstitutions +
        scheduleA.reduce((sum, item) => sum + (item.amount || 0), 0) +
        scheduleB.reduce((sum, item) => sum + (item.amount || 0), 0) +
        buildingMaterialInventory +
        scheduleC.reduce((sum, item) => sum + (item.totalValue || 0), 0) +
        lifeInsuranceCashValue +
        retirementAccounts +
        selectedPropertiesList.reduce(
          (sum, p) => sum + p.currentValue * (p.ownershipPercentage / 100),
          0
        ) +
        automobilesTrucks +
        machineryTools +
        scheduleE.reduce((sum, item) => sum + (item.presentBalance || 0), 0) +
        scheduleD.reduce((sum, item) => sum + (item.totalValue || 0), 0) +
        otherAssetsValue;

      const totalLiabilities =
        scheduleG.reduce((sum, item) => sum + (item.amount || 0), 0) +
        notesPayableRelatives +
        scheduleH.reduce((sum, item) => sum + (item.amount || 0), 0) +
        accruedInterest +
        accruedSalaryWages +
        accruedTaxesOther +
        incomeTaxPayable +
        scheduleI.reduce((sum, item) => sum + (item.balance || 0), 0) +
        selectedPropertiesList.reduce((sum, prop) => {
          const mortgage = data?.mortgages.find(
            (m) => m.propertyId === prop.id
          );
          return sum + (mortgage?.principalBalance || 0);
        }, 0) +
        chattelMortgage +
        otherLiabilitiesValue;

      const formData: PFSFormData = {
        borrowerName,
        cashOnHand,
        cashOtherInstitutions,
        buildingMaterialInventory,
        lifeInsuranceCashValue,
        retirementAccounts,
        automobilesTrucks,
        machineryTools,
        otherAssets,
        otherAssetsValue,
        notesPayableRelatives,
        accruedInterest,
        accruedSalaryWages,
        accruedTaxesOther,
        incomeTaxPayable,
        chattelMortgage,
        otherLiabilities,
        otherLiabilitiesValue,
        guaranteedLoans,
        suretyBonds,
        contingentOther,
        contingentOtherValue,
        insuranceDescription: "", // Not currently in form
        insuranceAmount: 0, // Not currently in form
        lifeInsuranceFaceValue,
        lifeInsuranceBorrowed,
        salaryWages,
        proprietorshipDraws,
        commissionsBonus,
        dividendsInterest,
        rentals,
        otherIncome,
        scheduleA,
        scheduleB,
        scheduleC,
        scheduleD,
        scheduleE,
        scheduleG,
        scheduleH,
        scheduleI,
        selectedProperties: propertiesWithMortgages,
        mortgages: data?.mortgages.map((m) => ({
          propertyId: m.propertyId,
          principalBalance: m.principalBalance,
          paymentAmount: m.paymentAmount,
        })),
        summaries: {
          totalAssets,
          totalLiabilities,
        },
      };

      // Validate form data has some values
      const hasData =
        borrowerName.trim() !== "" ||
        cashOnHand > 0 ||
        cashOtherInstitutions > 0 ||
        scheduleA.some((item) => item.name || item.amount > 0) ||
        selectedPropertiesList.length > 0;

      if (!hasData) {
        toast({
          title: "No Data to Fill",
          description:
            "Please enter some data in the form before generating the PDF.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      // Fill PDF with form data
      console.log("=== Starting PDF Generation ===");
      console.log("Form data sample:", {
        borrowerName,
        cashOnHand,
        scheduleACount: scheduleA.length,
        selectedPropertiesCount: selectedPropertiesList.length,
      });

      const filledPDFBytes = await fillPFSForm(pdfTemplate, formData, {
        flatten: true, // Prevent further editing
        debug: true, // Enable debug logging to console
      });

      // Generate filename with date
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `164PFS_${timestamp}.pdf`;

      // Download PDF
      downloadPDF(filledPDFBytes, filename);

      // Automatically save snapshot
      try {
        const snapshotDate = new Date().toISOString();
        const snapshotName = `PFS Snapshot - ${new Date().toLocaleDateString()}`;
        const netWorth = totalAssets - totalLiabilities;

        // Get template info
        const selectedTemplate = availableTemplates.find(
          (t) => t.id === selectedTemplateId
        );
        const templateId = selectedTemplateId || undefined;
        const templateName = selectedTemplate?.name || undefined;

        await saveSnapshot({
          userId: "current-user", // TODO: Get from auth
          snapshotName,
          snapshotDate,
          templateId,
          templateName,
          formData,
          totals: {
            totalAssets,
            totalLiabilities,
            netWorth,
          },
          isOutdated: false,
          notes: `Auto-saved when PDF was generated: ${filename}`,
        });

        console.log("Snapshot saved successfully");
      } catch (snapshotError) {
        console.error("Error saving snapshot:", snapshotError);
        // Don't fail the PDF generation if snapshot save fails
      }

      toast({
        title: "PDF Generated Successfully",
        description: `Your PFS has been generated and downloaded as ${filename}`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error Generating PDF",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while generating the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
              : "Failed to load financial data. Please check your Airtable configuration."}
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            Please configure Airtable or add data to your base.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const selectedPropertiesList = data.properties.filter((p) =>
    selectedProperties.has(p.id)
  );
  const selectedPropertiesValue = selectedPropertiesList.reduce(
    (sum, p) => sum + p.currentValue * (p.ownershipPercentage / 100),
    0
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Generate PFS
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure and generate your Personal Financial Statement
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Select
              value={selectedTemplateId || ""}
              onValueChange={handleTemplateSelect}
              disabled={isLoadingTemplates || isLoadingTemplate || isGenerating}
            >
              <SelectTrigger id="template-select" className="w-[200px]">
                <SelectValue placeholder="Select template..." />
              </SelectTrigger>
              <SelectContent>
                {availableTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || isLoadingTemplate}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate PFS
                </>
              )}
            </Button>
          </div>
        </div>

        {!selectedTemplateId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>PDF Template Required</AlertTitle>
            <AlertDescription>
              Please select a PDF template from the dropdown above before
              generating the statement.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="properties" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Properties</CardTitle>
                <CardDescription>
                  Choose which properties to include in your PFS statement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Select All */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search properties..."
                      className="pl-10"
                      value={propertySearchQuery}
                      onChange={(e) => setPropertySearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSelectAll}
                    className="flex items-center gap-2"
                  >
                    {selectedProperties.size === filteredProperties.length &&
                    filteredProperties.length > 0 ? (
                      <>
                        <Square className="h-4 w-4" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4" />
                        Select All
                      </>
                    )}
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {selectedProperties.size} of {filteredProperties.length}{" "}
                    selected
                  </div>
                </div>

                <Separator />

                {/* Properties List */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredProperties.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {propertySearchQuery
                        ? "No properties match your search."
                        : "No properties available."}
                    </p>
                  ) : (
                    filteredProperties.map((property) => {
                      const mortgage = data.mortgages.find(
                        (m) => m.propertyId === property.id
                      );
                      const isSelected = selectedProperties.has(property.id);
                      return (
                        <div
                          key={property.id}
                          className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                            isSelected
                              ? "bg-primary/5 border-primary"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              handleToggleProperty(property.id)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">
                              {property.address}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Value:{" "}
                              {formatCurrencyDisplay(property.currentValue)} •
                              Ownership: {property.ownershipPercentage}% •
                              {mortgage
                                ? `Mortgage: ${formatCurrencyDisplay(
                                    mortgage.principalBalance
                                  )}`
                                : "No Mortgage"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatCurrencyDisplay(
                                property.currentValue *
                                  (property.ownershipPercentage / 100)
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Included Value
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedProperties.size > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                      <span className="font-medium">
                        Total Selected Properties Value:
                      </span>
                      <span className="text-xl font-bold">
                        {formatCurrencyDisplay(selectedPropertiesValue)}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Borrower/Guarantor information for the PFS statement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="borrower-name">Borrower/Guarantor Name</Label>
                  <Input
                    id="borrower-name"
                    placeholder="Enter name"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income for Year to Date</CardTitle>
                <CardDescription>Annual income sources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="salary-wages">Salary or Wages</Label>
                    <Input
                      id="salary-wages"
                      type="number"
                      placeholder="0"
                      value={salaryWages || ""}
                      onChange={(e) =>
                        setSalaryWages(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proprietorship-draws">
                      Proprietorship/Partnership Draws
                    </Label>
                    <Input
                      id="proprietorship-draws"
                      type="number"
                      placeholder="0"
                      value={proprietorshipDraws || ""}
                      onChange={(e) =>
                        setProprietorshipDraws(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commissions">Commissions and Bonus</Label>
                    <Input
                      id="commissions"
                      type="number"
                      placeholder="0"
                      value={commissionsBonus || ""}
                      onChange={(e) =>
                        setCommissionsBonus(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dividends-interest">
                      Dividends and Interest
                    </Label>
                    <Input
                      id="dividends-interest"
                      type="number"
                      placeholder="0"
                      value={dividendsInterest || ""}
                      onChange={(e) =>
                        setDividendsInterest(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rentals">Rentals</Label>
                    <Input
                      id="rentals"
                      type="number"
                      placeholder="0"
                      value={rentals || ""}
                      onChange={(e) => setRentals(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="other-income">Other</Label>
                    <Input
                      id="other-income"
                      type="number"
                      placeholder="0"
                      value={otherIncome || ""}
                      onChange={(e) =>
                        setOtherIncome(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Total Net Income:</span>
                  <span className="text-xl font-bold">
                    {formatCurrencyDisplay(
                      salaryWages +
                        proprietorshipDraws +
                        commissionsBonus +
                        dividendsInterest +
                        rentals +
                        otherIncome
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Current Assets</CardTitle>
                  <AutoFilledIndicator source="Assets & Liabilities page - Personal Assets table" />
                </div>
                <CardDescription>Liquid and short-term assets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="cash-on-hand">
                        Cash on Hand and in Banks
                      </Label>
                      {autoPopulatedFields.has("cashOnHand") && (
                        <Badge variant="secondary" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          Auto-filled
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="cash-on-hand"
                      type="number"
                      placeholder="0"
                      value={cashOnHand || ""}
                      onChange={(e) => {
                        setCashOnHand(Number(e.target.value) || 0);
                        setAutoPopulatedFields((prev) => {
                          const next = new Set(prev);
                          next.delete("cashOnHand");
                          return next;
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="cash-other">
                        Cash in Other Institutions
                      </Label>
                      {autoPopulatedFields.has("cashOtherInstitutions") && (
                        <Badge variant="secondary" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          Auto-filled
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="cash-other"
                      type="number"
                      placeholder="0"
                      value={cashOtherInstitutions || ""}
                      onChange={(e) => {
                        setCashOtherInstitutions(Number(e.target.value) || 0);
                        setAutoPopulatedFields((prev) => {
                          const next = new Set(prev);
                          next.delete("cashOtherInstitutions");
                          return next;
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="building-inventory">
                        Building Material Inventory
                      </Label>
                      {autoPopulatedFields.has("buildingMaterialInventory") && (
                        <Badge variant="secondary" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          Auto-filled
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="building-inventory"
                      type="number"
                      placeholder="0"
                      value={buildingMaterialInventory || ""}
                      onChange={(e) => {
                        setBuildingMaterialInventory(
                          Number(e.target.value) || 0
                        );
                        setAutoPopulatedFields((prev) => {
                          const next = new Set(prev);
                          next.delete("buildingMaterialInventory");
                          return next;
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="life-insurance-cash">
                        Cash Surrender Value of Life Insurance
                      </Label>
                      {autoPopulatedFields.has("lifeInsuranceCashValue") && (
                        <Badge variant="secondary" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          Auto-filled
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="life-insurance-cash"
                      type="number"
                      placeholder="0"
                      value={lifeInsuranceCashValue || ""}
                      onChange={(e) => {
                        setLifeInsuranceCashValue(Number(e.target.value) || 0);
                        setAutoPopulatedFields((prev) => {
                          const next = new Set(prev);
                          next.delete("lifeInsuranceCashValue");
                          return next;
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="retirement-accounts">
                        Retirement Accounts
                      </Label>
                      {autoPopulatedFields.has("retirementAccounts") && (
                        <Badge variant="secondary" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          Auto-filled
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="retirement-accounts"
                      type="number"
                      placeholder="0"
                      value={retirementAccounts || ""}
                      onChange={(e) => {
                        setRetirementAccounts(Number(e.target.value) || 0);
                        setAutoPopulatedFields((prev) => {
                          const next = new Set(prev);
                          next.delete("retirementAccounts");
                          return next;
                        });
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground italic">
                  * Accounts Receivable (Schedule A), Notes Receivable (Schedule
                  B), and Listed Stocks/Bonds (Schedule C) are configured in the
                  Schedules tab.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Other Assets</CardTitle>
                  <AutoFilledIndicator source="Assets & Liabilities page - Personal Assets table" />
                </div>
                <CardDescription>Long-term and other assets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="automobiles">
                        Automobiles and Trucks
                      </Label>
                      {autoPopulatedFields.has("automobilesTrucks") && (
                        <Badge variant="secondary" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          Auto-filled
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="automobiles"
                      type="number"
                      placeholder="0"
                      value={automobilesTrucks || ""}
                      onChange={(e) => {
                        setAutomobilesTrucks(Number(e.target.value) || 0);
                        setAutoPopulatedFields((prev) => {
                          const next = new Set(prev);
                          next.delete("automobilesTrucks");
                          return next;
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="machinery">Machinery and Tools</Label>
                      {autoPopulatedFields.has("machineryTools") && (
                        <Badge variant="secondary" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          Auto-filled
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="machinery"
                      type="number"
                      placeholder="0"
                      value={machineryTools || ""}
                      onChange={(e) => {
                        setMachineryTools(Number(e.target.value) || 0);
                        setAutoPopulatedFields((prev) => {
                          const next = new Set(prev);
                          next.delete("machineryTools");
                          return next;
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="other-assets-desc">
                      Other Assets - Description
                    </Label>
                    <Input
                      id="other-assets-desc"
                      placeholder="Describe other assets"
                      value={otherAssets}
                      onChange={(e) => setOtherAssets(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="other-assets-value">
                      Other Assets - Value
                    </Label>
                    <Input
                      id="other-assets-value"
                      type="number"
                      placeholder="0"
                      value={otherAssetsValue || ""}
                      onChange={(e) =>
                        setOtherAssetsValue(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground italic">
                  * Real Estate (Schedule F), Contracts & Mortgages Receivable
                  (Schedule E), and Unlisted Stocks/Bonds (Schedule D) are
                  configured in the Schedules tab.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Liabilities Tab */}
          <TabsContent value="liabilities" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Current Liabilities</CardTitle>
                  <AutoFilledIndicator source="Assets & Liabilities page - Liabilities table" />
                </div>
                <CardDescription>Short-term obligations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="notes-relatives">
                        Notes Payable to Relatives and Friends
                      </Label>
                      {autoPopulatedFields.has("notesPayableRelatives") && (
                        <Badge variant="secondary" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          Auto-filled
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="notes-relatives"
                      type="number"
                      placeholder="0"
                      value={notesPayableRelatives || ""}
                      onChange={(e) => {
                        setNotesPayableRelatives(Number(e.target.value) || 0);
                        setAutoPopulatedFields((prev) => {
                          const next = new Set(prev);
                          next.delete("notesPayableRelatives");
                          return next;
                        });
                      }}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Accrued Current Liabilities
                  </Label>
                  <div className="grid gap-4 md:grid-cols-2 pl-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="accrued-interest">a. Interest</Label>
                        {autoPopulatedFields.has("accruedInterest") && (
                          <Badge variant="secondary" className="text-xs">
                            <Database className="h-3 w-3 mr-1" />
                            Auto-filled
                          </Badge>
                        )}
                      </div>
                      <Input
                        id="accrued-interest"
                        type="number"
                        placeholder="0"
                        value={accruedInterest || ""}
                        onChange={(e) => {
                          setAccruedInterest(Number(e.target.value) || 0);
                          setAutoPopulatedFields((prev) => {
                            const next = new Set(prev);
                            next.delete("accruedInterest");
                            return next;
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="accrued-salary">
                          b. Salary and Wages
                        </Label>
                        {autoPopulatedFields.has("accruedSalaryWages") && (
                          <Badge variant="secondary" className="text-xs">
                            <Database className="h-3 w-3 mr-1" />
                            Auto-filled
                          </Badge>
                        )}
                      </div>
                      <Input
                        id="accrued-salary"
                        type="number"
                        placeholder="0"
                        value={accruedSalaryWages || ""}
                        onChange={(e) => {
                          setAccruedSalaryWages(Number(e.target.value) || 0);
                          setAutoPopulatedFields((prev) => {
                            const next = new Set(prev);
                            next.delete("accruedSalaryWages");
                            return next;
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="accrued-taxes">
                          c. Taxes, other than Income
                        </Label>
                        {autoPopulatedFields.has("accruedTaxesOther") && (
                          <Badge variant="secondary" className="text-xs">
                            <Database className="h-3 w-3 mr-1" />
                            Auto-filled
                          </Badge>
                        )}
                      </div>
                      <Input
                        id="accrued-taxes"
                        type="number"
                        placeholder="0"
                        value={accruedTaxesOther || ""}
                        onChange={(e) => {
                          setAccruedTaxesOther(Number(e.target.value) || 0);
                          setAutoPopulatedFields((prev) => {
                            const next = new Set(prev);
                            next.delete("accruedTaxesOther");
                            return next;
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="income-tax">
                          d. Income Tax Payable
                        </Label>
                        {autoPopulatedFields.has("incomeTaxPayable") && (
                          <Badge variant="secondary" className="text-xs">
                            <Database className="h-3 w-3 mr-1" />
                            Auto-filled
                          </Badge>
                        )}
                      </div>
                      <Input
                        id="income-tax"
                        type="number"
                        placeholder="0"
                        value={incomeTaxPayable || ""}
                        onChange={(e) => {
                          setIncomeTaxPayable(Number(e.target.value) || 0);
                          setAutoPopulatedFields((prev) => {
                            const next = new Set(prev);
                            next.delete("incomeTaxPayable");
                            return next;
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground italic">
                  * Open Accounts Payable (Schedule G), Notes Payable to Others
                  (Schedule H), and Installment Obligations (Schedule I) are
                  configured in the Schedules tab.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Other Liabilities</CardTitle>
                  <AutoFilledIndicator source="Assets & Liabilities page - Liabilities table" />
                </div>
                <CardDescription>Long-term obligations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="chattel-mortgage">
                        Chattel Mortgage and Contract on Equipment
                      </Label>
                      {autoPopulatedFields.has("chattelMortgage") && (
                        <Badge variant="secondary" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          Auto-filled
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="chattel-mortgage"
                      type="number"
                      placeholder="0"
                      value={chattelMortgage || ""}
                      onChange={(e) => {
                        setChattelMortgage(Number(e.target.value) || 0);
                        setAutoPopulatedFields((prev) => {
                          const next = new Set(prev);
                          next.delete("chattelMortgage");
                          return next;
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="other-liabilities-desc">
                      Other Liabilities - Describe
                    </Label>
                    <Input
                      id="other-liabilities-desc"
                      placeholder="Describe other liabilities"
                      value={otherLiabilities}
                      onChange={(e) => setOtherLiabilities(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="other-liabilities-value">
                      Other Liabilities - Value
                    </Label>
                    <Input
                      id="other-liabilities-value"
                      type="number"
                      placeholder="0"
                      value={otherLiabilitiesValue || ""}
                      onChange={(e) =>
                        setOtherLiabilitiesValue(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground italic">
                  * Real Estate Mortgages (Schedule F) are configured in the
                  Schedules tab.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Contingent Liabilities</CardTitle>
                  <AutoFilledIndicator source="Assets & Liabilities page - Liabilities table (Guaranteed Loan, Surety Bond categories)" />
                </div>
                <CardDescription>
                  Guarantees and other contingent obligations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="guaranteed-loans">
                        Guaranteed or Cosigned Loans or Paper
                      </Label>
                      {autoPopulatedFields.has("guaranteedLoans") && (
                        <Badge variant="secondary" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          Auto-filled
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="guaranteed-loans"
                      type="number"
                      placeholder="0"
                      value={guaranteedLoans || ""}
                      onChange={(e) => {
                        setGuaranteedLoans(Number(e.target.value) || 0);
                        setAutoPopulatedFields((prev) => {
                          const next = new Set(prev);
                          next.delete("guaranteedLoans");
                          return next;
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="surety-bonds">Surety Bonds</Label>
                      {autoPopulatedFields.has("suretyBonds") && (
                        <Badge variant="secondary" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          Auto-filled
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="surety-bonds"
                      type="number"
                      placeholder="0"
                      value={suretyBonds || ""}
                      onChange={(e) => {
                        setSuretyBonds(Number(e.target.value) || 0);
                        setAutoPopulatedFields((prev) => {
                          const next = new Set(prev);
                          next.delete("suretyBonds");
                          return next;
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="contingent-other-desc">
                      Other - Describe
                    </Label>
                    <Input
                      id="contingent-other-desc"
                      placeholder="Describe other contingent liabilities"
                      value={contingentOther}
                      onChange={(e) => setContingentOther(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contingent-other-value">
                      Other - Value
                    </Label>
                    <Input
                      id="contingent-other-value"
                      type="number"
                      placeholder="0"
                      value={contingentOtherValue || ""}
                      onChange={(e) =>
                        setContingentOtherValue(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insurance</CardTitle>
                <CardDescription>Life insurance details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="life-face-value">
                      Life Insurance - Face Value
                    </Label>
                    <Input
                      id="life-face-value"
                      type="number"
                      placeholder="0"
                      value={lifeInsuranceFaceValue || ""}
                      onChange={(e) =>
                        setLifeInsuranceFaceValue(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="life-borrowed">Less Amount Borrowed</Label>
                    <Input
                      id="life-borrowed"
                      type="number"
                      placeholder="0"
                      value={lifeInsuranceBorrowed || ""}
                      onChange={(e) =>
                        setLifeInsuranceBorrowed(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Schedule A - Accounts Receivable</CardTitle>
                  {autoFilledSchedules.has("scheduleA") && (
                    <>
                      <AutoFilledIndicator source="Assets & Liabilities page - Personal Assets (Accounts Receivable category)" />
                      <Badge variant="secondary" className="text-xs">
                        {
                          data.personalAssets.filter(
                            (a) =>
                              a.category === "Accounts Receivable" &&
                              a.receivableName &&
                              a.dueDate
                          ).length
                        }{" "}
                        {data.personalAssets.filter(
                          (a) =>
                            a.category === "Accounts Receivable" &&
                            a.receivableName &&
                            a.dueDate
                        ).length === 1
                          ? "entry"
                          : "entries"}{" "}
                        auto-filled
                      </Badge>
                    </>
                  )}
                </div>
                <CardDescription>
                  Outstanding accounts receivable
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduleA.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-4 md:grid-cols-3 border-b pb-4 last:border-0"
                    >
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          placeholder="Name"
                          value={item.name}
                          onChange={(e) => {
                            const newSchedule = [...scheduleA];
                            newSchedule[index].name = e.target.value;
                            setScheduleA(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.amount || ""}
                          onChange={(e) => {
                            const newSchedule = [...scheduleA];
                            newSchedule[index].amount =
                              Number(e.target.value) || 0;
                            setScheduleA(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={item.dueDate}
                          onChange={(e) => {
                            const newSchedule = [...scheduleA];
                            newSchedule[index].dueDate = e.target.value;
                            setScheduleA(newSchedule);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Schedule B - Notes Receivable</CardTitle>
                  {autoFilledSchedules.has("scheduleB") && (
                    <>
                      <AutoFilledIndicator source="Assets & Liabilities page - Personal Assets (Notes Receivable category)" />
                      <Badge variant="secondary" className="text-xs">
                        {
                          data.personalAssets.filter(
                            (a) =>
                              a.category === "Notes Receivable" &&
                              a.receivableName &&
                              a.dueDate
                          ).length
                        }{" "}
                        {data.personalAssets.filter(
                          (a) =>
                            a.category === "Notes Receivable" &&
                            a.receivableName &&
                            a.dueDate
                        ).length === 1
                          ? "entry"
                          : "entries"}{" "}
                        auto-filled
                      </Badge>
                    </>
                  )}
                </div>
                <CardDescription>Outstanding notes receivable</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduleB.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-4 md:grid-cols-3 border-b pb-4 last:border-0"
                    >
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          placeholder="Name"
                          value={item.name}
                          onChange={(e) => {
                            const newSchedule = [...scheduleB];
                            newSchedule[index].name = e.target.value;
                            setScheduleB(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.amount || ""}
                          onChange={(e) => {
                            const newSchedule = [...scheduleB];
                            newSchedule[index].amount =
                              Number(e.target.value) || 0;
                            setScheduleB(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={item.dueDate}
                          onChange={(e) => {
                            const newSchedule = [...scheduleB];
                            newSchedule[index].dueDate = e.target.value;
                            setScheduleB(newSchedule);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule C - Listed Stocks and Bonds</CardTitle>
                <CardDescription>Publicly traded securities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduleC.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-4 md:grid-cols-4 border-b pb-4 last:border-0"
                    >
                      <div className="space-y-2">
                        <Label>Registered Name</Label>
                        <Input
                          placeholder="Name"
                          value={item.registeredName}
                          onChange={(e) => {
                            const newSchedule = [...scheduleC];
                            newSchedule[index].registeredName = e.target.value;
                            setScheduleC(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Number of Shares</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.shares || ""}
                          onChange={(e) => {
                            const newSchedule = [...scheduleC];
                            newSchedule[index].shares =
                              Number(e.target.value) || 0;
                            setScheduleC(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Market per Share</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.marketPerShare || ""}
                          onChange={(e) => {
                            const newSchedule = [...scheduleC];
                            newSchedule[index].marketPerShare =
                              Number(e.target.value) || 0;
                            newSchedule[index].totalValue =
                              newSchedule[index].shares *
                              newSchedule[index].marketPerShare;
                            setScheduleC(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total Market Value</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.totalValue || ""}
                          onChange={(e) => {
                            const newSchedule = [...scheduleC];
                            newSchedule[index].totalValue =
                              Number(e.target.value) || 0;
                            setScheduleC(newSchedule);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule D - Unlisted Stocks and Bonds</CardTitle>
                <CardDescription>Privately held securities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduleD.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-4 md:grid-cols-4 border-b pb-4 last:border-0"
                    >
                      <div className="space-y-2">
                        <Label>Registered Name</Label>
                        <Input
                          placeholder="Name"
                          value={item.registeredName}
                          onChange={(e) => {
                            const newSchedule = [...scheduleD];
                            newSchedule[index].registeredName = e.target.value;
                            setScheduleD(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Number of Shares</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.shares || ""}
                          onChange={(e) => {
                            const newSchedule = [...scheduleD];
                            newSchedule[index].shares =
                              Number(e.target.value) || 0;
                            setScheduleD(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Market per Share</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.marketPerShare || ""}
                          onChange={(e) => {
                            const newSchedule = [...scheduleD];
                            newSchedule[index].marketPerShare =
                              Number(e.target.value) || 0;
                            newSchedule[index].totalValue =
                              newSchedule[index].shares *
                              newSchedule[index].marketPerShare;
                            setScheduleD(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total Market Value</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.totalValue || ""}
                          onChange={(e) => {
                            const newSchedule = [...scheduleD];
                            newSchedule[index].totalValue =
                              Number(e.target.value) || 0;
                            setScheduleD(newSchedule);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>
                    Schedule E - Contracts and Mortgages Receivable
                  </CardTitle>
                  <AutoFilledIndicator source="Properties page - Selected properties with Schedule E data" />
                  {selectedPropertiesList.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {Math.min(selectedPropertiesList.length, 3)}{" "}
                      {Math.min(selectedPropertiesList.length, 3) === 1
                        ? "property"
                        : "properties"}{" "}
                      auto-filled
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Outstanding contracts and mortgages you are owed.
                  Automatically populated from selected properties.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPropertiesList.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Select properties in the Properties tab to auto-populate
                    Schedule E.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {scheduleE.map((item, index) => (
                      <div
                        key={index}
                        className="grid gap-4 md:grid-cols-7 border-b pb-4 last:border-0"
                      >
                        <div className="space-y-2">
                          <Label>Description of Property</Label>
                          <Input
                            placeholder="Property description"
                            value={item.description}
                            onChange={(e) => {
                              const newSchedule = [...scheduleE];
                              newSchedule[index].description = e.target.value;
                              setScheduleE(newSchedule);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Name of Debtor</Label>
                          <Input
                            placeholder="Debtor name"
                            value={item.debtorName}
                            onChange={(e) => {
                              const newSchedule = [...scheduleE];
                              newSchedule[index].debtorName = e.target.value;
                              setScheduleE(newSchedule);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Schedule</Label>
                          <Input
                            placeholder="Schedule"
                            value={item.paymentSchedule}
                            onChange={(e) => {
                              const newSchedule = [...scheduleE];
                              newSchedule[index].paymentSchedule =
                                e.target.value;
                              setScheduleE(newSchedule);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Amount Past Due</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.pastDue || ""}
                            onChange={(e) => {
                              const newSchedule = [...scheduleE];
                              newSchedule[index].pastDue =
                                Number(e.target.value) || 0;
                              setScheduleE(newSchedule);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Original Balance</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.originalBalance || ""}
                            onChange={(e) => {
                              const newSchedule = [...scheduleE];
                              newSchedule[index].originalBalance =
                                Number(e.target.value) || 0;
                              setScheduleE(newSchedule);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Present Balance</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.presentBalance || ""}
                            onChange={(e) => {
                              const newSchedule = [...scheduleE];
                              newSchedule[index].presentBalance =
                                Number(e.target.value) || 0;
                              setScheduleE(newSchedule);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Interest Rate (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={item.interestRate || ""}
                            onChange={(e) => {
                              const newSchedule = [...scheduleE];
                              newSchedule[index].interestRate =
                                Number(e.target.value) || 0;
                              setScheduleE(newSchedule);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Schedule F - Real Estate</CardTitle>
                  <AutoFilledIndicator source="Properties page - Selected properties" />
                </div>
                <CardDescription>
                  Real estate properties (automatically populated from selected
                  properties)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPropertiesList.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Select properties in the Properties tab to see them listed
                    here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {selectedPropertiesList.map((property) => {
                      const mortgage = data.mortgages.find(
                        (m) => m.propertyId === property.id
                      );
                      return (
                        <div
                          key={property.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="font-medium mb-2">
                            {property.address}
                          </div>
                          <div className="grid gap-4 md:grid-cols-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Current Value:
                              </span>
                              <div className="font-semibold">
                                {formatCurrencyDisplay(property.currentValue)}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Ownership:
                              </span>
                              <div className="font-semibold">
                                {property.ownershipPercentage}%
                              </div>
                            </div>
                            {mortgage && (
                              <>
                                <div>
                                  <span className="text-muted-foreground">
                                    Mortgage Balance:
                                  </span>
                                  <div className="font-semibold">
                                    {formatCurrencyDisplay(
                                      mortgage.principalBalance
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Monthly Payment:
                                  </span>
                                  <div className="font-semibold">
                                    {formatCurrencyDisplay(
                                      mortgage.paymentAmount
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Schedule G - Open Accounts Payable</CardTitle>
                  {autoFilledSchedules.has("scheduleG") && (
                    <>
                      <AutoFilledIndicator source="Assets & Liabilities page - Liabilities (Accounts Payable category)" />
                      <Badge variant="secondary" className="text-xs">
                        {
                          data.liabilities.filter(
                            (l) =>
                              l.category === "Accounts Payable" &&
                              l.payableTo &&
                              l.dueDate
                          ).length
                        }{" "}
                        {data.liabilities.filter(
                          (l) =>
                            l.category === "Accounts Payable" &&
                            l.payableTo &&
                            l.dueDate
                        ).length === 1
                          ? "entry"
                          : "entries"}{" "}
                        auto-filled
                      </Badge>
                    </>
                  )}
                </div>
                <CardDescription>Outstanding accounts payable</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduleG.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-4 md:grid-cols-3 border-b pb-4 last:border-0"
                    >
                      <div className="space-y-2">
                        <Label>Payable to</Label>
                        <Input
                          placeholder="Name"
                          value={item.payableTo}
                          onChange={(e) => {
                            const newSchedule = [...scheduleG];
                            newSchedule[index].payableTo = e.target.value;
                            setScheduleG(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.amount || ""}
                          onChange={(e) => {
                            const newSchedule = [...scheduleG];
                            newSchedule[index].amount =
                              Number(e.target.value) || 0;
                            setScheduleG(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={item.dueDate}
                          onChange={(e) => {
                            const newSchedule = [...scheduleG];
                            newSchedule[index].dueDate = e.target.value;
                            setScheduleG(newSchedule);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Schedule H - Notes Payable to Others</CardTitle>
                  {autoFilledSchedules.has("scheduleH") && (
                    <>
                      <AutoFilledIndicator source="Assets & Liabilities page - Liabilities (Notes Payable category)" />
                      <Badge variant="secondary" className="text-xs">
                        {
                          data.liabilities.filter(
                            (l) =>
                              l.category === "Notes Payable" &&
                              l.payableTo &&
                              l.dueDate
                          ).length
                        }{" "}
                        {data.liabilities.filter(
                          (l) =>
                            l.category === "Notes Payable" &&
                            l.payableTo &&
                            l.dueDate
                        ).length === 1
                          ? "entry"
                          : "entries"}{" "}
                        auto-filled
                      </Badge>
                    </>
                  )}
                </div>
                <CardDescription>Outstanding notes payable</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduleH.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-4 md:grid-cols-3 border-b pb-4 last:border-0"
                    >
                      <div className="space-y-2">
                        <Label>Payable to</Label>
                        <Input
                          placeholder="Name"
                          value={item.payableTo}
                          onChange={(e) => {
                            const newSchedule = [...scheduleH];
                            newSchedule[index].payableTo = e.target.value;
                            setScheduleH(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.amount || ""}
                          onChange={(e) => {
                            const newSchedule = [...scheduleH];
                            newSchedule[index].amount =
                              Number(e.target.value) || 0;
                            setScheduleH(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={item.dueDate}
                          onChange={(e) => {
                            const newSchedule = [...scheduleH];
                            newSchedule[index].dueDate = e.target.value;
                            setScheduleH(newSchedule);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Schedule I - Installment Obligations</CardTitle>
                  {autoFilledSchedules.has("scheduleI") && (
                    <>
                      <AutoFilledIndicator source="Assets & Liabilities page - Liabilities (Installment Obligations category)" />
                      <Badge variant="secondary" className="text-xs">
                        {
                          data.liabilities.filter(
                            (l) =>
                              l.category === "Installment Obligations" &&
                              l.payableTo &&
                              l.collateral &&
                              l.finalDueDate &&
                              l.monthlyPayment !== undefined
                          ).length
                        }{" "}
                        {data.liabilities.filter(
                          (l) =>
                            l.category === "Installment Obligations" &&
                            l.payableTo &&
                            l.collateral &&
                            l.finalDueDate &&
                            l.monthlyPayment !== undefined
                        ).length === 1
                          ? "entry"
                          : "entries"}{" "}
                        auto-filled
                      </Badge>
                    </>
                  )}
                </div>
                <CardDescription>
                  Installment payment obligations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduleI.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-4 md:grid-cols-5 border-b pb-4 last:border-0"
                    >
                      <div className="space-y-2">
                        <Label>Payable to</Label>
                        <Input
                          placeholder="Name"
                          value={item.payableTo}
                          onChange={(e) => {
                            const newSchedule = [...scheduleI];
                            newSchedule[index].payableTo = e.target.value;
                            setScheduleI(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Collateral</Label>
                        <Input
                          placeholder="Collateral description"
                          value={item.collateral}
                          onChange={(e) => {
                            const newSchedule = [...scheduleI];
                            newSchedule[index].collateral = e.target.value;
                            setScheduleI(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Balance</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.balance || ""}
                          onChange={(e) => {
                            const newSchedule = [...scheduleI];
                            newSchedule[index].balance =
                              Number(e.target.value) || 0;
                            setScheduleI(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Final Due Date</Label>
                        <Input
                          type="date"
                          value={item.finalDueDate}
                          onChange={(e) => {
                            const newSchedule = [...scheduleI];
                            newSchedule[index].finalDueDate = e.target.value;
                            setScheduleI(newSchedule);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Monthly Payment</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.monthlyPayment || ""}
                          onChange={(e) => {
                            const newSchedule = [...scheduleI];
                            newSchedule[index].monthlyPayment =
                              Number(e.target.value) || 0;
                            setScheduleI(newSchedule);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
