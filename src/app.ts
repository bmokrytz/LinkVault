import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authenticate } from "./middleware/auth";
import authRouter from "./routes/auth";
import bookmarksRouter from "./routes/bookmarks";

dotenv.config();

const app = express();

const allowed_origins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173", "https://www.linkvault.ca", "https://linkvault.ca"];


app.use(
  cors({
    origin: allowed_origins,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/bookmarks", authenticate, bookmarksRouter);

export default app;
