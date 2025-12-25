# Overview

This is **Scan Master Inspection Pro**, a professional web application for creating ultrasonic technique sheets and inspection reports for aerospace and industrial non-destructive testing (NDT). The application helps inspectors generate standardized documentation that complies with industry standards like AMS-STD-2154E and ASTM A388/A388M.

The system provides intelligent form-filling assistance, 3D part visualization, technical drawing generation, calibration block recommendations, and comprehensive PDF export capabilities for both technique sheets and full inspection reports.

**Migration Status**: Successfully migrated from Lovable/Supabase to Replit's full-stack environment on November 3, 2025. The backend now uses Express.js with PostgreSQL (Neon) via Drizzle ORM instead of Supabase.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**UI Component System**: Radix UI primitives with shadcn/ui components, styled with Tailwind CSS. The design system follows a dark professional desktop application theme optimized for technical users.

**State Management**: React hooks and context for local state. Form state is managed with react-hook-form. No global state management library is used - data flows through props and context where needed.

**Routing**: React Router v6 for client-side navigation between pages (Index, Auth, Standards, MyStandards).

**Data Fetching**: TanStack Query (React Query) for server state management, caching, and synchronization with the backend.

## Backend Architecture

**Server Framework**: Express.js running on Node.js, configured to serve both API routes and the Vite development server in development mode.

**API Design**: RESTful API with routes prefixed with `/api`. Authentication uses a simple mock auth middleware (header-based user ID) that should be replaced with proper JWT-based authentication in production.

**Database Access**: Drizzle ORM for type-safe database queries. The storage layer is abstracted through an `IStorage` interface implemented by `DbStorage` class.

## Data Storage

**Database**: PostgreSQL via Neon serverless, using the `@neondatabase/serverless` driver with WebSocket support.

**Schema Management**: Drizzle Kit for migrations, with schema definitions in `shared/schema.ts`. Tables include:
- `profiles` - User profile information
- `technique_sheets` - Saved inspection technique sheets (JSONB data column)
- `standards` - Available inspection standards catalog
- `user_standard_access` - User permissions for premium standards
- `purchase_history` - Payment and subscription tracking

**Data Model**: Technique sheets store all form data as JSONB, allowing flexible schema evolution. Related metadata (user, standard, timestamps) are stored as dedicated columns for querying.

## Authentication and Authorization

**Provider**: Supabase Auth for user authentication (email/password, OAuth providers).

**Session Management**: Supabase handles session tokens and refresh logic. Client-side auth state is managed through the `useAuth` hook.

**Authorization**: Standard access control is implemented through the `user_standard_access` table. Free standards (AMS-STD-2154E) are accessible to all authenticated users. Premium standards require purchase or subscription.

## 3D Visualization

**Rendering**: React Three Fiber (R3F) wrapping Three.js for WebGL-based 3D rendering.

**Components**: Custom geometry builders in `ShapeGeometries.ts` generate parametric 3D models based on part specifications. Material properties are defined in `ShapeMaterials.ts`.

**Performance**: Debouncing is used extensively to prevent re-renders during dimension input. Deep comparison hooks ensure geometry only rebuilds when actual values change.

## Technical Drawing Generation

**Vector Graphics**: Paper.js for 2D vector drawing on HTML canvas.

**CAD Geometry**: MakerJS library for precise geometric calculations and CAD-standard constructions.

**Drawing Standards**: Implements ISO 128 line standards, professional dimensioning with arrows, cross-sections with hatching, and multi-view orthographic projections.

**Export Formats**: 
- PDF via jsPDF for documents
- DXF-Writer for AutoCAD compatibility (architectural drawings)
- Canvas-based raster images for preview

## PDF Generation

**Library**: jsPDF with autoTable plugin for structured document generation.

**Document Types**:
- Technique sheets (5+ pages with equipment, calibration, scan parameters)
- Inspection reports (19 pages with C-Scan images, A-Scan waveforms, probe details)
- Calibration block drawings with technical specifications

**Styling**: Mimics professional aerospace documentation with blue headers, structured tables, and technical diagrams embedded as base64 images.

