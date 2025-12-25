import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResultsData,
  ScanResult,
  Indication,
  DataForm,
  StatisticalAnalysis,
  ChartData
} from "@/types/unifiedInspection";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import {
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  BarChart,
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Activity,
  FileSpreadsheet
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ResultsDataTabProps {
  data: ResultsData;
  onChange: (data: ResultsData) => void;
  scanDirections?: any[];
  probes?: any[];
}

const indicationTypes = [
  "Linear",
  "Rounded",
  "Planar",
  "Volumetric",
  "Crack-like",
  "Porosity",
  "Inclusion",
  "Lack of Fusion",
  "Lack of Penetration",
  "Undercut",
  "Root Concavity",
];

const dispositions = [
  { value: "Accept", label: "Accept", color: "bg-green-500" },
  { value: "Reject", label: "Reject", color: "bg-red-500" },
  { value: "Repair", label: "Repair Required", color: "bg-yellow-500" },
];

const formTypes = [
  "Indication Report",
  "Coverage Map",
  "Calibration Check",
  "Equipment Verification",
  "Final Inspection",
];

export const ResultsDataTab = ({
  data,
  onChange,
  scanDirections = [],
  probes = []
}: ResultsDataTabProps) => {
  const [activeSection, setActiveSection] = useState("results");
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [editingResult, setEditingResult] = useState<ScanResult | null>(null);
  const [showIndicationDialog, setShowIndicationDialog] = useState(false);
  const [editingIndication, setEditingIndication] = useState<Indication | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [showIndicationMap, setShowIndicationMap] = useState(false);

  const updateField = (field: keyof ResultsData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addOrUpdateResult = (result: ScanResult) => {
    const results = [...(data.scanResults || [])];
    if (editingResult) {
      const index = results.findIndex(r => r.scanId === editingResult.scanId);
      if (index !== -1) {
        results[index] = result;
      }
    } else {
      results.push({ ...result, scanId: `scan-${Date.now()}` });
    }
    updateField("scanResults", results);
    setShowResultDialog(false);
    setEditingResult(null);
    updateStatistics();
  };

  const deleteResult = (scanId: string) => {
    const results = data.scanResults?.filter(r => r.scanId !== scanId) || [];
    updateField("scanResults", results);
    updateStatistics();
  };

  const addOrUpdateIndication = (indication: Indication) => {
    const indications = [...(data.indications || [])];
    if (editingIndication) {
      const index = indications.findIndex(i => i.id === editingIndication.id);
      if (index !== -1) {
        indications[index] = indication;
      }
    } else {
      indications.push({ ...indication, id: `ind-${Date.now()}` });
    }
    updateField("indications", indications);
    setShowIndicationDialog(false);
    setEditingIndication(null);
    updateStatistics();
  };

  const deleteIndication = (id: string) => {
    const indications = data.indications?.filter(i => i.id !== id) || [];
    updateField("indications", indications);
    updateStatistics();
  };

  const updateStatistics = () => {
    const totalScans = data.scanResults?.length || 0;
    const acceptedScans = data.scanResults?.filter(r => r.status === "Accept").length || 0;
    const rejectedScans = data.scanResults?.filter(r => r.status === "Reject").length || 0;
    const indicationsFound = data.indications?.length || 0;
    const criticalFindings = data.indications?.filter(i => i.disposition === "Reject").length || 0;

    const statistics: StatisticalAnalysis = {
      totalScans,
      acceptedScans,
      rejectedScans,
      indicationsFound,
      criticalFindings,
      charts: generateCharts(),
    };

    updateField("statistics", statistics);
  };

  const generateCharts = (): ChartData[] => {
    // Generate chart data based on results
    const statusDistribution = {
      Accept: data.scanResults?.filter(r => r.status === "Accept").length || 0,
      Reject: data.scanResults?.filter(r => r.status === "Reject").length || 0,
      Review: data.scanResults?.filter(r => r.status === "Review").length || 0,
    };

    const indicationTypes = data.indications?.reduce((acc, ind) => {
      acc[ind.type] = (acc[ind.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return [
      {
        type: "pie",
        title: "Scan Status Distribution",
        data: statusDistribution,
      },
      {
        type: "bar",
        title: "Indication Types",
        data: indicationTypes,
      },
    ];
  };

  const exportResults = () => {
    const exportData = {
      scanResults: data.scanResults,
      indications: data.indications,
      statistics: data.statistics,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inspection-results.json';
    a.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Accept":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "Reject":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "Review":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto px-1">
      {/* Section Navigation */}
      <div className="sticky top-0 bg-background z-10 pb-2 border-b">
        <div className="flex space-x-2 overflow-x-auto">
          <Button
            variant={activeSection === "results" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("results")}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Scan Results
          </Button>
          <Button
            variant={activeSection === "indications" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("indications")}
            className="flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Indications
          </Button>
          <Button
            variant={activeSection === "forms" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("forms")}
            className="flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Data Forms
          </Button>
          <Button
            variant={activeSection === "statistics" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("statistics")}
            className="flex items-center gap-2"
          >
            <BarChart className="w-4 h-4" />
            Statistics
          </Button>
        </div>
      </div>

      {/* Scan Results */}
      {activeSection === "results" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Scan Results</CardTitle>
                <CardDescription>Record inspection results for each scan area</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowResultDialog(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Result
                </Button>
                <Button onClick={exportResults} size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.scanResults && data.scanResults.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Probe</TableHead>
                    <TableHead>Gain (dB)</TableHead>
                    <TableHead>Indications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.scanResults.map((result) => (
                    <TableRow
                      key={result.scanId}
                      className={cn(
                        "cursor-pointer",
                        selectedResult === result.scanId && "bg-muted"
                      )}
                      onClick={() => setSelectedResult(result.scanId)}
                    >
                      <TableCell>{result.location}</TableCell>
                      <TableCell>{result.probeUsed}</TableCell>
                      <TableCell>{result.gain}</TableCell>
                      <TableCell>
                        {result.indications > 0 ? (
                          <Badge variant="outline">{result.indications}</Badge>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <Badge
                            variant={
                              result.status === "Accept" ? "default" :
                              result.status === "Reject" ? "destructive" :
                              "secondary"
                            }
                          >
                            {result.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {result.comments ? result.comments.substring(0, 30) + "..." : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingResult(result);
                              setShowResultDialog(true);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteResult(result.scanId);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No scan results recorded. Click "Add Result" to start recording inspection data.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Indications */}
      {activeSection === "indications" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Indication Plotting</CardTitle>
                <CardDescription>Document and plot all indications found</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowIndicationDialog(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Indication
                </Button>
                <Button onClick={() => setShowIndicationMap(true)} size="sm" variant="outline">
                  <MapPin className="w-4 h-4 mr-2" />
                  View Map
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.indications && data.indications.length > 0 ? (
              <div className="space-y-3">
                {data.indications.map((indication) => (
                  <Card key={indication.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{indication.type}</Badge>
                            <Badge
                              className={cn(
                                indication.disposition === "Accept" && "bg-green-500",
                                indication.disposition === "Reject" && "bg-red-500",
                                indication.disposition === "Repair" && "bg-yellow-500"
                              )}
                            >
                              {indication.disposition}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Location:</span>
                              <p className="font-medium">
                                X: {indication.location.x}mm, Y: {indication.location.y}mm, Z: {indication.location.z}mm
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Amplitude:</span>
                              <p className="font-medium">{indication.amplitude}%</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Size:</span>
                              <p className="font-medium">{indication.size}mm</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Evaluation:</span>
                              <p className="font-medium">{indication.evaluation}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingIndication(indication);
                              setShowIndicationDialog(true);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteIndication(indication.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No indications recorded. Click "Add Indication" when indications are found.
              </div>
            )}

            {/* Summary Statistics */}
            {data.indications && data.indications.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <Label className="text-sm font-medium mb-3">Indication Summary</Label>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-lg font-medium">{data.indications.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Accepted</p>
                    <p className="text-lg font-medium text-green-600">
                      {data.indications.filter(i => i.disposition === "Accept").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                    <p className="text-lg font-medium text-red-600">
                      {data.indications.filter(i => i.disposition === "Reject").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">For Repair</p>
                    <p className="text-lg font-medium text-yellow-600">
                      {data.indications.filter(i => i.disposition === "Repair").length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Forms */}
      {activeSection === "forms" && (
        <Card>
          <CardHeader>
            <CardTitle>Data Recording Forms</CardTitle>
            <CardDescription>Structured forms for data collection</CardDescription>
            <Button onClick={() => setShowFormDialog(true)} size="sm" className="w-fit">
              <Plus className="w-4 h-4 mr-2" />
              Add Form
            </Button>
          </CardHeader>
          <CardContent>
            {data.dataForms && data.dataForms.length > 0 ? (
              <div className="space-y-3">
                {data.dataForms.map((form, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="mb-2">{form.formType}</Badge>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="text-muted-foreground">Completed by:</span>{" "}
                              <span className="font-medium">{form.completedBy}</span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">Date:</span>{" "}
                              <span className="font-medium">{form.completedDate}</span>
                            </p>
                            {form.data && Object.keys(form.data).length > 0 && (
                              <div className="mt-2 p-2 bg-muted rounded">
                                {Object.entries(form.data).map(([key, value]) => (
                                  <p key={key} className="text-xs">
                                    <span className="text-muted-foreground">{key}:</span>{" "}
                                    <span>{String(value)}</span>
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const forms = data.dataForms?.filter((_, i) => i !== index) || [];
                            updateField("dataForms", forms);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No data forms created. Click "Add Form" to create a data collection form.
              </div>
            )}

            {/* Quick Form Templates */}
            <div className="mt-4 border-t pt-4">
              <Label className="text-sm mb-2">Quick Templates:</Label>
              <div className="flex flex-wrap gap-2">
                {formTypes.map(type => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const form: DataForm = {
                        formType: type,
                        data: {},
                        completedBy: "",
                        completedDate: new Date().toISOString().split('T')[0],
                      };
                      const forms = [...(data.dataForms || []), form];
                      updateField("dataForms", forms);
                    }}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistical Analysis */}
      {activeSection === "statistics" && (
        <Card>
          <CardHeader>
            <CardTitle>Statistical Analysis</CardTitle>
            <CardDescription>Inspection results analysis and charts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Scans</p>
                      <p className="text-2xl font-bold">{data.statistics?.totalScans || 0}</p>
                    </div>
                    <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Accepted</p>
                      <p className="text-2xl font-bold text-green-600">
                        {data.statistics?.acceptedScans || 0}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Rejected</p>
                      <p className="text-2xl font-bold text-red-600">
                        {data.statistics?.rejectedScans || 0}
                      </p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Indications</p>
                      <p className="text-2xl font-bold">
                        {data.statistics?.indicationsFound || 0}
                      </p>
                    </div>
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Critical</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {data.statistics?.criticalFindings || 0}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Success Rate */}
            {data.statistics && data.statistics.totalScans > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <Label className="text-sm font-medium mb-3">Success Rate</Label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Acceptance Rate</span>
                      <span className="font-medium">
                        {((data.statistics.acceptedScans / data.statistics.totalScans) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="h-4 rounded-full bg-gradient-to-r from-green-500 to-green-600"
                        style={{
                          width: `${(data.statistics.acceptedScans / data.statistics.totalScans) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chart Placeholders */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                    <PieChart className="w-12 h-12 text-muted-foreground" />
                    <p className="ml-2 text-muted-foreground">Pie Chart Visualization</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Indication Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                    <BarChart className="w-12 h-12 text-muted-foreground" />
                    <p className="ml-2 text-muted-foreground">Bar Chart Visualization</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generate Report Button */}
            <div className="flex justify-center">
              <Button onClick={() => updateStatistics()}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Refresh Statistics
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingResult ? "Edit" : "Add"} Scan Result</DialogTitle>
            <DialogDescription>Record scan inspection results</DialogDescription>
          </DialogHeader>
          <ResultForm
            result={editingResult}
            probes={probes}
            onSave={addOrUpdateResult}
            onCancel={() => {
              setShowResultDialog(false);
              setEditingResult(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Indication Dialog */}
      <Dialog open={showIndicationDialog} onOpenChange={setShowIndicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndication ? "Edit" : "Add"} Indication</DialogTitle>
            <DialogDescription>Document indication details</DialogDescription>
          </DialogHeader>
          <IndicationForm
            indication={editingIndication}
            onSave={addOrUpdateIndication}
            onCancel={() => {
              setShowIndicationDialog(false);
              setEditingIndication(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Indication Map Dialog */}
      <Dialog open={showIndicationMap} onOpenChange={setShowIndicationMap}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Indication Map</DialogTitle>
            <DialogDescription>Visual representation of all indications</DialogDescription>
          </DialogHeader>
          <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Indication map visualization will be displayed here</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Result Form Component
const ResultForm = ({ result, probes, onSave, onCancel }: {
  result: ScanResult | null;
  probes: any[];
  onSave: (result: ScanResult) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Partial<ScanResult>>(result || {
    location: "",
    probeUsed: "",
    gain: 0,
    indications: 0,
    status: "Review",
    comments: "",
  });

  const handleSubmit = () => {
    onSave({
      scanId: result?.scanId || `scan-${Date.now()}`,
      location: formData.location || "",
      probeUsed: formData.probeUsed || "",
      gain: formData.gain || 0,
      indications: formData.indications || 0,
      status: formData.status as ScanResult["status"] || "Review",
      comments: formData.comments || "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Scan Location</Label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Zone A1, Weld 1"
          />
        </div>

        <div>
          <Label>Probe Used</Label>
          <Select value={formData.probeUsed} onValueChange={(value) => setFormData({ ...formData, probeUsed: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select probe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5MHz 0°">5MHz 0°</SelectItem>
              <SelectItem value="5MHz 45°">5MHz 45°</SelectItem>
              <SelectItem value="5MHz 60°">5MHz 60°</SelectItem>
              <SelectItem value="5MHz 70°">5MHz 70°</SelectItem>
              <SelectItem value="2.25MHz 0°">2.25MHz 0°</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Gain (dB)</Label>
          <Input
            type="number"
            value={formData.gain}
            onChange={(e) => setFormData({ ...formData, gain: parseFloat(e.target.value) })}
            step="0.5"
          />
        </div>

        <div>
          <Label>Number of Indications</Label>
          <Input
            type="number"
            value={formData.indications}
            onChange={(e) => setFormData({ ...formData, indications: parseInt(e.target.value) })}
            min="0"
          />
        </div>

        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as ScanResult["status"] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Accept">Accept</SelectItem>
              <SelectItem value="Reject">Reject</SelectItem>
              <SelectItem value="Review">Review Required</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Comments</Label>
        <Textarea
          value={formData.comments}
          onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          placeholder="Additional notes or observations..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Save Result</Button>
      </div>
    </div>
  );
};

// Indication Form Component
const IndicationForm = ({ indication, onSave, onCancel }: {
  indication: Indication | null;
  onSave: (indication: Indication) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Partial<Indication>>(indication || {
    location: { x: 0, y: 0, z: 0 },
    amplitude: 0,
    size: 0,
    type: "",
    evaluation: "",
    disposition: "Review" as any,
  });

  const handleSubmit = () => {
    onSave({
      id: indication?.id || `ind-${Date.now()}`,
      location: formData.location || { x: 0, y: 0, z: 0 },
      amplitude: formData.amplitude || 0,
      size: formData.size || 0,
      type: formData.type || "",
      evaluation: formData.evaluation || "",
      disposition: formData.disposition as Indication["disposition"] || "Accept",
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Location Coordinates (mm)</Label>
        <div className="grid grid-cols-3 gap-2">
          <Input
            type="number"
            placeholder="X"
            value={formData.location?.x}
            onChange={(e) => setFormData({
              ...formData,
              location: { ...formData.location!, x: parseFloat(e.target.value) }
            })}
          />
          <Input
            type="number"
            placeholder="Y"
            value={formData.location?.y}
            onChange={(e) => setFormData({
              ...formData,
              location: { ...formData.location!, y: parseFloat(e.target.value) }
            })}
          />
          <Input
            type="number"
            placeholder="Z (depth)"
            value={formData.location?.z}
            onChange={(e) => setFormData({
              ...formData,
              location: { ...formData.location!, z: parseFloat(e.target.value) }
            })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Indication Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {indicationTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Amplitude (%)</Label>
          <Input
            type="number"
            value={formData.amplitude}
            onChange={(e) => setFormData({ ...formData, amplitude: parseFloat(e.target.value) })}
            min="0"
            max="100"
          />
        </div>

        <div>
          <Label>Size (mm)</Label>
          <Input
            type="number"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: parseFloat(e.target.value) })}
            step="0.1"
          />
        </div>

        <div>
          <Label>Disposition</Label>
          <Select value={formData.disposition} onValueChange={(value) => setFormData({ ...formData, disposition: value as Indication["disposition"] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dispositions.map(d => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Evaluation Method/Notes</Label>
        <Textarea
          value={formData.evaluation}
          onChange={(e) => setFormData({ ...formData, evaluation: e.target.value })}
          placeholder="Evaluation method and additional details..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Save Indication</Button>
      </div>
    </div>
  );
};