import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanPlanData, ScanPlanDocument } from "@/types/techniqueSheet";
import { DocumentViewer } from "@/components/DocumentViewer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileText,
  ExternalLink,
  ChevronDown,
  Download,
  Maximize2,
  RefreshCw
} from "lucide-react";

interface ScanPlanTabProps {
  data: ScanPlanData;
  onChange: (data: ScanPlanData) => void;
}

export const ScanPlanTab = ({ data, onChange }: ScanPlanTabProps) => {
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [key, setKey] = useState<number>(0);
  const [loadError, setLoadError] = useState<boolean>(false);

  const handleToggleDoc = (doc: ScanPlanDocument) => {
    if (expandedDocId === doc.id) {
      setExpandedDocId(null);
    } else {
      setExpandedDocId(doc.id);
      setKey(prev => prev + 1);
      setLoadError(false);
    }
  };

  const getSelectedDocument = () => {
    return data.documents.find(d => d.id === expandedDocId) || null;
  };

  const handleDownload = () => {
    const doc = getSelectedDocument();
    if (doc) {
      const link = document.createElement('a');
      const fileUrl = doc.filePath.startsWith('/') ? `http://localhost:5000${doc.filePath}` : doc.filePath;
      link.href = fileUrl;
      const ext = doc.filePath.split('.').pop() || 'pdf';
      link.download = doc.title + '.' + ext;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenExternal = () => {
    const doc = getSelectedDocument();
    if (doc) {
      const fileUrl = doc.filePath.startsWith('/') ? `http://localhost:5000${doc.filePath}` : doc.filePath;
      window.open(fileUrl, '_blank');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  // Filter only active documents and sort by order
  const activeDocuments = data.documents
    .filter(doc => doc.isActive)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* Document Sections */}
      {activeDocuments.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Documents Available</h3>
          <p className="text-sm text-muted-foreground">
            No scan plan documents have been configured
          </p>
        </Card>
      ) : (
        activeDocuments.map((doc) => (
          <Collapsible
            key={doc.id}
            open={expandedDocId === doc.id}
            onOpenChange={() => handleToggleDoc(doc)}
          >
            <Card className="overflow-hidden">
              {/* Document Header - Clickable */}
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <h3 className="font-semibold">{doc.title}</h3>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.category && (
                      <span className="px-2 py-1 text-xs bg-secondary rounded-full">
                        {doc.category}
                      </span>
                    )}
                    <ChevronDown
                      className={`h-5 w-5 transition-transform duration-200 ${
                        expandedDocId === doc.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>

              {/* Document Content - PDF Viewer */}
              <CollapsibleContent>
                <div className="border-t">
                  {/* Toolbar */}
                  <div className="flex items-center justify-end gap-2 p-2 bg-muted/30 border-b">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
                      className="h-8"
                      title="Refresh document"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                      className="h-8"
                      title="Toggle fullscreen"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                      className="h-8"
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleOpenExternal(); }}
                      className="h-8"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Document Viewer */}
                  <div
                    className={`h-[calc(100vh-280px)] min-h-[500px] ${
                      isFullscreen ? "fixed inset-2 z-50 bg-background h-auto" : ""
                    }`}
                  >
                    {loadError ? (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <FileText className="h-16 w-16 mb-4 text-destructive/50" />
                        <h3 className="text-lg font-semibold mb-2 text-destructive">Failed to Load Document</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          The document could not be loaded. Try the options below.
                        </p>
                        <div className="flex gap-2">
                          <Button onClick={handleDownload} variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button onClick={handleOpenExternal} variant="outline">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Externally
                          </Button>
                          <Button onClick={() => { setLoadError(false); setKey(prev => prev + 1); }} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                          Path: {doc.filePath}
                        </p>
                      </div>
                    ) : (
                      <DocumentViewer
                        key={key}
                        file={doc.filePath}
                        onLoadError={() => setLoadError(true)}
                      />
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))
      )}
    </div>
  );
};
