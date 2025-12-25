import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "dotenv";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { createServer } from "http";
import path from "path";
import { 
  securityHeaders, 
  corsOptions, 
  sanitizeRequest, 
  preventSqlInjection 
} from "./middleware/security";
import { generalRateLimiter } from "./middleware/rateLimiter";
import { requestTracking, healthCheck, livenessProbe, readinessProbe, metricsEndpoint } from "./middleware/monitoring";
import { 
  errorHandler, 
  notFoundHandler, 
  handleUncaughtException, 
  handleUnhandledRejection,
  handleGracefulShutdown
} from "./middleware/errorHandler";
import logger, { stream } from "./utils/logger";
import compression from "compression";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const isDev = process.env.NODE_ENV !== "production";

// Handle uncaught errors
handleUncaughtException();
handleUnhandledRejection();

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(compression()); // Compress responses

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Logging middleware
if (isDev) {
  // Development: simple request logging
  app.use((req, res, next) => {
    const start = Date.now();
    const reqPath = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (reqPath.startsWith("/api")) {
        let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse && res.statusCode >= 400) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 120) {
          logLine = logLine.slice(0, 119) + "…";
        }

        console.log(logLine);
      }
    });

    next();
  });
} else {
  // Production: structured logging with Morgan
  app.use(morgan('combined', { stream }));
}

// Monitoring - skip for static assets in development
app.use((req, res, next) => {
  // In development, skip monitoring for Vite assets and HMR
  if (isDev && (req.path.startsWith('/@') || req.path.startsWith('/src/') || 
      req.path.includes('.css') || req.path.includes('.js') || 
      req.path.includes('.ts') || req.path.includes('.tsx') ||
      req.path.includes('.json') || req.path.includes('.png') ||
      req.path.includes('.jpg') || req.path.includes('.svg'))) {
    return next();
  }
  requestTracking(req, res, next);
});

// Security checks - skip for static assets in development
app.use((req, res, next) => {
  // In development, skip sanitization for Vite assets
  if (isDev && (req.path.startsWith('/@') || req.path.startsWith('/src/'))) {
    return next();
  }
  sanitizeRequest(req, res, next);
});
// Note: SQL injection prevention is handled by Drizzle ORM's parameterized queries
// The preventSqlInjection middleware is too aggressive and blocks legitimate data

// Rate limiting for API routes
app.use('/api', generalRateLimiter);

// Health check endpoints (before other routes)
app.get('/health', healthCheck);
app.get('/health/live', livenessProbe);
app.get('/health/ready', readinessProbe);
app.get('/metrics', metricsEndpoint);

(async () => {
  const server = createServer(app);

  // Register API routes
  registerRoutes(app);

  // In production, serve the built client files
  if (process.env.NODE_ENV === "production") {
    const clientPath = path.join(process.cwd(), "dist");
    app.use(express.static(clientPath));
    
    // Handle client-side routing - serve index.html for all non-API routes
    app.use((req, res, next) => {
      if (!req.path.startsWith("/api") && !req.path.startsWith("/health") && !req.path.startsWith("/metrics") && req.method === "GET") {
        res.sendFile(path.join(clientPath, "index.html"));
      } else {
        next();
      }
    });
  } else {
    // In development, use Vite's middleware
    await setupVite(app, server);
  }

  // Error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Graceful shutdown handling
  handleGracefulShutdown(server);

  // Start server
  server.listen(PORT, "0.0.0.0", () => {
    const message = `Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`;
    if (!isDev) {
      logger.info(message);
    }
    console.log(message);
  });
})();