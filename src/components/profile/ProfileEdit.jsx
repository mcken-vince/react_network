import { Card } from "../common";
import FormField from "../forms/common/FormField";
import ErrorBanner from "../forms/common/ErrorBanner";
import { Button, Grid, Stack, Text, Heading } from "../atoms";
import { useFormState } from "../../hooks/useFormState";
import { validateSignupForm } from "../../utils/validation";
import { useAuth } from "../../hooks/useAuth";

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
    email: user.email || "",
    bio: user.bio || "",
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
    const result = await updateUserProfile(user.id, {
      ...formData,
      age: parseInt(formData.age),
    });

    if (result.success) {
      onSave();
    } else {
      setErrors({ general: result.message || "Failed to update profile" });
    }

    setIsSubmitting(false);
  };

  return (
    <Card className="p-6">
      <Heading level={3} className="mb-6">
        Edit Profile
      </Heading>

      <ErrorBanner message={errors.general} />

      <form onSubmit={handleSubmit}>
        <Stack spacing="medium">
          <Grid cols={1} mdCols={2}>
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
          </Grid>

          <Grid cols={1} mdCols={2}>
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
          </Grid>

          <FormField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
          />

          <FormField
            label="Email (Optional)"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            error={errors.email}
          />

          <FormField
            label="Bio (Optional)"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us a bit about yourself (max 500 characters)"
            multiline
            rows={3}
            error={errors.bio}
            helperText={`${formData.bio.length}/500 characters`}
          />

          <div className="pt-4 border-t border-gray-200">
            <Text size="sm" color="gray-600" className="mb-4">
              Leave password fields empty to keep your current password
            </Text>
            <Grid cols={1} mdCols={2}>
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
            </Grid>
          </div>

          <Grid cols={2} gap="medium" className="pt-4">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isSubmitting}
              loadingText="Saving..."
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={onCancel}
            >
              Cancel
            </Button>
          </Grid>
        </Stack>
      </form>
    </Card>
  );
}

export default ProfileEdit;
