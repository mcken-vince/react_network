import { useState, type FormEvent } from "react";
import { LIMITS } from "@shared/limits";
import { Card } from "../common";
import FormField from "../forms/common/FormField";
import ErrorBanner from "../forms/common/ErrorBanner";
import { Button, Grid, Heading, Stack, Text } from "../atoms";
import { useFormState } from "../../hooks/useFormState";
import {
  validatePassword,
  validatePasswordMatch,
} from "../../utils/validation";
import { ApiError, userAPI } from "../../lib/api";
import type { FormErrors } from "../../types";

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const initialFormData: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

/** Talks to PUT /users/me/password, which requires the current password. */
function ChangePasswordForm() {
  const {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    setErrors,
    resetForm,
  } = useFormState(initialFormData);
  const [successMessage, setSuccessMessage] = useState("");

  const validate = (): FormErrors => {
    const validationErrors: FormErrors = {};

    if (!formData.currentPassword) {
      validationErrors.currentPassword = "Current password is required";
    }

    const newPasswordError = validatePassword(formData.newPassword);
    if (newPasswordError) {
      validationErrors.newPassword = newPasswordError;
    } else if (formData.newPassword === formData.currentPassword) {
      validationErrors.newPassword =
        "New password must be different from current password";
    }

    const matchError = validatePasswordMatch(
      formData.newPassword,
      formData.confirmPassword,
    );
    if (matchError) validationErrors.confirmPassword = matchError;

    return validationErrors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSuccessMessage("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await userAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      resetForm();
      setSuccessMessage("Password updated successfully");
    } catch (err) {
      setErrors(
        err instanceof ApiError
          ? { ...(err.errors ?? {}), general: err.message }
          : { general: "Failed to update password" },
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <Heading level={3} className="mb-2">
        Change Password
      </Heading>
      <Text size="sm" color="gray-600" className="mb-6">
        You&apos;ll need your current password to set a new one.
      </Text>

      <ErrorBanner message={errors.general} />
      {successMessage && (
        <div
          className="bg-green-50 border border-green-200 px-4 py-3 rounded-lg mb-4"
          role="status"
        >
          <Text color="green-700" className="mb-0">
            {successMessage}
          </Text>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)}>
        <Stack spacing="medium">
          <FormField
            label="Current Password"
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="Enter your current password"
            error={errors.currentPassword}
            autoComplete="current-password"
          />
          <Grid cols={1} mdCols={2}>
            <FormField
              label="New Password"
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder={`At least ${LIMITS.PASSWORD_MIN} characters`}
              error={errors.newPassword}
              autoComplete="new-password"
            />
            <FormField
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat new password"
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
          </Grid>
          <div>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              loadingText="Updating..."
            >
              Update Password
            </Button>
          </div>
        </Stack>
      </form>
    </Card>
  );
}

export default ChangePasswordForm;
