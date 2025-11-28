import { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logger';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;

  constructor(message: string, statusCode: number, isOperational = true, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// Global error handler
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logError(err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as any).userId,
    orgId: (req as any).orgId,
    requestId: (req as any).requestId,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please log in again.';
    error = new AppError(message, 401);
  }

  // Rate limit error
  if (err.statusCode === 429) {
    error = new AppError('Too many requests. Please try again later.', 429);
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Send different error details based on environment
  if (process.env.NODE_ENV === 'production') {
    // Production: send minimal error info
    res.status(statusCode).json({
      success: false,
      error: error.isOperational ? message : 'Something went wrong',
      ...(error.details && error.isOperational ? { details: error.details } : {}),
    });
  } else {
    // Development: send full error details
    res.status(statusCode).json({
      success: false,
      error: message,
      details: error.details,
      stack: err.stack,
      raw: err,
    });
  }
};

// Uncaught exception handler
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error: Error) => {
    logError(error, { type: 'UNCAUGHT_EXCEPTION' });
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(error.name, error.message);
    // In production we terminate the process so the orchestrator can restart it.
    // In development we keep the process alive to avoid full app crashes on errors
    // and let the developer see and fix the problem.
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.error('UNCAUGHT EXCEPTION in development - process will NOT exit');
    }
  });
};

// Unhandled rejection handler
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logError(new Error(`Unhandled Rejection: ${reason}`), { 
      type: 'UNHANDLED_REJECTION',
      reason,
    });
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(reason);

    // In production, give time to log the error before shutting down so that
    // the process manager (Docker, App Engine, etc.) can restart the service.
    // In development, do not exit to avoid constant crashes while debugging.
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    } else {
      console.error('UNHANDLED REJECTION in development - process will NOT exit');
    }
  });
};

// Graceful shutdown handler
export const handleGracefulShutdown = (server: any) => {
  const gracefulShutdown = (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    server.close(() => {
      console.log('HTTP server closed.');
      
      // Close database connections
      // Close redis connections
      // Close any other resources
      
      console.log('Process terminated.');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};