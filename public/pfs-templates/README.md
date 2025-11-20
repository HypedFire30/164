# PFS PDF Templates

This directory contains pre-loaded PDF templates for Personal Financial Statement generation.

## Adding Templates

To add a new template:

1. Place your PDF file in this directory
2. Name it `pfs-template.pdf` (or update the template manager to recognize other names)
3. The template will be available in the dropdown selector on the GeneratePFS page

## Template Requirements

- Must be a PDF file with form fields
- Form fields should be named according to the mapping in `src/lib/pdf/pfs-field-mapping.ts`
- Field names should follow the pattern: `TextField`, `TextField_1`, `TextField_2`, etc.

## Current Template

- **Default Template**: `pfs-template.pdf` - The main PFS template with all 262 form fields

## User-Uploaded Templates

Users can also upload their own templates through the UI. These are stored in the browser's localStorage and persist across sessions.