## Auto-Fill Intelligence

**Material Database**: Comprehensive properties for aluminum, steel, stainless steel, titanium, and magnesium including acoustic velocity, impedance, attenuation, and surface finish requirements.

**Smart Recommendations**: Rule-based engine in `enhancedAutoFillLogic.ts` that suggests:
- Appropriate inspection frequencies based on material and thickness
- Calibration block types matching part geometry
- Scan coverage patterns for different geometries
- Acceptance criteria per standard requirements

**Standard References**: Inline help system with exact text from MIL-STD-2154 and ASTM A388, including section numbers and requirement tables.

# External Dependencies

## Primary Infrastructure

**Neon Database** - Serverless PostgreSQL hosting with WebSocket support for real-time queries.

**Supabase** - Backend-as-a-Service providing authentication, user management, and edge functions for payment processing.

**Lovable/GPT Engineer** - Development platform where the application is built and deployed.

## Key NPM Packages

**UI & Styling**:
- `@radix-ui/*` - Accessible component primitives (20+ packages for dialogs, dropdowns, tabs, etc.)
- `tailwindcss` - Utility-first CSS framework
- `next-themes` - Theme management (dark mode support)

**3D Graphics**:
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Helper components for R3F
- `three` - 3D graphics library
- `@jscad/modeling` - Parametric 3D CAD modeling

**Technical Drawing**:
- `paper` - Vector graphics scripting framework
- `makerjs` - 2D CAD library for precise geometry
- `opentype.js` - Font rendering for technical text
- `chroma-js` - Color manipulation for heat maps and visualizations

**Document Generation**:
- `jspdf` - PDF document creation
- `jspdf-autotable` - Table generation for PDFs
- `dxf-writer` - AutoCAD DXF file export

**Data & Forms**:
- `@tanstack/react-query` - Server state management
- `react-hook-form` - Form state and validation
- `@hookform/resolvers` - Integration with Zod validation
- `zod` - Schema validation
- `drizzle-orm` - Type-safe database ORM

**Date Handling**: `date-fns` for date formatting and manipulation.

## Development Tools

**TypeScript** - Static typing with relaxed compiler settings (`noImplicitAny: false`, `strictNullChecks: false`).

**Vite** - Fast development server with HMR, optimized production builds.

**ESLint** - Code linting with TypeScript support.

**Drizzle Kit** - Database schema management and migrations.

## Service Worker

Basic PWA support with network-first caching strategy for offline functionality, registered in `public/service-worker.js`.

## Scan Direction Visualization

**Enhanced Visualization System**: Advanced scan direction visualization that fully complies with AMS-STD-2154 standard for all part geometries. The new `ScanDirectionVisualizerEnhanced` component provides:

**Geometry Support**:
- All AMS-STD-2154 part geometries: box, cylinder, tube, rectangular_tube, hexagon, sphere, cone, plate, bar, forging, disk, ring, etc.
- Automatic geometry detection and appropriate visualization rendering
- Standard-compliant scan patterns for each geometry type

**Advanced Scan Patterns**:
- Raster scan (orthogonal grid pattern for plates/boxes)
- Helix scan (spiral pattern for tubes/cylinders)
- Multi-axis scans (X, Y, Z directional scanning)
- Contour-following (for complex forgings)
- Angle beam scans (45°, 60°, 70°) with beam spread visualization

**3D Isometric Visualizations**:
- True 3D isometric projections using SVG (no WebGL dependency)
- Interactive drag-to-rotate functionality
- Animated scan path progression with play/pause controls
- Color-coded paths for different wave modes (Longitudinal, Shear)
- Professional depth perception with shadows and gradients

**Technical Features**:
- Beam spread and focal zone visualization
- Near/Far field region indicators
- Critical angle markings for mode conversion
- Coupling method indicators (immersion, gel, direct contact)
- Real-time scan coverage percentage display
- Interactive inspection zones (A, B, C)

**Demo Page**: Available at `/visualizer-demo` showcasing 8 different geometry examples with appropriate scan patterns.

