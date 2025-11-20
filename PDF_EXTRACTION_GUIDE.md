# PDF Form Field Extraction Guide

This guide explains how to extract form fields from your PFS PDF template and map them to your data structure.

## Overview

The PDF extraction system consists of:
1. **Field Extraction**: Extracts all form fields from your PDF template
2. **Mapping Generation**: Creates a mapping template that suggests which data fields map to which PDF fields
3. **PDF Generation**: Uses the mapping to fill the PDF with your PFS data

## Quick Start

### Option 1: Browser-Based Extraction (Recommended)

1. Add the `PDFFieldExtractor` component to your app (e.g., in the GeneratePFS page)
2. Upload your PDF template
3. Click "Extract Form Fields"
4. Download the extracted fields JSON and mapping template
5. Review and update the mapping template with correct data paths

### Option 2: Command Line Extraction

If you prefer using the command line:

```bash
# Install tsx if you haven't already
npm install -D tsx

# Run the extraction script
npx tsx scripts/extract-pdf-fields.ts path/to/your/pfs-template.pdf
```

This will generate:
- `pdf-fields.json` - All extracted fields with their properties
- `pdf-field-mappings.json` - Mapping template with suggested data paths

## Understanding the Output

### Extracted Fields (`pdf-fields.json`)

Each field contains:
- `fieldName`: The name of the PDF form field
- `fieldType`: Type of field (text, checkbox, dropdown, radio, etc.)
- `defaultValue`: Any default value in the PDF
- `options`: Available options (for dropdowns/radios)

### Mapping Template (`pdf-field-mappings.json`)

Each mapping contains:
- `pdfFieldName`: The PDF field name
- `dataPath`: Suggested path to your data (e.g., `personalInfo.name`, `realEstate[0].address`)
- `fieldType`: How to format the value (text, number, date, currency, percentage)
- `validation`: Optional validation rules

## Manual Mapping

The automatic mapping is a starting point. You'll need to review and update the `dataPath` for each field to match your actual PFS data structure.

### Common Data Paths

Based on your PFS structure:

**Personal Information:**
- `personalInfo.name`
- `personalInfo.address`
- `personalInfo.dateOfBirth`

**Assets:**
- `assets.cashOnHand`
- `assets.cashOtherInstitutions`
- `assets.retirementAccounts`
- `assets.lifeInsuranceCashValue`
- `assets.automobilesTrucks`
- `assets.machineryTools`

**Liabilities:**
- `liabilities.notesPayableRelatives`
- `liabilities.accruedInterest`
- `liabilities.creditCardBalance`

**Real Estate:**
- `realEstate[0].address` - First property address
- `realEstate[0].marketValue` - First property value
- `realEstate[0].mortgages[0].principalBalance` - First mortgage balance

**Schedules:**
- `schedules.scheduleA[0].name` - Schedule A, first entry
- `schedules.scheduleB[0].amount` - Schedule B, first entry amount
- etc.

**Summaries:**
- `summaries.totalAssets`
- `summaries.totalLiabilities`
- `summaries.netWorth`
- `summaries.debtToAssetRatio`

### Array Indices

For arrays, use bracket notation:
- `realEstate[0]` - First property
- `realEstate[1]` - Second property
- `schedules.scheduleA[0]` - First Schedule A entry

## Using the Mapping

Once you've updated your mapping file, you can use it in your PDF generation code:

```typescript
import { fillPFSForm } from '@/lib/pdf/pdf-field-mapper';
import mappings from './pdf-field-mappings.json';

async function generatePDF(pfsData: FullPFS, templateBytes: Uint8Array) {
  const filledPDF = await fillPFSForm(templateBytes, pfsData, mappings);
  // Save or download the filled PDF
  return filledPDF;
}
```

## Field Type Formatting

The system automatically formats values based on field type:
- **currency**: Formats as USD currency (e.g., `$1,000,000`)
- **date**: Formats as MM/DD/YYYY
- **percentage**: Formats with % symbol (e.g., `5.25%`)
- **number**: Plain number
- **text**: Plain text

## Tips

1. **Field Names**: PDF field names are case-sensitive. Make sure your mapping uses the exact field names from the PDF.

2. **Multiple Properties**: If your PDF has multiple rows for properties, you may need to map them individually:
   - Property 1: `realEstate[0].address`
   - Property 2: `realEstate[1].address`
   - etc.

3. **Schedules**: Schedules are arrays, so map each row:
   - Schedule A Row 1: `schedules.scheduleA[0].name`
   - Schedule A Row 2: `schedules.scheduleA[1].name`

4. **Calculated Fields**: For totals and calculated values, use the `summaries` object which contains pre-calculated values.

5. **Missing Fields**: If a PDF field doesn't have a corresponding data field, you can either:
   - Leave it empty (the field will be blank in the PDF)
   - Add a custom data field to your PFS structure
   - Use a transform function to calculate the value

## Troubleshooting

**No fields extracted?**
- Make sure your PDF has form fields (not just text)
- Some PDFs may have fields that aren't properly tagged

**Fields not filling?**
- Check that the field names in your mapping match exactly
- Verify the data path exists in your PFS data structure
- Check the browser console for errors

**Wrong formatting?**
- Review the `fieldType` in your mapping
- You can add custom transform functions if needed

## Next Steps

1. Extract fields from your PDF template
2. Review and update the mapping template
3. Integrate the mapping into your PDF generation code
4. Test with sample data
5. Adjust mappings as needed

