import { NextFunction, Request, Response } from "express";
import { ValidationChain, validationResult } from "express-validator";

// Runs the given validation chains, then short-circuits with 400 on failure.
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ message: "Validation failed", errors: errors.array() });
  };
};
