/**
 * PDF Filler using pdf-lib
 * 
 * Fills PDF form fields based on PFS field mappings
 */

import { PDFDocument } from 'pdf-lib';
import { PFS_FIELD_MAPPINGS, type PFSFieldMapping } from './pfs-field-mapping';

/**
 * PFS Form Data Structure
 * This matches the data structure used in GeneratePFS component
 */
export interface PFSFormData {
  // Personal Information
  borrowerName: string;

  // Current Assets
  cashOnHand: number;
  cashOtherInstitutions: number;
  buildingMaterialInventory: number;
  lifeInsuranceCashValue: number;
  retirementAccounts: number;

  // Other Assets
  automobilesTrucks: number;
  machineryTools: number;
  otherAssets: string;
  otherAssetsValue: number;

  // Current Liabilities
  notesPayableRelatives: number;
  accruedInterest: number;
  accruedSalaryWages: number;
  accruedTaxesOther: number;
  incomeTaxPayable: number;

  // Other Liabilities
  chattelMortgage: number;
  otherLiabilities: string;
  otherLiabilitiesValue: number;

  // Contingent Liabilities
  guaranteedLoans: number;
  suretyBonds: number;
  contingentOther: string;
  contingentOtherValue: number;

  // Insurance
  insuranceDescription: string;
  insuranceAmount: number;
  lifeInsuranceFaceValue: number;
  lifeInsuranceBorrowed: number;

  // Income
  salaryWages: number;
  proprietorshipDraws: number;
  commissionsBonus: number;
  dividendsInterest: number;
  rentals: number;
  otherIncome: number;

  // Schedules
  scheduleA: Array<{ name: string; amount: number; dueDate: string }>;
  scheduleB: Array<{ name: string; amount: number; dueDate: string }>;
  scheduleC: Array<{
    registeredName: string;
    shares: number;
    marketPerShare: number;
    totalValue: number;
  }>;
  scheduleD: Array<{
    registeredName: string;
    shares: number;
    marketPerShare: number;
    totalValue: number;
  }>;
  scheduleE: Array<{
    description: string;
    debtorName: string;
    paymentSchedule: string;
    pastDue: number;
    originalBalance: number;
    presentBalance: number;
    interestRate: number;
  }>;
  scheduleG: Array<{ payableTo: string; amount: number; dueDate: string }>;
  scheduleH: Array<{ payableTo: string; amount: number; dueDate: string }>;
  scheduleI: Array<{
    payableTo: string;
    collateral: string;
    balance: number;
    finalDueDate: string;
    monthlyPayment: number;
  }>;

  // Properties (Schedule F)
  selectedProperties: Array<{
    id: string;
    address: string;
    propertyType: string;
    yearAcquired: string;
    originalCost: number;
    currentValue: number;
    ownershipPercentage: number;
    lender?: string;
    balance?: number;
    payment?: number;
  }>;

  // Mortgages (for property calculations)
  mortgages?: Array<{
    propertyId: string;
    principalBalance: number;
    paymentAmount: number;
  }>;

  // Summaries (calculated totals)
  summaries?: {
    totalAssets: number;
    totalLiabilities: number;
  };
}

/**
 * Format field value based on field type
 */
function formatFieldValue(value: any, fieldType: PFSFieldMapping['fieldType']): string {
  // Handle null/undefined/empty string - always return blank
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  // For numbers, 0 should be blank (not displayed)
  if (typeof value === 'number' && value === 0) {
    return '';
  }
  
  // For strings that represent zero, also return blank
  if (typeof value === 'string' && (value.trim() === '0' || value.trim() === '')) {
    return '';
  }

  switch (fieldType) {
    case 'currency':
      // Format currency with dollar sign and commas
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(numValue) || numValue === 0) return '';
      
      // Round to whole number (no decimals for currency)
      const roundedValue = Math.round(numValue);
      
      // Format with commas manually to ensure it works
      const formattedNumber = roundedValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      
      // Add dollar sign at the beginning
      return `$${formattedNumber}`;
    
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
        });
      }
      if (typeof value === 'string' && value.includes('-')) {
        // ISO date string (YYYY-MM-DD)
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
          });
        }
      }
      // If date is invalid or empty, return blank
      return '';
    
    case 'percentage':
      const percentValue = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(percentValue) || percentValue === 0) return '';
      return `${percentValue.toFixed(2)}%`;
    
    case 'number':
      const num = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(num) || num === 0) return '';
      // Format number with commas for readability
      return num.toLocaleString('en-US');
    
    case 'text':
    default:
      const textValue = String(value).trim();
      return textValue === '' || textValue === '0' ? '' : textValue;
  }
}

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

