import { LIMITS } from "../../shared/limits";
import { REACTION_TYPES, isReactionType } from "../../shared/reactions";
import type { FieldErrors } from "../lib/errors";
import type {
  CreateDirectConversationData,
  CreateGroupConversationData,
  CreatePostData,
  LoginCredentials,
  PasswordChangeData,
  PostVisibility,
  ProfileUpdateData,
  SendMessageData,
  SignupData,
  UpdatePostData,
  AddParticipantsData,
  CreateCommentData,
  RenameConversationData,
  SetReactionData,
} from "../../shared/types";

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------
interface ValidationFailure {
  message: string;
  errors: FieldErrors;
}

/** Discriminated so `if (result.error) return;` narrows `result.data` to T. */
export type ValidationResult<T> =
  | { error: ValidationFailure; data: null }
  | { error: null; data: T };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type Body = Record<string, unknown>;

const asBody = (input: unknown): Body =>
  typeof input === "object" && input !== null ? (input as Body) : {};

/** Non-strings become "" so they fail "required" checks rather than crashing. */
const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

const parseInteger = (value: unknown): number | null => {
  const n = typeof value === "number" ? value : parseInt(text(value), 10);
  return Number.isInteger(n) ? n : null;
};

const addError = (
  errors: FieldErrors,
  field: string,
  message: string | null,
): void => {
  if (message) errors[field] = message;
};

const finish = <T>(errors: FieldErrors, data: T): ValidationResult<T> =>
  Object.keys(errors).length > 0
    ? { error: { message: "Validation failed", errors }, data: null }
    : { error: null, data };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_RE.test(value);

const POST_VISIBILITIES: readonly PostVisibility[] = [
  "public",
  "friends",
  "private",
];

const isPostVisibility = (value: unknown): value is PostVisibility =>
  typeof value === "string" &&
  (POST_VISIBILITIES as readonly string[]).includes(value);

// ---------------------------------------------------------------------------
// Field validators (return an error message or null)
// ---------------------------------------------------------------------------

const validateRequired = (value: string, fieldName: string): string | null =>
  value.trim() ? null : `${fieldName} is required`;

const validateUsername = (username: string): string | null => {
  if (!username.trim()) return "Username is required";
  if (username.length < LIMITS.USERNAME_MIN)
    return `Username must be at least ${LIMITS.USERNAME_MIN} characters`;
  if (username.length > LIMITS.USERNAME_MAX)
    return `Username must be at most ${LIMITS.USERNAME_MAX} characters`;
  if (!USERNAME_RE.test(username))
    return "Username can only contain letters, numbers, and underscores";
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < LIMITS.PASSWORD_MIN)
    return `Password must be at least ${LIMITS.PASSWORD_MIN} characters`;
  if (password.length > LIMITS.PASSWORD_MAX)
    return `Password must be at most ${LIMITS.PASSWORD_MAX} characters`;
  return null;
};

const validateAge = (age: number | null): string | null =>
  age === null || age < LIMITS.AGE_MIN || age > LIMITS.AGE_MAX
    ? `Age must be between ${LIMITS.AGE_MIN} and ${LIMITS.AGE_MAX}`
    : null;

const validateEmail = (email: string): string | null =>
  !email || EMAIL_RE.test(email) ? null : "Please enter a valid email address";

const validateBio = (bio: string): string | null =>
  bio.length > LIMITS.BIO_MAX
    ? `Bio must be less than ${LIMITS.BIO_MAX} characters`
    : null;

const validateUrl = (url: string, fieldName: string): string | null => {
  if (url.length > LIMITS.URL_MAX)
    return `${fieldName} must be less than ${LIMITS.URL_MAX} characters`;
  try {
    new URL(url);
    return null;
  } catch {
    return `${fieldName} must be a valid URL`;
  }
};

const validatePostContent = (content: string): string | null => {
  if (!content.trim()) return "Post content is required";
  if (content.length > LIMITS.POST_CONTENT_MAX)
    return `Post content must be less than ${LIMITS.POST_CONTENT_MAX} characters`;
  return null;
};

const validateMessageContent = (content: string): string | null => {
  if (!content.trim()) return "Message content is required";
  if (content.length > LIMITS.MESSAGE_CONTENT_MAX)
    return `Message content must be less than ${LIMITS.MESSAGE_CONTENT_MAX} characters`;
  return null;
};

const validateConversationName = (name: string): string | null => {
  if (!name.trim())
    return "Conversation name is required for group conversations";
  if (name.length > LIMITS.CONVERSATION_NAME_MAX)
    return `Conversation name must be less than ${LIMITS.CONVERSATION_NAME_MAX} characters`;
  return null;
};

