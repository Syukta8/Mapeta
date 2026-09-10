import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an asynchronous Express request handler and forwards any thrown errors or
 * rejections to next(err) for centralized error middleware handling.
 *
 * @param fn - Asynchronous route handler function.
 * @returns Express RequestHandler.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
