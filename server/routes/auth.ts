import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";
import { validateSignup, validateLogin } from "../utils/validation.js";
import dotenv from "dotenv";
import type { Request, Response } from "express";

dotenv.config();

const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Sign up
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, data } = validateSignup(req.body);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    // Check if username already exists
    const existingUser = await User.findByUsername(data.username);
    if (existingUser) {
      res.status(400).json({ error: "Username already exists" });
      return;
    }

    // Create new user
    const user = await User.createUser(data);

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User created successfully",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Sign in
router.post("/signin", async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, data } = validateLogin(req.body);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    // Find user
    const user = await User.findByUsername(data.username);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Check password
    const isValidPassword = await user.comparePassword(data.password);
    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