/** Returns the parsed ids on success, or an error message. */
const parseParticipantIds = (
  value: unknown,
): { ids: number[] } | { error: string } => {
  if (!Array.isArray(value))
    return { error: "Participant IDs must be an array" };
  if (value.length < 1)
    return { error: "At least one other participant is required" };
  if (value.length > 50) return { error: "Maximum 50 participants allowed" };
  const ids = value.map(parseInteger);
  if (ids.some((id) => id === null || id <= 0))
    return { error: "Participant IDs must be positive integers" };
  const unique = new Set(ids);
  if (unique.size !== ids.length)
    return { error: "Duplicate participant IDs are not allowed" };
  return { ids: ids as number[] };
};

// ---------------------------------------------------------------------------
// Auth / users
// ---------------------------------------------------------------------------

export const validateSignup = (
  input: unknown,
): ValidationResult<SignupData> => {
  const b = asBody(input);
  const errors: FieldErrors = {};

  const firstName = text(b.firstName).trim();
  const lastName = text(b.lastName).trim();
  const location = text(b.location).trim();
  const username = text(b.username).trim();
  const password = text(b.password);
  const email = text(b.email).trim();
  const bio = text(b.bio);
  const age = parseInteger(b.age);

  addError(errors, "firstName", validateRequired(firstName, "First name"));
  addError(errors, "lastName", validateRequired(lastName, "Last name"));
  addError(errors, "age", validateAge(age));
  addError(errors, "location", validateRequired(location, "Location"));
  addError(errors, "username", validateUsername(username));
  addError(errors, "password", validatePassword(password));
  addError(errors, "email", validateEmail(email));
  addError(errors, "bio", validateBio(bio));

  return finish(errors, {
    firstName,
    lastName,
    age: age ?? 0, // unreachable on success: validateAge rejects null
    location,
    username,
    password,
    ...(email && { email }),
    ...(bio && { bio }),
  });
};

export const validateLogin = (
  input: unknown,
): ValidationResult<LoginCredentials> => {
  const b = asBody(input);
  const errors: FieldErrors = {};
  const username = text(b.username).trim();
  const password = text(b.password);

  addError(errors, "username", validateUsername(username));
  addError(errors, "password", validatePassword(password));

  return finish(errors, { username, password });
};

export const validatePasswordChange = (
  input: unknown,
): ValidationResult<PasswordChangeData> => {
  const b = asBody(input);
  const errors: FieldErrors = {};
  const currentPassword = text(b.currentPassword);
  const newPassword = text(b.newPassword);

  if (!currentPassword) errors.currentPassword = "Current password is required";
  const newPasswordError = validatePassword(newPassword);
  if (newPasswordError) {
    errors.newPassword = newPasswordError;
  } else if (newPassword === currentPassword) {
    errors.newPassword = "New password must be different from current password";
  }

  return finish(errors, { currentPassword, newPassword });
};

/** Every field optional; only keys present in the body are validated and returned. */
export const validateProfileUpdate = (
  input: unknown,
): ValidationResult<ProfileUpdateData> => {
  const b = asBody(input);
  const errors: FieldErrors = {};
  const data: ProfileUpdateData = {};

  if (b.firstName !== undefined) {
    const v = text(b.firstName).trim();
    addError(errors, "firstName", validateRequired(v, "First name"));
    data.firstName = v;
  }
  if (b.lastName !== undefined) {
    const v = text(b.lastName).trim();
    addError(errors, "lastName", validateRequired(v, "Last name"));
    data.lastName = v;
  }
  if (b.age !== undefined) {
    const age = parseInteger(b.age);
    addError(errors, "age", validateAge(age));
    if (age !== null) data.age = age;
  }
  if (b.location !== undefined) {
    const v = text(b.location).trim();
    addError(errors, "location", validateRequired(v, "Location"));
    data.location = v;
  }
  if (b.username !== undefined) {
    const v = text(b.username).trim();
    addError(errors, "username", validateUsername(v));
    data.username = v;
  }
  if (b.email !== undefined) {
    const v = text(b.email).trim();
    addError(errors, "email", validateEmail(v));
    data.email = v || null; // empty string clears the email
  }
  if (b.bio !== undefined) {
    const v = text(b.bio);
    addError(errors, "bio", validateBio(v));
    data.bio = v;
  }
  if (b.password !== undefined) {
    errors.password =
      "Password cannot be changed here; use PUT /users/me/password";
  }

  return finish(errors, data);
};

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export const validateCreatePost = (
  input: unknown,
): ValidationResult<CreatePostData> => {
  const b = asBody(input);
  const errors: FieldErrors = {};
  const content = text(b.content).trim();
  const data: CreatePostData = { content };

  addError(errors, "content", validatePostContent(content));

  if (b.imageUrl !== undefined && b.imageUrl !== null && b.imageUrl !== "") {
    const v = text(b.imageUrl).trim();
    addError(
      errors,
      "imageUrl",
      v ? validateUrl(v, "Image URL") : "Image URL must be a string",
    );
    data.imageUrl = v;
  } else {
    data.imageUrl = null;
  }

  if (b.visibility !== undefined) {
    if (isPostVisibility(b.visibility)) data.visibility = b.visibility;
    else
      errors.visibility = `Visibility must be one of: ${POST_VISIBILITIES.join(", ")}`;
  }

  return finish(errors, data);
};

