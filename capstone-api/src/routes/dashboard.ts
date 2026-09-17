import { Router, Request, Response } from "express";
import Claim from "../models/Claim";
import Policy from "../models/Policy";
import User from "../models/User";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", async (_req: Request, res: Response) => {
  try {
    const [
      totalClaims,
      claimsByStatusAgg,
      totalPolicies,
      policiesByTypeAgg,
      totalUsers,
      recentClaims,
      totalAmountAgg,
    ] = await Promise.all([
      Claim.countDocuments(),
      Claim.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Policy.countDocuments(),
      Policy.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
      User.countDocuments(),
      Claim.find().sort({ createdAt: -1 }).limit(5).populate("policy", "policyNumber holderName"),
      Claim.aggregate([{ $group: { _id: null, totalAmount: { $sum: "$amount" } } }]),
    ]);

    const claimsByStatus = claimsByStatusAgg.reduce((acc: Record<string, number>, entry) => {
      acc[entry._id] = entry.count;
      return acc;
    }, {});

    const policiesByType = policiesByTypeAgg.reduce((acc: Record<string, number>, entry) => {
      acc[entry._id] = entry.count;
      return acc;
    }, {});

    res.json({
      totalClaims,
      claimsByStatus,
      totalPolicies,
      policiesByType,
      totalUsers,
      recentClaims,
      totalClaimAmount: totalAmountAgg[0]?.totalAmount ?? 0,
    });
  } catch {
    res.status(500).json({ message: "Failed to load dashboard data" });
  }
});

export default router;
