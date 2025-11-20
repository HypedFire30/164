/**
 * PFS PDF Generation Service
 * 
 * Generates a filled PDF from PFS data using the field mapping configuration
 */

import { PDFDocument } from 'pdf-lib';
import { PFS_FIELD_MAPPINGS, type PFSFieldMapping } from './pfs-field-mapping';

export interface PFSFormData {
  // Personal Information
  borrowerName?: string;
  
  // Assets
  cashOnHand?: number;
  cashOtherInstitutions?: number;
  buildingMaterialInventory?: number;
  lifeInsuranceCashValue?: number;
  retirementAccounts?: number;
  automobilesTrucks?: number;
  machineryTools?: number;
  otherAssets?: string;
  otherAssetsValue?: number;
  
  // Liabilities
  notesPayableRelatives?: number;
  accruedInterest?: number;
  accruedSalaryWages?: number;
  accruedTaxesOther?: number;
  incomeTaxPayable?: number;
  chattelMortgage?: number;
  otherLiabilities?: string;
  otherLiabilitiesValue?: number;
  
  // Income
  salaryWages?: number;
  proprietorshipDraws?: number;
  commissionsBonus?: number;
  dividendsInterest?: number;
  rentals?: number;
  otherIncome?: number;
  
  // Contingent Liabilities
  guaranteedLoans?: number;
  suretyBonds?: number;
  contingentOther?: string;
  contingentOtherValue?: number;
  
  // Insurance
  insuranceDescription?: string;
  insuranceAmount?: number;
  lifeInsuranceFaceValue?: number;
  lifeInsuranceBorrowed?: number;
  
  // Schedules
  scheduleA?: Array<{ name: string; amount: number; dueDate: string }>;
  scheduleB?: Array<{ name: string; amount: number; dueDate: string }>;
  scheduleC?: Array<{ registeredName: string; shares: number; marketPerShare: number; totalValue: number }>;
  scheduleD?: Array<{ registeredName: string; shares: number; marketPerShare: number; totalValue: number }>;
  scheduleE?: Array<{ description: string; debtorName: string; paymentSchedule: string; pastDue: number; originalBalance: number; presentBalance: number; interestRate: number }>;
  scheduleG?: Array<{ payableTo: string; amount: number; dueDate: string }>;
  scheduleH?: Array<{ payableTo: string; amount: number; dueDate: string }>;
  scheduleI?: Array<{ payableTo: string; collateral: string; balance: number; finalDueDate: string; monthlyPayment: number }>;
  
  // Properties (for Schedule F)
  selectedProperties?: Array<{
    id: string;
    address: string;
    currentValue: number;
    ownershipPercentage: number;
    purchasePrice?: number;
    propertyType?: string;
    acquisitionDate?: string;
  }>;
  mortgages?: Array<{
    propertyId: string;
    lender: string;
    principalBalance: number;
    paymentAmount: number;
  }>;
  
  // Summaries (calculated values)
  summaries?: {
    totalAssets?: number;
    totalLiabilities?: number;
  };
}

/**
 * Format a value according to field type
 */
function formatValue(value: any, fieldType: PFSFieldMapping['fieldType']): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  switch (fieldType) {
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
 * Format a number as currency (no $ symbol, just number with commas)
 */
function formatCurrency(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a date value
 */
function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';
    
    // Format as MM/DD/YYYY
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return '';
  }
}

/**
 * Format a number as percentage
 */
function formatPercentage(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '';
  return `${value.toFixed(2)}%`;
}

/**
 * Get value from data based on mapping
 */
function getValueFromMapping(mapping: PFSFieldMapping, data: PFSFormData): any {
  switch (mapping.dataSource) {
    case 'direct':
      if (!mapping.dataPath) return null;
      return getNestedValue(data, mapping.dataPath);
    
    case 'schedule':
      if (mapping.scheduleType && mapping.scheduleIndex !== undefined && mapping.scheduleField) {
        const schedule = data[`schedule${mapping.scheduleType}` as keyof PFSFormData] as any[];
        if (!schedule || !Array.isArray(schedule)) return null;
        const item = schedule[mapping.scheduleIndex];
        if (!item) return null;
        return item[mapping.scheduleField];
      }
      return null;
    
    case 'property':
      if (mapping.propertyIndex !== undefined && mapping.propertyField) {
        const properties = data.selectedProperties;
        if (!properties || !Array.isArray(properties)) return null;
        const property = properties[mapping.propertyIndex];
        if (!property) return null;
        
        // Map property fields
        switch (mapping.propertyField) {
          case 'address':
            return property.address;
          case 'propertyType':
            return property.propertyType || 'Residential';
          case 'yearAcquired':
            return property.acquisitionDate;
          case 'originalCost':
            return property.purchasePrice || 0;
          case 'currentValue':
            return (property.currentValue || 0) * ((property.ownershipPercentage || 0) / 100);
          case 'lender':
            const mortgage = data.mortgages?.find(m => m.propertyId === property.id);
            return mortgage?.lender || '';
          case 'balance':
            const mortgage2 = data.mortgages?.find(m => m.propertyId === property.id);
            return mortgage2?.principalBalance || 0;
          case 'payment':
            const mortgage3 = data.mortgages?.find(m => m.propertyId === property.id);
            return mortgage3?.paymentAmount || 0;
          default:
            return null;
        }
      }
      return null;
    
    case 'calculated':
      if (mapping.calculate) {
        return mapping.calculate(data);
      }
      return null;
    
    default:
      return null;
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return null;
    current = current[part];
  }
  
  return current;
}

/**
 * Generate filled PFS PDF
 */
export async function generatePFSPDF(
  templateBytes: Uint8Array,
  formData: PFSFormData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  // Fill all fields based on mapping
  for (const mapping of PFS_FIELD_MAPPINGS) {
    try {
      const value = getValueFromMapping(mapping, formData);
      if (value === null || value === undefined || value === '') {
        continue; // Skip empty values
      }
      
      const formattedValue = formatValue(value, mapping.fieldType);
      if (!formattedValue) continue;
      
      // Try to get the field
      try {
        const field = form.getTextField(mapping.pdfFieldName);
        field.setText(formattedValue);
      } catch (error) {
        // Field might not exist or might be a different type
        console.warn(`Could not fill field ${mapping.pdfFieldName}:`, error);
      }
    } catch (error) {
      console.warn(`Error processing mapping for ${mapping.pdfFieldName}:`, error);
      // Continue with other fields
    }
  }
  
  // Flatten the form to prevent further editing
  form.flatten();
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Download PDF as blob
 */
export function downloadPDF(pdfBytes: Uint8Array, filename: string = 'pfs-statement.pdf') {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

