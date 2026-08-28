import { useState, useEffect } from "react";
import {
  validateUpdatePost,
  getRemainingCharacters,
  isContentTooLong,
} from "../../utils/validation/post";

export default function EditPostModal({ post, isOpen, onClose, onSave }) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("friends");
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingChars = getRemainingCharacters(content);
  const isTooLong = isContentTooLong(content);
  const isNearLimit = remainingChars < 100;

  // Initialize form with post data when modal opens
  useEffect(() => {
    if (isOpen && post) {
      setContent(post.content || "");
      setVisibility(post.visibility || "friends");
      setImageUrl(post.imageUrl || "");
      setErrors({});
    }
  }, [isOpen, post]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
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
      const updateData = {
        content: content.trim(),
        visibility,
      };

      // Only include imageUrl if it's been changed
      if (imageUrl !== (post.imageUrl || "")) {
        updateData.imageUrl = imageUrl.trim() || null;
      }

      await onSave(updateData);
      onClose();
    } catch (error) {
      console.error("Error updating post:", error);
      setErrors({
        ...(error.errors ?? {}),
        general: error.errors
          ? undefined
          : error.message || "Failed to save post. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Edit Post</h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {/* Content Textarea */}
            <div className="mb-4">
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.content ? "border-red-500" : "border-gray-300"
                }`}
                rows={6}
                maxLength={2100}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}

              {/* Character Counter */}
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

            {/* Image URL */}
            <div className="mb-4">
              <label
                htmlFor="imageUrl"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Image URL (optional)
              </label>
              <input
                id="imageUrl"
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

            {/* Visibility */}
            <div className="mb-4">
              <label
                htmlFor="visibility"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Visibility
              </label>
              <select
                id="visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="friends">🔵 Friends</option>
                <option value="public">🌍 Public</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="mb-4">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Footer */}
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
