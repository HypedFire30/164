/**
 * Script to extract form fields from a PFS PDF template
 * 
 * Usage:
 *   - Place your PDF template in the project root or specify the path
 *   - Run: npx tsx scripts/extract-pdf-fields.ts <path-to-pdf>
 *   - Output will be saved as pdf-fields.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { extractFormFields, generateMappingTemplate, createMappingConfig } from '../src/lib/pdf/extract-form-fields';

async function main() {
  const pdfPath = process.argv[2] || './pfs-template.pdf';
  
  console.log(`Reading PDF from: ${pdfPath}`);
  
  try {
    const pdfBytes = readFileSync(pdfPath);
    const uint8Array = new Uint8Array(pdfBytes);
    
    console.log('Extracting form fields...');
    const fields = await extractFormFields(uint8Array);
    
    console.log(`Found ${fields.length} form fields`);
    
    // Generate mapping template
    console.log('Generating mapping template...');
    const mappings = generateMappingTemplate(fields);
    
    // Save extracted fields
    const fieldsOutput = {
      extractedAt: new Date().toISOString(),
      totalFields: fields.length,
      fields: fields,
    };
    
    writeFileSync('pdf-fields.json', JSON.stringify(fieldsOutput, null, 2));
    console.log('✓ Saved extracted fields to: pdf-fields.json');
    
    // Save mapping template
    const mappingOutput = {
      extractedAt: new Date().toISOString(),
      totalMappings: mappings.length,
      mappings: mappings,
      note: 'Review and update the dataPath for each field to match your PFS data structure',
    };
    
    writeFileSync('pdf-field-mappings.json', JSON.stringify(mappingOutput, null, 2));
    console.log('✓ Saved mapping template to: pdf-field-mappings.json');
    
    // Print summary
    console.log('\n=== Summary ===');
    console.log(`Total fields extracted: ${fields.length}`);
    console.log(`Text fields: ${fields.filter(f => f.fieldType === 'text').length}`);
    console.log(`Checkboxes: ${fields.filter(f => f.fieldType === 'checkbox').length}`);
    console.log(`Dropdowns: ${fields.filter(f => f.fieldType === 'dropdown').length}`);
    console.log(`Radio groups: ${fields.filter(f => f.fieldType === 'radio').length}`);
    
    console.log('\n=== Next Steps ===');
    console.log('1. Review pdf-fields.json to see all extracted fields');
    console.log('2. Review pdf-field-mappings.json and update dataPath for each field');
    console.log('3. Use the mappings in your PDF generation code');
    
  } catch (error) {
    console.error('Error extracting PDF fields:', error);
    process.exit(1);
  }
}

main();

