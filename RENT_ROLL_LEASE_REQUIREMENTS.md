# Rent Roll & Lease Requirements

## Important Clarifications

### Rent Roll Data Sources
Rent roll data comes from **multiple sources**:
- **Property Level**: Summary data (totalUnits, occupiedUnits, monthlyRentalIncome) stored on the property
- **Units Table**: Detailed unit information (unit number, type, square footage, market rent)
- **Leases Table**: Active lease information (tenant, rent amount, lease dates, payment status)
- **Tenants Table**: Tenant contact information

When generating a rent roll:
1. Select one or more properties
2. System fetches all units for those properties
3. System fetches all active leases for those units
4. System combines data to create comprehensive rent roll
5. Totals are calculated across all selected properties

### Current Leases Clarification
**Current Leases** = Properties that the owner/business **leases TO tenants** (the owner is the landlord).

This is NOT about leases the business has (leasing FROM others). This is about rental properties where the owner is the landlord renting out units to tenants.

### Property Level
- **Total Units**: Number of units in the property
- **Occupied Units**: Number of currently occupied units
- **Monthly Rental Income**: Total monthly rental income from all units

### Unit Level (for each unit)
- **Unit Number/Identifier**: e.g., "101", "A", "Suite 200"
- **Unit Type**: Studio, 1BR, 2BR, 3BR, 4BR, 5BR+, Commercial, Other
- **Square Footage**: Size of the unit
- **Bedrooms**: Number of bedrooms
- **Bathrooms**: Number of bathrooms
- **Market Rent**: Market rate for this unit type
- **Tenant Name**: Current tenant (if occupied)
- **Lease Start Date**: When current lease started
- **Lease End Date**: When current lease ends
- **Monthly Rent**: Base monthly rent amount
- **Other Monthly Charges**: Parking, storage, utilities, etc.
- **Total Monthly Rent**: Base rent + all fees
- **Occupancy Status**: Occupied, Vacant, Under Renovation
- **Move-in Date**: When tenant moved in
- **Move-out Date**: When tenant moved out (if vacant)
- **Days Vacant**: Number of days unit has been vacant
- **Last Rent Increase Date**: When rent was last increased
- **Last Rent Increase Amount**: Amount of last increase
- **Payment Status**: Current, Past Due, Partial
- **Days Past Due**: Number of days payment is overdue
- **Tenant Contact Information**: Phone, email

### Summary Metrics
- Total units
- Occupied units
- Vacant units
- Occupancy rate (%)
- Total monthly rent (potential - if all units rented at market rate)
- Total monthly rent (collected - actual from active leases)
- Average rent per unit
- Average rent per square foot

---

## Information Needed for Current Leases

### For Each Lease
- **Property Address**: Which property the lease is for
- **Unit Number/Identifier**: Which unit
- **Tenant Information**:
  - Name
  - Contact information (phone, email)
  - Emergency contact name
  - Emergency contact phone
- **Lease Terms**:
  - Lease start date
  - Lease end date
  - Lease term (months)
  - Monthly rent amount
  - Security deposit amount
  - Pet deposit (if applicable)
  - Parking fee (if separate from rent)
  - Storage fee (if separate from rent)
  - Other fees (application fees, etc.)
  - Total monthly rent (rent + all fees)
- **Lease Type**: Fixed-term, Month-to-month, Other
- **Renewal Options**:
  - Automatic renewal
  - Option to renew
  - None
  - Renewal terms (e.g., "5% increase", "Market rate")
- **Special Terms**: Any special conditions or terms
- **Guarantor Information** (if applicable):
  - Guarantor name
  - Guarantor contact information
- **Lease Document**: File attachment/link to lease agreement
- **Current Status**: Active, Expired, Terminated, Pending
- **Payment Information**:
  - Last payment date
  - Payment history (on-time, late, etc.)
  - Payment status (current, past due, partial)
  - Days past due (if applicable)

---

## Data Model Structure

### Units Table
```
- id
- propertyId
- unitNumber
- unitType (Studio, 1BR, 2BR, etc.)
- squareFootage
- bedrooms
- bathrooms
- marketRent
- notes
```

### Tenants Table
```
- id
- name
- email
- phone
- emergencyContact
- emergencyPhone
- notes
```

### Leases Table
```
- id
- propertyId
- unitId
- tenantId
- startDate
- endDate
- monthlyRent
- securityDeposit
- petDeposit
- parkingFee
- storageFee
- otherFees
- totalMonthlyRent (calculated)
- leaseType
- renewalOption
- renewalTerms
- status
- lastPaymentDate
- paymentStatus
- daysPastDue
- guarantorName
- guarantorContact
- specialTerms
- leaseDocumentUrl
- notes
```

---

## Data Sources for Rent Roll Generation

### Property-Level Data (Stored on Property)
- `totalUnits`: Total number of units in the property
- `occupiedUnits`: Number of currently occupied units
- `monthlyRentalIncome`: Total monthly rental income (summary)
- `occupancyRate`: Calculated from occupiedUnits / totalUnits

**Note**: This is summary data for quick display on property cards. The detailed rent roll requires unit-level and lease-level data.

### Unit-Level Data (Stored in Units Table)
- Unit number, type, square footage, bedrooms, bathrooms
- Market rent for each unit
- Links to property via `propertyId`

### Lease-Level Data (Stored in Leases Table)
- Tenant information (via `tenantId`)
- Lease dates, rent amounts, fees
- Payment status and history
- Links to unit via `unitId` and property via `propertyId`

### Tenant Data (Stored in Tenants Table)
- Contact information
- Emergency contacts
- Links to leases via `tenantId`

## Rent Roll Generation Flow

1. **User selects properties** in the Rent Roll Generator page (`/documents/rent-roll`)
2. **System fetches**:
   - Selected properties (summary data)
   - All units for selected properties
   - All active leases for those units
   - All tenants for those leases
3. **System aggregates**:
   - Totals across all selected properties
   - Unit-by-unit breakdown
   - Lease-by-lease details
4. **System generates PDF** with all combined data

## Implementation Notes

1. **Rent Roll** is generated from **Units + Leases + Tenants** data, not just property summary
2. **Current Leases** document lists all active leases with full details (owner leases TO tenants)
3. Both documents can be generated from:
   - Property detail page (single property)
   - Documents section (single or multiple properties)
4. Data should be stored in Airtable (or your database) and linked via IDs:
   - Property → Units (propertyId)
   - Units → Leases (unitId)
   - Leases → Tenants (tenantId)
5. Calculations (occupancy rate, total rent, etc.) should be computed dynamically
6. **Multi-property rent rolls** aggregate data from all selected properties
