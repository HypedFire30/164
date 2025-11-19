# Domain Layer Documentation

This directory contains the core business logic for the Personal Financial Statement (PFS) automation system. All code follows clean architecture principles with clear separation of concerns.

## Structure

```
domain/
├── types/          # Complete TypeScript domain models
├── calculations/   # Financial calculation engine
├── validation/     # Validation rules for all entities
├── versioning/     # Version tracking and rollback
├── sync/          # Entity synchronization and recalculation
├── assembler/     # PFS assembly from all modules
├── data/          # Data access layer (Airtable)
└── utils/         # Utility functions
```

## Core Modules

### 1. Types (`types/index.ts`)

Complete TypeScript domain models for all PFS modules:

- **PersonalInfo**: Personal information and contact details
- **RealEstateProperty**: Properties with mortgages, income, expenses
- **BankAccount**: Bank accounts with balances
- **InvestmentAccount**: Investment accounts with holdings
- **BusinessEntity**: Business entities with assets/liabilities
- **PersonalLoan**: Personal loans
- **CreditLine**: Lines of credit
- **CreditCard**: Credit cards
- **IncomeSource**: Income sources
- **FullPFS**: Complete PFS object with all modules and summaries

All types extend `BaseEntity` which includes:
- `id`: Unique identifier
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `version`: Version number
- `deletedAt`: Soft delete timestamp
- `snapshot`: JSON snapshot for rollback

### 2. Calculations (`calculations/index.ts`)

Pure TypeScript functions for all financial metrics:

**Real Estate:**
- `calculateTotalRealEstateValue()`: Ownership-weighted property values
- `calculateTotalMortgageBalance()`: Total mortgage debt
- `calculateTotalRealEstateEquity()`: Total equity
- `calculateLTV()`: Loan-to-value ratio
- `calculateNOI()`: Net Operating Income
- `calculateDSCR()`: Debt Service Coverage Ratio

**Assets:**
- `calculateTotalBankBalance()`: Total cash
- `calculateTotalInvestmentValue()`: Total investment value
- `calculateTotalRSUValue()`: RSU value
- `calculateTotalPrivateEquityValue()`: Private equity value
- `calculateTotalCapTableValue()`: Cap table value
- `calculateTotalBusinessEquity()`: Business equity

**Liabilities:**
- `calculateTotalPersonalLoanBalance()`: Personal loans
- `calculateTotalCreditLineBalance()`: Credit lines
- `calculateTotalCreditCardBalance()`: Credit cards

**Income:**
- `calculateTotalMonthlyIncome()`: Monthly income
- `calculateTotalAnnualIncome()`: Annual income

**Metrics:**
- `calculateNetWorth()`: Net worth
- `calculateDebtToAssetRatio()`: Debt-to-asset ratio
- `calculateLiquidity()`: Liquidity

**Comprehensive:**
- `calculatePFSSummaries()`: Calculate all summaries at once

### 3. Validation (`validation/index.ts`)

Reusable validation functions for all entities:

- `validateRealEstateProperty()`: Property validation
- `validateMortgage()`: Mortgage validation
- `validateBankAccount()`: Bank account validation
- `validateInvestmentAccount()`: Investment validation
- `validateBusinessEntity()`: Business entity validation
- `validatePersonalLoan()`: Personal loan validation
- `validateCreditLine()`: Credit line validation
- `validateCreditCard()`: Credit card validation
- `validateIncomeSource()`: Income source validation
- `validateOwnerShares()`: Ownership percentage validation

All validations return `ValidationResult` with:
- `isValid`: Boolean
- `errors`: Array of error messages

### 4. Versioning (`versioning/index.ts`)

Version tracking and rollback system:

- `createVersionedEntity()`: Create new entity with version metadata
- `updateVersionedEntity()`: Update entity with version increment
- `createSnapshot()`: Create snapshot for rollback
- `restoreFromSnapshot()`: Restore entity from snapshot
- `softDeleteEntity()`: Soft delete entity
- `restoreEntity()`: Restore soft-deleted entity
- `extractChanges()`: Compare two versions and extract changes

