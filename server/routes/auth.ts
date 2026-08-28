import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models";
import { validateSignup, validateLogin } from "../utils/validation.js";
import { sendValidationError } from "../utils/responses";
import type { Request, Response } from "express";

dotenv.config();

const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

const issueToken = (userId: number) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, data } = validateSignup(req.body);
    if (error) {
      sendValidationError(res, error);
      return;
    }

    const existingUser = await User.findByUsername(data.username);
    if (existingUser) {
      res.status(400).json({
        error: "Username already exists",
        errors: { username: "Username already exists" },
      });
      return;
    }

    const user = await User.createUser(data);

    res.status(201).json({
      message: "User created successfully",
      user: user.toJSON(),
      token: issueToken(user.id),
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/signin", async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, data } = validateLogin(req.body);
    if (error) {
      sendValidationError(res, error);
      return;
    }

    const user = await User.findByUsername(data.username);
    if (!user || !(await user.comparePassword(data.password))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    res.json({
      message: "Login successful",
      user: user.toJSON(),
      token: issueToken(user.id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
