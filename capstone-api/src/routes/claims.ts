import { Router, Request, Response } from "express";
import { body } from "express-validator";
import Claim from "../models/Claim";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate);

router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, policy, assignedTo, search } = req.query;
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit as string, 10) || 10, 1);

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (policy) filter.policy = policy;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      const regex = new RegExp(String(search), "i");
      filter.$or = [{ claimNumber: regex }, { description: regex }];
    }

    const [claims, total] = await Promise.all([
      Claim.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Claim.countDocuments(filter),
    ]);

    res.json({ data: claims, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ message: "Failed to fetch claims" });
  }
});

// Must be declared before "/:id" so "stats" isn't matched as an ID.
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const [statusCounts, totals] = await Promise.all([
      Claim.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Claim.aggregate([{ $group: { _id: null, totalAmount: { $sum: "$amount" }, totalClaims: { $sum: 1 } } }]),
    ]);

    const byStatus = statusCounts.reduce((acc: Record<string, number>, entry) => {
      acc[entry._id] = entry.count;
      return acc;
    }, {});

    res.json({
      byStatus,
      totalClaims: totals[0]?.totalClaims ?? 0,
      totalAmount: totals[0]?.totalAmount ?? 0,
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch claim statistics" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate("policy", "policyNumber holderName type status")
      .populate("assignedTo", "name email role");
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    res.json({ claim });
  } catch {
    res.status(404).json({ message: "Claim not found" });
  }
});

router.post(
  "/",
  validate([
    body("policy").isMongoId().withMessage("A valid policy ID is required"),
    body("description").trim().notEmpty().withMessage("Description is required"),
    body("incidentDate").isISO8601().withMessage("Incident date must be a valid date"),
    body("amount").isFloat({ min: 0 }).withMessage("Amount must be a non-negative number"),
  ]),
  async (req: Request, res: Response) => {
    try {
      const claim = await Claim.create({ ...req.body, assignedTo: req.user!._id });
      res.status(201).json({ claim });
    } catch {
      res.status(400).json({ message: "Failed to create claim" });
    }
  }
);

router.put(
  "/:id",
  validate([
    body("status").optional().isIn(["submitted", "under-review", "approved", "denied", "closed"]),
    body("amount").optional().isFloat({ min: 0 }),
    body("description").optional().trim().notEmpty(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const claim = await Claim.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!claim) return res.status(404).json({ message: "Claim not found" });
      res.json({ claim });
    } catch {
      res.status(400).json({ message: "Failed to update claim" });
    }
  }
);

router.post(
  "/:id/notes",
  validate([body("text").trim().notEmpty().withMessage("Note text is required")]),
  async (req: Request, res: Response) => {
    try {
      const claim = await Claim.findById(req.params.id);
      if (!claim) return res.status(404).json({ message: "Claim not found" });

      claim.notes.push({
        author: req.user!._id,
        text: req.body.text,
        createdAt: new Date(),
      });

      await claim.save();
      res.status(201).json({ claim });
    } catch {
      res.status(400).json({ message: "Failed to add note" });
    }
  }
);

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const claim = await Claim.findByIdAndDelete(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    res.json({ message: "Claim deleted" });
  } catch {
    res.status(400).json({ message: "Failed to delete claim" });
  }
});

export default router;
