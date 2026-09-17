import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db";
import User from "./models/User";
import Policy from "./models/Policy";
import Claim, { IClaim } from "./models/Claim";

const seed = async () => {
  await connectDB();

  await Promise.all([User.deleteMany({}), Policy.deleteMany({}), Claim.deleteMany({})]);

  const [admin, adjusterOne, adjusterTwo] = await User.create([
    { name: "Ava Administrator", email: "admin@capstone.dev", password: "password123", role: "admin" },
    { name: "Jordan Adjuster", email: "jordan@capstone.dev", password: "password123", role: "adjuster" },
    { name: "Sam Adjuster", email: "sam@capstone.dev", password: "password123", role: "adjuster" },
  ]);

  const [autoPolicy, homePolicy, lifePolicy, secondAutoPolicy, expiredHomePolicy] = await Policy.create([
    {
      policyNumber: "POL-1001",
      holderName: "Alice Nguyen",
      type: "auto",
      premium: 120.5,
      status: "active",
      effectiveDate: new Date("2025-01-01"),
      expirationDate: new Date("2026-01-01"),
      owner: adjusterOne._id,
    },
    {
      policyNumber: "POL-1002",
      holderName: "Bob Martinez",
      type: "home",
      premium: 89.99,
      status: "active",
      effectiveDate: new Date("2025-03-15"),
      expirationDate: new Date("2026-03-15"),
      owner: adjusterOne._id,
    },
    {
      policyNumber: "POL-1003",
      holderName: "Carla Diaz",
      type: "life",
      premium: 45.0,
      status: "active",
      effectiveDate: new Date("2024-06-01"),
      expirationDate: new Date("2027-06-01"),
      owner: adjusterTwo._id,
    },
    {
      policyNumber: "POL-1004",
      holderName: "Derek Osei",
      type: "auto",
      premium: 132.75,
      status: "cancelled",
      effectiveDate: new Date("2024-02-01"),
      expirationDate: new Date("2025-02-01"),
      owner: adjusterTwo._id,
    },
    {
      policyNumber: "POL-1005",
      holderName: "Elena Petrova",
      type: "home",
      premium: 97.25,
      status: "expired",
      effectiveDate: new Date("2023-01-01"),
      expirationDate: new Date("2024-01-01"),
      owner: adjusterOne._id,
    },
  ]);

  const claimData: Array<Pick<IClaim, "policy" | "description" | "incidentDate" | "amount" | "status" | "assignedTo">> = [
    {
      policy: autoPolicy._id,
      description: "Rear-end collision on Main St.",
      incidentDate: new Date("2025-06-10"),
      amount: 3200,
      status: "submitted",
      assignedTo: adjusterOne._id,
    },
    {
      policy: homePolicy._id,
      description: "Water damage from burst pipe.",
      incidentDate: new Date("2025-07-02"),
      amount: 8500,
      status: "under-review",
      assignedTo: adjusterOne._id,
    },
    {
      policy: lifePolicy._id,
      description: "Beneficiary claim filed.",
      incidentDate: new Date("2025-05-20"),
      amount: 50000,
      status: "approved",
      assignedTo: adjusterTwo._id,
    },
    {
      policy: secondAutoPolicy._id,
      description: "Windshield crack from road debris.",
      incidentDate: new Date("2025-04-11"),
      amount: 450,
      status: "denied",
      assignedTo: adjusterTwo._id,
    },
    {
      policy: expiredHomePolicy._id,
      description: "Storm damage to roof shingles.",
      incidentDate: new Date("2025-08-01"),
      amount: 6200,
      status: "closed",
      assignedTo: adjusterOne._id,
    },
    {
      policy: autoPolicy._id,
      description: "Minor fender bender in parking lot.",
      incidentDate: new Date("2025-08-20"),
      amount: 900,
      status: "submitted",
      assignedTo: adjusterTwo._id,
    },
  ];

  const claims: IClaim[] = [];
  for (const data of claimData) {
    claims.push(await Claim.create(data));
  }

  claims[0].notes.push({ author: admin._id, text: "Initial report received, awaiting photos.", createdAt: new Date() });
  claims[1].notes.push(
    { author: adjusterOne._id, text: "Plumber invoice submitted by policyholder.", createdAt: new Date() },
    { author: admin._id, text: "Escalated for review due to claim amount.", createdAt: new Date() }
  );
  claims[2].notes.push({ author: adjusterTwo._id, text: "Documentation verified, approved for payout.", createdAt: new Date() });

  await Promise.all([claims[0].save(), claims[1].save(), claims[2].save()]);

  console.log("Seed data inserted:");
  console.log(`  Users: ${await User.countDocuments()}`);
  console.log(`  Policies: ${await Policy.countDocuments()}`);
  console.log(`  Claims: ${await Claim.countDocuments()}`);
};

seed()
  .catch((err) => {
    console.error("Seeding failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
