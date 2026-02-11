import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Basic metrics storage (in-memory for now)
interface Metrics {
  requestCount: number;
  errorCount: number;
  responseTimes: number[];
}

const metrics: Metrics = {
  requestCount: 0,
  errorCount: 0,
  responseTimes: []
};

export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  metrics.requestCount++;

  // Log incoming request
  logger.info('Request received', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Listen for response finish to log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.responseTimes.push(duration);

    // Keep only last 100 response times for memory efficiency
    if (metrics.responseTimes.length > 100) {
      metrics.responseTimes.shift();
    }

    // Log response
    logger.info('Response sent', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });

    // Count errors
    if (res.statusCode >= 400) {
      metrics.errorCount++;
      logger.warn('Error response', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    }
  });

  next();
};

// Function to get current metrics
export const getMetrics = () => {
  const avgResponseTime = metrics.responseTimes.length > 0
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
    : 0;

  return {
    requestCount: metrics.requestCount,
    errorCount: metrics.errorCount,
    avgResponseTime: Math.round(avgResponseTime * 100) / 100 // Round to 2 decimal places
  };
};