export const validateUpdatePost = (
  input: unknown,
): ValidationResult<UpdatePostData> => {
  const b = asBody(input);
  const errors: FieldErrors = {};
  const data: UpdatePostData = {};

  if (
    b.content === undefined &&
    b.imageUrl === undefined &&
    b.visibility === undefined
  ) {
    errors.general = "At least one field must be provided for update";
  }

  if (b.content !== undefined) {
    const v = text(b.content).trim();
    addError(errors, "content", validatePostContent(v));
    data.content = v;
  }

  if (b.imageUrl !== undefined) {
    if (b.imageUrl === null || b.imageUrl === "") {
      data.imageUrl = null;
    } else {
      const v = text(b.imageUrl).trim();
      addError(
        errors,
        "imageUrl",
        v ? validateUrl(v, "Image URL") : "Image URL must be a string",
      );
      data.imageUrl = v;
    }
  }

  if (b.visibility !== undefined) {
    if (isPostVisibility(b.visibility)) data.visibility = b.visibility;
    else
      errors.visibility = `Visibility must be one of: ${POST_VISIBILITIES.join(", ")}`;
  }

  return finish(errors, data);
};

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

export const validateMessage = (
  input: unknown,
): ValidationResult<SendMessageData> => {
  const b = asBody(input);
  const errors: FieldErrors = {};
  const content = text(b.content);
  const data: SendMessageData = { content, replyToId: null };

  addError(errors, "content", validateMessageContent(content));

  if (b.replyToId !== undefined && b.replyToId !== null && b.replyToId !== "") {
    if (isUuid(b.replyToId)) data.replyToId = b.replyToId;
    else errors.replyToId = "replyToId must be a valid message id";
  }

  return finish(errors, data);
};

export const validateDirectConversation = (
  input: unknown,
): ValidationResult<CreateDirectConversationData> => {
  const b = asBody(input);
  const errors: FieldErrors = {};
  const recipientId = parseInteger(b.recipientId);

  if (recipientId === null || recipientId <= 0) {
    errors.recipientId = "A valid recipient ID is required";
  }

  return finish(errors, { recipientId: recipientId ?? 0 });
};

export const validateGroupConversation = (
  input: unknown,
): ValidationResult<CreateGroupConversationData> => {
  const b = asBody(input);
  const errors: FieldErrors = {};
  const name = text(b.name).trim();

  addError(errors, "name", validateConversationName(name));

  const parsed = parseParticipantIds(b.participantIds);
  if ("error" in parsed) errors.participantIds = parsed.error;

  return finish(errors, {
    name,
    participantIds: "ids" in parsed ? parsed.ids : [],
  });
};

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export const validateComment = (
  input: unknown,
): ValidationResult<CreateCommentData> => {
  const b = asBody(input);
  const errors: FieldErrors = {};
  const content = text(b.content).trim();
  if (!content) errors.content = "Comment cannot be empty";
  else if (content.length > LIMITS.COMMENT_CONTENT_MAX)
    errors.content = `Comment must be less than ${LIMITS.COMMENT_CONTENT_MAX} characters`;
  return finish(errors, { content });
};

// ---------------------------------------------------------------------------
// Group management
// ---------------------------------------------------------------------------

export const validateConversationRename = (
  input: unknown,
): ValidationResult<RenameConversationData> => {
  const b = asBody(input);
  const errors: FieldErrors = {};
  const name = text(b.name).trim();
  addError(errors, "name", validateConversationName(name));
  return finish(errors, { name });
};

export const validateAddParticipants = (
  input: unknown,
): ValidationResult<AddParticipantsData> => {
  const b = asBody(input);
  const errors: FieldErrors = {};
  const parsed = parseParticipantIds(b.userIds);
  if ("error" in parsed) errors.userIds = parsed.error;
  return finish(errors, { userIds: "ids" in parsed ? parsed.ids : [] });
};

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

export const validateReaction = (
  input: unknown,
): ValidationResult<SetReactionData> => {
  const b = asBody(input);
  if (!isReactionType(b.type)) {
    return finish<SetReactionData>(
      { type: `Reaction type must be one of: ${REACTION_TYPES.join(", ")}` },
      { type: "like" }, // unreachable on failure
    );
  }
  return finish<SetReactionData>({}, { type: b.type });
};
