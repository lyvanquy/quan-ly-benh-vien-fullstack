import { Response } from 'express';

export const ok = (res: Response, data: unknown, message = 'Success') =>
  res.status(200).json({ success: true, message, data });

export const created = (res: Response, data: unknown, message = 'Created') =>
  res.status(201).json({ success: true, message, data });

export const badRequest = (res: Response, message = 'Bad Request') =>
  res.status(400).json({ success: false, message });

export const unauthorized = (res: Response, message = 'Unauthorized') =>
  res.status(401).json({ success: false, message });

export const forbidden = (res: Response, message = 'Forbidden') =>
  res.status(403).json({ success: false, message });

export const notFound = (res: Response, message = 'Not Found') =>
  res.status(404).json({ success: false, message });

export const serverError = (res: Response, message = 'Internal Server Error') =>
  res.status(500).json({ success: false, message });

// Convenience aliases used by newer controllers
export const successResponse = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });

export const errorResponse = (res: Response, err: unknown) => {
  console.error(err);
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  return res.status(500).json({ success: false, message });
};
