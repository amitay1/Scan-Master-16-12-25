import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { DbStorage } from "./storage";
import { insertTechniqueSheetSchema } from "@shared/schema";
// import { registerOrganizationRoutes } from "./routes/organizations"; // Disabled - tables don't exist yet

const storage = new DbStorage();

// Enhanced auth middleware with org_id support (optional)
const mockAuth = (req: any, res: any, next: any) => {
  // For now, use a mock user ID (valid UUID format for development)
  // In production, this would validate JWT and extract user ID
  req.userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
  req.orgId = req.headers['x-org-id'] || null;
  
  next();
};

export function registerRoutes(app: Express) {
  // Register organization routes - DISABLED until migrations are run
  // registerOrganizationRoutes(app);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Technique Sheets Routes
  app.get("/api/technique-sheets", mockAuth, async (req, res) => {
    try {
      const sheets = await storage.getTechniqueSheetsByUserId(req.userId, req.orgId);
      res.json(sheets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/technique-sheets/:id", mockAuth, async (req, res) => {
    try {
      const sheet = await storage.getTechniqueSheetById(req.params.id, req.orgId);
      if (!sheet) {
        return res.status(404).json({ error: "Technique sheet not found" });
      }
      // Check both user and org access
      if (sheet.userId !== req.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (req.orgId && sheet.orgId !== req.orgId) {
        return res.status(403).json({ error: "Forbidden - wrong organization" });
      }
      res.json(sheet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/technique-sheets", mockAuth, async (req, res) => {
    try {
      const data = insertTechniqueSheetSchema.parse({
        ...req.body,
        userId: req.userId,
        orgId: req.orgId, // Include org_id
      });
      const sheet = await storage.createTechniqueSheet(data, req.orgId);
      res.status(201).json(sheet);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/technique-sheets/:id", mockAuth, async (req, res) => {
    try {
      const existing = await storage.getTechniqueSheetById(req.params.id, req.orgId);
      if (!existing) {
        return res.status(404).json({ error: "Technique sheet not found" });
      }
      if (existing.userId !== req.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (req.orgId && existing.orgId !== req.orgId) {
        return res.status(403).json({ error: "Forbidden - wrong organization" });
      }
      
      const sheet = await storage.updateTechniqueSheet(req.params.id, req.body, req.orgId);
      res.json(sheet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/technique-sheets/:id", mockAuth, async (req, res) => {
    try {
      const existing = await storage.getTechniqueSheetById(req.params.id, req.orgId);
      if (!existing) {
        return res.status(404).json({ error: "Technique sheet not found" });
      }
      if (existing.userId !== req.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (req.orgId && existing.orgId !== req.orgId) {
        return res.status(403).json({ error: "Forbidden - wrong organization" });
      }
      
      await storage.deleteTechniqueSheet(req.params.id, req.orgId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

  // User Standards Access Routes
  app.get("/api/user-standards", mockAuth, async (req, res) => {
    try {
      const accessRecords = await storage.getUserStandardAccess(req.userId);
      
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

      const hasAccess = await storage.hasStandardAccess(req.userId, standardCode);
      
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
