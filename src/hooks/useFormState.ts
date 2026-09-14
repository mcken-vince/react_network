import { useState, type ChangeEvent } from "react";
import type { FormErrors } from "../types";

type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** Controlled-form state for flat string-valued forms. */
export function useFormState<T extends Record<string, string>>(
  initialState: T,
) {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<FieldElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }) as T);
    // Clear the field's error as soon as the user edits it.
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const resetForm = (newInitialState: T = initialState): void => {
    setFormData(newInitialState);
    setErrors({});
    setIsSubmitting(false);
  };

  const setError = (field: string, message: string): void => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const clearErrors = (): void => setErrors({});

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    resetForm,
    setError,
    clearErrors,
  };
}
