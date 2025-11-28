import express, { type Express, type Request, type Response, type NextFunction } from "express";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { z } from "zod";
import { DbStorage } from "./storage";
import logger from "./utils/logger";
import { insertTechniqueSheetSchema } from "../shared/schema";
import type { CadJobDTO } from "../shared/drawingSpec";
// import { registerOrganizationRoutes } from "./routes/organizations"; // Disabled - tables don't exist yet

const storage = new DbStorage();

// Minimal validation for CAD jobs coming from the client. We deliberately
// keep this fairly generic – the Python side performs deeper validation
// of operations.
const cadJobSchema = z.object({
  solid: z.object({
    id: z.string(),
    operations: z.array(
      z.object({
        type: z.string(),
      }),
    ).nonempty(),
  }),
  drawing: z.object({
    page_title: z.string(),
    template_path: z.string(),
    views: z.array(
      z.object({
        id: z.string(),
        direction: z.tuple([z.number(), z.number(), z.number()]),
        is_section: z.boolean().optional(),
        section_normal: z.tuple([z.number(), z.number(), z.number()]).nullable().optional(),
        scale: z.number().optional(),
      }),
    ),
    dimensions: z.array(
      z.object({
        view_id: z.string(),
        kind: z.string(),
        label: z.string(),
        edges: z.array(z.string()).optional(),
      }),
    ).optional(),
  }),
  output_pdf: z.string().optional(),
  output_svg: z.string().optional(),
});

// Enhanced schema for ScanMaster CAD Engine with calibration support
const cadSolidJobSchema = z.object({
  shapeType: z.string(),
  parameters: z.record(z.any()).default({}),
  calibrationData: z.object({
    // נתונים מטאב Calibration
    fbhSizes: z.string().optional(),
    metalTravelDistance: z.union([z.number(), z.string().transform(val => Number(val))]).optional(),
    blockDimensions: z.object({
      L: z.number().min(1, "Block length must be positive"),
      W: z.number().min(1, "Block width must be positive"),
      H: z.number().min(1, "Block height must be positive"),
    }).optional(),
    standardType: z.string().optional(),

    // נתונים מטאב Inspection Setup
    material: z.string().optional(),
    partThickness: z.union([z.number(), z.string().transform(val => Number(val))]).optional(),
    partType: z.string().optional(),
    isHollow: z.boolean().optional(),
    acceptanceClass: z.string().optional(),

    // נתונים מטאב Equipment
    probeType: z.string().optional(),
    frequency: z.union([z.number(), z.string().transform(val => Number(val))]).optional(),
    inspectionType: z.string().optional(),

    // Scanning directions visualization
    includeScanDirections: z.boolean().optional(),
  }).optional(),
  metadata: z.object({
    userId: z.string().optional(),
    projectId: z.string().optional(),
    partName: z.string().optional(),
  }).optional(),
});

// Enhanced auth middleware with org_id support (optional)
const mockAuth = (req: any, res: any, next: any) => {
  // For now, use a mock user ID (valid UUID format for development)
  // In production, this would validate JWT and extract user ID
  req.userId = req.headers["x-user-id"] || "00000000-0000-0000-0000-000000000000";
  req.orgId = req.headers["x-org-id"] || null;

  next();
};

// Helper to safely read auth properties from the (augmented) Express request
// without upsetting the TypeScript type system.
const getAuthContext = (req: Request): { userId: string; orgId?: string } => {
  const anyReq = req as any;
  const userId = String(anyReq.userId || "00000000-0000-0000-0000-000000000000");
  const rawOrgId = anyReq.orgId;
  const orgId = rawOrgId != null && rawOrgId !== "" ? String(rawOrgId) : undefined;
  return { userId, orgId };
};

