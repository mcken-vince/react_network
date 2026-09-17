import { useState, type FormEvent } from "react";
import { LIMITS } from "@shared/limits";
import { ApiError } from "../../lib/api";
import {
  getRemainingCharacters,
  isContentTooLong,
  validateCreatePost,
} from "../../utils/validation";
import type {
  CreatePostData,
  FormErrors,
  PostVisibility,
  User,
} from "../../types";
import { Icon } from "../atoms";

const DEFAULT_VISIBILITY: PostVisibility = "friends";

interface CreatePostFormProps {
  currentUser: User | null;
  onPostCreated: (data: CreatePostData) => Promise<unknown>;
}

export default function CreatePostForm({
  currentUser,
  onPostCreated,
}: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] =
    useState<PostVisibility>(DEFAULT_VISIBILITY);
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);

  const remainingChars = getRemainingCharacters(content);
  const isTooLong = isContentTooLong(content);
  const isNearLimit = remainingChars < 100;

  const reset = (): void => {
    setContent("");
    setImageUrl("");
    setVisibility(DEFAULT_VISIBILITY);
    setShowImageInput(false);
    setErrors({});
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const validationErrors = validateCreatePost({
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
      const postData: CreatePostData = { content: content.trim(), visibility };
      if (imageUrl.trim()) postData.imageUrl = imageUrl.trim();

      await onPostCreated(postData);
      reset();
    } catch (error) {
      console.error("Error creating post:", error);
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {currentUser?.firstName?.[0]}
              {currentUser?.lastName?.[0]}
            </div>
          </div>

          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className={`w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.content ? "border-red-500" : "border-gray-300"
              }`}
              rows={3}
              maxLength={LIMITS.POST_CONTENT_MAX + 100} // small overflow so the counter can warn
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
        </div>

        {showImageInput && (
          <div className="mt-3 ml-13">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.imageUrl ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>
            )}
          </div>
        )}

        {errors.general && (
          <div className="mt-3 ml-13">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowImageInput((open) => !open)}
              className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                showImageInput ? "text-blue-600" : "text-gray-500"
              }`}
              title="Add image URL"
              aria-label="Add image URL"
            >
              <Icon name="image" size="medium" />
            </button>

            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as PostVisibility)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Post visibility"
            >
              <option value="friends">🔵 Friends</option>
              <option value="public">🌍 Public</option>
              <option value="private">🔒 Private</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {(content.trim() || imageUrl.trim()) && (
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !content.trim() || isTooLong}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
