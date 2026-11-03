// Stage 2 payroll DTOs: the API contract proposed by the design-first prototype.
import i18n from '../i18n';
import type { Named } from './types';

export type PayRunStatus = 'draft' | 'pending' | 'approved' | 'paid';
export interface PayRunSummary {
  id: string; period: string; status: PayRunStatus; payDate: string; employeeCount: number;
  totalGross: number; totalNet: number; totalTax: number; totalSsEmployee: number; totalSsEmployer: number; totalEmployerCost: number;
  createdAt: string; submittedAt: string | null; approvedAt: string | null; approvedBy: { email: string } | null; paidAt: string | null;
}
export interface PayItem { employeeId: string; basic: number; allowance: number; overtimeMinutes: number; bonus: number; otherDeduction: number; unpaidDays: number; note: string | null }
export interface PayCalc {
  basic: number; allowance: number; overtimeHours: number; overtimePay: number; bonus: number; unpaidDays: number; unpaidDeduction: number;
  gross: number; ssBase: number; ssEmployee: number; ssEmployer: number; taxable: number; incomeTax: number; otherDeduction: number;
  totalDeductions: number; net: number; employerCost: number;
  taxSteps: { from: number; to: number | null; rate: number; amount: number; tax: number }[];
}
export interface PayLine {
  employeeId: string;
  employee: { id: string; employeeCode: string; firstName: string; lastName: string; departmentId: string; department: Named | null; position: Named | null; bankName: string | null; bankAccount: string | null };
  item: PayItem;
  calc: PayCalc;
}
export interface PayRunDetail extends PayRunSummary { lines: PayLine[]; canEdit: boolean; canSubmit: boolean; canApprove: boolean; canPay: boolean }
export interface PayslipRow { payRunId: string; employeeId: string; period: string; payDate: string; paidAt: string | null; gross: number; totalDeductions: number; net: number }
export interface TaxBracket { upTo: number | null; rate: number }
export interface PayrollSettings { payDay: number; workDaysPerMonth: number; overtimeRate: number; ssEmployeeRate: number; ssEmployerRate: number; ssCeiling: number; taxBrackets: TaxBracket[] }
export interface Payslip extends PayLine {
  period: string; payDate: string; status: PayRunStatus;
  company: { nameLo: string; nameEn: string; addressLo: string; addressEn: string; taxId: string };
  rates: PayrollSettings;
}

/** "2026-10" → "ຕຸລາ 2026" / "October 2026". */
export const formatPeriod = (period: string) => {
  const [y, m] = period.split('-');
  return `${i18n.t(`common.months.m${Number(m)}`)} ${y}`;
};
