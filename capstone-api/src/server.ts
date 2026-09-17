import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import policyRoutes from "./routes/policies";
import claimRoutes from "./routes/claims";
import dashboardRoutes from "./routes/dashboard";
import healthRoutes from "./routes/health";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/health", healthRoutes);

app.use(errorHandler);

const port = process.env.PORT ?? 3000;

const start = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
