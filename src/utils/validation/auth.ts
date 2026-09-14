import { LIMITS } from "@shared/limits";
import type { FormErrors } from "../../types";

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

export interface LoginFormValues {
  username: string;
  password: string;
}

export const validateUsername = (username: string): string | null => {
  if (!username.trim()) return "Username is required";
  if (username.length < LIMITS.USERNAME_MIN)
    return `Username must be at least ${LIMITS.USERNAME_MIN} characters`;
  if (username.length > LIMITS.USERNAME_MAX)
    return `Username must be at most ${LIMITS.USERNAME_MAX} characters`;
  if (!USERNAME_RE.test(username))
    return "Username can only contain letters, numbers, and underscores";
  return null;
};

export const validatePassword = (
  password: string,
  isRequired = true,
): string | null => {
  if (!password) return isRequired ? "Password is required" : null;
  if (password.length < LIMITS.PASSWORD_MIN)
    return `Password must be at least ${LIMITS.PASSWORD_MIN} characters`;
  if (password.length > LIMITS.PASSWORD_MAX)
    return `Password must be at most ${LIMITS.PASSWORD_MAX} characters`;
  return null;
};

export const validatePasswordMatch = (
  password: string,
  confirmPassword: string,
): string | null =>
  password === confirmPassword ? null : "Passwords do not match";

export const validateLoginForm = (formData: LoginFormValues): FormErrors => {
  const errors: FormErrors = {};

  const usernameError = validateUsername(formData.username);
  if (usernameError) errors.username = usernameError;

  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;

  return errors;
};