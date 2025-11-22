# PDF Libraries for Writing and Editing PDF Form Fields

This document lists potential libraries for writing PDFs and editing PDF form fields based on your project's requirements. Your project needs to fill 262 PDF form fields with data from your PFS (Personal Financial Statement) application.

## Requirements Analysis

Based on your codebase:
- **262 PDF form fields** to fill (mapped in `pfs-field-mapping.ts`)
- **Browser-based** application (React/TypeScript)
- **Template-based** approach (load existing PDF, fill fields)
- **Complex data mapping** (direct values, calculated fields, schedules, properties)
- **Field types**: text, number, date, currency, percentage

## Recommended Libraries

### 1. **pdf-lib** ⭐ (Most Recommended)

**Package**: `pdf-lib`  
**NPM**: `npm install pdf-lib`  
**TypeScript**: Full TypeScript support  
**Bundle Size**: ~200KB (gzipped)

#### Pros:
- ✅ **Excellent form field support** - Can read and fill AcroForm fields
- ✅ **Works in browser** - No server-side dependency
- ✅ **TypeScript support** - Full type definitions
- ✅ **Active maintenance** - Regularly updated
- ✅ **No dependencies** - Pure JavaScript
- ✅ **Can create new PDFs** - Not just fill existing ones
- ✅ **Good documentation** - Clear examples

#### Cons:
- ⚠️ **Large bundle size** - May impact initial load
- ⚠️ **Limited styling** - Not ideal for complex layouts
- ⚠️ **No image manipulation** - Basic image support only

#### Example Usage:
```typescript
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function fillPDFForm(templateBytes: Uint8Array, data: any) {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  // Fill form fields
  form.getTextField('TextField_1').setText(data.cashOnHand.toString());
  form.getTextField('TextField_3').setText(data.cashOtherInstitutions.toString());
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
```

#### Best For:
- Filling existing PDF forms (your primary use case)
- Browser-based applications
- TypeScript projects
- When you need to create PDFs programmatically

---

### 2. **pdfjs-dist** (PDF.js)

**Package**: `pdfjs-dist`  
**NPM**: `npm install pdfjs-dist`  
**TypeScript**: Type definitions available via `@types/pdfjs-dist`

#### Pros:
- ✅ **Mozilla-backed** - Well-maintained and reliable
- ✅ **Excellent for reading** - Great for extracting field information
- ✅ **Browser-native** - Designed for web
- ✅ **Free and open source**

#### Cons:
- ❌ **Limited form filling** - Primarily for viewing/reading PDFs
- ❌ **Complex API** - More verbose than pdf-lib
- ⚠️ **Not ideal for editing** - Better for reading/rendering

#### Best For:
- Reading and extracting PDF form field information
- Rendering PDFs in browser
- **Not recommended** for filling forms (use pdf-lib instead)

---

### 3. **@react-pdf/renderer**

**Package**: `@react-pdf/renderer`  
**NPM**: `npm install @react-pdf/renderer`

#### Pros:
- ✅ **React-friendly** - Uses React components
- ✅ **Declarative API** - Write PDFs like React components
- ✅ **Good for creating PDFs** - Excellent for generating new PDFs

#### Cons:
- ❌ **Cannot fill existing forms** - Only creates new PDFs
- ❌ **Not suitable for templates** - Doesn't work with existing PDF templates
- ⚠️ **Different approach** - Requires rewriting your template

#### Best For:
- Creating new PDFs from scratch
- When you want to use React components to define PDF structure
- **Not suitable** for your use case (filling existing templates)

---

### 4. **pdfkit** (Node.js only)

**Package**: `pdfkit`  
**NPM**: `npm install pdfkit`  
**TypeScript**: `@types/pdfkit`

#### Pros:
- ✅ **Mature library** - Been around for years
- ✅ **Good for creating PDFs** - Excellent for generating new PDFs
- ✅ **Low-level control** - Fine-grained control over PDF structure

#### Cons:
- ❌ **Node.js only** - Cannot run in browser
- ❌ **Cannot fill existing forms** - Only creates new PDFs
- ❌ **Not suitable for browser apps** - Requires server-side rendering

