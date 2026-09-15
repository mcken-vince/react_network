import { useEffect, useState, type FormEvent } from "react";
import { LIMITS } from "@shared/limits";
import { ApiError } from "../../lib/api";
import {
  getRemainingCharacters,
  isContentTooLong,
  validateUpdatePost,
} from "../../utils/validation";
import type {
  FormErrors,
  Post,
  PostVisibility,
  UpdatePostData,
} from "../../types";

interface EditPostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdatePostData) => Promise<void>;
}

export default function EditPostModal({
  post,
  isOpen,
  onClose,
  onSave,
}: EditPostModalProps) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("friends");
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingChars = getRemainingCharacters(content);
  const isTooLong = isContentTooLong(content);
  const isNearLimit = remainingChars < 100;

  // Initialise from the post each time the modal opens.
  useEffect(() => {
    if (isOpen && post) {
      setContent(post.content);
      setVisibility(post.visibility);
      setImageUrl(post.imageUrl ?? "");
      setErrors({});
    }
  }, [isOpen, post]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!post) return;

    const validationErrors = validateUpdatePost({
      content,
      imageUrl,
      visibility,
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const updateData: UpdatePostData = {
        content: content.trim(),
        visibility,
      };
      // Only send imageUrl if it actually changed (null clears it).
      if (imageUrl !== (post.imageUrl ?? "")) {
        updateData.imageUrl = imageUrl.trim() || null;
      }

      await onSave(updateData);
      onClose();
    } catch (error) {
      console.error("Error updating post:", error);
      if (error instanceof ApiError) {
        setErrors({
          ...(error.errors ?? {}),
          general: error.errors ? undefined : error.message,
        });
      } else {
        setErrors({ general: "Failed to save post. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    if (!isSubmitting) {
      setErrors({});
      onClose();
    }
  };

  if (!isOpen || !post) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-post-title"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2
              id="edit-post-title"
              className="text-xl font-semibold text-gray-900"
            >
              Edit Post
            </h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-4">
            <div className="mb-4">
              <label
                htmlFor="edit-content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Content
              </label>
              <textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.content ? "border-red-500" : "border-gray-300"
                }`}
                rows={6}
                maxLength={LIMITS.POST_CONTENT_MAX + 100}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
              <div className="flex justify-end mt-1">
                <span
                  className={`text-sm ${
                    isTooLong
                      ? "text-red-600 font-semibold"
                      : isNearLimit
                        ? "text-yellow-600"
                        : "text-gray-400"
                  }`}
                >
                  {remainingChars} characters remaining
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="edit-imageUrl"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Image URL (optional)
              </label>
              <input
                id="edit-imageUrl"
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.imageUrl ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.imageUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="edit-visibility"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Visibility
              </label>
              <select
                id="edit-visibility"
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as PostVisibility)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="friends">🔵 Friends</option>
                <option value="public">🌍 Public</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>

            {errors.general && (
              <div className="mb-4">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !content.trim() || isTooLong}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
