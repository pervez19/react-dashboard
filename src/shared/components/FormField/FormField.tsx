import { TextField, type TextFieldProps } from '@mui/material';

type FormFieldProps = Omit<TextFieldProps, 'error'> & {
  /** Validation message; when set the field is marked invalid and the text is linked via aria-describedby. */
  error?: string;
};

export function FormField({ error, helperText, ...props }: FormFieldProps) {
  return <TextField {...props} error={!!error} helperText={error ?? helperText} />;
}
