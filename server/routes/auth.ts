import { Router } from "express";
import { User } from "../models";
import { signToken } from "../lib/jwt";
import { route, validated } from "../lib/http";
import { toWire } from "../lib/serialize";
import { ConflictError, UnauthorizedError } from "../lib/errors";
import { validateLogin, validateSignup } from "../utils/validation";
import type { AuthResponse, User as UserDto } from "../types";

const router = Router();

const authResponse = (message: string, user: User): AuthResponse => ({
  message,
  user: toWire<UserDto>(user),
  token: signToken(user.id),
});

router.post(
  "/signup",
  route(async (req, res) => {
    const data = validated(validateSignup(req.body));

    if ((await User.count({ where: { username: data.username } })) > 0) {
      throw new ConflictError("Username already exists", {
        username: "Username already exists",
      });
    }

    const user = await User.createUser(data);
    res.status(201).json(authResponse("User created successfully", user));
  }),
);

router.post(
  "/signin",
  route(async (req, res) => {
    const { username, password } = validated(validateLogin(req.body));

    const user = await User.findByUsername(username);
    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedError("Invalid credentials");
    }

    res.json(authResponse("Login successful", user));
  }),
);

export default router;
