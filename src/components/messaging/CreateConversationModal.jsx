import React, { useState, useEffect } from "react";
import { useMessaging } from "../../hooks/useMessaging";

export function CreateConversationModal({ isOpen, onClose }) {
  const {
    createDirectConversation,
    createGroupConversation,
    setActiveConversation,
  } = useMessaging();
  const [conversationType, setConversationType] = useState("direct");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock user search - in real app, this would be an API call
  const searchUsers = async (query) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUsers = [
          {
            id: 2,
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
          },
          {
            id: 3,
            firstName: "Bob",
            lastName: "Johnson",
            email: "bob@example.com",
          },
          {
            id: 4,
            firstName: "Alice",
            lastName: "Brown",
            email: "alice@example.com",
          },
          {
            id: 5,
            firstName: "Charlie",
            lastName: "Davis",
            email: "charlie@example.com",
          },
        ];

        const filtered = query
          ? mockUsers.filter(
              (user) =>
                user.firstName.toLowerCase().includes(query.toLowerCase()) ||
                user.lastName.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase())
            )
          : mockUsers;

        resolve(filtered);
      }, 300);
    });
  };

  useEffect(() => {
    if (isOpen) {
      searchUsers(searchQuery).then(setAvailableUsers);
    }
  }, [isOpen, searchQuery]);

  const handleUserSelect = (user) => {
    if (conversationType === "direct") {
      setSelectedUsers([user]);
    } else {
      setSelectedUsers((prev) => {
        const isSelected = prev.some((u) => u.id === user.id);
        if (isSelected) {
          return prev.filter((u) => u.id !== user.id);
        } else {
          return [...prev, user];
        }
      });
    }
  };

  const handleCreate = async () => {
    if (selectedUsers.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      let conversation;

      if (conversationType === "direct") {
        conversation = await createDirectConversation(selectedUsers[0].id);
      } else {
        const participantIds = selectedUsers.map((u) => u.id);
        conversation = await createGroupConversation(groupName, participantIds);
      }

      setActiveConversation(conversation.id);
      onClose();

      // Reset form
      setSelectedUsers([]);
      setGroupName("");
      setSearchQuery("");
      setConversationType("direct");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canCreate = () => {
    if (selectedUsers.length === 0) return false;
    if (conversationType === "group" && !groupName.trim()) return false;
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                New Conversation
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
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

            {/* Conversation Type Selector */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Conversation Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="direct"
                    checked={conversationType === "direct"}
                    onChange={(e) => setConversationType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Direct Message</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="group"
                    checked={conversationType === "group"}
                    onChange={(e) => setConversationType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Group Chat</span>
                </label>
              </div>
            </div>

            {/* Group Name (for group conversations) */}
            {conversationType === "group" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            {/* User Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {conversationType === "direct"
                  ? "Select User"
                  : "Add Participants"}
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected ({selectedUsers.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <span
                      key={user.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800"
                    >
                      {user.firstName} {user.lastName}
                      <button
                        onClick={() => handleUserSelect(user)}
                        className="ml-1 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Available Users List */}
            <div className="mb-4 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
              {availableUsers.map((user) => {
                const isSelected = selectedUsers.some((u) => u.id === user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      isSelected ? "bg-primary-50" : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-primary-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}

              {availableUsers.length === 0 && (
                <div className="px-3 py-4 text-center text-gray-500">
                  {searchQuery ? "No users found" : "Loading users..."}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleCreate}
              disabled={!canCreate() || loading}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                canCreate() && !loading
                  ? "bg-primary-600 hover:bg-primary-700 focus:ring-primary-500"
                  : "bg-gray-300 cursor-not-allowed"
              } focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              {loading ? "Creating..." : "Create Conversation"}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
