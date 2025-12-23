/**
 * PDF Template Manager
 * 
 * Manages PFS PDF templates - both pre-loaded and user-uploaded
 */

const TEMPLATE_STORAGE_KEY = 'pfs-templates';
const TEMPLATE_PREFIX = 'pfs-template-';

export interface PDFTemplate {
  id: string;
  name: string;
  filename: string;
  isPreloaded: boolean;
  uploadedAt?: string;
  size?: number;
}

/**
 * Get all available templates (pre-loaded + user-uploaded)
 */
export async function getAvailableTemplates(): Promise<PDFTemplate[]> {
  const templates: PDFTemplate[] = [];

  // Get pre-loaded templates from public directory
  try {
    const preloadedTemplates = [
      {
        id: 'default',
        name: 'CC Credit Union',
        filename: 'CCCU.pdf',
        isPreloaded: true,
      },
    ];
    templates.push(...preloadedTemplates);
  } catch (error) {
    console.warn('Could not load pre-loaded templates:', error);
  }

  // Get user-uploaded templates from localStorage
  try {
    const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (stored) {
      const userTemplates: PDFTemplate[] = JSON.parse(stored);
      templates.push(...userTemplates);
    }
  } catch (error) {
    console.warn('Could not load user templates:', error);
  }

  return templates;
}

/**
 * Load a template by ID
 */
export async function loadTemplate(templateId: string): Promise<Uint8Array | null> {
  // Check if it's a pre-loaded template
  if (templateId === 'default') {
    try {
      // Try to load from public directory
      const response = await fetch('/pfs-templates/CCCU.pdf');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      }
    } catch (error) {
      console.warn('Could not load pre-loaded template:', error);
    }
  }

  // Try to load from localStorage
  try {
    const stored = localStorage.getItem(`${TEMPLATE_PREFIX}${templateId}`);
    if (stored) {
      // Template is stored as base64
      const base64 = JSON.parse(stored);
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
  } catch (error) {
    console.warn('Could not load template from storage:', error);
  }

  return null;
}

/**
 * Save a user-uploaded template
 */
export async function saveTemplate(
  file: File,
  name: string = file.name
): Promise<PDFTemplate> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Convert to base64 for storage
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  const base64 = btoa(binaryString);

  // Create template object
  const template: PDFTemplate = {
    id: `user-${Date.now()}`,
    name: name.replace(/\.pdf$/i, ''),
    filename: file.name,
    isPreloaded: false,
    uploadedAt: new Date().toISOString(),
    size: file.size,
  };

  // Save template data to localStorage
  localStorage.setItem(`${TEMPLATE_PREFIX}${template.id}`, JSON.stringify(base64));

  // Update templates list
  const templates = await getAvailableTemplates();
  const userTemplates = templates.filter(t => !t.isPreloaded);
  userTemplates.push(template);
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(userTemplates));

  return template;
}

/**
 * Delete a user-uploaded template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  if (templateId === 'default') {
    throw new Error('Cannot delete pre-loaded template');
  }

  // Remove from localStorage
  localStorage.removeItem(`${TEMPLATE_PREFIX}${templateId}`);

  // Update templates list
  const templates = await getAvailableTemplates();
  const userTemplates = templates.filter(t => t.id !== templateId);
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(userTemplates));
}

/**
 * Load template from file input
 */
export async function loadTemplateFromFile(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

