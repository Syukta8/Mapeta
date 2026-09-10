import type { Request, Response, NextFunction } from 'express';

export interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Centralized Express error handler middleware.
 * Ensures consistent JSON error responses across all controllers.
 */
export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let status = err.statusCode || err.status || 500;
  if (status === 500 && err.message && err.message.toLowerCase().includes('not found')) {
    status = 404;
  }
  const message = err.message || 'Internal server error';

  if (status >= 500) {
    console.error(`[API Error ${status}]:`, err);
  }

  res.status(status).json({
    success: false,
    error: message,
    status,
  });
}
