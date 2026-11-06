import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import i18n from '../i18n';
import { apiError } from './api';

/**
 * Puts server field errors on the form; a duplicate (409) goes on `duplicateField`.
 * Anything else becomes a toast. Returns the error info.
 */
export function applyServerErrors<T extends FieldValues>(e: unknown, setError: UseFormSetError<T>, duplicateField?: Path<T>) {
  const err = apiError(e);
  const fields = Object.entries(err.fieldErrors);
  if (fields.length) {
    for (const [f, m] of fields) setError(f as Path<T>, { message: m });
  } else if (err.messageKey === 'errors.common.duplicate' && duplicateField) {
    setError(duplicateField, { message: err.messageKey });
  } else {
    toast.error(i18n.t(err.messageKey));
  }
  return err;
}

export const toastError = (e: unknown) => toast.error(i18n.t(apiError(e).messageKey));
