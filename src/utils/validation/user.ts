import { LIMITS } from "@shared/limits";
import type { FormErrors } from "../../types";
import {
  validatePassword,
  validatePasswordMatch,
  validateUsername,
} from "./auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Raw <input> values — age is a string until submit. */
export interface SignupFormValues {
  firstName: string;
  lastName: string;
  age: string;
  location: string;
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  bio: string;
}

export type ProfileFormValues = Omit<
  SignupFormValues,
  "password" | "confirmPassword"
>;

const validateRequired = (value: string, fieldName: string): string | null =>
  value.trim() ? null : `${fieldName} is required`;

const validateAge = (age: string | number): string | null => {
  const n = typeof age === "number" ? age : parseInt(age, 10);
  if (!Number.isInteger(n) || n < LIMITS.AGE_MIN || n > LIMITS.AGE_MAX) {
    return `Age must be between ${LIMITS.AGE_MIN} and ${LIMITS.AGE_MAX}`;
  }
  return null;
};

const validateEmail = (email: string): string | null => {
  if (!email) return null; // optional
  return EMAIL_RE.test(email) ? null : "Please enter a valid email address";
};

const validateBio = (bio: string): string | null =>
  bio.length > LIMITS.BIO_MAX
    ? `Bio must be less than ${LIMITS.BIO_MAX} characters`
    : null;

export const validateSignupForm = (formData: SignupFormValues): FormErrors => {
  const errors: FormErrors = {};

  const firstNameError = validateRequired(formData.firstName, "First name");
  if (firstNameError) errors.firstName = firstNameError;

  const lastNameError = validateRequired(formData.lastName, "Last name");
  if (lastNameError) errors.lastName = lastNameError;

  const ageError = validateAge(formData.age);
  if (ageError) errors.age = ageError;

  const locationError = validateRequired(formData.location, "Location");
  if (locationError) errors.location = locationError;

  const usernameError = validateUsername(formData.username);
  if (usernameError) errors.username = usernameError;

  const passwordError = validatePassword(formData.password);
  if (passwordError) {
    errors.password = passwordError;
  } else {
    const matchError = validatePasswordMatch(
      formData.password,
      formData.confirmPassword,
    );
    if (matchError) errors.confirmPassword = matchError;
  }

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  const bioError = validateBio(formData.bio);
  if (bioError) errors.bio = bioError;

  return errors;
};

/** Every field optional; only the keys present are validated. */
export const validateProfileUpdateForm = (
  formData: Partial<ProfileFormValues>,
): FormErrors => {
  const errors: FormErrors = {};

  if (formData.firstName !== undefined) {
    const e = validateRequired(formData.firstName, "First name");
    if (e) errors.firstName = e;
  }
  if (formData.lastName !== undefined) {
    const e = validateRequired(formData.lastName, "Last name");
    if (e) errors.lastName = e;
  }
  if (formData.age !== undefined) {
    const e = validateAge(formData.age);
    if (e) errors.age = e;
  }
  if (formData.location !== undefined) {
    const e = validateRequired(formData.location, "Location");
    if (e) errors.location = e;
  }
  if (formData.username !== undefined) {
    const e = validateUsername(formData.username);
    if (e) errors.username = e;
  }
  if (formData.email !== undefined) {
    const e = validateEmail(formData.email);
    if (e) errors.email = e;
  }
  if (formData.bio !== undefined) {
    const e = validateBio(formData.bio);
    if (e) errors.bio = e;
  }

  return errors;
};