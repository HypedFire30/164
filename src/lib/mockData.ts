// Mock data generator for development/testing when Airtable is not configured
import type { Property, Mortgage, PersonalAsset, Liability } from "@/types";

// Generate random property addresses in Chicago
const addresses = [
  "1234 Main St, Chicago IL 60601",
  "5678 Oak Ave, Chicago IL 60602",
  "9012 Elm Dr, Chicago IL 60603",
  "3456 Pine St, Chicago IL 60604",
  "7890 Maple Ave, Chicago IL 60605",
  "2345 Cedar Blvd, Chicago IL 60606",
  "6789 Birch Ln, Chicago IL 60607",
  "1237 Walnut St, Chicago IL 60608",
  "4568 Ash Dr, Chicago IL 60609",
  "8901 Hickory Ave, Chicago IL 60610",
  "3457 Spruce St, Chicago IL 60611",
  "7892 Poplar Ln, Chicago IL 60612",
  "2346 Willow Dr, Chicago IL 60613",
  "6790 Cherry St, Chicago IL 60614",
  "1238 Chestnut Ave, Chicago IL 60615",
];

const lenders = [
  "Bank of America",
  "Chase",
  "Wells Fargo",
  "JPMorgan",
  "Citibank",
  "US Bank",
  "PNC Bank",
];

const assetCategories = ["Cash", "Investments", "Vehicles", "Other Assets"];
const liabilityCategories = ["Credit Cards", "Personal Loans", "Other Liabilities"];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomCurrency(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min) / 1000 * 1000; // Round to nearest 1000
}

export function generateMockProperties(count: number = 15): Property[] {
  return addresses.slice(0, count).map((address, index) => {
    const purchasePrice = randomCurrency(500000, 5000000);
    const appreciation = randomBetween(5, 30); // 5-30% appreciation
    const currentValue = Math.floor(purchasePrice * (1 + appreciation / 100));
    const ownershipPercentage = randomBetween(50, 100);

    return {
      id: `prop_${index + 1}`,
      address,
      purchasePrice,
      currentValue,
      ownershipPercentage,
      mortgageId: `mort_${index + 1}`,
      notes: index % 3 === 0 ? "Recently renovated" : undefined,
    };
  });
}

export function generateMockMortgages(properties: Property[]): Mortgage[] {
  return properties
    .filter((p) => p.mortgageId)
    .map((property, index) => {
      const loanToValue = randomBetween(60, 80); // 60-80% LTV
      const principalBalance = Math.floor(
        property.currentValue * (loanToValue / 100)
      );
      const interestRate = randomBetween(3, 7); // 3-7% interest
      const paymentAmount = Math.floor(principalBalance * 0.005); // Rough estimate

      return {
        id: property.mortgageId!,
        propertyId: property.id,
        lender: lenders[index % lenders.length],
        principalBalance,
        interestRate: interestRate / 100,
        paymentAmount,
        lastUpdated: new Date(
          Date.now() - randomBetween(0, 90) * 24 * 60 * 60 * 1000
        ).toISOString(), // Updated within last 90 days
      };
    });
}

export function generateMockPersonalAssets(): PersonalAsset[] {
  const now = new Date();
  const futureDate = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  return [
    {
      id: "asset_1",
      category: "Cash",
      description: "Chase Checking Account",
      value: randomCurrency(50000, 200000),
    },
    {
      id: "asset_2",
      category: "Cash",
      description: "Wells Fargo Savings",
      value: randomCurrency(100000, 300000),
    },
    {
      id: "asset_3",
      category: "Cash Other Institutions",
      description: "Credit Union Account",
      value: randomCurrency(25000, 150000),
    },
    {
      id: "asset_4",
      category: "Building Material Inventory",
      description: "Construction Materials Warehouse",
      value: randomCurrency(75000, 250000),
    },
    {
      id: "asset_5",
      category: "Life Insurance",
      description: "Whole Life Policy - Cash Surrender Value",
      value: randomCurrency(50000, 200000),
    },
    {
      id: "asset_6",
      category: "Retirement",
      description: "401(k) Account",
      value: randomCurrency(200000, 800000),
    },
    {
      id: "asset_7",
      category: "Retirement",
      description: "IRA Account",
      value: randomCurrency(150000, 500000),
    },
    {
      id: "asset_8",
      category: "Automobile",
      description: "2022 Mercedes-Benz S-Class",
      value: randomCurrency(60000, 120000),
    },
    {
      id: "asset_9",
      category: "Automobile",
      description: "2021 Ford F-150 Truck",
      value: randomCurrency(35000, 65000),
    },
    {
      id: "asset_10",
      category: "Machinery",
      description: "Construction Equipment",
      value: randomCurrency(100000, 400000),
    },
    {
      id: "asset_11",
      category: "Machinery",
      description: "Office Equipment & Tools",
      value: randomCurrency(25000, 100000),
    },
    {
      id: "asset_12",
      category: "Investment",
      description: "Stock Portfolio",
      value: randomCurrency(200000, 1000000),
    },
    {
      id: "asset_13",
      category: "Accounts Receivable",
      description: "Outstanding Invoice - ABC Construction",
      value: randomCurrency(25000, 150000),
      receivableName: "ABC Construction Company",
      dueDate: futureDate(30),
    },
    {
      id: "asset_14",
      category: "Accounts Receivable",
      description: "Invoice - XYZ Developers",
      value: randomCurrency(50000, 200000),
      receivableName: "XYZ Developers LLC",
      dueDate: futureDate(45),
    },
    {
      id: "asset_15",
      category: "Notes Receivable",
      description: "Promissory Note - John Smith",
      value: randomCurrency(100000, 500000),
      receivableName: "John Smith",
      dueDate: futureDate(180),
    },
    {
      id: "asset_16",
      category: "Notes Receivable",
      description: "Business Loan Note - Tech Startup Inc",
      value: randomCurrency(200000, 800000),
      receivableName: "Tech Startup Inc",
      dueDate: futureDate(365),
    },
    {
      id: "asset_17",
      category: "Other Assets",
      description: "Art Collection",
      value: randomCurrency(50000, 300000),
    },
    {
      id: "asset_18",
      category: "Other Assets",
      description: "Precious Metals",
      value: randomCurrency(75000, 250000),
    },
  ];
}

