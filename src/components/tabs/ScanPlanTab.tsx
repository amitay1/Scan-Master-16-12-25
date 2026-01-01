import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanPlanData } from "@/types/techniqueSheet";
import {
  FileText,
  ExternalLink,
  Download,
  RefreshCw,
  Maximize2,
  Minimize2
} from "lucide-react";
import mammoth from 'mammoth';

interface ScanPlanTabProps {
  data: ScanPlanData;
  onChange: (data: ScanPlanData) => void;
}

export const ScanPlanTab = ({ data, onChange }: ScanPlanTabProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [combinedHtml, setCombinedHtml] = useState<string>('');
  const [loadError, setLoadError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);

  // Filter only active documents and sort by order
  const activeDocuments = data.documents
    .filter(doc => doc.isActive)
    .sort((a, b) => a.order - b.order);

  // Load and combine all DOCX documents
  useEffect(() => {
    const loadAllDocuments = async () => {
      setIsLoading(true);
      setLoadError(false);
      
      try {
        const htmlParts: string[] = [];
        
        for (const doc of activeDocuments) {
          const fileUrl = doc.filePath.startsWith('/') 
            ? `http://localhost:5000${doc.filePath}` 
            : doc.filePath;
          
          if (doc.filePath.toLowerCase().endsWith('.docx') || doc.filePath.toLowerCase().endsWith('.doc')) {
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error(`Failed to fetch ${doc.title}`);
            
            const arrayBuffer = await response.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            
            // Add document with title separator
            htmlParts.push(`
              <div class="document-section">
                <div class="document-title">${doc.title}</div>
                <div class="document-content">${result.value}</div>
              </div>
            `);
          }
        }
        
        setCombinedHtml(htmlParts.join('<hr class="document-separator" />'));
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading documents:', error);
        setLoadError(true);
        setIsLoading(false);
      }
    };

    if (activeDocuments.length > 0) {
      loadAllDocuments();
    } else {
      setIsLoading(false);
    }
  }, [key, activeDocuments.length]);

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  const handleDownloadAll = () => {
    activeDocuments.forEach(doc => {
      const link = document.createElement('a');
      const fileUrl = doc.filePath.startsWith('/') ? `http://localhost:5000${doc.filePath}` : doc.filePath;
      link.href = fileUrl;
      const ext = doc.filePath.split('.').pop() || 'docx';
      link.download = doc.title + '.' + ext;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleOpenExternal = (filePath: string) => {
    const fileUrl = filePath.startsWith('/') ? `http://localhost:5000${filePath}` : filePath;
    window.open(fileUrl, '_blank');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (activeDocuments.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-2">
        <Card className="p-8 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Documents Available</h3>
          <p className="text-sm text-muted-foreground">
            No scan plan documents have been configured
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      <Card className={`overflow-hidden ${isFullscreen ? 'fixed inset-2 z-50' : ''}`}>
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Scan Plan Documents</h3>
            <span className="text-sm text-muted-foreground">
              ({activeDocuments.length} documents)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="h-8"
              title="Refresh documents"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAll}
              className="h-8"
              title="Download all documents"
            >
              <Download className="h-4 w-4 mr-1" />
              Download All
            </Button>
            {activeDocuments.map(doc => (
              <Button
                key={doc.id}
                variant="outline"
                size="sm"
                onClick={() => handleOpenExternal(doc.filePath)}
                className="h-8"
                title={`Open ${doc.title} externally`}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {doc.title.substring(0, 15)}...
              </Button>
            ))}
          </div>
        </div>

        {/* Document Content */}
        <div className={`overflow-auto bg-white ${isFullscreen ? 'h-[calc(100vh-100px)]' : 'h-[calc(100vh-200px)] min-h-[600px]'}`}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
              <p className="text-sm text-muted-foreground">Loading documents...</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
              <FileText className="h-16 w-16 text-muted-foreground/50" />
              <p className="text-lg font-medium text-destructive">Failed to Load Documents</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Could not load the documents. Try refreshing or download them directly.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={handleDownloadAll} variant="default">
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="p-8 prose prose-sm max-w-none"
              style={{ 
                backgroundColor: 'white',
                color: 'black',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              <style>{`
                .document-section {
                  margin-bottom: 2rem;
                }
                .document-title {
                  font-size: 1.5rem;
                  font-weight: bold;
                  color: #1e40af;
                  padding-bottom: 0.5rem;
                  border-bottom: 2px solid #3b82f6;
                  margin-bottom: 1rem;
                }
                .document-content {
                  line-height: 1.6;
                }
                .document-content table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 1rem 0;
                }
                .document-content table td,
                .document-content table th {
                  border: 1px solid #ccc;
                  padding: 8px;
                }
                .document-content img {
                  max-width: 100%;
                  height: auto;
                }
                .document-separator {
                  margin: 3rem 0;
                  border: none;
                  border-top: 3px dashed #3b82f6;
                }
              `}</style>
              <div dangerouslySetInnerHTML={{ __html: combinedHtml }} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
