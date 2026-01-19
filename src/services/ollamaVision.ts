/**
 * Ollama Vision Service
 * Local AI service for analyzing technical drawings
 * Uses Ollama with LLaVA or similar vision models
 *
 * Ollama is FREE and open source - runs completely offline
 * Perfect for confidential/air-gapped environments
 */

import type { PartGeometry } from '@/types/techniqueSheet';

// Ollama server URL (default local installation)
const OLLAMA_URL = 'http://localhost:11434';

// Vision models in order of preference
const VISION_MODELS = ['llava:13b', 'llava:7b', 'llama3.2-vision', 'bakllava'];

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
 * Analysis result from Ollama
 */
export interface GeometryAnalysis {
  geometry: PartGeometry | 'unknown';
  confidence: number;
  reasoning: string;
  suggestedArrows?: SuggestedArrow[];
}

/**
 * Ollama server status
 */
export interface OllamaStatus {
  available: boolean;
  models: string[];
  error?: string;
}

/**
 * NDT-specific prompt for geometry detection
 * CRITICAL: Must be accurate for industrial NDT applications
 * Uses chain-of-thought reasoning for better accuracy
 */
const NDT_ANALYSIS_PROMPT = `You are an expert NDT (Non-Destructive Testing) engineer analyzing a technical drawing.

YOUR TASK: Identify the geometry type shown in this drawing.

=== STEP 1: READ ALL TEXT IN THE IMAGE ===
Look for ANY text that says: PLATE, BLOCK, TUBE, PIPE, CYLINDER, CONE, DISK, RING, SPHERE, IMPELLER, BLISK, HEX, BAR
Also look for: "TECHNICAL DRAWING", title blocks, part names, labels.
TEXT LABELS ARE THE MOST RELIABLE SOURCE - if you see "CONE" written, the answer is cone!

=== STEP 2: ANALYZE THE SHAPE ===
Look at the ACTUAL 3D SHAPE being depicted:

CONE indicators:
- Triangular profile (side view)
- Tapered/funnel shape - WIDER at one end, NARROWER at the other
- Circular top with pointed or smaller circular bottom
- Frustum shape (truncated cone)
→ If tapered from wide to narrow = "cone"

PLATE/BLOCK indicators:
- Rectangular box with 6 FLAT faces
- All corners are 90-degree angles
- Uniform thickness throughout
- Looks like a brick, slab, or sheet metal
→ If rectangular/boxy with flat surfaces = "plate"

CYLINDER indicators:
- SOLID circular cross-section
- Same diameter along entire length
- NO HOLE visible in the middle
- Looks like a rod, bar, or shaft
→ If solid round with no hole = "cylinder"

TUBE indicators:
- HOLLOW with visible inner diameter (ID)
- Shows TWO CONCENTRIC CIRCLES (OD and ID)
- Pipe-like with visible wall thickness
→ If hollow circular with visible hole = "tube"

DISK indicators:
- Flat circular, like a coin
- Height much smaller than diameter
→ If flat circular = "disk"

RING indicators:
- Donut/washer shape
- Thick-walled annular with large center hole
→ If donut-shaped = "ring"

SPHERE indicators:
- Perfectly round ball shape
→ If ball-shaped = "sphere"

HEXAGON indicators:
- Six-sided cross-section
→ If hex bar = "hexagon"

IMPELLER indicators:
- Has blades/vanes radiating from center
→ If has blades = "impeller"

=== STEP 3: MAKE YOUR DECISION ===
- If text label exists and matches a geometry → USE THE TEXT LABEL
- If no text, use your visual analysis from Step 2

=== OUTPUT FORMAT ===
Respond with ONLY a JSON object. Replace [GEOMETRY] with the actual type you identified:
{"geometry": "[GEOMETRY]", "confidence": 0.XX, "reasoning": "your analysis here"}

Valid geometry values: plate, cylinder, tube, cone, disk, ring, sphere, hexagon, impeller
DO NOT just copy an example - analyze the actual image!`;

/**
 * Check if Ollama server is available and get installed models
 */
export async function checkOllamaStatus(): Promise<OllamaStatus> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return {
        available: false,
        models: [],
        error: `Ollama server returned ${response.status}`,
      };
    }

    const data = await response.json();
    const models = data.models?.map((m: { name: string }) => m.name) || [];

    // Filter to only vision-capable models
    const visionModels = models.filter((m: string) =>
      VISION_MODELS.some(vm => m.toLowerCase().includes(vm.split(':')[0]))
    );

    return {
      available: true,
      models: visionModels,
      error: visionModels.length === 0
        ? 'No vision models installed. Run: ollama pull llava:13b'
        : undefined,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    // Check for common connection errors
    if (errorMsg.includes('fetch') || errorMsg.includes('ECONNREFUSED')) {
      return {
        available: false,
        models: [],
        error: 'Ollama not running. Start with: ollama serve',
      };
    }

    return {
      available: false,
      models: [],
      error: `Cannot connect to Ollama: ${errorMsg}`,
    };
  }
}

/**
 * Get the best available vision model
 */
async function getBestVisionModel(): Promise<string | null> {
  const status = await checkOllamaStatus();

  if (!status.available || status.models.length === 0) {
    return null;
  }

  // Return first available model from preference list
  for (const preferred of VISION_MODELS) {
    const found = status.models.find(m =>
      m.toLowerCase().includes(preferred.split(':')[0])
    );
    if (found) return found;
  }

  // Fallback to first available vision model
  return status.models[0] || null;
}

/**
 * Analyze a drawing image using Ollama vision
 * @param imageBase64 - Base64 encoded image (with or without data URL prefix)
 * @returns Analysis result with geometry, confidence, and reasoning
 */
export async function analyzeDrawing(imageBase64: string): Promise<GeometryAnalysis> {
  // Get best available model
  const model = await getBestVisionModel();

  if (!model) {
    return {
      geometry: 'unknown',
      confidence: 0,
      reasoning: 'No vision model available. Install with: ollama pull llava:13b',
    };
  }

  // Check if using weak model
  const isWeakModel = model.includes('7b') || model.includes('bakllava');

  // Remove data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: NDT_ANALYSIS_PROMPT,
        images: [base64Data],
        stream: false,
        options: {
          temperature: 0.0, // Zero temperature for most consistent results
          num_predict: 500, // More room for chain-of-thought
          top_k: 10, // More focused sampling
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.response || '';

    // Parse JSON from response
    const result = parseGeometryResponse(responseText);

    // Add warning if using weak model
    if (isWeakModel && result.geometry !== 'unknown') {
      result.reasoning = `[⚠️ Using ${model} - install llava:13b for better accuracy] ${result.reasoning}`;
      // Reduce confidence for weak models
      result.confidence = Math.min(result.confidence, 0.7);
    }

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
 * Parse geometry analysis from Ollama response
 */
function parseGeometryResponse(responseText: string): GeometryAnalysis {
  try {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*?\}/);

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

    return {
      geometry,
      confidence,
      reasoning: parsed.reasoning || 'No reasoning provided',
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
  checkOllamaStatus,
  analyzeDrawing,
};