#### Best For:
- Server-side PDF generation
- Creating PDFs from scratch
- **Not suitable** for your browser-based application

---

### 5. **jsPDF**

**Package**: `jspdf`  
**NPM**: `npm install jspdf`  
**TypeScript**: `@types/jspdf`

#### Pros:
- ✅ **Lightweight** - Smaller bundle size
- ✅ **Browser-friendly** - Works in browser
- ✅ **Good for simple PDFs** - Easy to use for basic PDFs

#### Cons:
- ❌ **Cannot fill existing forms** - Only creates new PDFs
- ❌ **Limited form support** - Not designed for AcroForm fields
- ⚠️ **Layout limitations** - Difficult to match existing PDF layouts

#### Best For:
- Creating simple PDFs from scratch
- When you don't need to fill existing templates
- **Not suitable** for your use case

---

### 6. **pdfmake**

**Package**: `pdfmake`  
**NPM**: `npm install pdfmake`

#### Pros:
- ✅ **Easy to use** - Simple API
- ✅ **Good documentation** - Clear examples
- ✅ **Browser-friendly** - Works in browser

#### Cons:
- ❌ **Cannot fill existing forms** - Only creates new PDFs
- ❌ **Layout limitations** - Difficult to match existing templates
- ⚠️ **Font management** - Requires font files

#### Best For:
- Creating new PDFs with simple layouts
- **Not suitable** for filling existing templates

---

### 7. **hummus-recipe** / **pdf-lib** (Alternative)

**Package**: `hummus-recipe` (deprecated) or use `pdf-lib` instead

#### Note:
- `hummus-recipe` is deprecated
- Use `pdf-lib` instead (see option 1)

---

## Server-Side Options (If you add a backend)

If you decide to add a server-side component, these are excellent options:

### 8. **PDFtk** (Command-line tool)

**Package**: `pdftk` (system package, not npm)

#### Pros:
- ✅ **Excellent form filling** - Industry standard
- ✅ **Mature and reliable** - Battle-tested
- ✅ **Handles complex forms** - Works with any AcroForm PDF

#### Cons:
- ❌ **Server-side only** - Requires backend
- ❌ **System dependency** - Must be installed on server
- ❌ **Not JavaScript** - Command-line tool

#### Best For:
- Server-side PDF processing
- When you can add a backend API

---

### 9. **iText** (Java/.NET)

**Package**: Various (Java, .NET, etc.)

#### Pros:
- ✅ **Enterprise-grade** - Very powerful
- ✅ **Excellent form support** - Handles complex forms

#### Cons:
- ❌ **Not JavaScript** - Requires Java/.NET backend
- ❌ **Commercial license** - May require paid license for commercial use
- ❌ **Overkill** - Too complex for simple form filling

---

## Recommendation for Your Project

### Primary Recommendation: **pdf-lib**

**Why pdf-lib is the best choice:**

1. ✅ **Perfect for your use case** - Designed specifically for filling PDF forms
2. ✅ **Browser-compatible** - Works in your React app without a backend
3. ✅ **TypeScript support** - Matches your tech stack
4. ✅ **Active development** - Well-maintained library
5. ✅ **Good documentation** - Easy to implement
6. ✅ **Handles 262 fields** - Can efficiently fill many fields

### Implementation Strategy

