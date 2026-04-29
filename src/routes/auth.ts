import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { randomUUID } from 'node:crypto';
import pool from "../db/pool";
import { sendVerificationEmail } from '../lib/email';
import { VerificationEmailPayload } from "../types";

const router = Router();

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const verification_token: string = randomUUID();
    const token_expiry_time = new Date(Date.now() + (1000 * 60 * 60 * 24)); // 24 hours

    await pool.query(
      "INSERT INTO users (email, password_hash, verification_token, verification_token_expires) VALUES ($1, $2, $3, $4)",
      [email, password_hash, verification_token, token_expiry_time],
    );

    if (!await sendVerificationEmail(email, verification_token)) {
      await pool.query(
        "DELETE FROM users WHERE verification_token = $1",
        [verification_token],
      );
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    
    res.status(201).json({ message: `A verification email has been sent to ${email}.\n\nPlease check your inbox for a verification link.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/verify/:verification_token", async (req: Request, res: Response): Promise<void> => {
  const { verification_token } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE verification_token = $1",
      [verification_token],
    );
    if (result.rows.length === 0 || new Date() > result.rows[0].verification_token_expires) {
      res.status(400).json({ error: "Verification token expired. Sign in again to request a new verification email." });
      return;
    }
    const userID = result.rows[0].id;
    await pool.query(
      `UPDATE users
      SET verified = true, verification_token = null, verification_token_expires = null
      WHERE id = $1`,
      [userID],
    );
    res.status(200).json({ message: "Thank you for verifying your account. You may sign into LinkVault now." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/verify/resend", async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as VerificationEmailPayload;
    const verification_token: string = randomUUID();
    const token_expiry_time = new Date((Date.now() + (1000 * 60 * 60 * 24)));  // 24 hours
    await pool.query(
      `UPDATE users
      SET verification_token = $1, verification_token_expires = $2
      WHERE email = $3`,
    [verification_token, token_expiry_time, decoded.email]);
    if (!await sendVerificationEmail(decoded.email, verification_token)) {
      await pool.query(
        "UPDATE users SET verification_token = null, verification_token_expires = null WHERE email = $1",
        [decoded.email],
      );
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    res.status(200).json({ message: "Verification email sent" });
  } catch (err) {
    console.log(err);
    if (err instanceof TokenExpiredError) {
      res.status(401).json({ error: "Expired token" });
    } else if (err instanceof JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(500).json({ error: "Internal server error "});
    }
  }
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      // Same error for missing user and wrong password as to not leak whether email exists
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // Same error for missing user and wrong password as to not leak whether email exists
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const { id, verified, verification_token_expires} = result.rows[0];
    if (!verified) {
      let error_message;
      if (verification_token_expires && new Date() < verification_token_expires) {
        error_message = "Your email has not yet been verified. Please check your inbox for our email verification link.";
      } else {
        await pool.query(
          `UPDATE users
          SET verification_token = null, verification_token_expires = null
          WHERE id=$1`,
          [id],
        );
        error_message = "The verification link we sent to your email has expired. Please request a new one and verify your email to register your account.";
      }
      const verification_email_token = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" },
      );
      res.status(403).json({ verification_email_token, error: error_message });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    res.status(200).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
