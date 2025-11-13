import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import logger from '../utils/logger';

// Content Security Policy configuration
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "blob:", "https:"],
    connectSrc: ["'self'", "https://*.supabase.co", "https://*.neon.tech", "wss://*.supabase.co"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
};

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? cspConfig : false,
  crossOriginEmbedderPolicy: false, // Allow embedding in iframes for Replit
});

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Allow all Replit domains
    if (origin.includes('.replit.app') || origin.includes('.repl.co') || origin.includes('.replit.dev')) {
      return callback(null, true);
    }

    const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim());
    
    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:5000', 'http://localhost:5173', 'http://localhost:8080');
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, allow all origins (for easier testing)
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-org-id'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
};

// Request sanitization middleware
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Remove any potentially dangerous fields from body
  if (req.body) {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    dangerousKeys.forEach(key => {
      delete req.body[key];
    });
  }

  // Limit request body size (this should also be done at nginx level)
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    return res.status(413).json({ error: 'Request body too large' });
  }

  next();
};

// API key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  // Skip API key check for public endpoints
  const publicEndpoints = ['/api/health', '/api/standards'];
  if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    return next();
  }

  // In production, validate API key
  if (process.env.NODE_ENV === 'production' && process.env.REQUIRE_API_KEY === 'true') {
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: 'Invalid or missing API key' });
    }
  }

  next();
};

// SQL injection prevention - ONLY for suspicious patterns, not common words
export const preventSqlInjection = (req: Request, res: Response, next: NextFunction) => {
  // Only check for actual SQL injection patterns, not common words
  // Drizzle ORM handles parameterization, this is just an extra safety layer
  const dangerousPatterns = [
    /(\b(EXEC|EXECUTE)\s+(xp_|sp_))/gi, // Stored procedure execution
    /(--|\*\/|\/\*.*\*\/)/g, // SQL comments
    /(\bUNION\b.*\bSELECT\b)/gi, // UNION-based injection
    /(0x[0-9a-f]+)/gi, // Hexadecimal literals (often used in attacks)
    /(\bINTO\s+OUTFILE\b)/gi, // File operations
    /(\bLOAD_FILE\b)/gi, // File reading
  ];

  const checkValue = (value: any, path: string = ''): boolean => {
    if (typeof value === 'string') {
      // Skip checking for common inspection terms that might trigger false positives
      const inspectionTerms = ['drop', 'alter', 'update', 'select', 'insert', 'delete', 'create'];
      const lowerValue = value.toLowerCase();
      
      // Only check if the string looks like actual SQL (has semicolons, multiple keywords, etc.)
      const looksLikeSQL = value.includes(';') || 
                           (value.match(/\b(SELECT|FROM|WHERE|AND|OR)\b/gi) || []).length > 2;
      
      if (!looksLikeSQL) {
        return true; // Normal text, don't check
      }
      
      // Check for dangerous patterns
      return !dangerousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value).every(([key, val]) => checkValue(val, path ? `${path}.${key}` : key));
    }
    return true;
  };

  // Only check if content-type is JSON or form data
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('json') && !contentType.includes('form')) {
    return next(); // Skip binary or other content types
  }

  // Check query parameters
  if (req.query && !checkValue(req.query, 'query')) {
    logger.warn('Potential SQL injection in query parameters', { 
      ip: req.ip, 
      path: req.path,
      query: req.query 
    });
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  // Check body
  if (req.body && !checkValue(req.body, 'body')) {
    logger.warn('Potential SQL injection in request body', { 
      ip: req.ip, 
      path: req.path 
    });
    return res.status(400).json({ error: 'Invalid request body' });
  }

  next();
};

// XSS prevention for responses
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Escape HTML entities in string values
    const escapeHtml = (str: string): string => {
      const htmlEntities: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
      };
      return str.replace(/[&<>"'\/]/g, (s) => htmlEntities[s]);
    };

    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return escapeHtml(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[key] = sanitize(obj[key]);
          }
        }
        return sanitized;
      }
      return obj;
    };

    // Don't sanitize if explicitly disabled for this response
    if ((res as any).skipXssProtection) {
      return originalJson.call(this, data);
    }

    return originalJson.call(this, sanitize(data));
  };

  next();
};