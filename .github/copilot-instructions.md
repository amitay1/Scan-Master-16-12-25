# ScanMaster AI Coding Instructions

## Project Overview
ScanMaster is an NDT (Non-Destructive Testing) application for ultrasonic inspection planning. It generates **technique sheets** and **inspection reports** compliant with aerospace standards (AMS-STD-2154, ASTM E2375, ASTM A388, BS-EN-10228).

## Architecture

### Frontend (`src/`)
- **React 18 + TypeScript + Vite** with shadcn/ui components
- **State**: TanStack React Query for server state, React local state/context for UI (no Redux/Zustand)
- **3D**: Three.js via `@react-three/fiber` for part visualization
- **Main entry**: `src/pages/Index.tsx` - orchestrates 8 technique sheet tabs

### Backend (`server/`)
- **Express 5 + TypeScript** served by `tsx`
- **Database**: PostgreSQL + Drizzle ORM (schema in `shared/schema.ts`)
- **Auth**: Supabase integration with mock auth for development
- **Routes**: `server/routes.ts` handles API + CAD engine bridge

### CAD Engine (`drawing-engine/`)
- **Python** (CadQuery + FreeCAD TechDraw) for generating technical drawings and STEP files
- Node.js spawns Python scripts via `SCANMASTER_CAD_SCRIPT` env var
- Job specs flow: Client → JSON → Node → Python → PDF/STEP output

## Critical Patterns

### Domain Types
All part geometries and inspection parameters are defined in `src/types/techniqueSheet.ts`:
- `PartGeometry`: 27+ shapes (box, cylinder, tube, l_profile, i_profile, etc.)
- `AcceptanceClass`: AAA/AA/A/B/C per AMS-STD-2154
- Scanning directions A-L for different beam orientations

### Auto-Fill Logic
When material or acceptance class changes, auto-populate dependent fields:
```typescript
// src/utils/autoFillLogic.ts
const recommendedFreq = getRecommendedFrequency(thickness, material);
const metalTravel = calculateMetalTravel(thickness); // 3T rule
const couplant = getCouplantRecommendation(transducerType, material);
```

### Standards Data
UT standards live in `standards/` - update these files (not code) when changing acceptance criteria, FBH tables, or material properties. Frontend reads via services.

### Tab State Architecture
Index.tsx maintains parallel state for Part A and Part B (split mode):
- `inspectionSetup` / `inspectionSetupB`
- `equipment` / `equipmentB`
- etc.

Use `getCurrentData()` to access the active part's data.

## Commands
```bash
npm run dev          # Dev server (tsx watch + Vite)
npm run build        # Production frontend build
npm run lint         # ESLint - run after changes
npm run db:push      # Drizzle schema push to PostgreSQL
npm run electron:dev # Desktop app development
```

## Conventions

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `use-kebab-case.ts`
- Types: `kebab-case.types.ts`
- Utils: `kebab-case.ts`

### Component Patterns
- Functional components only with shadcn/ui primitives
- Use `cn()` utility for conditional Tailwind classes
- Co-locate component hooks in same file when small

### API Routes
All routes in `server/routes.ts`:
- `GET/POST/PATCH/DELETE /api/technique-sheets` - CRUD with org scoping
- `POST /api/cad/engine/parts` - Generate STEP files via Python
- `POST /api/cad/drawings` - Generate PDF drawings via Python

## Do NOT
- Install new npm packages without explicit confirmation
- Edit `dist/`, `cad-3d-output/`, or `cad-engine-jobs/` (build artifacts)
- Add global state libraries (Zustand, Redux)
- Change UT standard calculations without reading `standards/` docs first
- Use `html2canvas` (not in this project)

## Key Documentation
- `CLAUDE.md` - Comprehensive project context
- `AUTO_FILL_DOCUMENTATION.md` - Field dependency logic
- `TECHNIQUE_SHEET_ANALYSIS.md` - Domain rules
- `TUV_EXPORT_SYSTEM_README.md` - Export formats
