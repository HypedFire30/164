/**
 * PDF Field Extractor Component
 * 
 * Allows users to upload a PDF template and extract all form fields
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Upload, Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { extractFormFieldsFromFile, downloadFieldsAsJSON, generateAndDownloadMapping } from '@/lib/pdf/extract-form-fields-browser';
import type { PDFFormField } from '@/lib/pdf/extract-form-fields';

export function PDFFieldExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedFields, setExtractedFields] = useState<PDFFormField[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setExtractedFields(null);
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsExtracting(true);
    setError(null);

    try {
      const fields = await extractFormFieldsFromFile(file);
      setExtractedFields(fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract form fields');
      console.error('Extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDownloadFields = () => {
    if (!extractedFields) return;
    downloadFieldsAsJSON(extractedFields);
  };

  const handleDownloadMappings = () => {
    if (!extractedFields) return;
    generateAndDownloadMapping(extractedFields);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extract PDF Form Fields</CardTitle>
        <CardDescription>
          Upload your PFS PDF template to extract all form fields and generate a mapping configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pdf-upload">PDF Template File</Label>
          <Input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isExtracting}
          />
        </div>

        {file && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{file.name}</span>
            <span className="text-xs">({(file.size / 1024).toFixed(2)} KB)</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleExtract}
          disabled={!file || isExtracting}
          className="w-full"
        >
          {isExtracting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Extracting Fields...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Extract Form Fields
            </>
          )}
        </Button>

        {extractedFields && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Extraction Complete</AlertTitle>
              <AlertDescription>
                Found {extractedFields.length} form field{extractedFields.length !== 1 ? 's' : ''}
              </AlertDescription>
            </Alert>

            <div className="grid gap-2 md:grid-cols-2">
              <Button
                onClick={handleDownloadFields}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Fields JSON
              </Button>
              <Button
                onClick={handleDownloadMappings}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Mapping Template
              </Button>
            </div>

            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              <h4 className="font-semibold mb-2">Extracted Fields Preview:</h4>
              <div className="space-y-2 text-sm">
                {extractedFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <span className="font-mono text-xs">{field.fieldName}</span>
                    <span className="text-muted-foreground">({field.fieldType})</span>
                    {field.defaultValue && (
                      <span className="text-muted-foreground text-xs">
                        Default: {field.defaultValue}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

