/**
 * Claude Vision Service
 * Cloud-based AI service for analyzing technical drawings
 * Uses Anthropic's Claude API with vision capabilities
 *
 * MUCH more accurate than local models for technical drawings
 * Requires API key and internet connection
 *
 * In Electron: Uses secure IPC (API key stays in main process)
 * In Browser: Uses direct fetch with dangerous-direct-browser-access header
 */

import type { PartGeometry } from '@/types/techniqueSheet';

// API endpoint (for browser mode only)
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// Type declaration for Electron API
declare global {
  interface Window {
    electron?: {
      isElectron: boolean;
      claude?: {
        analyzeDrawing: (imageBase64: string, mediaType: string) => Promise<{
          success: boolean;
          geometry?: string;
          confidence?: number;
          reasoning?: string;
          suggestedArrows?: Array<{
            direction: string;
            x: number;
            y: number;
            angle: number;
            label: string;
          }>;
          error?: string;
        }>;
        checkStatus: () => Promise<{
          available: boolean;
          error?: string;
        }>;
      };
    };
  }
}

/**
 * Check if running in Electron with Claude API support
 */
function isElectronWithClaude(): boolean {
  return !!(window.electron?.isElectron && window.electron?.claude);
}

/**
 * Suggested arrow placement from AI
 */
export interface SuggestedArrow {
  direction: string;  // A, B, C, D, etc.
  x: number;          // 0-1 normalized position
  y: number;          // 0-1 normalized position
  angle: number;      // degrees, 0=right, 90=down, 180=left, 270=up
  label: string;      // e.g. "Longitudinal top", "Radial OD"
}

/**
 * Analysis result from Claude
 */
export interface GeometryAnalysis {
  geometry: PartGeometry | 'unknown';
  confidence: number;
  reasoning: string;
  suggestedArrows?: SuggestedArrow[];
}

/**
 * Claude API status
 */
export interface ClaudeStatus {
  available: boolean;
  error?: string;
}

/**
 * Get API key from environment or localStorage
 */
function getApiKey(): string | null {
  // Try environment variable first (for production)
  const envKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (envKey) return envKey;

  // Fallback to localStorage (for development/testing)
  return localStorage.getItem('anthropic_api_key');
}

/**
 * Set API key in localStorage
 */
export function setApiKey(key: string): void {
  localStorage.setItem('anthropic_api_key', key);
}

/**
 * Clear API key from localStorage
 */
export function clearApiKey(): void {
  localStorage.removeItem('anthropic_api_key');
}

/**
 * Check if Claude API is available
 * In Electron: Checks via secure IPC (API key is in main process)
 * In Browser: Checks local environment variable/localStorage
 */
export async function checkClaudeStatus(): Promise<ClaudeStatus> {
  // If running in Electron, use secure IPC
  if (isElectronWithClaude()) {
    try {
      const result = await window.electron!.claude!.checkStatus();
      console.log('🔐 Claude status via Electron IPC:', result);
      return result;
    } catch (error) {
      console.error('❌ Electron IPC error:', error);
      return {
        available: false,
        error: 'Electron IPC error',
      };
    }
  }

  // Browser mode - check local API key
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      available: false,
      error: 'No API key configured. Set VITE_ANTHROPIC_API_KEY or use setApiKey()',
    };
  }

  // Simple validation - API key should start with 'sk-ant-'
  if (!apiKey.startsWith('sk-ant-')) {
    return {
      available: false,
      error: 'Invalid API key format. Should start with sk-ant-',
    };
  }

  return {
    available: true,
  };
}

/**
 * NDT-specific prompt for geometry detection AND arrow placement
 * Optimized for Claude's understanding capabilities
 * Uses visual analysis to place arrows on ACTUAL visible surfaces
 */