/**
 * Get schedule value based on mapping
 */
function getScheduleValue(
  data: PFSFormData,
  mapping: PFSFieldMapping
): any {
  if (!mapping.scheduleType || mapping.scheduleIndex === undefined || !mapping.scheduleField) {
    return undefined;
  }

  const scheduleKey = `schedule${mapping.scheduleType}` as keyof PFSFormData;
  const schedule = data[scheduleKey] as any[];

  if (!Array.isArray(schedule) || !schedule[mapping.scheduleIndex]) {
    return undefined;
  }

  const scheduleItem = schedule[mapping.scheduleIndex];
  const value = scheduleItem[mapping.scheduleField];
  
  // Return undefined for empty/zero values so field stays blank
  if (value === null || value === undefined || value === '' || value === 0) {
    return undefined;
  }
  
  return value;
}

/**
 * Get property value based on mapping
 */
function getPropertyValue(
  data: PFSFormData,
  mapping: PFSFieldMapping
): any {
  if (mapping.propertyIndex === undefined || !mapping.propertyField) {
    return undefined;
  }

  if (!data.selectedProperties || !data.selectedProperties[mapping.propertyIndex]) {
    return undefined;
  }

  const property = data.selectedProperties[mapping.propertyIndex];
  
  // Handle special property field mappings
  if (mapping.propertyField === 'yearAcquired') {
    // Extract year from date string or return as-is
    const yearAcquired = property.yearAcquired || '';
    if (yearAcquired === '') {
      return undefined; // Return undefined for empty dates
    }
    if (yearAcquired.includes('-')) {
      return yearAcquired.split('-')[0];
    }
    return yearAcquired;
  }

  if (mapping.propertyField === 'balance') {
    // Get balance from mortgage if available
    if (data.mortgages) {
      const mortgage = data.mortgages.find(m => m.propertyId === property.id);
      const balance = mortgage?.principalBalance || property.balance;
      // Return undefined for zero/empty values
      return (balance && balance > 0) ? balance : undefined;
    }
    const balance = property.balance;
    return (balance && balance > 0) ? balance : undefined;
  }

  if (mapping.propertyField === 'payment') {
    // Get payment from mortgage if available
    if (data.mortgages) {
      const mortgage = data.mortgages.find(m => m.propertyId === property.id);
      const payment = mortgage?.paymentAmount || property.payment;
      // Return undefined for zero/empty values
      return (payment && payment > 0) ? payment : undefined;
    }
    const payment = property.payment;
    return (payment && payment > 0) ? payment : undefined;
  }

  const value = property[mapping.propertyField as keyof typeof property];
  
  // Return undefined for empty/zero values
  if (value === null || value === undefined || value === '' || value === 0) {
    return undefined;
  }
  
  return value;
}

/**
 * Get calculated value based on mapping
 */
function getCalculatedValue(
  data: PFSFormData,
  mapping: PFSFieldMapping
): any {
  if (!mapping.calculate) {
    return undefined;
  }

  try {
    const result = mapping.calculate(data);
    // If calculation results in 0, return undefined so field stays blank
    if (result === 0 || result === null || result === undefined) {
      return undefined;
    }
    return result;
  } catch (error) {
    console.warn(`Error calculating value for ${mapping.pdfFieldName}:`, error);
    return undefined;
  }
}

/**
 * Fill PDF form with PFS data
 * 
 * @param templateBytes - PDF template as Uint8Array
 * @param formData - PFS form data to fill
 * @param options - Optional configuration
 * @returns Filled PDF as Uint8Array
 */
/**
 * List all form fields in a PDF (for debugging)
 */
