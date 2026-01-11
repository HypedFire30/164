import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Building2, Search, CheckSquare, Square, ChevronRight, ChevronLeft, Check, X, Calculator } from "lucide-react";
import { usePFSData } from "@/hooks/usePFSData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/domain/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { generatePropertyMockData } from "@/lib/mock-data/generators";

const formatCurrencyDisplay = (amount: number) => {
  return formatCurrency(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function GenerateScheduleE() {
  const navigate = useNavigate();
  const { data, isLoading, error } = usePFSData();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));
  const totalSteps = 3;
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [taxYear, setTaxYear] = useState(2026);
  
  // Check if a step is completed
  const isStepCompleted = (step: number): boolean => {
    // Only check completion for steps that have been visited
    if (!visitedSteps.has(step)) {
      return false;
    }
    
    switch (step) {
      case 1:
        return selectedProperties.size > 0;
      case 2:
        return selectedProperties.size > 0; // Must have selected properties
      case 3:
        return selectedProperties.size > 0; // Must have selected properties
      default:
        return false;
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
              : "Failed to load properties. Please check your configuration."}
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
            Please add properties to generate Schedule E.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const { properties } = data;

  // Enrich properties with calculated values if missing monthlyRentalIncome
  const enrichedProperties = useMemo(() => {
    return properties.map(property => {
      // If property doesn't have monthlyRentalIncome, calculate from mock data
      if (!property.monthlyRentalIncome) {
        // Generate mock data to get realistic values
        const mockData = generatePropertyMockData(property);
        return {
          ...property,
          monthlyRentalIncome: mockData.totals.monthlyRentalIncome || property.currentValue * 0.0083, // 1% annual / 12
          monthlyExpenses: property.monthlyExpenses || (mockData.totals.monthlyRentalIncome * 0.3) || (property.currentValue * 0.0025), // 30% expense ratio
        };
      }
      return {
        ...property,
        monthlyExpenses: property.monthlyExpenses || (property.monthlyRentalIncome * 0.3), // Default 30% expense ratio
      };
    });
  }, [properties]);

  // Filter properties by search query
  const filteredProperties = enrichedProperties.filter((property) =>
    property.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle property selection
  const toggleProperty = (propertyId: string) => {
    setSelectedProperties((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  // Select all / Deselect all
  const toggleAll = () => {
    if (selectedProperties.size === filteredProperties.length) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(filteredProperties.map((p) => p.id)));
    }
  };

  // Calculate Schedule E values for each selected property
  const scheduleEData = enrichedProperties
    .filter((p) => selectedProperties.has(p.id))
    .map((property) => {
      const monthlyRentalIncome = property.monthlyRentalIncome || 0;
      const monthlyExpenses = property.monthlyExpenses || 0;
      
      const annualRentalIncome = monthlyRentalIncome * 12;
      const annualExpenses = monthlyExpenses * 12;
      
      // Depreciation (simplified - typically 27.5 years for residential, 39 years for commercial)
      const propertyType = "Residential"; // TODO: Get from property
      const depreciationPeriod = propertyType === "Residential" ? 27.5 : 39;
      const depreciableBasis = property.purchasePrice || 0;
      const landValue = depreciableBasis * 0.2; // Assume 20% is land (not depreciable)
      const buildingValue = depreciableBasis - landValue;
      const depreciation = buildingValue / depreciationPeriod;
      const netIncome = annualRentalIncome - annualExpenses - depreciation;
      
      return {
        property,
        propertyAddress: property.address,
        rentalIncome: annualRentalIncome,
        expenses: annualExpenses,
        depreciation,
        netIncome,
      };
    });

  const totals = {
    totalRentalIncome: scheduleEData.reduce((sum, p) => sum + p.rentalIncome, 0),
    totalExpenses: scheduleEData.reduce((sum, p) => sum + p.expenses, 0),
    totalDepreciation: scheduleEData.reduce((sum, p) => sum + p.depreciation, 0),
    totalNetIncome: scheduleEData.reduce((sum, p) => sum + p.netIncome, 0),
  };

  const handleGenerate = () => {
    if (selectedProperties.size === 0) {
      toast({
        title: "No Properties Selected",
        description: "Please select at least one property to generate Schedule E.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Generate PDF
    console.log("Generating Schedule E PDF for properties:", Array.from(selectedProperties));
    toast({
      title: "Schedule E Generated",
      description: "Schedule E PDF has been generated successfully.",
    });
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

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
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
              Generate Schedule E (Rental Income)
            </h1>
            <p className="text-muted-foreground mt-1">
              IRS Schedule E for Tax Year {taxYear}
            </p>
          </div>
        </div>

        {/* Step Progress */}
        <Card className="transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-0">
                {[1, 2, 3].map((step, index) => {
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
                        <p className="text-xs mt-2 text-center text-muted-foreground w-24">
                          {step === 1 && "Select Properties"}
                          {step === 2 && "Review Details"}
                          {step === 3 && "Generate"}
                        </p>
                      </div>
                      {index < 2 && (
                        <div
                          className={`h-1 w-24 mx-6 transition-all duration-300 ${
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

        {/* Step 1: Select Properties */}
        {currentStep === 1 && (
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle>Step 1: Select Properties</CardTitle>
              <CardDescription>Choose which properties to include in Schedule E</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search properties..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {filteredProperties.length > 0 && (
                  <Button variant="outline" onClick={toggleAll}>
                    {selectedProperties.size === filteredProperties.length ? (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Select All
                      </>
                    )}
                  </Button>
                )}
              </div>

              {filteredProperties.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "No properties match your search."
                      : "No properties found. Add properties to generate Schedule E."}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Property Address</TableHead>
                      <TableHead className="text-right">Annual Rental Income</TableHead>
                      <TableHead className="text-right">Annual Expenses</TableHead>
                      <TableHead className="text-right">Depreciation</TableHead>
                      <TableHead className="text-right">Net Income</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => {
                      const isSelected = selectedProperties.has(property.id);
                      const monthlyRentalIncome = property.monthlyRentalIncome || 0;
                      const monthlyExpenses = property.monthlyExpenses || 0;
                      const annualRentalIncome = monthlyRentalIncome * 12;
                      const annualExpenses = monthlyExpenses * 12;
                      const propertyType = "Residential"; // TODO: Get from property
                      const depreciationPeriod = propertyType === "Residential" ? 27.5 : 39;
                      const depreciableBasis = property.purchasePrice || 0;
                      const landValue = depreciableBasis * 0.2;
                      const buildingValue = depreciableBasis - landValue;
                      const depreciation = buildingValue / depreciationPeriod;
                      const netIncome = annualRentalIncome - annualExpenses - depreciation;

                      return (
                        <TableRow
                          key={property.id}
                          className={isSelected ? "bg-primary/5" : ""}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleProperty(property.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{property.address}</TableCell>
                          <TableCell className="text-right">{formatCurrencyDisplay(annualRentalIncome)}</TableCell>
                          <TableCell className="text-right text-destructive">{formatCurrencyDisplay(annualExpenses)}</TableCell>
                          <TableCell className="text-right text-destructive">{formatCurrencyDisplay(depreciation)}</TableCell>
                          <TableCell className={`text-right font-semibold ${netIncome >= 0 ? "text-success" : "text-destructive"}`}>
                            {formatCurrencyDisplay(netIncome)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Review Details */}
        {currentStep === 2 && (
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Step 2: Review Schedule E Details
              </CardTitle>
              <CardDescription>
                Review rental income, expenses, and depreciation for each property
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedProperties.size === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Properties Selected</AlertTitle>
                  <AlertDescription>
                    Please go back to Step 1 and select at least one property.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Tax Year</Label>
                    <Input
                      type="number"
                      value={taxYear}
                      onChange={(e) => setTaxYear(parseInt(e.target.value) || 2026)}
                      className="w-32"
                    />
                  </div>

                  <Separator />

                  <div className="bg-primary/5 border-primary/20 p-6 rounded-lg">
                    <Label className="text-sm font-semibold mb-4 block">Schedule E Summary</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Rental Income</p>
                        <p className="text-2xl font-bold">{formatCurrencyDisplay(totals.totalRentalIncome)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Expenses</p>
                        <p className="text-2xl font-bold text-destructive">{formatCurrencyDisplay(totals.totalExpenses)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Depreciation</p>
                        <p className="text-2xl font-bold text-destructive">{formatCurrencyDisplay(totals.totalDepreciation)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Net Rental Income</p>
                        <p className={`text-2xl font-bold ${totals.totalNetIncome >= 0 ? "text-success" : "text-destructive"}`}>
                          {formatCurrencyDisplay(totals.totalNetIncome)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Property-by-Property Breakdown</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property Address</TableHead>
                          <TableHead className="text-right">Rental Income</TableHead>
                          <TableHead className="text-right">Expenses</TableHead>
                          <TableHead className="text-right">Depreciation</TableHead>
                          <TableHead className="text-right">Net Income/Loss</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scheduleEData.map((item) => (
                          <TableRow key={item.property.id}>
                            <TableCell className="font-medium">{item.propertyAddress}</TableCell>
                            <TableCell className="text-right">{formatCurrencyDisplay(item.rentalIncome)}</TableCell>
                            <TableCell className="text-right text-destructive">{formatCurrencyDisplay(item.expenses)}</TableCell>
                            <TableCell className="text-right text-destructive">{formatCurrencyDisplay(item.depreciation)}</TableCell>
                            <TableCell className={`text-right font-semibold ${item.netIncome >= 0 ? "text-success" : "text-destructive"}`}>
                              {formatCurrencyDisplay(item.netIncome)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">{formatCurrencyDisplay(totals.totalRentalIncome)}</TableCell>
                          <TableCell className="text-right text-destructive">{formatCurrencyDisplay(totals.totalExpenses)}</TableCell>
                          <TableCell className="text-right text-destructive">{formatCurrencyDisplay(totals.totalDepreciation)}</TableCell>
                          <TableCell className={`text-right ${totals.totalNetIncome >= 0 ? "text-success" : "text-destructive"}`}>
                            {formatCurrencyDisplay(totals.totalNetIncome)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Generate */}
        {currentStep === 3 && (
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle>Step 3: Generate Schedule E</CardTitle>
              <CardDescription>Review summary and generate your Schedule E PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedProperties.size === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Properties Selected</AlertTitle>
                  <AlertDescription>
                    Please go back to Step 1 and select at least one property.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="bg-muted/50 p-6 rounded-lg">
                    <Label className="text-sm font-semibold mb-4 block">Final Summary</Label>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tax Year</span>
                        <span className="font-semibold">{taxYear}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Properties Selected</span>
                        <Badge variant="secondary">{selectedProperties.size}</Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Rental Income</span>
                        <span className="font-semibold">{formatCurrencyDisplay(totals.totalRentalIncome)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Expenses</span>
                        <span className="font-semibold text-destructive">{formatCurrencyDisplay(totals.totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Depreciation</span>
                        <span className="font-semibold text-destructive">{formatCurrencyDisplay(totals.totalDepreciation)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Net Rental Income/Loss</span>
                        <span className={`text-2xl font-bold ${totals.totalNetIncome >= 0 ? "text-success" : "text-destructive"}`}>
                          {formatCurrencyDisplay(totals.totalNetIncome)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Ready to Generate</AlertTitle>
                    <AlertDescription>
                      Your Schedule E will include {selectedProperties.size} propert{selectedProperties.size === 1 ? 'y' : 'ies'} with a net rental {totals.totalNetIncome >= 0 ? 'income' : 'loss'} of {formatCurrencyDisplay(Math.abs(totals.totalNetIncome))}.
                    </AlertDescription>
                  </Alert>
                </>
              )}
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
                  disabled={currentStep === 1 && selectedProperties.size === 0}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                  size="lg"
                  disabled={selectedProperties.size === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Schedule E PDF
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
