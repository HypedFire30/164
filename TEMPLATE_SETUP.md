# PDF Template Setup Guide

## Where to Place Your PDF Template

To add your PFS PDF template so it appears in the dropdown:

1. **Place the PDF file in**: `public/pfs-templates/pfs-template.pdf`
2. The template will automatically appear in the dropdown as "Default PFS Template"

## Current Setup

- **Template Location**: `public/pfs-templates/pfs-template.pdf`
- **Template Name**: Will appear as "Default PFS Template" in the dropdown

## How It Works

1. **Pre-loaded Templates**: Place PDFs in `public/pfs-templates/` directory
   - These are served from the public folder
   - Currently supports: `pfs-template.pdf`

2. **User-Uploaded Templates**: Users can upload templates through the UI
   - Stored in browser localStorage
   - Persist across sessions
   - Can be selected from the dropdown

## Adding Your Template Today

1. Copy your PDF template file to:
   ```
   public/pfs-templates/pfs-template.pdf
   ```

2. The template will be available in the dropdown selector on the GeneratePFS page

3. If you want to add multiple templates, you can:
   - Update `template-manager.ts` to recognize additional filenames
   - Or upload them through the UI (they'll be saved in localStorage)

## Template Requirements

- PDF file with form fields
- Form fields named: `TextField`, `TextField_1`, `TextField_2`, etc. (up to `TextField_262`)
- See `src/lib/pdf/pfs-field-mapping.ts` for complete field mapping

