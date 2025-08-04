import { Card } from "../common";
import FormField from "../forms/common/FormField";
import SubmitButton from "../forms/common/SubmitButton";
import ErrorBanner from "../forms/common/ErrorBanner";
import { useFormState } from "../../hooks/useFormState";
import { validateSignupForm } from "../../utils/validation";
import { useAuth } from "../../context/AuthContext";
import "./ProfileEdit.css";

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

    // Create validation data (password is optional for profile updates)
    const validationData = {
      ...formData,
      password: formData.password || "dummy-password", // Use dummy password for validation if empty
      confirmPassword: formData.confirmPassword || "dummy-password",
    };

    const validationErrors = validateSignupForm(validationData);

    // Remove password errors if password fields are empty (optional update)
    if (!formData.password && !formData.confirmPassword) {
      delete validationErrors.password;
      delete validationErrors.confirmPassword;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    // Prepare update data
    const updateData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      age: parseInt(formData.age),
      location: formData.location,
      username: formData.username,
    };

    // Only include password if it was provided
    if (formData.password) {
      updateData.password = formData.password;
    }

    const result = updateUserProfile(user.id, updateData);
    if (result.success) {
      onSave();
    } else {
      setErrors({ general: result.message });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="profile-edit">
      <Card className="profile-edit-card">
        <h2>Edit Profile</h2>

        <ErrorBanner message={errors.general} />

        <form onSubmit={handleSubmit} className="profile-edit-form">
          <div className="form-row">
            <FormField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              error={errors.firstName}
            />

            <FormField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              error={errors.lastName}
            />
          </div>

          <div className="form-row">
            <FormField
              label="Age"
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Your age"
              min="13"
              max="120"
              error={errors.age}
            />

            <FormField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, Country"
              error={errors.location}
            />
          </div>

          <FormField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a unique username"
            error={errors.username}
          />

          <div className="password-section">
            <h3>Change Password (Optional)</h3>
            <p className="password-note">
              Leave blank to keep current password
            </p>

            <FormField
              label="New Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password (optional)"
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

          <div className="profile-edit-actions">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-btn"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <SubmitButton
              isSubmitting={isSubmitting}
              submitText="Save Changes"
              submittingText="Saving..."
            />
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ProfileEdit;
