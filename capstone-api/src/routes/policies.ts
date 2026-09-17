import { Router, Request, Response } from "express";
import { body } from "express-validator";
import Policy from "../models/Policy";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate);

router.get("/", async (req: Request, res: Response) => {
  try {
    const { type, status, search } = req.query;
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit as string, 10) || 10, 1);

    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) {
      const regex = new RegExp(String(search), "i");
      filter.$or = [{ holderName: regex }, { policyNumber: regex }];
    }

    const [policies, total] = await Promise.all([
      Policy.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Policy.countDocuments(filter),
    ]);

    res.json({ data: policies, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ message: "Failed to fetch policies" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const policy = await Policy.findById(req.params.id).populate("owner", "name email role");
    if (!policy) return res.status(404).json({ message: "Policy not found" });
    res.json({ policy });
  } catch {
    res.status(404).json({ message: "Policy not found" });
  }
});

router.post(
  "/",
  validate([
    body("policyNumber").trim().notEmpty().withMessage("Policy number is required"),
    body("holderName").trim().notEmpty().withMessage("Holder name is required"),
    body("type").isIn(["auto", "home", "life"]).withMessage("Type must be auto, home, or life"),
    body("premium").isFloat({ min: 0 }).withMessage("Premium must be a non-negative number"),
    body("effectiveDate").isISO8601().withMessage("Effective date must be a valid date"),
    body("expirationDate").isISO8601().withMessage("Expiration date must be a valid date"),
    body("status").optional().isIn(["active", "expired", "cancelled"]),
  ]),
  async (req: Request, res: Response) => {
    try {
      const policy = await Policy.create({ ...req.body, owner: req.user!._id });
      res.status(201).json({ policy });
    } catch {
      res.status(400).json({ message: "Failed to create policy" });
    }
  }
);

router.put(
  "/:id",
  validate([
    body("policyNumber").optional().trim().notEmpty(),
    body("holderName").optional().trim().notEmpty(),
    body("type").optional().isIn(["auto", "home", "life"]),
    body("premium").optional().isFloat({ min: 0 }),
    body("status").optional().isIn(["active", "expired", "cancelled"]),
    body("effectiveDate").optional().isISO8601(),
    body("expirationDate").optional().isISO8601(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const policy = await Policy.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!policy) return res.status(404).json({ message: "Policy not found" });
      res.json({ policy });
    } catch {
      res.status(400).json({ message: "Failed to update policy" });
    }
  }
);

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const policy = await Policy.findByIdAndDelete(req.params.id);
    if (!policy) return res.status(404).json({ message: "Policy not found" });
    res.json({ message: "Policy deleted" });
  } catch {
    res.status(400).json({ message: "Failed to delete policy" });
  }
});

export default router;
