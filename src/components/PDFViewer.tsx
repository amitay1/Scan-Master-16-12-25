import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink, Download, FileText } from "lucide-react";

interface PDFViewerProps {
  file: string;
  onLoadError?: () => void;
}

export const PDFViewer = ({ file, onLoadError }: PDFViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useEmbed, setUseEmbed] = useState(false);
  const objectRef = useRef<HTMLObjectElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if running in Electron
  const isElectron = typeof window !== 'undefined' && 
    (window.navigator.userAgent.toLowerCase().includes('electron') || 
     (window as unknown as { electronAPI?: unknown }).electronAPI !== undefined);

  // Get full URL for the file
  const getFileUrl = () => {
    // For Electron, we need to use the server URL
    if (file.startsWith('/')) {
      return `http://localhost:5000${file}`;
    }
    return file;
  };

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setUseEmbed(false);

    // Set a timeout to check if loading succeeded
    loadTimeoutRef.current = setTimeout(() => {
      // If still loading after 5 seconds, try embed fallback
      if (isLoading && !useEmbed) {
        console.log('Object tag timeout, trying embed fallback...');
        setUseEmbed(true);
        setIsLoading(true);
      }
    }, 5000);

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [file]);

  // Second timeout for embed fallback
  useEffect(() => {
    if (useEmbed && isLoading) {
      const embedTimeout = setTimeout(() => {
        console.log('Embed also failed, showing error');
        setIsLoading(false);
        setHasError(true);
        onLoadError?.();
      }, 5000);

      return () => clearTimeout(embedTimeout);
    }
  }, [useEmbed, isLoading, onLoadError]);

  const handleLoad = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    if (!useEmbed) {
      // Try embed as fallback
      console.log('Object tag failed, trying embed...');
      setUseEmbed(true);
    } else {
      setIsLoading(false);
      setHasError(true);
      onLoadError?.();
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setUseEmbed(false);
    setIsLoading(true);
  };

  const handleOpenExternal = () => {
    // Open in default system PDF viewer
    const url = getFileUrl();
    if (isElectron && (window as unknown as { electronAPI?: { openExternal?: (url: string) => void } }).electronAPI?.openExternal) {
      (window as unknown as { electronAPI: { openExternal: (url: string) => void } }).electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = getFileUrl();
    link.download = file.split('/').pop() || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileUrl = getFileUrl();

  return (
    <div className="relative flex flex-col h-full w-full bg-gray-100">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
          <p className="text-sm text-muted-foreground">
            {useEmbed ? 'Trying alternative viewer...' : 'Loading document...'}
          </p>
        </div>
      )}
      
      {hasError ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 bg-muted/30">
          <FileText className="h-16 w-16 text-muted-foreground/50" />
          <p className="text-lg font-medium">Unable to display PDF in app</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            The built-in PDF viewer is having trouble displaying this document. 
            Please use one of the options below to view the file.
          </p>
          <div className="flex gap-3 flex-wrap justify-center mt-2">
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleOpenExternal} variant="default">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in System Viewer
            </Button>
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full h-full">
          {!useEmbed ? (
            // Primary: Object tag - better for most browsers
            <object
              ref={objectRef}
              data={fileUrl}
              type="application/pdf"
              className="w-full h-full"
              onLoad={handleLoad}
              onError={handleError}
            >
              {/* Fallback content inside object */}
              <div className="flex flex-col items-center justify-center h-full p-8">
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            </object>
          ) : (
            // Fallback: Embed tag
            <embed
              src={fileUrl}
              type="application/pdf"
              className="w-full h-full"
              onLoad={handleLoad}
              onError={handleError}
            />
          )}
        </div>
      )}
    </div>
  );
};
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      )}
    </div>
  );
};