const NDT_ANALYSIS_PROMPT = `You are an expert NDT (Non-Destructive Testing) engineer analyzing a technical drawing.

YOUR TASKS:
1. Identify the geometry type of the part
2. Visually locate EXACTLY where the part appears in the image
3. Place scan direction arrows PRECISELY on the visible surfaces

=== STEP 1: IDENTIFY GEOMETRY ===
Look for text labels or analyze the visual shape:
• PLATE/BLOCK: Rectangular solid with flat faces
• CYLINDER: Solid circular cross-section (NO center hole)
• TUBE: HOLLOW circular with visible ID (inner diameter) and OD (outer diameter)
• CONE: Tapered shape - wider at one end, narrower at other
• DISK: Flat circular shape, like a coin or pancake
• RING: Thick-walled donut/annular shape with large center hole
• IMPELLER: Complex part with blades/vanes, stepped hub profile
• SPHERE: Round ball shape

=== STEP 2: MEASURE THE ACTUAL PART LOCATION ===
CRITICAL - You MUST visually measure where the part is in the image!

Look at the image and identify:
1. The LEFT-MOST pixel of the part → this is x_left (as 0-1 fraction of image width)
2. The RIGHT-MOST pixel of the part → this is x_right
3. The TOP-MOST pixel of the part → this is y_top
4. The BOTTOM-MOST pixel of the part → this is y_bottom

IGNORE these when measuring: title blocks, dimension lines, text labels, borders, whitespace

Example: If the part occupies the center-right portion of the image:
- x_left might be 0.35, x_right might be 0.90
- y_top might be 0.15, y_bottom might be 0.85

=== STEP 3: PLACE ARROWS ON MEASURED SURFACES ===
Now place arrows AT THE EDGES of the part you measured!

Coordinate system:
- x=0 is LEFT edge of IMAGE, x=1 is RIGHT edge
- y=0 is TOP edge of IMAGE, y=1 is BOTTOM edge
- angle: 0°=pointing right, 90°=pointing down, 180°=pointing left, 270°=pointing up

ARROW RULES:
1. Arrow BASE (origin point) should be OUTSIDE the part, about 5-10% away from the surface
2. Arrow points INTO the part (toward the surface where ultrasound enters)
3. Arrows must be perpendicular to the entry surface
4. Place arrows on ALL accessible surfaces shown in ALL views

MULTI-VIEW DRAWINGS:
Many drawings show multiple views (Front + Side, or Top + Front + Side).
You MUST place arrows on EACH VIEW separately!

Example: A tube drawing with front view (circle) at x=0.2-0.4 and side view (rectangle) at x=0.55-0.95:
- For front view circle centered at x=0.30:
  - Place "C" arrow at x=0.12 (left of circle OD), y=0.50, angle=0
  - Place "D" arrow at x=0.48 (right of circle OD), y=0.50, angle=180
- For side view rectangle from x=0.55 to x=0.95:
  - Place "A" arrow at x=0.75, y=(y_top - 0.05), angle=90 (from top)
  - Place "B" arrow at x=0.75, y=(y_bottom + 0.05), angle=270 (from bottom)

=== ARROW DIRECTIONS BY GEOMETRY ===

PLATE/BLOCK:
- A: Top surface entry (perpendicular, angle=90)
- B: Bottom surface entry (perpendicular, angle=270)
- C: Left side entry (angle=0)
- D: Right side entry (angle=180)
- E,F: 45° shear waves

TUBE/CYLINDER (place on BOTH front circle view AND side profile view):
- A: Axial from top end
- B: Axial from bottom end
- C: Radial from OD (left side of circle)
- D: Radial from OD (right side of circle)
- E: Circumferential CW
- F: Circumferential CCW
- If tube has ID visible: also add arrows from ID surface

CONE:
- A: Axial from large end
- B: Axial from small end
- C,D: Radial from OD at various heights
- E: Along tapered surface (angle matches taper)

IMPELLER:
- A: Axial from hub top
- B: Axial from hub bottom
- C,D: Radial from hub OD
- E,F: At blade/vane surfaces if visible

=== OUTPUT FORMAT ===
Return ONLY a JSON object (no other text):
{
  "geometry": "tube",
  "confidence": 0.92,
  "reasoning": "Describe what you see: the views present, where the part is located in the image, key features identified",
  "partBounds": {
    "x_left": 0.15,
    "x_right": 0.85,
    "y_top": 0.10,
    "y_bottom": 0.90
  },
  "suggestedArrows": [
    {"direction": "A", "x": 0.50, "y": 0.05, "angle": 90, "label": "Axial top"},
    {"direction": "B", "x": 0.50, "y": 0.95, "angle": 270, "label": "Axial bottom"},
    {"direction": "C", "x": 0.10, "y": 0.50, "angle": 0, "label": "Radial OD left"},
    {"direction": "D", "x": 0.90, "y": 0.50, "angle": 180, "label": "Radial OD right"}
  ]
}

CRITICAL REMINDERS:
- The x,y coordinates MUST match where you actually SEE the part in this specific image
- Do NOT use generic template positions - LOOK at the image and MEASURE
- If the part is in the right half of the image, x values should be 0.5-1.0
- If there are multiple views, place arrows on EACH view
- Arrow base should be slightly OUTSIDE the part surface (5-10% gap)`;

/**
 * Analyze a drawing image using Claude Vision
 * In Electron: Uses secure IPC (API key stays in main process)
 * In Browser: Uses direct fetch with dangerous-direct-browser-access header
 *
 * @param imageBase64 - Base64 encoded image (with or without data URL prefix)
 * @returns Analysis result with geometry, confidence, and reasoning
 */
