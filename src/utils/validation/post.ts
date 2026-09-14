import { LIMITS } from "@shared/limits";
import type { FormErrors, PostVisibility } from "../../types";

const VISIBILITIES: readonly PostVisibility[] = ["public", "friends", "private"];

export interface PostFormValues {
  content: string;
  imageUrl?: string | null;
  visibility?: string;
}

const validatePostContent = (content: string | undefined): string | null => {
  if (!content || !content.trim()) return "Post content is required";
  if (content.length > LIMITS.POST_CONTENT_MAX)
    return `Post content must be less than ${LIMITS.POST_CONTENT_MAX} characters`;
  return null;
};

const validateImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null; // optional
  if (imageUrl.length > LIMITS.URL_MAX)
    return `Image URL must be less than ${LIMITS.URL_MAX} characters`;
  try {
    new URL(imageUrl);
    return null;
  } catch {
    return "Image URL must be a valid URL";
  }
};

const validateVisibility = (visibility: string | undefined): string | null => {
  if (!visibility) return null; // server default applies
  return (VISIBILITIES as readonly string[]).includes(visibility)
    ? null
    : `Visibility must be one of: ${VISIBILITIES.join(", ")}`;
};

export const validateCreatePost = (formData: PostFormValues): FormErrors => {
  const errors: FormErrors = {};

  const contentError = validatePostContent(formData.content);
  if (contentError) errors.content = contentError;

  if (formData.imageUrl !== undefined) {
    const imageError = validateImageUrl(formData.imageUrl);
    if (imageError) errors.imageUrl = imageError;
  }

  if (formData.visibility !== undefined) {
    const visibilityError = validateVisibility(formData.visibility);
    if (visibilityError) errors.visibility = visibilityError;
  }

  return errors;
};

export const validateUpdatePost = (
  formData: Partial<PostFormValues>,
): FormErrors => {
  const errors: FormErrors = {};

  if (
    !formData.content &&
    formData.imageUrl === undefined &&
    formData.visibility === undefined
  ) {
    errors.general = "At least one field must be provided for update";
  }

  if (formData.content !== undefined) {
    const contentError = validatePostContent(formData.content);
    if (contentError) errors.content = contentError;
  }

  if (formData.imageUrl !== undefined) {
    const imageError = validateImageUrl(formData.imageUrl);
    if (imageError) errors.imageUrl = imageError;
  }

  if (formData.visibility !== undefined) {
    const visibilityError = validateVisibility(formData.visibility);
    if (visibilityError) errors.visibility = visibilityError;
  }

  return errors;
};

export const getRemainingCharacters = (
  content: string,
  maxLength: number = LIMITS.POST_CONTENT_MAX,
): number => maxLength - content.length;

export const isContentTooLong = (
  content: string,
  maxLength: number = LIMITS.POST_CONTENT_MAX,
): boolean => content.length > maxLength;