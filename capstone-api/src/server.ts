import "dotenv/config";
import { connectDB } from "./config/db";
import app from "./app";

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
