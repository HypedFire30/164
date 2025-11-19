# 164 PFS System - Setup Guide

## Overview

This system replaces Google Sheets with Airtable as the primary data storage for managing your property portfolio and generating Personal Financial Statements (PFS).

## Key Benefits

- **No more complex spreadsheets**: All data is stored in a structured database
- **Easy monthly updates**: Update mortgage balances with a simple form
- **Consistent property valuations**: Centralized value tracking
- **Automated calculations**: Totals, equity, and net worth are calculated automatically

## Airtable Setup

### Step 1: Create Your Airtable Base

1. Go to [Airtable](https://airtable.com) and create a new base
2. Name it "164 PFS" or similar

### Step 2: Create the Tables

Create the following tables with these exact field names:

#### Properties Table
- `address` (Single line text)
- `purchase_price` (Number, Currency)
- `current_value` (Number, Currency)
- `ownership_percentage` (Number, Percent)
- `mortgage_id` (Single line text) - Optional, links to Mortgages table
- `notes` (Long text) - Optional

#### Mortgages Table
- `property_id` (Single line text) - Links to Properties
- `lender` (Single line text)
- `principal_balance` (Number, Currency)
- `interest_rate` (Number, Percent)
- `payment_amount` (Number, Currency)
- `last_updated` (Date)

#### PersonalAssets Table
- `category` (Single line text) - e.g., "Cash", "Investments", "Vehicles"
- `description` (Single line text)
- `value` (Number, Currency)

#### Liabilities Table
- `category` (Single line text) - e.g., "Credit Cards", "Loans"
- `description` (Single line text)
- `balance` (Number, Currency)

#### ValuationHistory Table (Optional, for Phase 2)
- `property_id` (Single line text) - Links to Properties
- `value` (Number, Currency)
- `timestamp` (Date)

### Step 3: Get Your API Credentials

1. Go to [Airtable API](https://airtable.com/api)
2. Select your base
3. Copy your **Base ID** (starts with `app...`)
4. Go to [Account Settings > Developer Options](https://airtable.com/create/tokens)
5. Create a new Personal Access Token
6. Copy your **API Key**

### Step 4: Configure Environment Variables

1. Create a `.env` file in the project root:

```bash
VITE_AIRTABLE_API_KEY=your_api_key_here
VITE_AIRTABLE_BASE_ID=your_base_id_here
```

2. Replace the placeholder values with your actual credentials

### Step 5: Update Table Names (if needed)

If you named your tables differently, update the table names in:
- `src/lib/airtable/client.ts` - Update the `TABLES` constant

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

## Next Steps

1. **Add your first property**: Use the "Add Property" button on the Properties page
2. **Add mortgage information**: Link mortgages to properties
3. **Update values regularly**: Use the edit forms to update property values and mortgage balances monthly
4. **Generate PFS**: Use the "Generate PFS" button to create PDF statements

## Troubleshooting

### "Error Loading Data" message
- Check that your `.env` file exists and has the correct values
- Verify your Airtable API key has access to the base
- Ensure table names match exactly (case-sensitive)
- Check that field names match exactly (use underscores, not spaces)

### Data not showing
- Make sure you've added at least one record to each table you want to display
- Check the browser console for specific error messages

## Field Name Reference

Make sure your Airtable field names use **underscores** (snake_case):
- ✅ `purchase_price` (correct)
- ❌ `purchase price` (incorrect - spaces not allowed)
- ❌ `purchasePrice` (incorrect - camelCase not used)

