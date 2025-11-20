/**
 * PDF Field Mapper
 * 
 * Maps PFS data to PDF form fields based on a configuration
 */

import { PDFDocument } from 'pdf-lib';
import type { PDFFormFieldMapping } from './extract-form-fields';
import type { FullPFS } from '@/domain/types';

export interface PDFGenerationOptions {
  mappings: PDFFormFieldMapping[];
  templateBytes: Uint8Array;
}

/**
 * Fill a PDF form with PFS data
 */
export async function fillPFSForm(
  templateBytes: Uint8Array,
  pfsData: FullPFS,
  mappings: PDFFormFieldMapping[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  for (const mapping of mappings) {
    try {
      const value = getValueFromPath(pfsData, mapping.dataPath);
      if (value === null || value === undefined) continue;
      
      const formattedValue = formatValue(value, mapping);
      const field = form.getTextField(mapping.pdfFieldName);
      field.setText(formattedValue);
    } catch (error) {
      console.warn(`Could not fill field ${mapping.pdfFieldName}:`, error);
      // Continue with other fields
    }
  }
  
  // Flatten the form to prevent further editing
  form.flatten();
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Get a value from an object using a dot-notation path
 * Supports array indices: e.g., "realEstate[0].address"
 */
function getValueFromPath(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    // Handle array indices like "realEstate[0]"
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      current = current[arrayName];
      if (!Array.isArray(current)) return null;
      current = current[parseInt(index, 10)];
    } else {
      current = current[part];
    }
    
    if (current === null || current === undefined) return null;
  }
  
  return current;
}

/**
 * Format a value according to the field type
 */
function formatValue(value: any, mapping: PDFFormFieldMapping): string {
  switch (mapping.fieldType) {
    case 'currency':
      return formatCurrency(value);
    case 'date':
      return formatDate(value);
    case 'percentage':
      return formatPercentage(value);
    case 'number':
      return String(value);
    case 'text':
    default:
      return String(value);
  }
}

/**
 * Format a number as currency
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a date value
 */
function formatDate(value: string | Date): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format a number as percentage
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

