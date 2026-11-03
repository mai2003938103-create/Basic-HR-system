import type { PPayItem, PSettings, PTaxBracket } from './db';

export interface PayLine {
  basic: number; allowance: number; overtimeHours: number; overtimePay: number; bonus: number; unpaidDays: number; unpaidDeduction: number;
  gross: number; ssBase: number; ssEmployee: number; ssEmployer: number; taxable: number; incomeTax: number; otherDeduction: number;
  totalDeductions: number; net: number; employerCost: number;
  taxSteps: { from: number; to: number | null; rate: number; amount: number; tax: number }[];
}

export function progressiveTax(taxable: number, brackets: PTaxBracket[]) {
  let prev = 0;
  let total = 0;
  const steps: PayLine['taxSteps'] = [];
  for (const b of brackets) {
    const cap = b.upTo ?? Infinity;
    if (taxable <= prev) break;
    const amount = Math.min(taxable, cap) - prev;
    const tax = Math.round((amount * b.rate) / 100);
    steps.push({ from: prev, to: b.upTo, rate: b.rate, amount, tax });
    total += tax;
    prev = cap;
  }
  return { total, steps };
}

/** Sample calculation for the prototype. The real rules are confirmed with HR and implemented on the server in Stage 2. */
export function calcLine(item: PPayItem, s: PSettings['payroll']): PayLine {
  const daily = item.basic / s.workDaysPerMonth;
  const overtimeHours = item.overtimeMinutes / 60;
  const overtimePay = Math.round((daily / 8) * overtimeHours * (s.overtimeRate / 100));
  const unpaidDeduction = Math.round(daily * item.unpaidDays);
  const gross = item.basic + item.allowance + overtimePay + item.bonus - unpaidDeduction;
  const ssBase = Math.min(gross, s.ssCeiling);
  const ssEmployee = Math.round((ssBase * s.ssEmployeeRate) / 100);
  const ssEmployer = Math.round((ssBase * s.ssEmployerRate) / 100);
  const taxable = Math.max(0, gross - ssEmployee);
  const { total: incomeTax, steps } = progressiveTax(taxable, s.taxBrackets);
  const totalDeductions = ssEmployee + incomeTax + item.otherDeduction;
  const net = gross - totalDeductions;
  return {
    basic: item.basic, allowance: item.allowance, overtimeHours, overtimePay, bonus: item.bonus, unpaidDays: item.unpaidDays, unpaidDeduction,
    gross, ssBase, ssEmployee, ssEmployer, taxable, incomeTax, otherDeduction: item.otherDeduction, totalDeductions, net, employerCost: gross + ssEmployer, taxSteps: steps,
  };
}