export function registerRoutes(app: Express) {
  // Serve generated CAD PDFs from a dedicated folder.
  const cadOutputDir = path.join(process.cwd(), "cad-output");
  app.use("/cad-output", express.static(cadOutputDir));

  // Serve generated 3D STEP files from the ScanMaster CAD Engine.
  const cad3dOutputRoot = path.join(process.cwd(), "cad-3d-output");
  app.use("/cad-3d-output", express.static(cad3dOutputRoot));

  // Register organization routes - DISABLED until migrations are run
  // registerOrganizationRoutes(app);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Temporary mock organizations endpoint (until database migrations are run)
  // Use a valid UUID format for the mock organization
  const MOCK_ORG_ID = "11111111-1111-1111-1111-111111111111";
  
  app.get("/api/organizations", mockAuth, (req, res) => {
    res.json([
      {
        id: MOCK_ORG_ID,
        name: "Default Organization",
        slug: "default",
        plan: "free",
        isActive: true,
        userRole: "owner"
      }
    ]);
  });

  app.get("/api/organizations/:id/role", mockAuth, (req, res) => {
    res.json({ role: "owner" });
  });

  // Technique Sheets Routes
  app.get("/api/technique-sheets", mockAuth, async (req, res) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      const sheets = await storage.getTechniqueSheetsByUserId(userId, orgId);
      res.json(sheets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/technique-sheets/:id", mockAuth, async (req, res) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      const sheet = await storage.getTechniqueSheetById(req.params.id, orgId);
      if (!sheet) {
        return res.status(404).json({ error: "Technique sheet not found" });
      }
      // Check both user and org access
      if (sheet.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (orgId && sheet.orgId !== orgId) {
        return res.status(403).json({ error: "Forbidden - wrong organization" });
      }
      res.json(sheet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/technique-sheets", mockAuth, async (req, res) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      
      // Debug logging
      logger.info('📥 Technique sheet POST request:');
      logger.info('  userId:', userId);
      logger.info('  orgId:', orgId);
      logger.info('  body keys:', Object.keys(req.body));
      logger.info('  sheetName:', req.body.sheetName);
      logger.info('  standard:', req.body.standard);
      logger.info('  data type:', typeof req.body.data);
      
      const data = insertTechniqueSheetSchema.parse({
        ...req.body,
        userId,
        orgId, // Include org_id
      });
      const sheet = await storage.createTechniqueSheet(data, orgId);
      res.status(201).json(sheet);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        logger.error('❌ Technique sheet validation failed:');
        error.errors.forEach((err: any) => {
          logger.error(`  - Path: ${err.path.join('.')}, Code: ${err.code}, Message: ${err.message}`);
        });
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      logger.error('❌ Technique sheet creation failed:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/technique-sheets/:id", mockAuth, async (req, res) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      const existing = await storage.getTechniqueSheetById(req.params.id, orgId);
      if (!existing) {
        return res.status(404).json({ error: "Technique sheet not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (orgId && existing.orgId !== orgId) {
        return res.status(403).json({ error: "Forbidden - wrong organization" });
      }

      const sheet = await storage.updateTechniqueSheet(req.params.id, req.body, orgId);
      res.json(sheet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/technique-sheets/:id", mockAuth, async (req, res) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      const existing = await storage.getTechniqueSheetById(req.params.id, orgId);
      if (!existing) {
        return res.status(404).json({ error: "Technique sheet not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (orgId && existing.orgId !== orgId) {
        return res.status(403).json({ error: "Forbidden - wrong organization" });
      }

      await storage.deleteTechniqueSheet(req.params.id, orgId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // CAD drawing generation route - bridges the JSON spec to the Python
  // job_runner. The client can either build the CadJobDTO directly or use
  // the helpers in @shared/drawingSpec.
  app.post("/api/cad/drawings", mockAuth, async (req: Request, res: Response) => {
    try {
      const parsed = cadJobSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid CAD job payload",
          details: parsed.error.flatten(),
        });
      }

      const job = parsed.data as unknown as CadJobDTO;

      // Always prefer a server-side template path if provided. The frontend
      // does not know the filesystem layout of the backend, so we override any
      // placeholder value sent from the client with TECHDRAW_TEMPLATE_PATH when
      // available.
      const templatePathEnv = process.env.TECHDRAW_TEMPLATE_PATH;
      if (templatePathEnv && templatePathEnv.trim().length > 0) {
        job.drawing.template_path = templatePathEnv;
      }

      // Always control output paths on the server side for security.
      const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const userId = String((req as any).userId || "anonymous");

      const userDir = path.join(cadOutputDir, userId);
      const outputPdfPath = path.join(userDir, `${jobId}.pdf`);

      const jobForPython: CadJobDTO = {
        ...job,
        output_pdf: outputPdfPath,
        output_svg: job.output_svg ? path.join(userDir, `${jobId}.svg`) : undefined,
      };

      // Allow the Python drawing engine to live outside this Node project.
      // If CAD_ENGINE_ROOT is set, we use that as the base directory;
      // otherwise we fall back to the local ./drawing-engine folder.
      const engineRoot = process.env.CAD_ENGINE_ROOT
        ? path.resolve(process.env.CAD_ENGINE_ROOT)
        : path.join(process.cwd(), "drawing-engine");

      const scriptPath = path.join(engineRoot, "job_runner.py");

      const pythonBin = process.env.PYTHON_BIN || "python";

      const pythonResult = await new Promise<any>((resolve, reject) => {
        const child = spawn(pythonBin, [scriptPath], {
          stdio: ["pipe", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (chunk) => {
          stdout += chunk.toString();
        });

        child.stderr.on("data", (chunk) => {
          stderr += chunk.toString();
        });

        child.on("error", (err) => {
          reject(err);
        });

        child.on("close", (code) => {
          if (code !== 0) {
            return reject(new Error(`Python exited with code ${code}: ${stderr}`));
          }
          try {
            const parsedResult = JSON.parse(stdout || "{}");
            resolve(parsedResult);
          } catch (err: any) {
            reject(new Error(`Failed to parse Python output: ${err.message}`));
          }
        });

        child.stdin.write(JSON.stringify(jobForPython));
        child.stdin.end();
      });

      const publicPdfUrl = `/cad-output/${userId}/${jobId}.pdf`;

      res.json({
        pdfUrl: publicPdfUrl,
        jobId,
        pythonResult,
      });
    } catch (error: any) {
      logger.error("Failed to generate CAD drawing", {
        error: error.message,
        stack: error.stack,
      });
      res.status(500).json({ error: "Failed to generate CAD drawing" });
    }
  });

  // Standards Routes
  app.get("/api/standards", async (req, res) => {
    try {
      const standards = await storage.getAllStandards();
      res.json(standards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/standards/:id", async (req, res) => {
    try {
      const standard = await storage.getStandardById(req.params.id);
      if (!standard) {
        return res.status(404).json({ error: "Standard not found" });
      }
      res.json(standard);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3D solid generation route using the external ScanMaster CAD Engine.
  // This produces STEP files and is designed to work with the
  // integration_examples/generate_drawing.py (or similar) entrypoint.
  app.post("/api/cad/engine/parts", mockAuth, async (req: Request, res: Response) => {
    try {
      // Debug logging
      logger.info("Received CAD solid generation request", {
        body: req.body,
        userId: (req as any).userId,
      });

      const parsed = cadSolidJobSchema.safeParse(req.body);
      if (!parsed.success) {
        logger.error("CAD solid job validation failed", {
          error: parsed.error.flatten(),
          body: req.body,
          fieldErrors: parsed.error.flatten().fieldErrors,
        });
        console.error("🚨 Validation Details:", JSON.stringify(parsed.error.flatten(), null, 2));
        console.error("🚨 Received Body:", JSON.stringify(req.body, null, 2));
        
        return res.status(400).json({
          error: "Invalid CAD solid job payload",
          details: parsed.error.flatten(),
          fieldErrors: parsed.error.flatten().fieldErrors,
          receivedBody: req.body,
        });
      }

      const cadScript = process.env.SCANMASTER_CAD_SCRIPT;
      if (!cadScript || cadScript.trim().length === 0) {
        return res.status(500).json({
          error: "SCANMASTER_CAD_SCRIPT environment variable is not set. Point it to your generate_drawing.py or python_api_integration.py entrypoint.",
        });
      }

      const pythonBin = process.env.PYTHON_BIN || "python";

      const userId = String((req as any).userId || "anonymous");
      const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const cad3dOutputRoot = path.join(process.cwd(), "cad-3d-output");
      const cad3dUserDir = path.join(cad3dOutputRoot, userId);
      const jobDir = path.join(process.cwd(), "cad-engine-jobs");

      fs.mkdirSync(cad3dUserDir, { recursive: true });
      fs.mkdirSync(jobDir, { recursive: true });

      const outputStepPath = path.join(cad3dUserDir, `${jobId}.step`);

      const jobPayload = {
        jobId,
        engine: "ScanMaster CAD Engine v3.0",
        shapeType: parsed.data.shapeType,
        parameters: parsed.data.parameters,
        calibrationData: parsed.data.calibrationData,
        metadata: parsed.data.metadata,
        outputFormat: "step",
        outputPath: outputStepPath,
      };

      const jobFilePath = path.join(jobDir, `${jobId}.json`);
      await fs.promises.writeFile(jobFilePath, JSON.stringify(jobPayload, null, 2), "utf8");

      const pythonResult = await new Promise<any>((resolve, reject) => {
        const child = spawn(pythonBin, [cadScript, "--json", jobFilePath], {
          stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (chunk) => {
          stdout += chunk.toString();
        });

        child.stderr.on("data", (chunk) => {
          stderr += chunk.toString();
        });

        child.on("error", (err) => {
          reject(err);
        });

        child.on("close", (code) => {
          // Debug logging
          logger.info("ScanMaster CAD Engine process completed", {
            exitCode: code,
            stdout: stdout,
            stderr: stderr
          });

          // Try to parse stdout as JSON - look for JSON at the end of stdout
          let parsedOut;
          try {
            // Look for JSON at the end of stdout (after any progress messages)
            // Extract the last line that contains a complete JSON object
            const lines = stdout.trim().split('\n');
            let jsonLine = null;
            
            // Search from the end for a line that starts with { and contains "success"
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i].trim();
              if (line.startsWith('{') && line.includes('"success"')) {
                jsonLine = line;
                break;
              }
            }
            
            if (jsonLine) {
              parsedOut = JSON.parse(jsonLine);
              logger.info("Parsed stdout JSON from line", { parsedOut });
            } else {
              // Try parsing the entire stdout
              parsedOut = stdout.trim() ? JSON.parse(stdout) : {};
              logger.info("Parsed entire stdout as JSON", { parsedOut });
            }
          } catch (parseError) {
            logger.warn("Failed to parse stdout as JSON", { stdout: stdout.substring(0, 500), parseError });
            parsedOut = { rawOutput: stdout };
          }

          logger.info("Debug: Checking success conditions");
          console.log("🔍 DEBUG - parsedOut.success:", parsedOut.success);
          console.log("🔍 DEBUG - typeof success:", typeof parsedOut.success);
          console.log("🔍 DEBUG - exit code:", code);
          console.log("🔍 DEBUG - parsedOut keys:", Object.keys(parsedOut || {}));
          console.log("🔍 DEBUG - parsedOut sample:", JSON.stringify(parsedOut).substring(0, 300));

          // If we have a success indicator in the JSON output, treat as success regardless of exit code
          if (parsedOut.success === true) {
            logger.info("CAD engine reported success, ignoring exit code", { exitCode: code });
            return resolve(parsedOut);
          }

          // Check if we have output that looks successful (outputPath exists)
          if (parsedOut.outputPath) {
            const fileExists = fs.existsSync(parsedOut.outputPath);
            logger.info("Checking output file existence", { 
              outputPath: parsedOut.outputPath, 
              fileExists,
              exitCode: code 
            });
            
            if (fileExists) {
              logger.info("CAD engine created output file, treating as success", { outputPath: parsedOut.outputPath, exitCode: code });
              parsedOut.success = true; // Mark as success
              return resolve(parsedOut);
            }
          }

          // If no success indicator and non-zero exit code, treat as error
          if (code !== 0) {
            logger.error("CAD engine failed", { 
              exitCode: code, 
              stderr, 
              parsedOut,
              stdoutLength: stdout.length,
              stderrLength: stderr.length
            });
            return reject(new Error(`ScanMaster CAD Engine exited with code ${code}: ${stderr || 'No error details'}`));
          }

          // If zero exit code but no explicit success, return the parsed output
          logger.info("CAD engine completed with zero exit code", { parsedOut });
          resolve(parsedOut);
        });
      });

      const publicStepUrl = `/cad-3d-output/${userId}/${jobId}.step`;

      return res.json({
        stepUrl: publicStepUrl,
        jobId,
        engineResult: pythonResult,
      });
    } catch (error: any) {
      logger.error("Error while generating CAD solid via ScanMaster engine", {
        error: error?.message || String(error),
      });

      return res.status(500).json({
        error: "Failed to generate CAD solid via ScanMaster engine",
      });
    }
  });

  // User Standards Access Routes
  app.get("/api/user-standards", mockAuth, async (req, res) => {
    try {
      const { userId } = getAuthContext(req);
      const accessRecords = await storage.getUserStandardAccess(userId);
      
      // Filter out expired subscriptions
      const now = new Date();
      const activeStandards = accessRecords.filter(access => 
        !access.expiryDate || new Date(access.expiryDate) > now
      );

      const hasActiveSubscription = activeStandards.some(
        access => access.accessType === 'subscription'
      );

      res.json({
        standards: activeStandards,
        has_active_subscription: hasActiveSubscription,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Validate Standard Access
  app.post("/api/validate-standard-access", mockAuth, async (req, res) => {
    try {
      const { standardCode } = req.body;

      if (!standardCode || typeof standardCode !== 'string') {
        return res.status(400).json({ 
          hasAccess: false,
          error: 'Invalid or missing standard code' 
        });
      }

      // Validate standard code format
      if (standardCode.length > 50 || !/^[A-Za-z0-9\-]+$/.test(standardCode)) {
        return res.status(400).json({ 
          hasAccess: false,
          error: 'Invalid standard code format' 
        });
      }

      const standard = await storage.getStandardByCode(standardCode);
      
      if (!standard) {
        return res.status(404).json({ 
          hasAccess: false,
          error: 'Standard not found' 
        });
      }

      // Free standards are always accessible
      if (standard.isFree) {
        return res.json({ 
          hasAccess: true,
          accessType: 'free',
          expiryDate: null
        });
      }

      const { userId } = getAuthContext(req);
      const hasAccess = await storage.hasStandardAccess(userId, standardCode);
      
      if (!hasAccess) {
        return res.json({ 
          hasAccess: false,
          accessType: null,
          expiryDate: null
        });
      }

      res.json({ 
        hasAccess: true,
        accessType: 'purchased',
        expiryDate: null
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Lemon Squeezy Webhook
  app.post("/api/webhooks/lemon-squeezy", async (req, res) => {
    try {
      const event = req.body;
      
      const customData = event.meta?.custom_data;
      const userId = customData?.user_id;
      const standardId = customData?.standard_id;
      const priceType = customData?.price_type;

      // Validate required webhook data
      if (!userId || !standardId) {
        return res.status(400).json({ error: 'Missing required data' });
      }

      // Validate UUID formats
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId) || !uuidRegex.test(standardId)) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      // Handle different event types
      switch (event.meta.event_name) {
        case 'order_created':
          const isSubscription = priceType === 'monthly' || priceType === 'annual';
          let expiryDate = null;
          
          if (isSubscription) {
            const now = new Date();
            expiryDate = priceType === 'monthly' 
              ? new Date(now.setMonth(now.getMonth() + 1))
              : new Date(now.setFullYear(now.getFullYear() + 1));
          }

          await storage.grantStandardAccess({
            userId,
            standardId,
            accessType: isSubscription ? 'subscription' : 'purchased',
            purchaseDate: new Date(),
            expiryDate: expiryDate || undefined,
            isActive: true,
            lemonSqueezyOrderId: event.data.id,
          });

          await storage.createPurchaseHistory({
            userId,
            standardId,
            bundleId: undefined,
            purchaseType: priceType,
            amount: String(event.data.attributes.total / 100),
            status: 'completed',
          });
          break;

        case 'subscription_cancelled':
          // Deactivate access logic would go here
          break;

        case 'subscription_payment_success':
          // Renewal logic would go here
          break;
      }

      res.json({ received: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create Lemon Squeezy Checkout
  app.post("/api/create-checkout", mockAuth, async (req, res) => {
    try {
      const { standardId, priceType } = req.body;

      // Validate inputs
      if (!standardId || typeof standardId !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing standardId' });
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(standardId)) {
        return res.status(400).json({ error: 'Invalid UUID format for standardId' });
      }

      const validPriceTypes = ['one_time', 'monthly', 'annual'];
      if (!priceType || !validPriceTypes.includes(priceType)) {
        return res.status(400).json({ 
          error: 'Invalid price type. Must be one_time, monthly, or annual' 
        });
      }

      const standard = await storage.getStandardById(standardId);
      
      if (!standard) {
        return res.status(404).json({ error: 'Standard not found' });
      }

      // Get the appropriate variant ID based on price type
      let variantId;
      switch (priceType) {
        case 'one_time':
          variantId = standard.lemonSqueezyVariantIdOnetime;
          break;
        case 'monthly':
          variantId = standard.lemonSqueezyVariantIdMonthly;
          break;
        case 'annual':
          variantId = standard.lemonSqueezyVariantIdAnnual;
          break;
      }

      if (!variantId) {
        return res.status(400).json({ 
          error: 'Price type not available for this standard' 
        });
      }

      // TODO: Implement actual Lemon Squeezy API call
      // For now, return a mock response
      res.json({ 
        checkoutUrl: 'https://checkout.lemonsqueezy.com/mock-checkout-url',
        message: 'This is a mock checkout URL. Configure LEMON_SQUEEZY_API_KEY to enable real checkouts.'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
