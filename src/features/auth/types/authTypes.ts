// Form models. Index signature lets them plug into useFormValidation's string-record constraint.

export interface LoginFormValues {
  [field: string]: string;
  email: string;
  password: string;
}

export interface RegisterFormValues {
  [field: string]: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