### 5. Sync (`sync/index.ts`)

Entity synchronization and recalculation:

- `syncRealEstateProperty()`: Sync single property
- `syncRealEstatePortfolio()`: Sync all properties
- `syncInvestmentAccount()`: Sync investment account
- `syncInvestmentPortfolio()`: Sync all investments
- `syncBusinessEntity()`: Sync business entity
- `syncBusinessPortfolio()`: Sync all businesses
- `syncCreditLine()`: Sync credit line
- `syncCreditCard()`: Sync credit card
- `syncIncomeSource()`: Sync income source
- `syncAllEntities()`: Sync all entities at once

### 6. Assembler (`assembler/index.ts`)

PFS assembly from all data sources:

- `assemblePFS()`: Assemble complete PFS from fetchers
- `assemblePFSFromData()`: Assemble PFS from already-fetched data
- `assemblePFSSummary()`: Get summary-only view

### 7. Data Layer (`data/airtable-repository.ts`)

Generic Airtable repository pattern:

- `GenericAirtableRepository<T>`: Generic repository class
- `fetchAll()`: Fetch all records
- `fetchById()`: Fetch by ID
- `create()`: Create new record
- `update()`: Update existing record
- `delete()`: Soft delete record
- `findByField()`: Find by field value

### 8. Utils (`utils/index.ts`)

Utility functions:

**Date:**
- `formatDate()`: Format date for display
- `formatDateTime()`: Format date with time
- `addMonths()`: Add months to date
- `addYears()`: Add years to date
- `monthsBetween()`: Calculate months between dates

**Number:**
- `formatCurrency()`: Format as currency
- `formatPercentage()`: Format as percentage
- `formatNumber()`: Format number with commas
- `roundToCent()`: Round to nearest cent
- `roundToDollar()`: Round to nearest dollar

**Normalization:**
- `normalizeString()`: Normalize string
- `normalizeAddress()`: Normalize address
- `normalizePhone()`: Normalize phone number
- `formatPhone()`: Format phone number
- `normalizeEIN()`: Normalize EIN

**Array:**
- `sum()`: Sum array of numbers
- `average()`: Average of array
- `groupBy()`: Group array by key

**Other:**
- `isEmpty()`: Check if value is empty
- `debounce()`: Debounce function
- `throttle()`: Throttle function

## Usage Examples

### Calculate Net Worth

```typescript
import { calculateNetWorth, calculateTotalAssets, calculateTotalLiabilities } from "@/domain/calculations";

const totalAssets = calculateTotalAssets(realEstate, bankAccounts, investments, ...);
const totalLiabilities = calculateTotalLiabilities(realEstate, loans, creditLines, ...);
const netWorth = calculateNetWorth(totalAssets, totalLiabilities);
```

### Validate Property

```typescript
import { validateRealEstateProperty } from "@/domain/validation";

const result = validateRealEstateProperty(property);
if (!result.isValid) {
  console.error(result.errors);
}
```

### Assemble Complete PFS

```typescript
import { assemblePFS } from "@/domain/assembler";

const pfs = await assemblePFS(userId, {
  getPersonalInfo: async (id) => { /* ... */ },
  getRealEstate: async (id) => { /* ... */ },
  // ... other fetchers
});

console.log(pfs.summaries.netWorth);
```

### Sync Entities After Update

```typescript
import { syncAllEntities } from "@/domain/sync";

const synced = syncAllEntities({
  realEstate: updatedProperties,
  investments: updatedInvestments,
  // ...
});
```

## Design Principles

1. **Pure Functions**: All calculations are pure (no side effects)
2. **Type Safety**: Strong TypeScript types throughout
3. **Separation of Concerns**: Domain logic separate from data access
4. **Testability**: All functions are easily testable
5. **Flexibility**: Easy to extend for new banks/formats
6. **Deterministic**: Same inputs always produce same outputs

## Future Enhancements

- PDF generation integration
- Bank API integrations
- Automated data syncing
- Advanced reporting
- Multi-currency support
- Tax calculations



