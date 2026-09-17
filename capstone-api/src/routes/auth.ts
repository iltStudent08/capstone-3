import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import User from "../models/User";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

const router = Router();

const signToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign({ id: userId }, secret, { expiresIn: "1d" });
};

router.post(
  "/register",
  validate([
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email is already registered" });
      }

      const user = await User.create({ name, email, password });
      const token = signToken(user.id);

      res.status(201).json({ token, user });
    } catch {
      res.status(500).json({ message: "Failed to register user" });
    }
  }
);

router.post(
  "/login",
  validate([
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = signToken(user.id);

      res.json({ token, user });
    } catch {
      res.status(500).json({ message: "Failed to log in" });
    }
  }
);

router.get("/me", authenticate, async (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;
