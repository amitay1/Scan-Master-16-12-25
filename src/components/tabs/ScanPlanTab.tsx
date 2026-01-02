import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanPlanData } from "@/types/techniqueSheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  ExternalLink,
  Download,
  RefreshCw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import mammoth from 'mammoth';

interface ScanPlanTabProps {
  data: ScanPlanData;
  onChange: (data: ScanPlanData) => void;
}

export const ScanPlanTab = ({ data, onChange }: ScanPlanTabProps) => {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [documentHtml, setDocumentHtml] = useState<Record<string, string>>({});
  const [loadErrors, setLoadErrors] = useState<Record<string, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<string>('');
  const [key, setKey] = useState(0);

  // Filter only active documents and sort by order
  const activeDocuments = data.documents
    .filter(doc => doc.isActive)
    .sort((a, b) => a.order - b.order);

  // Set default active tab
  useEffect(() => {
    if (activeDocuments.length > 0 && !activeDocTab) {
      setActiveDocTab(activeDocuments[0].id);
    }
  }, [activeDocuments, activeDocTab]);

  // Load individual document
  const loadDocument = async (docId: string, filePath: string, title: string) => {
    setIsLoading(prev => ({ ...prev, [docId]: true }));
    setLoadErrors(prev => ({ ...prev, [docId]: false }));
    
    try {
      const fileUrl = filePath.startsWith('/') 
        ? `http://localhost:5000${filePath}` 
        : filePath;
      
      if (filePath.toLowerCase().endsWith('.docx') || filePath.toLowerCase().endsWith('.doc')) {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Failed to fetch ${title}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        
        setDocumentHtml(prev => ({ ...prev, [docId]: result.value }));
      }
      setIsLoading(prev => ({ ...prev, [docId]: false }));
    } catch (error) {
      console.error(`Error loading document ${title}:`, error);
      setLoadErrors(prev => ({ ...prev, [docId]: true }));
      setIsLoading(prev => ({ ...prev, [docId]: false }));
    }
  };

  // Load documents on mount and when key changes
  useEffect(() => {
    activeDocuments.forEach(doc => {
      loadDocument(doc.id, doc.filePath, doc.title);
    });
  }, [key, activeDocuments.length]);

  const handleRefresh = (docId?: string) => {
    if (docId) {
      const doc = activeDocuments.find(d => d.id === docId);
      if (doc) {
        loadDocument(doc.id, doc.filePath, doc.title);
      }
    } else {
      setKey(prev => prev + 1);
    }
  };

  const handleDownload = (doc: typeof activeDocuments[0]) => {
    const link = document.createElement('a');
    const fileUrl = doc.filePath.startsWith('/') ? `http://localhost:5000${doc.filePath}` : doc.filePath;
    link.href = fileUrl;
    const ext = doc.filePath.split('.').pop() || 'docx';
    link.download = doc.title + '.' + ext;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-600 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-lg text-slate-800">Scan Plan Documents</h3>
              <p className="text-sm text-slate-500">
                {activeDocuments.length} documents available
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Document Tabs */}
        <Tabs value={activeDocTab} onValueChange={setActiveDocTab} className="w-full">
          <div className="border-b bg-muted/30">
            <TabsList className="h-auto p-1 bg-transparent w-full justify-start flex-wrap">
              {activeDocuments.map((doc) => (
                <TabsTrigger
                  key={doc.id}
                  value={doc.id}
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {doc.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {activeDocuments.map((doc) => (
            <TabsContent key={doc.id} value={doc.id} className="mt-0">
              {/* Document Toolbar */}
              <div className="flex items-center justify-between gap-2 p-2 bg-muted/20 border-b">
                <p className="text-sm text-muted-foreground px-2">
                  {doc.description}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRefresh(doc.id)}
                    className="h-8"
                    title="Refresh document"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    className="h-8"
                    title="Download document"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenExternal(doc.filePath)}
                    className="h-8"
                    title="Open in new window"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open External
                  </Button>
                </div>
              </div>

              {/* Document Content */}
              <div className={`overflow-auto bg-white ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[calc(100vh-350px)] min-h-[400px]'}`}>
                {isLoading[doc.id] ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
                    <p className="text-sm text-muted-foreground">Loading {doc.title}...</p>
                  </div>
                ) : loadErrors[doc.id] ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                    <FileText className="h-16 w-16 text-muted-foreground/50" />
                    <p className="text-lg font-medium text-destructive">Failed to Load Document</p>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Could not load "{doc.title}". Try refreshing or download it directly.
                    </p>
                    <div className="flex gap-3">
                      <Button onClick={() => handleRefresh(doc.id)} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                      <Button onClick={() => handleDownload(doc)} variant="default">
                        <Download className="h-4 w-4 mr-2" />
                        Download
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
                    `}</style>
                    <div 
                      className="document-content"
                      dangerouslySetInnerHTML={{ __html: documentHtml[doc.id] || '' }} 
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};
