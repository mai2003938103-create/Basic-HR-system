import { z } from 'zod';

export const newPasswordSchema = z
  .string()
  .min(8, 'errors.password.weak')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'errors.password.weak');
