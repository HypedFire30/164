# Auto-Population Architecture for PFS Generation

## Overview

The PFS generation system should intelligently auto-populate fields from the database wherever possible, reducing manual data entry while still allowing overrides and additions.

## Current Database Structure

### Available Data Sources

1. **Properties Table**
   - Address, purchase price, current value, ownership percentage
   - Links to mortgages

2. **Mortgages Table**
   - Lender, principal balance, interest rate, payment amount
   - Linked to properties

3. **PersonalAssets Table**
   - Category, description, value
   - Can map to various asset fields

4. **Liabilities Table**
   - Category, description, balance
   - Can map to various liability fields

## Auto-Population Strategy

### ✅ What Can Be Auto-Populated Now

#### Schedule F - Real Estate
- **Auto-populate:** All selected properties with:
  - Address
  - Current Value (ownership-weighted)
  - Original Cost (purchase price)
  - Mortgage Balance (from linked mortgage)
  - Monthly Payment (from linked mortgage)
  - Lender (from linked mortgage)

#### Current Assets
- **Cash on Hand:** Can be populated from PersonalAssets where `category = "Cash"` or `category = "Bank Account"`
- **Building Material Inventory:** From PersonalAssets where `category = "Inventory"`
- **Life Insurance Cash Value:** From PersonalAssets where `category = "Life Insurance"`
- **Retirement Accounts:** From PersonalAssets where `category = "Retirement"` or `category = "401k"` or `category = "IRA"`

#### Other Assets
- **Automobiles/Trucks:** From PersonalAssets where `category = "Vehicle"` or `category = "Automobile"`
- **Machinery/Tools:** From PersonalAssets where `category = "Machinery"` or `category = "Equipment"`

#### Current Liabilities
- **Notes Payable to Relatives:** From Liabilities where `category = "Note Payable - Relative"`
- **Accrued Liabilities:** From Liabilities where `category = "Accrued Interest"`, `category = "Accrued Wages"`, etc.

#### Other Liabilities
- **Chattel Mortgage:** From Liabilities where `category = "Chattel Mortgage"`
- **Other Liabilities:** From Liabilities where `category` doesn't match standard categories

#### Income
- **Rentals:** Auto-calculate from properties with rental income (if `monthlyIncome` field exists)
- **Other Income:** From Income Sources table (if exists)

### 🔄 What Requires Database Expansion

To fully auto-populate the PFS, you'll need additional tables:

#### Schedule A - Accounts Receivable
**New Table: `AccountsReceivable`**
- Fields: `name`, `amount`, `due_date`
- Auto-populate all entries

#### Schedule B - Notes Receivable
**New Table: `NotesReceivable`**
- Fields: `name`, `amount`, `due_date`
- Auto-populate all entries

#### Schedule C - Listed Stocks and Bonds
**New Table: `ListedSecurities`**
- Fields: `registered_name`, `shares`, `market_per_share`, `total_value`
- Auto-populate all entries

#### Schedule D - Unlisted Stocks and Bonds
**New Table: `UnlistedSecurities`**
- Fields: `registered_name`, `shares`, `market_per_share`, `total_value`
- Auto-populate all entries

#### Schedule E - Contracts and Mortgages Receivable
**New Table: `ContractsReceivable`**
- Fields: `description`, `debtor_name`, `payment_schedule`, `past_due`, `original_balance`, `present_balance`, `interest_rate`
- Auto-populate all entries

#### Schedule G - Open Accounts Payable
**New Table: `AccountsPayable`**
- Fields: `payable_to`, `amount`, `due_date`
- Auto-populate all entries

#### Schedule H - Notes Payable to Others
**New Table: `NotesPayable`**
- Fields: `payable_to`, `amount`, `due_date`
- Auto-populate all entries

#### Schedule I - Installment Obligations
**New Table: `InstallmentObligations`**
- Fields: `payable_to`, `collateral`, `balance`, `final_due_date`, `monthly_payment`
- Auto-populate all entries

#### Bank Accounts
**New Table: `BankAccounts`**
- Fields: `bank_name`, `account_type`, `balance`, `is_joint`
- Auto-populate to "Cash on Hand and in Banks"

#### Income Sources
**New Table: `IncomeSources`**
- Fields: `source_type`, `source_name`, `monthly_amount`, `annual_amount`, `is_recurring`
- Auto-populate to Income section

## Implementation Approach

### Phase 1: Smart Auto-Population (Current)
1. Auto-populate Schedule F from Properties
2. Auto-populate mortgage data from Mortgages table
3. Map PersonalAssets to appropriate asset fields based on category
4. Map Liabilities to appropriate liability fields based on category
5. Show visual indicators for auto-populated vs manual fields

### Phase 2: Database Expansion
1. Create new tables for all schedules
2. Build data entry forms for each schedule type
3. Auto-populate all fields from database
4. Allow manual overrides

### Phase 3: Intelligent Mapping
1. Use category-based mapping for flexible asset/liability classification
2. Support multiple categories per asset/liability
3. Auto-categorize based on description keywords

## User Experience

### Visual Indicators
- **Auto-populated fields:** Show a badge/icon indicating data came from database
- **Manual fields:** Show editable indicator
- **Override capability:** Allow users to override any auto-populated value
- **Add new entries:** Always allow adding entries not in database

### Workflow
1. User selects properties to include
2. System auto-populates all available data
3. User reviews and can:
   - Override any auto-populated value
   - Add new entries not in database
   - Remove entries they don't want to include
4. User generates PDF with final configuration

## Benefits

1. **Time Savings:** Most data auto-populates, reducing manual entry by 70-80%
2. **Accuracy:** Single source of truth in database
3. **Consistency:** Same data used across all PFS generations
4. **Flexibility:** Can still override or add data as needed
5. **Scalability:** Easy to add new data sources as database expands

## Next Steps

1. Update GeneratePFS page to auto-populate from existing data
2. Add visual indicators for auto-populated fields
3. Create data entry forms for new schedule tables
4. Implement category-based mapping for assets/liabilities
5. Add override functionality with clear UI






