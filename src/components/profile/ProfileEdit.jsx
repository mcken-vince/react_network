import { Card } from "../common";
import FormField from "../forms/common/FormField";
import ErrorBanner from "../forms/common/ErrorBanner";
import ChangePasswordForm from "./ChangePasswordForm";
import { Button, Grid, Stack, Heading } from "../atoms";
import { useFormState } from "../../hooks/useFormState";
import { validateProfileUpdateForm } from "../../utils/validation";
import { useAuth } from "../../hooks/useAuth";

/**
 * Profile edit component. Profile fields and password are handled by two
 * independent forms — the profile endpoint does not accept passwords.
 * @param {object} user - The user whose profile is being edited
 * @param {function} onSave - Called after the profile is saved
 * @param {function} onCancel - Called when editing is cancelled
 */
function ProfileEdit({ user, onSave, onCancel }) {
  const { updateUserProfile } = useAuth();

  const initialFormData = {
    firstName: user.firstName,
    lastName: user.lastName,
    age: user.age.toString(),
    location: user.location,
    username: user.username,
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

    const validationErrors = validateProfileUpdateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    const result = await updateUserProfile(user.id, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      age: parseInt(formData.age, 10),
      location: formData.location,
      username: formData.username,
      email: formData.email,
      bio: formData.bio,
    });

    if (result.success) {
      onSave();
    } else {
      setErrors({
        ...(result.errors ?? {}),
        general: result.message || "Failed to update profile",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <Stack spacing="large">
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

      <ChangePasswordForm />
    </Stack>
  );
}

export default ProfileEdit;