export function generateMockLiabilities(): Liability[] {
  const now = new Date();
  const futureDate = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  return [
    {
      id: "liab_1",
      category: "Note Payable - Relative",
      description: "Loan from Brother",
      balance: randomCurrency(25000, 100000),
    },
    {
      id: "liab_2",
      category: "Accrued Interest",
      description: "Accrued Interest on Mortgages",
      balance: randomCurrency(5000, 25000),
    },
    {
      id: "liab_3",
      category: "Accrued Salary",
      description: "Outstanding Payroll",
      balance: randomCurrency(10000, 50000),
    },
    {
      id: "liab_4",
      category: "Accrued Tax",
      description: "Property Taxes Due",
      balance: randomCurrency(15000, 75000),
    },
    {
      id: "liab_5",
      category: "Income Tax Payable",
      description: "Federal Income Tax Owed",
      balance: randomCurrency(20000, 100000),
    },
    {
      id: "liab_6",
      category: "Chattel Mortgage",
      description: "Equipment Financing",
      balance: randomCurrency(50000, 200000),
    },
    {
      id: "liab_7",
      category: "Guaranteed Loan",
      description: "Business Loan Guarantee",
      balance: randomCurrency(100000, 500000),
    },
    {
      id: "liab_8",
      category: "Surety Bond",
      description: "Construction Bond",
      balance: randomCurrency(50000, 250000),
    },
    {
      id: "liab_9",
      category: "Credit Cards",
      description: "Chase Credit Card",
      balance: randomCurrency(5000, 30000),
    },
    {
      id: "liab_10",
      category: "Credit Cards",
      description: "American Express",
      balance: randomCurrency(10000, 50000),
    },
    {
      id: "liab_11",
      category: "Personal Loans",
      description: "Personal Line of Credit",
      balance: randomCurrency(25000, 150000),
    },
    {
      id: "liab_12",
      category: "Accounts Payable",
      description: "Outstanding Invoice - Supplier",
      balance: randomCurrency(15000, 75000),
      payableTo: "ABC Supply Company",
      dueDate: futureDate(30),
    },
    {
      id: "liab_13",
      category: "Accounts Payable",
      description: "Vendor Payment Due",
      balance: randomCurrency(25000, 100000),
      payableTo: "XYZ Materials Inc",
      dueDate: futureDate(45),
    },
    {
      id: "liab_14",
      category: "Notes Payable",
      description: "Business Note to Bank",
      balance: randomCurrency(100000, 500000),
      payableTo: "First National Bank",
      dueDate: futureDate(365),
    },
    {
      id: "liab_15",
      category: "Notes Payable",
      description: "Promissory Note",
      balance: randomCurrency(50000, 200000),
      payableTo: "Private Lender LLC",
      dueDate: futureDate(180),
    },
    {
      id: "liab_16",
      category: "Installment Obligations",
      description: "Auto Loan - Mercedes",
      balance: randomCurrency(30000, 80000),
      payableTo: "Mercedes-Benz Financial",
      collateral: "2022 Mercedes-Benz S-Class",
      finalDueDate: futureDate(1080), // 3 years
      monthlyPayment: randomCurrency(800, 2000),
    },
    {
      id: "liab_17",
      category: "Installment Obligations",
      description: "Equipment Loan",
      balance: randomCurrency(50000, 150000),
      payableTo: "Equipment Finance Corp",
      collateral: "Construction Equipment",
      finalDueDate: futureDate(1440), // 4 years
      monthlyPayment: randomCurrency(1200, 3000),
    },
    {
      id: "liab_18",
      category: "Installment Obligations",
      description: "Truck Financing",
      balance: randomCurrency(25000, 60000),
      payableTo: "Ford Credit",
      collateral: "2021 Ford F-150 Truck",
      finalDueDate: futureDate(720), // 2 years
      monthlyPayment: randomCurrency(600, 1500),
    },
    {
      id: "liab_19",
      category: "Other Liabilities",
      description: "Legal Settlement",
      balance: randomCurrency(20000, 100000),
    },
    {
      id: "liab_20",
      category: "Other Liabilities",
      description: "Miscellaneous Debts",
      balance: randomCurrency(10000, 50000),
    },
  ];
}

export function generateMockPFSData() {
  const properties = generateMockProperties(15);
  const mortgages = generateMockMortgages(properties);
  const personalAssets = generateMockPersonalAssets();
  const liabilities = generateMockLiabilities();

  return {
    properties,
    mortgages,
    personalAssets,
    liabilities,
  };
}

