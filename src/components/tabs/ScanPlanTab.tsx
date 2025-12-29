import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScanPlanData, ScanPlanDocument } from "@/types/techniqueSheet";
import {
  FileText,
  ExternalLink,
  ChevronRight,
  Download,
  Maximize2,
  RefreshCw
} from "lucide-react";

interface ScanPlanTabProps {
  data: ScanPlanData;
  onChange: (data: ScanPlanData) => void;
}

export const ScanPlanTab = ({ data, onChange }: ScanPlanTabProps) => {
  const [selectedDocument, setSelectedDocument] = useState<ScanPlanDocument | null>(
    data.documents.length > 0 ? data.documents[0] : null
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [key, setKey] = useState<number>(0); // For forcing iframe reload

  const handleDocumentSelect = (doc: ScanPlanDocument) => {
    setSelectedDocument(doc);
    setKey(prev => prev + 1); // Force reload
  };

  const handleDownload = () => {
    if (selectedDocument) {
      const link = document.createElement('a');
      link.href = selectedDocument.filePath;
      link.download = selectedDocument.title + '.pdf';
      link.click();
    }
  };

  const handleOpenExternal = () => {
    if (selectedDocument) {
      window.open(selectedDocument.filePath, '_blank');
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
    <div className="flex h-full gap-4 p-4">
      {/* Left Sidebar - Document List */}
      <div className="w-80 flex-shrink-0">
        <Card className="p-4 h-full">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Scan Plan Documents
          </h3>

          <ScrollArea className="h-[calc(100%-3rem)]">
            <div className="space-y-2">
              {activeDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No documents available</p>
                </div>
              ) : (
                activeDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocumentSelect(doc)}
                    className={`w-full text-left p-3 rounded-lg transition-all hover:bg-accent/50 ${
                      selectedDocument?.id === doc.id
                        ? "bg-primary/10 border-2 border-primary"
                        : "border border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {doc.title}
                        </h4>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                        {doc.category && (
                          <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-secondary rounded-full">
                            {doc.category}
                          </span>
                        )}
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 flex-shrink-0 transition-transform ${
                          selectedDocument?.id === doc.id ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Right Side - PDF Viewer */}
      <div className="flex-1 flex flex-col">
        {selectedDocument ? (
          <>
            {/* Toolbar */}
            <Card className="p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{selectedDocument.title}</h3>
                  {selectedDocument.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedDocument.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Action Buttons */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="h-8"
                    title="Refresh document"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="h-8"
                    title="Toggle fullscreen"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-8"
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenExternal}
                    className="h-8"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* PDF Viewer using iframe */}
            <Card
              className={`flex-1 overflow-hidden ${
                isFullscreen ? "fixed inset-4 z-50" : ""
              }`}
            >
              <div className="h-full w-full bg-muted/10">
                <iframe
                  key={key}
                  src={selectedDocument.filePath}
                  className="w-full h-full border-0"
                  title={selectedDocument.title}
                  style={{ minHeight: '600px' }}
                />
              </div>
            </Card>
          </>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Document Selected</h3>
              <p className="text-sm text-muted-foreground">
                Select a document from the list to view it here
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
