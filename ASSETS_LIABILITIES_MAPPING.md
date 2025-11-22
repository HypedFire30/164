# Assets & Liabilities to PFS Form Mapping

## Overview

When you add assets and liabilities on the **Assets & Liabilities** page, they automatically populate the corresponding fields in the **Generate PFS** form based on the category you select.

## Asset Categories → PFS Form Fields

| Asset Category | PFS Form Field | Location |
|---------------|----------------|----------|
| **Cash** | Cash on Hand and in Banks | Assets Tab → Current Assets |
| **Cash Other Institutions** | Cash in Other Institutions | Assets Tab → Current Assets |
| **Building Material Inventory** | Building Material Inventory | Assets Tab → Current Assets |
| **Life Insurance** | Cash Surrender Value of Life Insurance | Assets Tab → Current Assets |
| **Retirement** | Retirement Accounts | Assets Tab → Current Assets |
| **Automobile** | Automobiles and Trucks | Assets Tab → Other Assets |
| **Machinery** | Machinery and Tools | Assets Tab → Other Assets |
| **Investment** | (Not auto-filled, but can be used for schedules) | - |
| **Other Assets** | Other Assets - Value | Assets Tab → Other Assets |

## Liability Categories → PFS Form Fields

| Liability Category | PFS Form Field | Location |
|-------------------|----------------|----------|
| **Note Payable - Relative** | Notes Payable to Relatives and Friends | Liabilities Tab → Current Liabilities |
| **Accrued Interest** | Accrued Current Liabilities → a. Interest | Liabilities Tab → Current Liabilities |
| **Accrued Salary** | Accrued Current Liabilities → b. Salary and Wages | Liabilities Tab → Current Liabilities |
| **Accrued Tax** | Accrued Current Liabilities → c. Taxes, other than Income | Liabilities Tab → Current Liabilities |
| **Income Tax Payable** | Accrued Current Liabilities → d. Income Tax Payable | Liabilities Tab → Current Liabilities |
| **Chattel Mortgage** | Chattel Mortgage and Contract on Equipment | Liabilities Tab → Other Liabilities |
| **Guaranteed Loan** | Guaranteed or Cosigned Loans or Paper | Liabilities Tab → Contingent Liabilities |
| **Surety Bond** | Surety Bonds | Liabilities Tab → Contingent Liabilities |
| **Credit Cards** | (Not auto-filled, but stored for reference) | - |
| **Personal Loans** | (Not auto-filled, but stored for reference) | - |
| **Other Liabilities** | Other Liabilities - Value | Liabilities Tab → Other Liabilities |

## How It Works

1. **Add Assets/Liabilities**: Go to the Assets & Liabilities page and add items with appropriate categories
2. **Auto-Population**: When you open the Generate PFS page, fields automatically populate based on category
3. **Visual Indicators**: Auto-filled fields show a "Auto-filled" badge with a database icon
4. **Manual Override**: You can always edit any auto-filled value - the badge disappears when you manually change it
5. **Multiple Items**: If you have multiple assets/liabilities in the same category, their values are automatically summed

## Example Workflow

### Adding Cash Assets
1. Go to Assets & Liabilities → Add Asset
2. Select category: **Cash**
3. Description: "Chase Checking Account"
4. Value: $50,000
5. Save

When you generate a PFS:
- The "Cash on Hand and in Banks" field will show $50,000
- It will have an "Auto-filled" badge
- You can override it if needed

### Adding Multiple Retirement Accounts
1. Add Asset: Category "Retirement", Description "401k", Value $100,000
2. Add Asset: Category "Retirement", Description "IRA", Value $50,000

When you generate a PFS:
- The "Retirement Accounts" field will show $150,000 (sum of both)
- It will have an "Auto-filled" badge

## Benefits

✅ **Single Source of Truth**: Manage all assets/liabilities in one place  
✅ **Automatic Updates**: Changes on Assets page automatically reflect in PFS form  
✅ **Time Savings**: No need to manually enter the same data multiple times  
✅ **Accuracy**: Reduces data entry errors  
✅ **Flexibility**: Can still override values in PFS form when needed  

## Tips

- Use specific categories to ensure proper auto-population
- You can have multiple assets/liabilities in the same category - they'll be summed
- The description field is for your reference and doesn't affect auto-population
- Always review auto-filled values before generating the PDF