export async function listPDFFields(templateBytes: Uint8Array): Promise<{
  textFields: string[];
  checkboxes: string[];
  dropdowns: string[];
  radios: string[];
  allFields: string[];
  fieldDetails: Array<{ name: string; type: string; value?: string }>;
}> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  const textFields: string[] = [];
  const checkboxes: string[] = [];
  const dropdowns: string[] = [];
  const radios: string[] = [];
  const allFields: string[] = [];
  const fieldDetails: Array<{ name: string; type: string; value?: string }> = [];
  
  // Get all field names
  const fieldNames = form.getFields().map(field => field.getName());
  
  for (const fieldName of fieldNames) {
    allFields.push(fieldName);
    let fieldType = 'unknown';
    let fieldValue: string | undefined;
    
    try {
      const field = form.getTextField(fieldName);
      fieldType = 'text';
      fieldValue = field.getText();
      textFields.push(fieldName);
    } catch {
      try {
        const field = form.getCheckBox(fieldName);
        fieldType = 'checkbox';
        fieldValue = field.isChecked() ? 'checked' : 'unchecked';
        checkboxes.push(fieldName);
      } catch {
        try {
          const field = form.getDropdown(fieldName);
          fieldType = 'dropdown';
          fieldValue = field.getSelected() || '';
          dropdowns.push(fieldName);
        } catch {
          try {
            const field = form.getRadioGroup(fieldName);
            fieldType = 'radio';
            fieldValue = field.getSelected() || '';
            radios.push(fieldName);
          } catch {
            // Unknown field type
          }
        }
      }
    }
    
    fieldDetails.push({ name: fieldName, type: fieldType, value: fieldValue });
  }
  
  return { textFields, checkboxes, dropdowns, radios, allFields, fieldDetails };
}