export async function analyzeDrawing(imageBase64: string): Promise<GeometryAnalysis> {
  // Extract media type and base64 data first (needed for both paths)
  let mediaType = 'image/png';
  let base64Data = imageBase64;

  const dataUrlMatch = imageBase64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (dataUrlMatch) {
    mediaType = dataUrlMatch[1];
    base64Data = dataUrlMatch[2];
  }

  // If running in Electron, use secure IPC
  if (isElectronWithClaude()) {
    console.log('🔐 Using Electron IPC for Claude Vision (secure)');
    try {
      const result = await window.electron!.claude!.analyzeDrawing(base64Data, mediaType);

      if (!result.success) {
        console.error('❌ Electron Claude API error:', result.error);
        return {
          geometry: 'unknown',
          confidence: 0,
          reasoning: result.error || 'Electron IPC error',
        };
      }

      console.log('✅ Electron Claude result:', result);

      // Validate and return result
      const validGeometries: (PartGeometry | 'unknown')[] = [
        'plate', 'cylinder', 'tube', 'cone', 'disk', 'ring',
        'hexagon', 'rectangular_tube', 'impeller', 'sphere', 'unknown'
      ];

      const geometry = validGeometries.includes(result.geometry as PartGeometry)
        ? (result.geometry as PartGeometry)
        : 'unknown';

      return {
        geometry,
        confidence: result.confidence || 0,
        reasoning: result.reasoning || 'No reasoning provided',
        suggestedArrows: result.suggestedArrows as SuggestedArrow[],
      };
    } catch (error) {
      console.error('❌ Electron IPC error:', error);
      return {
        geometry: 'unknown',
        confidence: 0,
        reasoning: `Electron IPC error: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
    }
  }

  // Browser mode - use direct fetch
  console.log('🌐 Using browser fetch for Claude Vision');
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      geometry: 'unknown',
      confidence: 0,
      reasoning: 'No API key configured',
    };
  }

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: NDT_ANALYSIS_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('🔴 Claude API Error:', JSON.stringify(errorData, null, 2));
      const errorMessage = errorData.error?.message || `API returned ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const responseText = data.content?.[0]?.text || '';

    console.log('🤖 Claude Raw Response:', responseText);

    // Parse JSON from response
    const result = parseGeometryResponse(responseText);
    console.log('✅ Parsed Result:', JSON.stringify(result, null, 2));
    console.log('🎯 Suggested Arrows:', result.suggestedArrows?.length || 0, 'arrows');

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return {
      geometry: 'unknown',
      confidence: 0,
      reasoning: `Analysis failed: ${errorMsg}`,
    };
  }
}

/**
 * Parse geometry analysis from Claude response
 */
function parseGeometryResponse(responseText: string): GeometryAnalysis {
  try {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return {
        geometry: 'unknown',
        confidence: 0,
        reasoning: 'Could not parse response from AI model',
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate geometry
    const validGeometries: (PartGeometry | 'unknown')[] = [
      'plate', 'cylinder', 'tube', 'cone', 'disk', 'ring',
      'hexagon', 'rectangular_tube', 'impeller', 'sphere', 'unknown'
    ];

    const geometry = validGeometries.includes(parsed.geometry)
      ? parsed.geometry
      : 'unknown';

    // Validate confidence
    const confidence = typeof parsed.confidence === 'number'
      ? Math.min(1, Math.max(0, parsed.confidence))
      : 0;

    // Parse suggested arrows if present
    let suggestedArrows: SuggestedArrow[] | undefined;
    if (Array.isArray(parsed.suggestedArrows)) {
      suggestedArrows = parsed.suggestedArrows
        .filter((arrow: Record<string, unknown>) =>
          arrow &&
          typeof arrow.direction === 'string' &&
          typeof arrow.x === 'number' &&
          typeof arrow.y === 'number' &&
          typeof arrow.angle === 'number'
        )
        .map((arrow: Record<string, unknown>) => ({
          direction: String(arrow.direction),
          x: Math.min(1, Math.max(0, Number(arrow.x))),
          y: Math.min(1, Math.max(0, Number(arrow.y))),
          angle: Number(arrow.angle) % 360,
          label: String(arrow.label || `Direction ${arrow.direction}`),
        }));
    }

    return {
      geometry,
      confidence,
      reasoning: parsed.reasoning || 'No reasoning provided',
      suggestedArrows,
    };
  } catch {
    return {
      geometry: 'unknown',
      confidence: 0,
      reasoning: 'Failed to parse AI response',
    };
  }
}

export default {
  checkClaudeStatus,
  analyzeDrawing,
  setApiKey,
  clearApiKey,
};
