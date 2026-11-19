import { isBlank, isEmail, isStrongPassword } from '../utils/validationUtils';
import { PASSWORD_MIN_LENGTH } from '../constants/appConstants';

/** A rule returns an error message, or undefined when the value is valid. It can see all form values. */
export type Rule<T> = (value: string, values: T) => string | undefined;
export type Schema<T> = Partial<Record<keyof T, Rule<T>[]>>;
export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

export const rules = {
  required:
    <T>(message = 'This field is required.'): Rule<T> =>
    (v) => (isBlank(v) ? message : undefined),
  email:
    <T>(message = 'Enter a valid email address.'): Rule<T> =>
    (v) => (isBlank(v) || isEmail(v) ? undefined : message),
  strongPassword:
    <T>(
      message = `Use at least ${PASSWORD_MIN_LENGTH} characters with upper- and lower-case letters and a number.`,
    ): Rule<T> =>
    (v) => (isBlank(v) || isStrongPassword(v) ? undefined : message),
  matches:
    <T>(field: keyof T, message = 'Values do not match.'): Rule<T> =>
    (v, values) => (v === values[field] ? undefined : message),
};

/** Runs every field's rules in order and keeps the first error per field. */
export function validate<T extends Record<string, string>>(values: T, schema: Schema<T>): ValidationErrors<T> {
  const errors: ValidationErrors<T> = {};
  for (const field of Object.keys(schema) as (keyof T)[]) {
    for (const rule of schema[field] ?? []) {
      const error = rule(values[field] ?? '', values);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return errors;
}

export const validationService = { rules, validate };
