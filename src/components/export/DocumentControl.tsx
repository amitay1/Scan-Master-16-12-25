/**
 * Document Control Component for TÜV Export System
 * Handles document numbering, revision tracking, and controlled/uncontrolled copy settings
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar, Hash } from 'lucide-react';

export interface DocumentControlData {
  documentNumber: string;
  revisionNumber: string;
  revisionDate: string;
  revisionDescription: string;
  controlledCopy: boolean;
  language: "english" | "hebrew" | "bilingual";
}

interface DocumentControlProps {
  data: DocumentControlData;
  onChange: (data: DocumentControlData) => void;
}

export const DocumentControl: React.FC<DocumentControlProps> = ({
  data,
  onChange
}) => {
  const handleChange = (field: keyof DocumentControlData, value: string | boolean) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const generateDocumentNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const docNumber = `TUV-UT-${year}${month}-${randomId}`;
    handleChange('documentNumber', docNumber);
  };

  const setCurrentDate = () => {
    const today = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY format
    handleChange('revisionDate', today);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Document Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Number */}
        <div className="space-y-2">
          <Label htmlFor="doc-number">Document Number</Label>
          <div className="flex gap-2">
            <Input
              id="doc-number"
              value={data.documentNumber}
              onChange={(e) => handleChange('documentNumber', e.target.value)}
              placeholder="TUV-UT-001"
            />
            <button
              type="button"
              onClick={generateDocumentNumber}
              className="px-3 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
              title="Generate automatic document number"
            >
              <Hash className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Format: TUV-UT-YYYYMM-XXXXXX (automatically generated)
          </p>
        </div>

        {/* Revision Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="revision-number">Revision Number</Label>
            <Input
              id="revision-number"
              value={data.revisionNumber}
              onChange={(e) => handleChange('revisionNumber', e.target.value)}
              placeholder="Rev. 00"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="revision-date">Revision Date</Label>
            <div className="flex gap-2">
              <Input
                id="revision-date"
                value={data.revisionDate}
                onChange={(e) => handleChange('revisionDate', e.target.value)}
                placeholder="DD/MM/YYYY"
              />
              <button
                type="button"
                onClick={setCurrentDate}
                className="px-3 py-2 text-sm bg-green-50 text-green-600 border border-green-200 rounded hover:bg-green-100 transition-colors"
                title="Set current date"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Revision Description */}
        <div className="space-y-2">
          <Label htmlFor="revision-description">Revision Description</Label>
          <Textarea
            id="revision-description"
            value={data.revisionDescription}
            onChange={(e) => handleChange('revisionDescription', e.target.value)}
            placeholder="Initial Release"
            rows={2}
          />
          <p className="text-xs text-gray-500">
            Brief description of changes in this revision
          </p>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <Label htmlFor="language">Report Language</Label>
          <Select
            value={data.language}
            onValueChange={(value) => handleChange('language', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English Only</SelectItem>
              <SelectItem value="hebrew">Hebrew Only (עברית)</SelectItem>
              <SelectItem value="bilingual">Bilingual (English/Hebrew)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Language for headers, sections, and labels in the report
          </p>
        </div>

        {/* Controlled Copy Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="controlled-copy" className="text-sm font-medium">
              Controlled Copy
            </Label>
            <p className="text-xs text-gray-500">
              Mark as controlled document with distribution tracking
            </p>
          </div>
          <Switch
            id="controlled-copy"
            checked={data.controlledCopy}
            onCheckedChange={(checked) => handleChange('controlledCopy', checked)}
          />
        </div>

        {/* Document Status Info */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${data.controlledCopy ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className="text-sm font-medium">
              {data.controlledCopy ? 'CONTROLLED COPY' : 'UNCONTROLLED COPY'}
            </span>
          </div>
          <p className="text-xs text-blue-700">
            {data.controlledCopy 
              ? 'This document is subject to revision control and distribution tracking.'
              : 'This document is for information only and may not reflect the latest version.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentControl;