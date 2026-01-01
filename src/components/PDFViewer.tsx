import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink, Download } from "lucide-react";

interface PDFViewerProps {
  file: string;
  onLoadError?: () => void;
}

export const PDFViewer = ({ file, onLoadError }: PDFViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadKey, setLoadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 3;

  // Generate a cache-busting URL
  const getFileUrl = useCallback(() => {
    const timestamp = Date.now();
    const separator = file.includes('?') ? '&' : '?';
    return `${file}${separator}t=${timestamp}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`;
  }, [file]);

  useEffect(() => {
    // Reset state when file changes
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
    setLoadKey(prev => prev + 1);
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [file]);

  // Set a timeout to detect if PDF fails to load (iframe onError doesn't always fire for PDFs)
  useEffect(() => {
    if (isLoading && !hasError) {
      loadTimeoutRef.current = setTimeout(() => {
        // Check if iframe actually has content
        if (iframeRef.current) {
          try {
            // Try to access iframe content - this will throw if cross-origin or failed
            const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
            if (!iframeDoc || iframeDoc.body?.innerHTML === '') {
              // Empty content - might have failed silently
              console.warn('PDF load timeout - iframe appears empty');
              handleLoadFailure();
            }
          } catch {
            // Cross-origin access denied is expected for successful PDF loads
            // If we get here after timeout, PDF probably loaded successfully
            setIsLoading(false);
          }
        }
      }, 8000); // 8 second timeout
    }
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [isLoading, hasError, loadKey]);

  const handleLoad = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    setIsLoading(false);
    setHasError(false);
  };

  const handleLoadFailure = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    if (retryCount < maxRetries) {
      console.log(`PDF load failed, retrying... (attempt ${retryCount + 1}/${maxRetries})`);
      setRetryCount(prev => prev + 1);
      setLoadKey(prev => prev + 1);
      setIsLoading(true);
    } else {
      console.error('PDF load failed after max retries');
      setIsLoading(false);
      setHasError(true);
      onLoadError?.();
    }
  };

  const handleError = () => {
    handleLoadFailure();
  };

  const handleRetry = () => {
    setRetryCount(0);
    setHasError(false);
    setIsLoading(true);
    setLoadKey(prev => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open(file, '_blank');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file;
    link.download = file.split('/').pop() || 'document.pdf';
    link.click();
  };

  // Use object tag as fallback which is sometimes more reliable than iframe
  return (
    <div className="relative flex flex-col h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          {retryCount > 0 && (
            <p className="text-sm text-muted-foreground">
              Retrying... ({retryCount}/{maxRetries})
            </p>
          )}
        </div>
      )}
      
      {hasError ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
          <p className="text-destructive font-medium">Failed to load PDF</p>
          <p className="text-sm text-muted-foreground text-center">
            The PDF viewer encountered an issue. Try the options below:
          </p>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button onClick={handleRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleOpenExternal} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Browser
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          key={loadKey}
          src={getFileUrl()}
          className="w-full h-full border-0"
          title="PDF Viewer"
          onLoad={handleLoad}
          onError={handleError}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      )}
    </div>
  );
};
