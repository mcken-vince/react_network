import { Router } from "express";
import { Op } from "sequelize";
import { Connection, User } from "../models";
import { authenticateToken } from "../middleware/auth";
import {
  authed,
  intParam,
  pagination,
  queryBool,
  queryString,
  validated,
} from "../lib/http";
import { toWire } from "../lib/serialize";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../lib/errors";
import {
  validatePasswordChange,
  validateProfileUpdate,
} from "../utils/validation";
import type {
  Connection as ConnectionDto,
  ConnectionStatusInfo,
  SuccessMessageResponse,
  User as UserDto,
  UserResponse,
  UsersResponse,
  UsersWithConnectionStatusResponse,
} from "../types";

const router = Router();
router.use(authenticateToken);

/** Every connection row involving `userId`, keyed by the *other* user's id. */
async function connectionStatusByUser(
  userId: number,
): Promise<Map<number, ConnectionStatusInfo>> {
  const connections = await Connection.findAll({
    where: { [Op.or]: [{ requesterId: userId }, { recipientId: userId }] },
  });
  return new Map(
    connections.map((c): [number, ConnectionStatusInfo] => [
      c.requesterId === userId ? c.recipientId : c.requesterId,
      { ...toWire<ConnectionDto>(c), isRequester: c.requesterId === userId },
    ]),
  );
}

async function withConnectionStatus(
  users: User[],
  viewerId: number,
): Promise<UsersWithConnectionStatusResponse> {
  const statusByUser = await connectionStatusByUser(viewerId);
  return {
    users: users.map((u) => ({
      ...toWire<UserDto>(u),
      connectionStatus: statusByUser.get(u.id) ?? null,
    })),
  };
}

// GET /users?includeConnectionStatus=true
router.get(
  "/",
  authed(async (req, res) => {
    const users = await User.getAllUsers(pagination(req));
    if (!queryBool(req, "includeConnectionStatus")) {
      res.json({
        users: users.map((u) => toWire<UserDto>(u)),
      } satisfies UsersResponse);
      return;
    }
    res.json(await withConnectionStatus(users, req.userId));
  }),
);

// GET /users/search?q=&includeConnectionStatus=true  (never returns the caller)
router.get(
  "/search",
  authed(async (req, res) => {
    const term = queryString(req, "q")?.trim() ?? "";
    const users = term
      ? await User.searchUsers(term, {
          ...pagination(req),
          excludeUserId: req.userId,
        })
      : [];
    if (!queryBool(req, "includeConnectionStatus")) {
      res.json({
        users: users.map((u) => toWire<UserDto>(u)),
      } satisfies UsersResponse);
      return;
    }
    res.json(await withConnectionStatus(users, req.userId));
  }),
);

router.get(
  "/me",
  authed(async (req, res) => {
    const user = await User.findByPk(req.userId);
    if (!user) throw new NotFoundError("User not found");
    res.json({ user: toWire<UserDto>(user) } satisfies UserResponse);
  }),
);

// Registered before "/:userId" so "me" is never parsed as an id.
router.put(
  "/me/password",
  authed(async (req, res) => {
    const { currentPassword, newPassword } = validated(
      validatePasswordChange(req.body),
    );

    // The default scope strips the hash; we need it to compare.
    const user = await User.scope("withPassword").findByPk(req.userId);
    if (!user) throw new NotFoundError("User not found");

    if (!(await user.comparePassword(currentPassword))) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    user.password = newPassword; // BeforeUpdate hook hashes it
    await user.save();

    res.json({
      message: "Password updated successfully",
    } satisfies SuccessMessageResponse);
  }),
);

router.get(
  "/:userId",
  authed(async (req, res) => {
    const userId = intParam(req, "userId");
    // Only the owner sees private fields (email).
    const finder = userId === req.userId ? User : User.scope("public");
    const user = await finder.findByPk(userId);
    if (!user) throw new NotFoundError("User not found");
    res.json({ user: toWire<UserDto>(user) } satisfies UserResponse);
  }),
);

// Profile fields only — password changes go through PUT /users/me/password.
router.put(
  "/:userId",
  authed(async (req, res) => {
    const userId = intParam(req, "userId");
    if (userId !== req.userId) {
      throw new ForbiddenError("You can only update your own profile");
    }

    const data = validated(validateProfileUpdate(req.body));

    if (data.username) {
      const taken = await User.count({
        where: { username: data.username, id: { [Op.ne]: userId } },
      });
      if (taken > 0) {
        throw new ConflictError("Username already exists", {
          username: "Username already exists",
        });
      }
    }

    const user = await User.updateUser(userId, data);
    res.json({
      message: "Profile updated successfully",
      user: toWire<UserDto>(user),
    } satisfies UserResponse);
  }),
);

export default router;
