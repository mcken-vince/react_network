import { useState } from "react";
import {
  validateCreatePost,
  getRemainingCharacters,
  isContentTooLong,
} from "../../utils/validation/post";

export default function CreatePostForm({ onPostCreated, currentUser }) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("friends");
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);

  const remainingChars = getRemainingCharacters(content);
  const isTooLong = isContentTooLong(content);
  const isNearLimit = remainingChars < 100;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
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
      const postData = {
        content: content.trim(),
        visibility,
      };

      if (imageUrl.trim()) {
        postData.imageUrl = imageUrl.trim();
      }

      await onPostCreated(postData);

      // Clear form on success
      setContent("");
      setImageUrl("");
      setVisibility("friends");
      setShowImageInput(false);
    } catch (error) {
      console.error("Error creating post:", error);
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

  const handleCancel = () => {
    setContent("");
    setImageUrl("");
    setVisibility("friends");
    setShowImageInput(false);
    setErrors({});
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <form onSubmit={handleSubmit}>
        {/* User Avatar & Textarea */}
        <div className="flex space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {currentUser?.firstName?.[0]}
              {currentUser?.lastName?.[0]}
            </div>
          </div>

          {/* Textarea */}
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className={`w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.content ? "border-red-500" : "border-gray-300"
              }`}
              rows={3}
              maxLength={2100} // Allow slightly over for better UX
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
        </div>

        {/* Image URL Input (optional) */}
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

        {/* General Error */}
        {errors.general && (
          <div className="mt-3 ml-13">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          {/* Left Side - Options */}
          <div className="flex items-center space-x-2">
            {/* Add Image Button */}
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                showImageInput ? "text-blue-600" : "text-gray-500"
              }`}
              title="Add image URL"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>

            {/* Visibility Selector */}
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="friends">🔵 Friends</option>
              <option value="public">🌍 Public</option>
              <option value="private">🔒 Private</option>
            </select>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center space-x-2">
            {(content.trim() || imageUrl.trim()) && (
              <button
                type="button"
                onClick={handleCancel}
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
