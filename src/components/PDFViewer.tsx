import { useState, useEffect } from 'react';

interface PDFViewerProps {
  file: string;
  onLoadError?: () => void;
}

export const PDFViewer = ({ file, onLoadError }: PDFViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset state when file changes
    setIsLoading(true);
    setHasError(false);
  }, [file]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onLoadError?.();
  };

  // Use iframe for PDF viewing - most reliable across browsers
  return (
    <div className="relative flex flex-col h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      {hasError ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-destructive">Failed to load PDF</p>
        </div>
      ) : (
        <iframe
          src={`${file}#toolbar=1&navpanes=1&scrollbar=1`}
          className="w-full h-full border-0"
          title="PDF Viewer"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};
