import { Card } from "../common";
import FormField from "../forms/common/FormField";
import SubmitButton from "../forms/common/SubmitButton";
import ErrorBanner from "../forms/common/ErrorBanner";
import { useFormState } from "../../hooks/useFormState";
import { validateSignupForm } from "../../utils/validation";
import { useAuth } from "../../context/AuthContext";

/**
 * Profile edit component for editing user information
 * @param {object} user - The user whose profile is being edited
 * @param {function} onSave - Function called when profile is saved
 * @param {function} onCancel - Function called when edit is cancelled
 */
function ProfileEdit({ user, onSave, onCancel }) {
  const { updateUserProfile } = useAuth();

  const initialFormData = {
    firstName: user.firstName,
    lastName: user.lastName,
    age: user.age.toString(),
    location: user.location,
    username: user.username,
    password: "",
    confirmPassword: "",
  };

  const {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    setErrors,
  } = useFormState(initialFormData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form data
    const validationErrors = validateSignupForm({
      ...formData,
      // Skip password validation if not changing password
      password: formData.password || "dummypassword",
      confirmPassword: formData.password || "dummypassword",
    });

    // Remove password errors if not changing password
    if (!formData.password) {
      delete validationErrors.password;
      delete validationErrors.confirmPassword;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    // Update the profile
    const success = updateUserProfile(user.id, {
      ...formData,
      age: parseInt(formData.age),
    });

    if (success) {
      onSave();
    } else {
      setErrors({ general: "Failed to update profile" });
    }

    setIsSubmitting(false);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Edit Profile</h2>

      <ErrorBanner message={errors.general} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
          />
          <FormField
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            error={errors.lastName}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Age"
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min="13"
            max="120"
            error={errors.age}
          />
          <FormField
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            error={errors.location}
          />
        </div>

        <FormField
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
        />

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            Leave password fields empty to keep your current password
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="New Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password"
              error={errors.password}
            />
            <FormField
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              error={errors.confirmPassword}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <SubmitButton
            isSubmitting={isSubmitting}
            submitText="Save Changes"
            submittingText="Saving..."
          />
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

export default ProfileEdit;
