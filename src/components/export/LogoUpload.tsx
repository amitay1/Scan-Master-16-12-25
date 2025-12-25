/**
 * Logo Upload Component for TÜV Export System
 * Allows users to upload and preview company logos for professional reports
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LogoUploadProps {
  onLogoChange: (logoBase64: string | null) => void;
  currentLogo?: string | null;
  maxSize?: number; // in MB
  allowedTypes?: string[];
}

export const LogoUpload: React.FC<LogoUploadProps> = ({
  onLogoChange,
  currentLogo = null,
  maxSize = 2,
  allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
}) => {
  const [preview, setPreview] = useState<string | null>(currentLogo);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Allowed types: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`);
      return false;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File too large. Maximum size: ${maxSize}MB`);
      return false;
    }

    return true;
  };

  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);
    
    try {
      const base64 = await processFile(file);
      setPreview(base64);
      onLogoChange(base64);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process logo file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setPreview(null);
    onLogoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Logo removed');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        // Create a new FileList with our file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="logo-upload" className="text-sm font-medium">
        Company Logo
      </Label>
      
      <div className="space-y-3">
        {preview ? (
          // Logo Preview
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={preview}
                    alt="Company Logo"
                    className="h-16 w-auto max-w-32 object-contain border rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Logo Preview</p>
                  <p className="text-xs text-gray-500 mt-1">
                    This logo will appear on the report header
                  </p>
                </div>
                <div className="flex-shrink-0 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Upload Area
          <Card>
            <CardContent className="p-6">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={handleUploadClick}
              >
                <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Click to upload company logo or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, or SVG up to {maxSize}MB
                  </p>
                </div>
                {isUploading && (
                  <div className="mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          id="logo-upload"
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Logo Guidelines:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Recommended size: 300x100 pixels minimum</li>
                <li>Transparent background (PNG) works best</li>
                <li>High resolution for professional appearance</li>
                <li>Logo will be automatically resized to fit report header</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoUpload;