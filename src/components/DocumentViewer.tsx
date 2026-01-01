import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink, Download, FileText } from "lucide-react";
import mammoth from 'mammoth';

interface DocumentViewerProps {
  file: string;
  onLoadError?: () => void;
}

export const DocumentViewer = ({ file, onLoadError }: DocumentViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [docxHtml, setDocxHtml] = useState<string>('');
  const [useEmbed, setUseEmbed] = useState(false);

  const isPdf = file.toLowerCase().endsWith('.pdf');
  const isDocx = file.toLowerCase().endsWith('.docx') || file.toLowerCase().endsWith('.doc');

  // Get full URL for the file
  const getFileUrl = () => {
    if (file.startsWith('/')) {
      return `http://localhost:5000${file}`;
    }
    return file;
  };

  // Load DOCX file and convert to HTML
  useEffect(() => {
    if (!isDocx) return;

    const loadDocx = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        const response = await fetch(getFileUrl());
        if (!response.ok) throw new Error('Failed to fetch document');
        
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setDocxHtml(result.value);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading DOCX:', error);
        setHasError(true);
        setIsLoading(false);
        onLoadError?.();
      }
    };

    loadDocx();
  }, [file, isDocx]);

  // PDF loading logic
  useEffect(() => {
    if (!isPdf) return;
    
    setIsLoading(true);
    setHasError(false);
    setUseEmbed(false);

    const timeout = setTimeout(() => {
      if (isLoading && !useEmbed) {
        setUseEmbed(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [file, isPdf]);

  useEffect(() => {
    if (isPdf && useEmbed && isLoading) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
        setHasError(true);
        onLoadError?.();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [useEmbed, isLoading, isPdf, onLoadError]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    if (isPdf && !useEmbed) {
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
    if (isDocx) {
      setDocxHtml('');
    }
  };

  const handleOpenExternal = () => {
    window.open(getFileUrl(), '_blank');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = getFileUrl();
    link.download = file.split('/').pop() || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileUrl = getFileUrl();

  // Error state
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 bg-muted/30">
        <FileText className="h-16 w-16 text-muted-foreground/50" />
        <p className="text-lg font-medium">Unable to display document</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          The document viewer encountered an issue. Please use one of the options below.
        </p>
        <div className="flex gap-3 flex-wrap justify-center mt-2">
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={handleOpenExternal} variant="default">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Externally
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    );
  }

  // DOCX viewer
  if (isDocx) {
    return (
      <div className="relative flex flex-col h-full w-full bg-white">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
            <p className="text-sm text-muted-foreground">Loading document...</p>
          </div>
        )}
        
        <div 
          className="w-full h-full overflow-auto p-8 prose prose-sm max-w-none"
          style={{ 
            backgroundColor: 'white',
            color: 'black',
            fontFamily: 'Arial, sans-serif'
          }}
          dangerouslySetInnerHTML={{ __html: docxHtml }}
        />
      </div>
    );
  }

  // PDF viewer
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
      
      <div className="w-full h-full">
        {!useEmbed ? (
          <object
            data={fileUrl}
            type="application/pdf"
            className="w-full h-full"
            onLoad={handleLoad}
            onError={handleError}
          >
            <div className="flex flex-col items-center justify-center h-full p-8">
              <p className="text-muted-foreground">Loading PDF...</p>
            </div>
          </object>
        ) : (
          <embed
            src={fileUrl}
            type="application/pdf"
            className="w-full h-full"
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
};