## Recent Fixes

**November 8, 2025 (Latest)**:
- **CRITICAL FIX**: Resolved all SVG ID collisions causing desktop-only animation bugs - replaced hardcoded SVG IDs with React `useId()` hook for deterministic unique IDs across all components:
  - `LiquidProgressGauge` - Fixed gradient, clipPath, and pattern IDs
  - `CalibrationBlockDrawing` - Fixed all 6 drawing variants (grid, sectionHatch, wallHatch, angleBeamHatch, notchHatch, iiwHatch patterns)
  - `ScanDirectionVisualizer` - Fixed arrow marker IDs
  - `SplashScreen` - Fixed depth-grid pattern ID
  - Root cause: Multiple component instances sharing same SVG IDs when rendered side-by-side on desktop layouts
- **CRITICAL FIX**: Fixed StandardSelector text overflow in narrow sidebars - lock message now uses vertical stacking with proper text wrapping instead of truncation (no more "This -30% ov" cutoff)
- **UX FIX**: Improved StandardSelector layout - feature badges in 2-column grid with truncation and tooltips for full text
- **ANIMATION FIX**: Enhanced liquid progress gauge CSS with hardware acceleration (`will-change`, `transform: translateZ(0)`, `backface-visibility: hidden`) for consistent cross-browser performance
- **RESPONSIVE FIX**: Made liquid progress gauge responsive with larger size on desktop (140px × 280px) and smaller on mobile (100px × 200px)

**November 6, 2025**:
- **CRITICAL FIX**: Fixed Figure 4A (Angle Beam Test Block) SDH positioning - corrected from impossible depth values to proper length-based positions (25mm, 50mm, 75mm along 100mm length)
- **CRITICAL FIX**: Added missing dimension segments to Figure 4A for complete fabrication specifications - both TOP VIEW and SECTION A-A now have fully closed dimension chains
- **UX FIX**: Made StandardSelector fully responsive for all screen sizes with proper text wrapping, flexible layouts, and mobile-optimized sizing
- **DATABASE FIX**: Initialized database schema with `drizzle-kit push` to create missing `organizations` and `org_members` tables
- **AUTH FIX**: Corrected mock user ID in `src/hooks/useAuth.tsx` from invalid string `'dev-user-id'` to proper UUID format `'00000000-0000-0000-0000-000000000000'`

**November 5, 2025**:
- **CRITICAL FIX**: Improved technical drawing contrast for dark backgrounds - all drawing elements now use high-contrast colors:
  - Main outlines: White (#FFFFFF) instead of black
  - Center lines: Gold (#FFD700) for high visibility
  - Dimension lines and leaders: Cyan (#00D4FF) for clear differentiation
  - Section cut planes: Red (#FF6B6B) for emphasis
  - Text labels: White with bold weight for maximum readability
  - Hatching and secondary elements: Light gray (#CCCCCC, #B0B0B0)
  - Fill colors adjusted to mid-tones (#505050, #707070) for depth without obscuring lines
  - Grid lines darkened to #404040 to remain subtle
  - Scan coverage legend updated with white text and borders

**November 3, 2025**:
- Fixed infinite tsx watch restart loop by adding `--ignore '**/*.timestamp-*.mjs'` flag to ignore Vite's temporary files
- Fixed mock authentication to use valid UUID format (`00000000-0000-0000-0000-000000000000`) instead of string to satisfy Drizzle schema validation
- Resolved `@mediapipe/tasks-vision` build errors by creating a custom Vite plugin that stubs out the package (app doesn't use FaceLandmarker feature)
- Production builds now succeed reliably for deployment

## Known Limitations

- Authentication is currently mocked in the server (uses `x-user-id` header with UUID `00000000-0000-0000-0000-000000000000`). Production requires implementing proper JWT validation with Supabase Auth.
- Flatten.js library installation failed - geometric flatten operations are handled by alternative approaches.
- The application expects Postgres but may work with other Drizzle-supported databases with schema adjustments.
- Old Supabase edge functions code remains in `supabase/functions/` directory for reference but is not used.