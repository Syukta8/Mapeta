import type { Request, Response, NextFunction } from 'express';

/**
 * Wraps an asynchronous Express request handler and forwards any thrown errors or
 * rejections to next(err) for centralized error middleware handling.
 *
 * @param fn - Asynchronous route handler function.
 * @returns Express RequestHandler.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): (req: Request, res: Response, next: NextFunction) => Promise<unknown> {
  return (req: Request, res: Response, next: NextFunction): Promise<unknown> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}
