import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScanPlanData, ScanPlanDocument } from "@/types/techniqueSheet";
import {
  FileText,
  ExternalLink,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Maximize2
} from "lucide-react";

// Configure PDF.js worker - use the version that comes with react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface ScanPlanTabProps {
  data: ScanPlanData;
  onChange: (data: ScanPlanData) => void;
}

export const ScanPlanTab = ({ data, onChange }: ScanPlanTabProps) => {
  const [selectedDocument, setSelectedDocument] = useState<ScanPlanDocument | null>(
    data.documents.length > 0 ? data.documents[0] : null
  );
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleDocumentSelect = (doc: ScanPlanDocument) => {
    setSelectedDocument(doc);
    setPageNumber(1);
    setScale(1.0);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
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
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 border rounded-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomOut}
                      disabled={scale <= 0.5}
                      className="h-8"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs px-2 min-w-[4rem] text-center">
                      {Math.round(scale * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomIn}
                      disabled={scale >= 3.0}
                      className="h-8"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Page Navigation */}
                  {numPages > 0 && (
                    <div className="flex items-center gap-1 border rounded-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                        disabled={pageNumber <= 1}
                        className="h-8"
                      >
                        Prev
                      </Button>
                      <span className="text-xs px-3">
                        {pageNumber} / {numPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                        disabled={pageNumber >= numPages}
                        className="h-8"
                      >
                        Next
                      </Button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="h-8"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenExternal}
                    className="h-8"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* PDF Viewer */}
            <Card
              className={`flex-1 overflow-hidden ${
                isFullscreen ? "fixed inset-4 z-50" : ""
              }`}
            >
              <ScrollArea className="h-full">
                <div className="flex justify-center p-4 bg-muted/30 min-h-full">
                  <Document
                    file={selectedDocument.filePath}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                      <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-sm text-muted-foreground">Loading document...</p>
                        </div>
                      </div>
                    }
                    error={
                      <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-destructive opacity-50" />
                          <p className="text-sm text-destructive font-medium">Failed to load document</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Please check if the file exists and is a valid PDF
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      className="shadow-lg"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </div>
              </ScrollArea>
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
