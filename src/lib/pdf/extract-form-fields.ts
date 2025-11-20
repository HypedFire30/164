/**
 * PDF Form Field Extraction Utility
 * 
 * This utility extracts all form fields from a PDF template and helps
 * map them to the PFS data structure.
 */

import { PDFDocument } from 'pdf-lib';

export interface PDFFormField {
  fieldName: string;
  fieldType: 'text' | 'button' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'unknown';
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  defaultValue?: string;
  isRequired?: boolean;
  options?: string[]; // For dropdown/radio fields
}

export interface PDFFormFieldMapping {
  pdfFieldName: string;
  dataPath: string; // e.g., "personalInfo.name", "realEstate[0].address"
  fieldType: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  transform?: (value: any) => string; // Optional transformation function
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

/**
 * Extract all form fields from a PDF document
 */
export async function extractFormFields(pdfBytes: Uint8Array): Promise<PDFFormField[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  const pages = pdfDoc.getPages();
  
  const extractedFields: PDFFormField[] = [];
  
  for (const field of fields) {
    const fieldName = field.getName();
    const fieldType = getFieldType(field);
    
    // Get field appearance and position
    // Note: pdf-lib doesn't directly expose field positions, so we'll need to
    // use the field name and type as identifiers
    const fieldInfo: PDFFormField = {
      fieldName,
      fieldType,
      pageNumber: 1, // Default to page 1, may need manual adjustment
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    
    // Try to get default value if it exists
    try {
      if (fieldType === 'text') {
        const textField = form.getTextField(fieldName);
        const value = textField.getText();
        if (value) fieldInfo.defaultValue = value;
      } else if (fieldType === 'checkbox') {
        const checkbox = form.getCheckBox(fieldName);
        fieldInfo.defaultValue = checkbox.isChecked() ? 'true' : 'false';
      } else if (fieldType === 'dropdown') {
        const dropdown = form.getDropdown(fieldName);
        const selected = dropdown.getSelected();
        if (selected.length > 0) {
          fieldInfo.defaultValue = selected[0];
          fieldInfo.options = dropdown.getOptions();
        }
      } else if (fieldType === 'radio') {
        const radio = form.getRadioGroup(fieldName);
        const selected = radio.getSelected();
        if (selected) {
          fieldInfo.defaultValue = selected;
          fieldInfo.options = radio.getOptions();
        }
      }
    } catch (error) {
      // Field might not be accessible in this way, continue
      console.warn(`Could not extract default value for field: ${fieldName}`, error);
    }
    
    extractedFields.push(fieldInfo);
  }
  
  return extractedFields;
}

/**
 * Determine the type of a PDF form field
 */
function getFieldType(field: any): PDFFormField['fieldType'] {
  const fieldType = field.constructor.name;
  
  if (fieldType.includes('PDFTextField')) return 'text';
  if (fieldType.includes('PDFCheckBox')) return 'checkbox';
  if (fieldType.includes('PDFRadioGroup')) return 'radio';
  if (fieldType.includes('PDFDropdown')) return 'dropdown';
  if (fieldType.includes('PDFButton')) return 'button';
  if (fieldType.includes('PDFSignature')) return 'signature';
  
  return 'unknown';
}

/**
 * Export form fields to a JSON file for analysis
 */
export async function exportFormFieldsToJSON(
  pdfBytes: Uint8Array,
  outputPath?: string
): Promise<string> {
  const fields = await extractFormFields(pdfBytes);
  const json = JSON.stringify(fields, null, 2);
  
  if (outputPath) {
    // In browser environment, we'll return the JSON string
    // In Node.js, we could write to file
    return json;
  }
  
  return json;
}

/**
 * Generate a mapping template based on extracted fields and PFS data structure
 */
export function generateMappingTemplate(
  pdfFields: PDFFormField[],
  suggestedMappings?: Partial<Record<string, string>>
): PDFFormFieldMapping[] {
  const mappings: PDFFormFieldMapping[] = [];
  
  for (const field of pdfFields) {
    // Try to infer the data path from field name
    const suggestedPath = suggestedMappings?.[field.fieldName] || inferDataPath(field.fieldName);
    
    mappings.push({
      pdfFieldName: field.fieldName,
      dataPath: suggestedPath,
      fieldType: inferFieldType(field.fieldName, field.fieldType),
      validation: {
        required: field.isRequired,
      },
    });
  }
  
  return mappings;
}

/**
 * Infer a data path from a PDF field name
 * This is a heuristic - manual review will be needed
 */
function inferDataPath(fieldName: string): string {
  const name = fieldName.toLowerCase();
  
  // Personal Information
  if (name.includes('borrower') || name.includes('name') || name.includes('applicant')) {
    if (name.includes('name')) return 'personalInfo.name';
    if (name.includes('address')) return 'personalInfo.address';
    if (name.includes('dob') || name.includes('birth')) return 'personalInfo.dateOfBirth';
  }
  
  // Assets - Cash
  if (name.includes('cash') && name.includes('hand')) return 'assets.cashOnHand';
  if (name.includes('cash') && name.includes('other')) return 'assets.cashOtherInstitutions';
  if (name.includes('retirement')) return 'assets.retirementAccounts';
  if (name.includes('life') && name.includes('insurance')) return 'assets.lifeInsuranceCashValue';
  
  // Assets - Other
  if (name.includes('automobile') || name.includes('vehicle')) return 'assets.automobilesTrucks';
  if (name.includes('machinery') || name.includes('tools')) return 'assets.machineryTools';
  
  // Liabilities
  if (name.includes('mortgage') && name.includes('balance')) return 'liabilities.mortgageBalance';
  if (name.includes('note') && name.includes('payable')) return 'liabilities.notesPayable';
  if (name.includes('credit') && name.includes('card')) return 'liabilities.creditCardBalance';
  
  // Income
  if (name.includes('salary') || name.includes('wage')) return 'income.salaryWages';
  if (name.includes('rental')) return 'income.rentals';
  if (name.includes('dividend') || name.includes('interest')) return 'income.dividendsInterest';
  
  // Totals
  if (name.includes('total') && name.includes('asset')) return 'summaries.totalAssets';
  if (name.includes('total') && name.includes('liabilit')) return 'summaries.totalLiabilities';
  if (name.includes('net') && name.includes('worth')) return 'summaries.netWorth';
  
  // Schedule fields
  if (name.includes('schedule')) {
    const scheduleMatch = name.match(/schedule\s*([a-i])/i);
    if (scheduleMatch) {
      const schedule = scheduleMatch[1].toUpperCase();
      return `schedules.schedule${schedule}`;
    }
  }
  
  // Default: return field name as-is for manual mapping
  return `manual.${fieldName}`;
}

/**
 * Infer field type from field name and PDF field type
 */
function inferFieldType(fieldName: string, pdfFieldType: string): PDFFormFieldMapping['fieldType'] {
  const name = fieldName.toLowerCase();
  
  if (name.includes('date') || name.includes('dob')) return 'date';
  if (name.includes('rate') || name.includes('percent') || name.includes('%')) return 'percentage';
  if (name.includes('amount') || name.includes('balance') || name.includes('value') || 
      name.includes('price') || name.includes('payment') || name.includes('income')) {
    return 'currency';
  }
  if (name.includes('number') || name.includes('count') || name.includes('shares')) {
    return 'number';
  }
  
  return 'text';
}

/**
 * Create a mapping configuration file
 */
export function createMappingConfig(mappings: PDFFormFieldMapping[]): string {
  return JSON.stringify(mappings, null, 2);
}