```typescript
// lib/pdf/pdf-filler.ts
import { PDFDocument } from 'pdf-lib';
import { PFS_FIELD_MAPPINGS } from './pfs-field-mapping';

export async function fillPFSForm(
  templateBytes: Uint8Array,
  pfsData: any
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  // Iterate through all field mappings
  for (const mapping of PFS_FIELD_MAPPINGS) {
    try {
      const field = form.getTextField(mapping.pdfFieldName);
      
      let value: string = '';
      
      // Get value based on data source
      if (mapping.dataSource === 'direct' && mapping.dataPath) {
        value = getNestedValue(pfsData, mapping.dataPath);
      } else if (mapping.dataSource === 'calculated' && mapping.calculate) {
        value = mapping.calculate(pfsData);
      } else if (mapping.dataSource === 'schedule') {
        value = getScheduleValue(pfsData, mapping);
      } else if (mapping.dataSource === 'property') {
        value = getPropertyValue(pfsData, mapping);
      }
      
      // Format value based on field type
      const formattedValue = formatFieldValue(value, mapping.fieldType);
      
      // Set field value
      field.setText(formattedValue);
    } catch (error) {
      console.warn(`Could not fill field ${mapping.pdfFieldName}:`, error);
      // Continue with other fields
    }
  }
  
  // Flatten form to prevent further editing
  form.flatten();
  
  // Save and return PDF bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

function formatFieldValue(value: any, fieldType: string): string {
  if (value === null || value === undefined) return '';
  
  switch (fieldType) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(value));
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US');
      }
      return String(value);
    case 'percentage':
      return `${Number(value).toFixed(2)}%`;
    case 'number':
      return String(Number(value));
    default:
      return String(value);
  }
}
```

### Alternative: Server-Side with PDFtk

If you need more robust form filling or encounter issues with pdf-lib:

1. Create a backend API endpoint
2. Use PDFtk on the server to fill forms
3. Return the filled PDF to the frontend

**Example API endpoint:**
```typescript
// Backend API route
app.post('/api/generate-pfs', async (req, res) => {
  const { templatePath, formData } = req.body;
  
  // Use PDFtk to fill form
  const filledPDF = await fillPDFWithPDFtk(templatePath, formData);
  
  res.setHeader('Content-Type', 'application/pdf');
  res.send(filledPDF);
});
```

## Installation

```bash
npm install pdf-lib
```

## Type Definitions

pdf-lib includes TypeScript definitions, so no additional `@types` package is needed.

## Performance Considerations

- **Bundle Size**: pdf-lib adds ~200KB to your bundle. Consider code-splitting if needed.
- **Large PDFs**: For very large PDFs, consider processing on the server.
- **Field Count**: 262 fields is manageable for pdf-lib.

## Testing Strategy

1. Test with your actual PDF template
2. Verify all 262 fields are filled correctly
3. Test edge cases (empty values, null values, large numbers)
4. Test formatting (currency, dates, percentages)
5. Verify PDF is still valid after filling

## Migration Path

Since you already have:
- ✅ Field mapping configuration (`pfs-field-mapping.ts`)
- ✅ Template manager (`template-manager.ts`)
- ✅ Data structure ready

You just need to:
1. Install `pdf-lib`
2. Create the PDF filler function (see example above)
3. Integrate into your `GeneratePFS` component
4. Test with your template

## Resources

- **pdf-lib Documentation**: https://pdf-lib.js.org/
- **pdf-lib GitHub**: https://github.com/Hopding/pdf-lib
- **Form Field Examples**: https://pdf-lib.js.org/docs/api/PDFForm

## Summary Table

| Library | Browser | Fill Forms | Create PDFs | TypeScript | Bundle Size | Recommendation |
|---------|---------|------------|--------------|------------|-------------|----------------|
| **pdf-lib** | ✅ | ✅ | ✅ | ✅ | ~200KB | ⭐⭐⭐⭐⭐ |
| pdfjs-dist | ✅ | ⚠️ | ❌ | ✅ | ~500KB | ⭐⭐⭐ (for reading only) |
| @react-pdf/renderer | ✅ | ❌ | ✅ | ✅ | ~100KB | ⭐⭐ (wrong use case) |
| pdfkit | ❌ | ❌ | ✅ | ✅ | N/A | ⭐ (server only) |
| jsPDF | ✅ | ❌ | ✅ | ✅ | ~50KB | ⭐⭐ (wrong use case) |
| pdfmake | ✅ | ❌ | ✅ | ❌ | ~200KB | ⭐⭐ (wrong use case) |
| PDFtk | ❌ | ✅ | ⚠️ | ❌ | N/A | ⭐⭐⭐⭐ (server only) |

**Final Recommendation: Use `pdf-lib` for your browser-based PDF form filling needs.**


