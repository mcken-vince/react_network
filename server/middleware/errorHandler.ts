import type { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  type?: string;
  status?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err.stack);

  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }

  if (err.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request entity too large' });
    return;
  }

  res.status(err.status || 500).json({ 
    error: err.message || 'Something went wrong!' 
  });
};
