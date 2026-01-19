/**
 * Custom Drawing Upload Component for Scan Details
 * Allows users to upload technical drawings for scan direction visualization
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, X, FileImage, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface CustomDrawingUploadProps {
  onImageUpload: (imageBase64: string, width: number, height: number) => void;
  currentImage?: string | null;
  onRemove?: () => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export const CustomDrawingUpload: React.FC<CustomDrawingUploadProps> = ({
  onImageUpload,
  currentImage = null,
  onRemove,
  maxSizeMB = 10,
  allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): boolean => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`);
      return false;
    }

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Maximum size: ${maxSizeMB}MB`);
      return false;
    }

    return true;
  }, [allowedTypes, maxSizeMB]);

  const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = base64;
    });
  };

  const processFile = useCallback(async (file: File): Promise<void> => {
    if (!validateFile(file)) {
      return;
    }

    setIsUploading(true);

    try {
      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Get image dimensions
      const dimensions = await getImageDimensions(base64);

      onImageUpload(base64, dimensions.width, dimensions.height);
      toast.success('Drawing uploaded successfully');
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process drawing file');
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, onImageUpload]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove();
      toast.success('Drawing removed');
    }
  }, [onRemove]);

  // Render preview if image exists
  if (currentImage) {
    return (
      <div className="relative group">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative bg-gray-100">
              <img
                src={currentImage}
                alt="Uploaded technical drawing"
                className="w-full h-auto max-h-[300px] object-contain"
              />
              {/* Overlay controls */}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleUploadClick}
                  className="shadow-md"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Replace
                </Button>
                {onRemove && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    className="shadow-md"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  // Render upload area
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleUploadClick}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              <p className="text-sm text-gray-600">Processing drawing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <FileImage className="h-12 w-12 text-gray-400" />
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                  <Upload className="h-3 w-3 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Upload Custom Drawing
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Drag and drop or click to select
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ImageIcon className="h-3 w-3" />
                <span>PNG, JPG, SVG up to {maxSizeMB}MB</span>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};

export default CustomDrawingUpload;
