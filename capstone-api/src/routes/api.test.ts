import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../models/User", () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock("../models/Policy", () => ({
  default: {
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock("../models/Claim", () => ({
  default: {
    create: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

import app from "../app";
import User from "../models/User";
import Claim from "../models/Claim";

const userModel = User as unknown as { findById: ReturnType<typeof vi.fn>; findOne: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
const claimModel = Claim as unknown as { create: ReturnType<typeof vi.fn> };

const token = () => jwt.sign({ id: "user-1" }, process.env.JWT_SECRET!, { expiresIn: "1h" });

describe("API routes", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    vi.clearAllMocks();
    userModel.findById.mockResolvedValue({ _id: "user-1", name: "Test User" });
  });

  it("register returns a JWT and user", async () => {
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue({ id: "user-1", name: "Test User", email: "test@example.com", role: "adjuster" });

    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email: "test@example.com", password: "password123" });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.email).toBe("test@example.com");
  });

  it("login with a wrong password returns 401", async () => {
    userModel.findOne.mockResolvedValue({ comparePassword: vi.fn().mockResolvedValue(false) });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });

  it("creates a claim with valid authenticated input", async () => {
    claimModel.create.mockResolvedValue({ _id: "claim-1", claimNumber: "CLM-1001" });

    const response = await request(app)
      .post("/api/claims")
      .set("Authorization", `Bearer ${token()}`)
      .send({ policy: "507f1f77bcf86cd799439011", description: "Damage", incidentDate: "2026-01-15", amount: 500 });

    expect(response.status).toBe(201);
    expect(response.body.claim.claimNumber).toBe("CLM-1001");
  });

  it("rejects unauthenticated claim requests", async () => {
    const response = await request(app).get("/api/claims");

    expect(response.status).toBe(401);
  });

  it("rejects claim creation with missing required fields", async () => {
    const response = await request(app)
      .post("/api/claims")
      .set("Authorization", `Bearer ${token()}`)
      .send({ description: "Damage" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });
});