export async function fillPFSForm(
  templateBytes: Uint8Array,
  formData: PFSFormData,
  options?: {
    flatten?: boolean; // Flatten form to prevent further editing (default: true)
    debug?: boolean; // Enable debug logging (default: false)
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  
  // Check if PDF has a form
  let form;
  try {
    form = pdfDoc.getForm();
  } catch (error) {
    throw new Error('PDF does not contain a form. Please ensure your PDF template has form fields (AcroForm).');
  }

  const flatten = options?.flatten !== false; // Default to true
  const debug = options?.debug === true;
  
  // Check if form has any fields
  const allFields = form.getFields();
  if (allFields.length === 0) {
    throw new Error('PDF form has no fields. Please ensure your PDF template has form fields.');
  }

  // List all available fields for debugging
  if (debug) {
    const allFields = form.getFields().map(f => f.getName());
    console.log('=== PDF Form Fields Debug ===');
    console.log(`Total fields in PDF: ${allFields.length}`);
    console.log('Available field names:', allFields);
    console.log('Expected field names from mappings:', PFS_FIELD_MAPPINGS.map(m => m.pdfFieldName));
    
    // Show first few field names for comparison
    console.log('\nFirst 10 available fields:', allFields.slice(0, 10));
    console.log('First 10 expected fields:', PFS_FIELD_MAPPINGS.slice(0, 10).map(m => m.pdfFieldName));
    
    // Check for exact matches
    const expectedFields = new Set(PFS_FIELD_MAPPINGS.map(m => m.pdfFieldName));
    const matchingFields = allFields.filter(f => expectedFields.has(f));
    console.log(`\nMatching fields: ${matchingFields.length} out of ${PFS_FIELD_MAPPINGS.length}`);
    if (matchingFields.length > 0) {
      console.log('Matching field names:', matchingFields.slice(0, 20));
    }
  }

  // Track fields that were successfully filled
  const filledFields: string[] = [];
  const failedFields: Array<{ name: string; reason: string }> = [];
  const missingFields: string[] = [];

  // Get all available field names
  const availableFieldNames = form.getFields().map(f => f.getName());
  const availableFieldsSet = new Set(availableFieldNames);

  // Iterate through all field mappings
  for (const mapping of PFS_FIELD_MAPPINGS) {
    try {
      // Check if field exists
      if (!availableFieldsSet.has(mapping.pdfFieldName)) {
        missingFields.push(mapping.pdfFieldName);
        if (debug) {
          console.warn(`Field "${mapping.pdfFieldName}" not found in PDF`);
        }
        continue;
      }

      // Get the form field - try different field types
      let field: any;
      let fieldType = 'unknown';
      
      try {
        field = form.getTextField(mapping.pdfFieldName);
        fieldType = 'text';
      } catch {
        try {
          field = form.getDropdown(mapping.pdfFieldName);
          fieldType = 'dropdown';
        } catch {
          try {
            field = form.getCheckBox(mapping.pdfFieldName);
            fieldType = 'checkbox';
          } catch {
            failedFields.push({ 
              name: mapping.pdfFieldName, 
              reason: 'Field exists but is not a supported type' 
            });
            if (debug) {
              console.warn(`Field "${mapping.pdfFieldName}" exists but is not a text/dropdown/checkbox field`);
            }
            continue;
          }
        }
      }

      // Get value based on data source
      let value: any = undefined;

      if (mapping.dataSource === 'direct' && mapping.dataPath) {
        // Handle both dot notation and direct property access
        if (mapping.dataPath.includes('.')) {
          value = getNestedValue(formData, mapping.dataPath);
        } else {
          // Direct property access
          value = (formData as any)[mapping.dataPath];
        }
        
        // Convert zero/empty values to undefined so fields stay blank
        if (value === 0 || value === null || value === '' || value === undefined) {
          value = undefined;
        }
        
        if (debug) {
          const formDataValue = (formData as any)[mapping.dataPath];
          console.log(`[${mapping.pdfFieldName}] Direct path "${mapping.dataPath}":`, value, `(formData.${mapping.dataPath} = ${formDataValue})`);
        }
        if (value === undefined) {
          if (debug) {
            console.log(`[${mapping.pdfFieldName}] ⚠️ No value found at path: ${mapping.dataPath} (will be blank)`);
          }
        }
      } else if (mapping.dataSource === 'calculated' && mapping.calculate) {
        value = getCalculatedValue(formData, mapping);
        if (debug) {
          console.log(`[${mapping.pdfFieldName}] Calculated value:`, value);
        }
      } else if (mapping.dataSource === 'schedule') {
        value = getScheduleValue(formData, mapping);
        if (debug) {
          console.log(`[${mapping.pdfFieldName}] Schedule value (${mapping.scheduleType}[${mapping.scheduleIndex}].${mapping.scheduleField}):`, value);
        }
        if (debug && value === undefined) {
          console.warn(`[${mapping.pdfFieldName}] No schedule value (Schedule ${mapping.scheduleType}, index ${mapping.scheduleIndex}, field ${mapping.scheduleField})`);
        }
      } else if (mapping.dataSource === 'property') {
        value = getPropertyValue(formData, mapping);
        if (debug) {
          console.log(`[${mapping.pdfFieldName}] Property value (index ${mapping.propertyIndex}, field ${mapping.propertyField}):`, value);
        }
        if (debug && value === undefined) {
          console.warn(`[${mapping.pdfFieldName}] No property value (Property index ${mapping.propertyIndex}, field ${mapping.propertyField})`);
        }
      }

      // Apply transform if provided
      if (value !== undefined && mapping.transform) {
        const originalValue = value;
        value = mapping.transform(value);
        if (debug) {
          console.log(`[${mapping.pdfFieldName}] Transform: ${originalValue} -> ${value}`);
        }
      }

      // Format value based on field type
      const formattedValue = formatFieldValue(value, mapping.fieldType);
      
      if (debug) {
        console.log(`[${mapping.pdfFieldName}] Raw value: ${value}, Field type: ${mapping.fieldType}, Formatted: "${formattedValue}"`);
      }

      // Set field value - always try to set, even if empty (to clear fields)
      try {
        if (fieldType === 'text') {
          // Set the formatted value directly - this should include $ and commas for currency
          if (formattedValue !== '') {
            field.setText(formattedValue);
            
            // Immediately verify what was actually set
            const actualValue = field.getText();
            
            if (debug) {
              console.log(`[${mapping.pdfFieldName}] Attempted to set: "${formattedValue}"`);
              console.log(`[${mapping.pdfFieldName}] Actually set in PDF: "${actualValue}"`);
              
              // For currency fields, show a clear message
              if (mapping.fieldType === 'currency' && formattedValue !== '') {
                if (actualValue === formattedValue) {
                  console.log(`[${mapping.pdfFieldName}] ✓ Currency formatted correctly: "${formattedValue}"`);
                } else {
                  console.error(`[${mapping.pdfFieldName}] ✗ Currency formatting issue! Expected: "${formattedValue}", Got: "${actualValue}"`);
                }
              }
            }
            
            // Count as filled if we set a non-empty value
            if (formattedValue !== '') {
              filledFields.push(mapping.pdfFieldName);
            }
          } else {
            // Clear the field if value is empty
            field.setText('');
          }
        } else if (fieldType === 'dropdown') {
          // Try to set dropdown value
          try {
            field.select(formattedValue);
            filledFields.push(mapping.pdfFieldName);
            if (debug) {
              console.log(`[${mapping.pdfFieldName}] Set dropdown to: "${formattedValue}"`);
            }
          } catch {
            // If exact match fails, try setting text
            try {
              field.setText(formattedValue);
              filledFields.push(mapping.pdfFieldName);
              if (debug) {
                console.log(`[${mapping.pdfFieldName}] Set dropdown text to: "${formattedValue}"`);
              }
            } catch (err) {
              failedFields.push({ 
                name: mapping.pdfFieldName, 
                reason: `Failed to set dropdown: ${err}` 
              });
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[${mapping.pdfFieldName}] Error setting field value:`, errorMessage);
        failedFields.push({ 
          name: mapping.pdfFieldName, 
          reason: `Error setting value: ${errorMessage}` 
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error filling field ${mapping.pdfFieldName}:`, errorMessage);
      failedFields.push({ 
        name: mapping.pdfFieldName, 
        reason: errorMessage 
      });
      // Continue with other fields
    }
  }

  // Log summary
  console.log(`\n=== PDF Filling Summary ===`);
  console.log(`Total mappings: ${PFS_FIELD_MAPPINGS.length}`);
  console.log(`Fields found in PDF: ${availableFieldNames.length}`);
  console.log(`Successfully filled: ${filledFields.length}`);
  console.log(`Missing fields (not in PDF): ${missingFields.length}`);
  console.log(`Failed fields: ${failedFields.length}`);
  
  if (missingFields.length > 0) {
    console.warn('\n⚠️ Missing fields (not found in PDF):', missingFields.slice(0, 20));
    if (missingFields.length > 20) {
      console.warn(`... and ${missingFields.length - 20} more`);
    }
  }
  
  if (failedFields.length > 0) {
    console.error('\n❌ Failed fields:', failedFields.slice(0, 20));
    if (failedFields.length > 20) {
      console.error(`... and ${failedFields.length - 20} more`);
    }
  }
  
  if (filledFields.length > 0) {
    console.log('\n✅ Successfully filled fields:', filledFields.slice(0, 20));
    if (filledFields.length > 20) {
      console.log(`... and ${filledFields.length - 20} more`);
    }
  } else {
    console.error('\n❌ WARNING: No fields were successfully filled!');
    console.error('This could mean:');
    console.error('1. Field names in PDF don\'t match the mappings');
    console.error('2. All values are empty');
    console.error('3. Fields are read-only or protected');
  }
  
  // Show sample of form data for debugging
  if (debug) {
    console.log('\n=== Form Data Sample ===');
    console.log('borrowerName:', formData.borrowerName);
    console.log('cashOnHand:', formData.cashOnHand);
    console.log('scheduleA length:', formData.scheduleA?.length);
    console.log('selectedProperties length:', formData.selectedProperties?.length);
  }

  // Before flattening, verify at least one field was set
  if (debug && filledFields.length === 0) {
    console.error('\n⚠️ WARNING: No fields were filled before flattening!');
    console.error('Attempting to test field setting with a sample value...');
    
    // Try to set a test value on the first available field
    if (availableFieldNames.length > 0) {
      try {
        const testFieldName = availableFieldNames[0];
        const testField = form.getTextField(testFieldName);
        testField.setText('TEST_VALUE');
        const testValue = testField.getText();
        console.log(`Test: Set "${testFieldName}" to "TEST_VALUE", read back: "${testValue}"`);
        if (testValue === 'TEST_VALUE') {
          console.log('✓ Field setting works! The issue is likely with field names or data extraction.');
        } else {
          console.error('✗ Field setting failed! Field may be read-only or protected.');
        }
        // Clear the test value
        testField.setText('');
      } catch (err) {
        console.error('✗ Could not test field setting:', err);
      }
    }
  }

  // Flatten form to prevent further editing (optional)
  // NOTE: Flattening converts form fields to static text, so fields should be filled before this
  if (flatten) {
    if (debug) {
      console.log('\nFlattening form (converting fields to static text)...');
    }
    form.flatten();
  }

  // Save and return PDF bytes
  if (debug) {
    console.log('\nSaving PDF...');
  }
  const pdfBytes = await pdfDoc.save();
  
  if (debug) {
    console.log(`PDF saved successfully. Size: ${(pdfBytes.length / 1024).toFixed(2)} KB`);
  }
  
  return pdfBytes;
}

/**
 * Download PDF as file
 */
export function downloadPDF(pdfBytes: Uint8Array, filename: string = 'PFS.pdf'): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

