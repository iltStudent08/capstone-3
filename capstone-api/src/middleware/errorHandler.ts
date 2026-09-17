import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

// Centralized error handler; must be mounted last, after all routes.
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string> = {};
    for (const [field, validatorError] of Object.entries(err.errors)) {
      errors[field] = validatorError.message;
    }
    return res.status(400).json({ message: "Validation failed", errors });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Invalid value for field "${err.path}"` });
  }

  const mongoError = err as MongoServerError;
  if (mongoError && mongoError.code === 11000) {
    const field = Object.keys(mongoError.keyValue ?? {})[0] ?? "field";
    return res.status(409).json({ message: `A record with that ${field} already exists` });
  }

  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
};
