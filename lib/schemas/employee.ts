import { z } from 'zod';
import { newPasswordSchema } from '../../screens/auth/passwordSchema';

const req = (max = 100) => z.string().trim().min(1, 'errors.validation.required').max(max);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'errors.validation.required');
const phone = z.string().trim().min(6, 'errors.validation.phone').max(20).regex(/^[0-9+\-\s()]+$/, 'errors.validation.phone');

export const employeeFormSchema = z
  .object({
    employeeCode: req(30).regex(/^[A-Za-z0-9_-]+$/, 'errors.validation.code'),
    firstName: req(),
    lastName: req(),
    gender: z.enum(['male', 'female', 'other'], { errorMap: () => ({ message: 'errors.validation.required' }) }),
    dateOfBirth: date,
    phone,
    email: z.string().trim().min(1, 'errors.validation.required').email('errors.validation.email'),
    address: z.string().max(1000).optional(),
    departmentId: z.string().min(1, 'errors.validation.required'),
    positionId: z.string().min(1, 'errors.validation.required'),
    hireDate: date,
    employmentStatus: z.enum(['active', 'probation']),
    basicSalary: z.coerce.number({ invalid_type_error: 'errors.validation.money' }).min(0, 'errors.validation.money'),
    emergencyContactName: z.string().max(200).optional(),
    emergencyContactPhone: z.union([z.literal(''), phone]).optional(),
    emergencyContactRelation: z.string().max(100).optional(),
    createAccount: z.boolean(),
    accountPassword: z.string().optional(),
    accountRole: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.createAccount) {
      const r = newPasswordSchema.safeParse(v.accountPassword ?? '');
      if (!r.success) ctx.addIssue({ code: 'custom', path: ['accountPassword'], message: 'errors.password.weak' });
      if (!v.accountRole) ctx.addIssue({ code: 'custom', path: ['accountRole'], message: 'errors.validation.required' });
    }
  });

export type EmployeeForm = z.infer<typeof employeeFormSchema>;
