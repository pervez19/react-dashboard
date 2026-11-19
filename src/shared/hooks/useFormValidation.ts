import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react';
import { validate, type Schema, type ValidationErrors } from '../../core/services/validationService';

/** Controlled form state + schema validation. Server-side field errors can be merged with setErrors. */
export function useFormValidation<T extends Record<string, string>>(initialValues: T, schema: Schema<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    // Clear the field's error as soon as the user edits it.
    setErrors((errs) => (errs[name as keyof T] ? { ...errs, [name]: undefined } : errs));
  }, []);

  const handleSubmit = useCallback(
    (onValid: (values: T) => void | Promise<void>) => (e: FormEvent) => {
      e.preventDefault();
      const found = validate(values, schema);
      setErrors(found);
      if (Object.values(found).every((msg) => !msg)) void onValid(values);
    },
    [values, schema],
  );

  return { values, errors, setErrors, handleChange, handleSubmit };
}
