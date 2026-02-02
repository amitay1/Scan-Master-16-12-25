// @ts-nocheck
/**
 * useVisionAnalysis Hook
 * React hook for AI vision model integration
 * Supports both Claude Vision API (cloud) and Ollama (local)
 * Claude is preferred for accuracy, Ollama as fallback for offline use
 */

import { useState, useCallback, useEffect } from 'react';
import type { GeometryAnalysis } from '@/services/ollamaVision';
import { checkOllamaStatus, analyzeDrawing as analyzeWithOllama } from '@/services/ollamaVision';
import {
  checkClaudeStatus,
  analyzeDrawing as analyzeWithClaude,
  setApiKey as setClaudeApiKey,
  clearApiKey as clearClaudeApiKey,
} from '@/services/claudeVision';

export type VisionProvider = 'claude' | 'ollama' | 'none';

interface VisionStatus {
  claude: { available: boolean; error?: string };
  ollama: { available: boolean; models: string[]; error?: string };
  activeProvider: VisionProvider;
}

interface UseOllamaVisionReturn {
  /** Combined status of vision providers */
  status: VisionStatus | null;
  /** Whether status is being checked */
  isCheckingStatus: boolean;
  /** Whether analysis is in progress */
  isAnalyzing: boolean;
  /** Analysis result */
  result: GeometryAnalysis | null;
  /** Error message */
  error: string | null;
  /** Currently active provider */
  activeProvider: VisionProvider;
  /** Check all vision provider statuses */
  checkStatus: () => Promise<void>;
  /** Analyze an image */
  analyze: (imageBase64: string) => Promise<GeometryAnalysis>;
  /** Reset analysis state */
  reset: () => void;
  /** Set Claude API key */
  setApiKey: (key: string) => void;
  /** Clear Claude API key */
  clearApiKey: () => void;
  /** Force use specific provider */
  setProvider: (provider: VisionProvider) => void;
}

/**
 * Hook for using AI vision models for drawing analysis
 * Automatically selects the best available provider
 */
export function useOllamaVision(): UseOllamaVisionReturn {
  const [status, setStatus] = useState<VisionStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GeometryAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<VisionProvider>('none');
  const [forcedProvider, setForcedProvider] = useState<VisionProvider | null>(null);

  /**
   * Check all vision provider statuses
   */
  const checkStatus = useCallback(async () => {
    setIsCheckingStatus(true);
    setError(null);

    try {
      // Check both providers in parallel
      const [claudeStatus, ollamaStatus] = await Promise.all([
        checkClaudeStatus(),
        checkOllamaStatus(),
      ]);

      // Determine active provider (Claude preferred if available)
      let provider: VisionProvider = 'none';
      if (forcedProvider && forcedProvider !== 'none') {
        provider = forcedProvider;
      } else if (claudeStatus.available) {
        provider = 'claude';
      } else if (ollamaStatus.available && ollamaStatus.models.length > 0) {
        provider = 'ollama';
      }

      const newStatus: VisionStatus = {
        claude: claudeStatus,
        ollama: ollamaStatus,
        activeProvider: provider,
      };

      setStatus(newStatus);
      setActiveProvider(provider);

      // Set error if no provider available
      if (provider === 'none') {
        if (!claudeStatus.available && !ollamaStatus.available) {
          setError('No AI vision available. Add Claude API key or start Ollama.');
        } else if (claudeStatus.error) {
          setError(claudeStatus.error);
        } else if (ollamaStatus.error) {
          setError(ollamaStatus.error);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to check status';
      setError(errorMsg);
      setStatus({
        claude: { available: false, error: errorMsg },
        ollama: { available: false, models: [], error: errorMsg },
        activeProvider: 'none',
      });
      setActiveProvider('none');
    } finally {
      setIsCheckingStatus(false);
    }
  }, [forcedProvider]);

  /**
   * Analyze an image using the best available provider
   */
  const analyze = useCallback(async (imageBase64: string): Promise<GeometryAnalysis> => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // Check status first if not already checked
      let currentProvider = activeProvider;
      if (!status) {
        await checkStatus();
        currentProvider = forcedProvider || (status?.activeProvider ?? 'none');
      }

      // Use forced provider if set
      if (forcedProvider && forcedProvider !== 'none') {
        currentProvider = forcedProvider;
      }

      let analysis: GeometryAnalysis;

      if (currentProvider === 'claude') {
        console.log('🤖 Analyzing with Claude Vision API...');
        analysis = await analyzeWithClaude(imageBase64);

        // If Claude fails, try Ollama as fallback
        if (analysis.geometry === 'unknown' && analysis.confidence === 0 && !forcedProvider) {
          const ollamaStatus = status?.ollama;
          if (ollamaStatus?.available && ollamaStatus.models.length > 0) {
            console.log('⚠️ Claude failed, falling back to Ollama...');
            analysis = await analyzeWithOllama(imageBase64);
          }
        }
      } else if (currentProvider === 'ollama') {
        console.log('🦙 Analyzing with Ollama...');
        analysis = await analyzeWithOllama(imageBase64);
      } else {
        analysis = {
          geometry: 'unknown',
          confidence: 0,
          reasoning: 'No AI vision provider available. Configure Claude API key or start Ollama.',
        };
      }

      setResult(analysis);

      // Set error if analysis failed
      if (analysis.geometry === 'unknown' && analysis.confidence === 0) {
        setError(analysis.reasoning);
      }

      return analysis;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMsg);

      const failedResult: GeometryAnalysis = {
        geometry: 'unknown',
        confidence: 0,
        reasoning: errorMsg,
      };
      setResult(failedResult);
      return failedResult;
    } finally {
      setIsAnalyzing(false);
    }
  }, [status, activeProvider, forcedProvider, checkStatus]);

  /**
   * Reset analysis state
   */
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  /**
   * Set Claude API key
   */
  const setApiKey = useCallback((key: string) => {
    setClaudeApiKey(key);
    // Re-check status after setting key
    checkStatus();
  }, [checkStatus]);

  /**
   * Clear Claude API key
   */
  const clearApiKey = useCallback(() => {
    clearClaudeApiKey();
    // Re-check status after clearing key
    checkStatus();
  }, [checkStatus]);

  /**
   * Force use specific provider
   */
  const setProvider = useCallback((provider: VisionProvider) => {
    setForcedProvider(provider === 'none' ? null : provider);
    setActiveProvider(provider);
  }, []);

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    status,
    isCheckingStatus,
    isAnalyzing,
    result,
    error,
    activeProvider,
    checkStatus,
    analyze,
    reset,
    setApiKey,
    clearApiKey,
    setProvider,
  };
}

export default useOllamaVision;
