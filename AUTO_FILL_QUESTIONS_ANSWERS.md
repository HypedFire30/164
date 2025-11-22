# Auto-Fill Questions & Answers

## Your Questions Answered

### 1. Accounts Receivable / Notes Receivable & Accounts Payable / Notes Payable

**Question:** Are accounts receivable or notes receivable findable if the user adds them to assets, or are those not considered assets and would have to be stored somewhere else? Same for accounts / notes payable.

**Answer:**
- **Accounts Receivable (Schedule A)** and **Notes Receivable (Schedule B)** ARE assets, but they're tracked separately in the PFS form as schedules rather than in the main asset totals.
- **Accounts Payable (Schedule G)** and **Notes Payable to Others (Schedule H)** ARE liabilities, but they're also tracked as schedules.

**Current Status:**
- These are NOT currently auto-filled from the Assets & Liabilities page
- They need to be entered manually in the Schedules tab

**Recommendation:**
To auto-fill these, you would need to:
1. Add new categories to the Assets & Liabilities page:
   - **For Assets:** "Accounts Receivable" and "Notes Receivable" categories
   - **For Liabilities:** "Accounts Payable" and "Notes Payable to Others" categories
2. Store additional fields (name, due date) along with the amount
3. Update the auto-population logic to map these to Schedule A, B, G, and H

**Note:** The current PersonalAssets and Liabilities tables only store: category, description, and value/balance. To fully support schedules, you'd need to add fields like:
- `dueDate` (for accounts/notes receivable and payable)
- `name` or `payableTo` (for identifying who owes/you owe)

### 2. Stocks and Bonds

**Question:** I don't want them to have to enter stocks and bonds manually, so we would need an API for that or they would have to manually enter them right?

**Answer:**
Yes, you have two options:

**Option A: API Integration (Recommended for Listed Stocks/Bonds - Schedule C)**
- Use a stock market API (e.g., Alpha Vantage, Yahoo Finance, IEX Cloud, Polygon.io)
- Users enter: Stock symbol (e.g., "AAPL") and number of shares
- System automatically fetches current market price and calculates total value
- Pros: Always up-to-date, less manual entry
- Cons: Requires API key, rate limits, costs

**Option B: Manual Entry (Current)**
- Users manually enter: Registered name, shares, market price per share, total value
- Pros: No API costs, works for any security (including unlisted)
- Cons: Requires manual updates, potential for outdated prices

**Recommendation:**
- **Schedule C (Listed Stocks/Bonds):** Implement API integration for real-time pricing
- **Schedule D (Unlisted Stocks/Bonds):** Keep manual entry (these are private securities, no public pricing)

**Potential APIs:**
- **Alpha Vantage:** Free tier available, good for basic stock quotes
- **Yahoo Finance (unofficial):** Free but may have rate limits
- **IEX Cloud:** Professional API with free tier
- **Polygon.io:** Real-time and historical data

### 3. Installment Obligations

**Question:** What are installment obligations?

**Answer:**
**Installment Obligations (Schedule I)** are loans or debts that are paid back in regular, fixed installments (monthly payments) over a set period. Examples include:

- **Car loans** - Monthly payments for vehicle financing
- **Equipment loans** - Monthly payments for business equipment
- **Personal loans** - Fixed monthly payment personal loans
- **Furniture/appliance financing** - Store credit with monthly payments
- **Student loans** - Monthly payment student loan obligations
- **Any loan with a fixed payment schedule**

**Key Characteristics:**
- Fixed monthly payment amount
- Regular payment schedule (usually monthly)
- Has a final due date (when the loan will be fully paid off)
- May have collateral (e.g., car, equipment)
- Balance decreases over time with each payment

**Current Status:**
- These are NOT currently auto-filled
- Must be entered manually in Schedule I

**Recommendation:**
To auto-fill these, you could:
1. Add an "Installment Loan" category to the Liabilities table
2. Store additional fields: `payableTo`, `collateral`, `balance`, `finalDueDate`, `monthlyPayment`
3. Update auto-population to map to Schedule I

**Note:** The current Liabilities table only stores: category, description, and balance. To support Schedule I, you'd need to add:
- `payableTo` (who the loan is with)
- `collateral` (what secures the loan)
- `finalDueDate` (when the loan matures)
- `monthlyPayment` (the fixed payment amount)

## Summary of Auto-Fillable Fields

### ✅ Currently Auto-Filled

1. **Current Assets** - From Assets & Liabilities page (Personal Assets)
   - Cash on Hand and in Banks
   - Cash in Other Institutions
   - Building Material Inventory
   - Cash Surrender Value of Life Insurance
   - Retirement Accounts

2. **Other Assets** - From Assets & Liabilities page (Personal Assets)
   - Automobiles and Trucks
   - Machinery and Tools
   - Other Assets (value)

3. **Current Liabilities** - From Assets & Liabilities page (Liabilities)
   - Notes Payable to Relatives and Friends
   - Accrued Interest
   - Accrued Salary and Wages
   - Accrued Taxes (other than Income)
   - Income Tax Payable

4. **Other Liabilities** - From Assets & Liabilities page (Liabilities)
   - Chattel Mortgage and Contract on Equipment
   - Other Liabilities (value)

5. **Contingent Liabilities** - From Assets & Liabilities page (Liabilities)
   - Guaranteed or Cosigned Loans
   - Surety Bonds

6. **Schedule E** - From Properties page
   - Contracts and Mortgages Receivable (from selected properties)

7. **Schedule F** - From Properties page
   - Real Estate (from selected properties)

### ❌ NOT Currently Auto-Filled (Manual Entry Required)

1. **Schedule A** - Accounts Receivable
2. **Schedule B** - Notes Receivable
3. **Schedule C** - Listed Stocks and Bonds (would need API)
4. **Schedule D** - Unlisted Stocks and Bonds
5. **Schedule G** - Open Accounts Payable
6. **Schedule H** - Notes Payable to Others
7. **Schedule I** - Installment Obligations

### 🔄 Could Be Auto-Filled (With Database Changes)

If you expand the database structure to include additional fields:
- **Schedule A & B** (Accounts/Notes Receivable) - Add to Assets with due dates
- **Schedule G & H** (Accounts/Notes Payable) - Add to Liabilities with due dates
- **Schedule I** (Installment Obligations) - Add to Liabilities with payment details






