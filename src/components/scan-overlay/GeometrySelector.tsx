/**
 * Geometry Selector Component
 * Geometry selection for custom drawing overlay with AI suggestion support
 * Supports Claude Vision API and Ollama local models
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Shapes, Sparkles, Loader2, AlertCircle, Key, Cloud, Cpu } from 'lucide-react';
import type { PartGeometry } from '@/types/techniqueSheet';
import type { GeometryAnalysis } from '@/services/ollamaVision';
import type { VisionProvider } from './hooks/useOllamaVision';

// Geometry options with display names
const GEOMETRY_OPTIONS: Array<{ value: PartGeometry; label: string; icon: string }> = [
  { value: 'plate', label: 'Plate / Block', icon: '▭' },
  { value: 'cylinder', label: 'Cylinder / Round Bar', icon: '○' },
  { value: 'tube', label: 'Tube / Pipe', icon: '◎' },
  { value: 'disk', label: 'Disk', icon: '⬭' },
  { value: 'ring', label: 'Ring', icon: '◯' },
  { value: 'cone', label: 'Cone', icon: '△' },
  { value: 'hexagon', label: 'Hex Bar', icon: '⬡' },
  { value: 'rectangular_tube', label: 'Rectangular Tube', icon: '▢' },
  { value: 'impeller', label: 'Impeller / Blisk', icon: '❋' },
  { value: 'sphere', label: 'Sphere', icon: '●' },
];

interface GeometrySelectorProps {
  /** Currently selected geometry */
  selectedGeometry?: PartGeometry | null;
  /** Callback when geometry is selected */
  onGeometrySelect: (geometry: PartGeometry) => void;
  /** AI analysis result (optional) */
  aiAnalysis?: GeometryAnalysis | null;
  /** Whether AI is currently analyzing */
  isAnalyzing?: boolean;
  /** AI error message */
  aiError?: string | null;
  /** Active AI provider */
  activeProvider?: VisionProvider;
  /** Callback to set Claude API key */
  onSetApiKey?: (key: string) => void;
}

export const GeometrySelector: React.FC<GeometrySelectorProps> = ({
  selectedGeometry,
  onGeometrySelect,
  aiAnalysis,
  isAnalyzing = false,
  aiError,
  activeProvider = 'none',
  onSetApiKey,
}) => {
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Get confidence percentage and color
  const getConfidenceInfo = (confidence: number) => {
    const percent = Math.round(confidence * 100);
    if (confidence >= 0.8) return { percent, color: 'text-green-600', bg: 'bg-green-100' };
    if (confidence >= 0.6) return { percent, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { percent, color: 'text-orange-600', bg: 'bg-orange-100' };
  };

  // Get provider info
  const getProviderInfo = () => {
    switch (activeProvider) {
      case 'claude':
        return { icon: <Cloud className="h-3 w-3" />, label: 'Claude AI', color: 'text-blue-500' };
      case 'ollama':
        return { icon: <Cpu className="h-3 w-3" />, label: 'Ollama (Local)', color: 'text-green-500' };
      default:
        return { icon: <AlertCircle className="h-3 w-3" />, label: 'No AI', color: 'text-gray-400' };
    }
  };

  const providerInfo = getProviderInfo();

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim() && onSetApiKey) {
      onSetApiKey(apiKeyInput.trim());
      setApiKeyInput('');
      setShowApiKeyInput(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shapes className="h-4 w-4 text-blue-500" />
            Select Geometry Type
          </CardTitle>
          <div className={`flex items-center gap-1 text-xs ${providerInfo.color}`}>
            {providerInfo.icon}
            <span>{providerInfo.label}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* API Key Configuration */}
        {activeProvider === 'none' && onSetApiKey && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            {!showApiKeyInput ? (
              <div className="space-y-2">
                <p className="text-xs text-blue-700">
                  Add Claude API key for accurate geometry detection
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => setShowApiKeyInput(true)}
                >
                  <Key className="h-3 w-3 mr-1" />
                  Add Claude API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="text-xs h-8"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 text-xs h-7"
                    onClick={handleSaveApiKey}
                    disabled={!apiKeyInput.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7"
                    onClick={() => {
                      setShowApiKeyInput(false);
                      setApiKeyInput('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                <p className="text-[10px] text-blue-600">
                  Get key from: console.anthropic.com
                </p>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis Status */}
        {isAnalyzing && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>AI is analyzing your drawing...</span>
          </div>
        )}

        {/* AI Suggestion */}
        {aiAnalysis && aiAnalysis.geometry !== 'unknown' && aiAnalysis.confidence > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-medium text-purple-700">AI Suggestion</span>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {GEOMETRY_OPTIONS.find(g => g.value === aiAnalysis.geometry)?.icon || '?'}
                  </span>
                  <span className="font-medium text-purple-900">
                    {GEOMETRY_OPTIONS.find(g => g.value === aiAnalysis.geometry)?.label || aiAnalysis.geometry}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getConfidenceInfo(aiAnalysis.confidence).bg} ${getConfidenceInfo(aiAnalysis.confidence).color}`}>
                  {getConfidenceInfo(aiAnalysis.confidence).percent}% confident
                </span>
              </div>
              <p className="text-xs text-purple-700 mb-2">{aiAnalysis.reasoning}</p>
              <Button
                size="sm"
                variant="default"
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => onGeometrySelect(aiAnalysis.geometry as PartGeometry)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Use This Suggestion
              </Button>
            </div>
          </div>
        )}

        {/* AI Error / Not Available */}
        {aiError && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">AI not available</p>
              <p className="text-amber-600">{aiError}</p>
              <p className="text-amber-600 mt-1">Select geometry manually below.</p>
            </div>
          </div>
        )}

        {/* Manual Selection */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            {aiAnalysis && aiAnalysis.geometry !== 'unknown'
              ? 'Or choose manually:'
              : 'Choose the geometry type that matches your drawing:'}
          </p>
          <Select
            value={selectedGeometry || undefined}
            onValueChange={(value) => onGeometrySelect(value as PartGeometry)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose geometry type..." />
            </SelectTrigger>
            <SelectContent>
              {GEOMETRY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{option.icon}</span>
                    <span>{option.label}</span>
                    {aiAnalysis?.geometry === option.value && (
                      <Sparkles className="h-3 w-3 text-purple-500 ml-1" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Currently Selected */}
        {selectedGeometry && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Selected: <strong>{GEOMETRY_OPTIONS.find(g => g.value === selectedGeometry)?.label || selectedGeometry}</strong>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeometrySelector;
