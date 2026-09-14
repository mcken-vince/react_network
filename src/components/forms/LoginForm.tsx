import type { FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import AuthCard from "./common/AuthCard";
import FormField from "./common/FormField";
import ErrorBanner from "./common/ErrorBanner";
import AuthModeSwitch from "./common/AuthModeSwitch";
import { Button, Stack } from "../atoms";
import { useFormState } from "../../hooks/useFormState";
import {
  validateLoginForm,
  type LoginFormValues,
} from "../../utils/validation";
import type { AuthResult } from "../../context/AuthContext";
import type { LoginCredentials } from "../../types";

const initialFormData: LoginFormValues = {
  username: "",
  password: "",
};

interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<AuthResult>;
}

function LoginForm({ onLogin }: LoginFormProps) {
  const navigate = useNavigate();
  const {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    setErrors,
    resetForm,
  } = useFormState(initialFormData);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationErrors = validateLoginForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    const result = await onLogin(formData);
    if (!result.success) {
      // Field-level errors land on their inputs; anything else goes to the banner.
      setErrors({ ...(result.errors ?? {}), general: result.message });
    }
    setIsSubmitting(false);
  };

  const handleSwitchMode = (): void => {
    resetForm();
    void navigate({ to: "/signup" });
  };

  return (
    <AuthCard title="Welcome Back" subtitle="Sign in to your account">
      <ErrorBanner message={errors.general} />
      <form onSubmit={(e) => void handleSubmit(e)}>
        <Stack spacing="medium">
          <FormField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
            error={errors.username}
            autoComplete="username"
          />
          <FormField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            error={errors.password}
            autoComplete="current-password"
          />
          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            isLoading={isSubmitting}
            loadingText="Signing In..."
          >
            Sign In
          </Button>
        </Stack>
      </form>
      <AuthModeSwitch isLoginMode onSwitch={handleSwitchMode} />
    </AuthCard>
  );
}

export default LoginForm;
