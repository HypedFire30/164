/**
 * Browser-based PDF Form Field Extraction
 * 
 * This version works in the browser environment
 */

import { PDFDocument } from 'pdf-lib';
import type { PDFFormField, PDFFormFieldMapping } from './extract-form-fields';

/**
 * Extract form fields from a PDF file in the browser
 */
export async function extractFormFieldsFromFile(file: File): Promise<PDFFormField[]> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  return extractFormFieldsFromBytes(uint8Array);
}

/**
 * Extract form fields from PDF bytes
 */
export async function extractFormFieldsFromBytes(pdfBytes: Uint8Array): Promise<PDFFormField[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  
  const extractedFields: PDFFormField[] = [];
  
  for (const field of fields) {
    const fieldName = field.getName();
    const fieldType = getFieldType(field);
    
    const fieldInfo: PDFFormField = {
      fieldName,
      fieldType,
      pageNumber: 1, // Default to page 1
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
      // Field might not be accessible, continue
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
 * Download extracted fields as JSON
 */
export function downloadFieldsAsJSON(fields: PDFFormField[], filename = 'pdf-fields.json') {
  const data = {
    extractedAt: new Date().toISOString(),
    totalFields: fields.length,
    fields: fields,
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download mapping template
 */
export function generateAndDownloadMapping(
  fields: PDFFormField[],
  suggestedMappings?: Partial<Record<string, string>>
) {
  const mappings = generateMappingTemplate(fields, suggestedMappings);
  
  const data = {
    extractedAt: new Date().toISOString(),
    totalMappings: mappings.length,
    mappings: mappings,
    note: 'Review and update the dataPath for each field to match your PFS data structure',
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pdf-field-mappings.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a mapping template
 */
function generateMappingTemplate(
  pdfFields: PDFFormField[],
  suggestedMappings?: Partial<Record<string, string>>
): PDFFormFieldMapping[] {
  const mappings: PDFFormFieldMapping[] = [];
  
  for (const field of pdfFields) {
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

