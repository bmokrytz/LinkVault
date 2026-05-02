import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authenticate } from "./middleware/auth";
import authRouter from "./routes/auth";
import bookmarksRouter from "./routes/bookmarks";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const allowed_origins = process.env.ALLOWED_ORIGINS?.split(",");

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: "Too many auth attempts, please try again later." },
});

app.use(helmet());

app.use(
  cors({
    origin: allowed_origins,
    credentials: true,
  }),
);

app.use((req, res, next) => {
  if (req.body instanceof Buffer) {
    console.log("Request body: ", JSON.parse(req.body.toString()));
  }
  next();
});

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(globalLimiter);
authRouter.use(authLimiter);

app.use("/auth", authRouter);
app.use("/bookmarks", authenticate, bookmarksRouter);

export default app;
