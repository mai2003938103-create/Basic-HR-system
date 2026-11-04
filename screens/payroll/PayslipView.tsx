import { useTranslation } from 'react-i18next';
import { currencyOf, useSettings } from '../../hooks/useSettings';
import { localName } from '../../i18n';
import { formatDate, formatMoney, fullName } from '../../lib/format';
import { formatPeriod, type Payslip } from '../../lib/payroll';
import { cn } from '@/lib/utils';

function Row({ label, value, hint, negative, strong }: { label: string; value: string; hint?: string; negative?: boolean; strong?: boolean }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 py-2', strong && 'border-t border-border pt-3 font-semibold')}>
      <span className="min-w-0">
        <span className="block">{label}</span>
        {hint && <span className="block text-body-sm text-ink-muted">{hint}</span>}
      </span>
      <span className={cn('tabular whitespace-nowrap text-right', negative && 'text-danger-text')}>{negative ? `− ${value}` : value}</span>
    </div>
  );
}

/** Printable payslip. Figures in the prototype are samples, not confirmed Lao-law calculations. */
export function PayslipView({ slip }: { slip: Payslip }) {
  const { t, i18n } = useTranslation();
  const cur = currencyOf(useSettings());
  const m = (n: number) => formatMoney(n, cur);
  const c = slip.calc;
  const e = slip.employee;
  const lo = i18n.language === 'lo';

  return (
    <article className="payslip rounded-md border border-border bg-surface-card" aria-label={`${t('payroll.payslip')} ${formatPeriod(slip.period)}`}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-6">
        <div className="flex items-center gap-3">
          <img src="/systory-logo.jpg" alt="Systory" className="size-12 rounded-sm object-contain" />
          <div>
            <p className="text-subhead">{lo ? slip.company.nameLo : slip.company.nameEn}</p>
            <p className="text-body-sm text-ink-muted">{lo ? slip.company.addressLo : slip.company.addressEn}</p>
            <p className="text-body-sm text-ink-muted">{t('settings.taxId')}: {slip.company.taxId}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-section-title text-primary-hover">{t('payroll.payslip')}</p>
          <p className="text-label">{formatPeriod(slip.period)}</p>
          <p className="text-body-sm text-ink-muted">{t('payroll.payDate')}: {formatDate(slip.payDate)}</p>
        </div>
      </header>

      <dl className="grid gap-x-6 gap-y-3 border-b border-border p-6 sm:grid-cols-3">
        {[
          [t('payroll.employee'), `${fullName(e)} (${e.employeeCode})`],
          [t('employees.department'), localName(e.department)],
          [t('employees.position'), localName(e.position)],
          [t('payroll.bank'), e.bankName ? `${e.bankName} · ${e.bankAccount}` : '—'],
          [t('payroll.workDays'), `${slip.rates.workDaysPerMonth - c.unpaidDays} / ${slip.rates.workDaysPerMonth}`],
          [t('payroll.overtime'), t('payroll.hours', { n: c.overtimeHours })],
        ].map(([k, v]) => (
          <div key={k}><dt className="text-body-sm text-ink-muted">{k}</dt><dd className="tabular">{v || '—'}</dd></div>
        ))}
      </dl>

      <div className="grid gap-6 p-6 md:grid-cols-2">
        <section aria-labelledby="earn">
          <h3 id="earn" className="mb-1 text-caption uppercase text-ink-muted">{t('payroll.earnings')}</h3>
          <Row label={t('payroll.basic')} value={m(c.basic)} />
          <Row label={t('payroll.allowance')} value={m(c.allowance)} />
          <Row label={t('payroll.overtimePay')} hint={t('payroll.otHint', { h: c.overtimeHours, rate: slip.rates.overtimeRate })} value={m(c.overtimePay)} />
          {c.bonus > 0 && <Row label={t('payroll.bonus')} value={m(c.bonus)} />}
          {c.unpaidDeduction > 0 && <Row label={t('payroll.unpaidLeave')} hint={t('payroll.days', { n: c.unpaidDays })} value={m(c.unpaidDeduction)} negative />}
          <Row label={t('payroll.gross')} value={m(c.gross)} strong />
        </section>
        <section aria-labelledby="ded">
          <h3 id="ded" className="mb-1 text-caption uppercase text-ink-muted">{t('payroll.deductions')}</h3>
          <Row label={t('payroll.ssEmployee')} hint={t('payroll.ssHint', { rate: slip.rates.ssEmployeeRate, base: m(c.ssBase) })} value={m(c.ssEmployee)} />
          <Row label={t('payroll.incomeTax')} hint={t('payroll.taxableHint', { amount: m(c.taxable) })} value={m(c.incomeTax)} />
          {c.otherDeduction > 0 && <Row label={t('payroll.otherDeduction')} value={m(c.otherDeduction)} />}
          <Row label={t('payroll.totalDeductions')} value={m(c.totalDeductions)} strong />
        </section>
      </div>

      <div className="mx-6 mb-6 flex flex-wrap items-center justify-between gap-2 rounded-sm bg-primary-tint px-5 py-4">
        <span className="text-subhead text-primary-hover">{t('payroll.net')}</span>
        <span className="tabular text-stat-value text-primary-hover">{m(c.net)}</span>
      </div>

      <details className="mx-6 mb-6 rounded-sm border border-border print:hidden">
        <summary className="cursor-pointer px-4 py-3 text-label">{t('payroll.taxBreakdown')}</summary>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-body-sm">
            <thead><tr className="text-left text-ink-muted"><th className="py-2 font-medium">{t('payroll.bracket')}</th><th className="py-2 text-right font-medium">{t('payroll.rate')}</th><th className="py-2 text-right font-medium">{t('payroll.amountInBracket')}</th><th className="py-2 text-right font-medium">{t('payroll.tax')}</th></tr></thead>
            <tbody>
              {c.taxSteps.map((s) => (
                <tr key={s.from} className="border-t border-border">
                  <td className="tabular py-2">{s.to === null ? t('payroll.over', { amount: m(s.from) }) : `${m(s.from)} – ${m(s.to)}`}</td>
                  <td className="tabular py-2 text-right">{s.rate}%</td>
                  <td className="tabular py-2 text-right">{m(s.amount)}</td>
                  <td className="tabular py-2 text-right">{m(s.tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-body-sm text-ink-muted">{t('payroll.employerSs', { rate: slip.rates.ssEmployerRate, amount: m(c.ssEmployer) })}</p>
        </div>
      </details>
      <p className="px-6 pb-6 text-body-sm text-ink-muted">{t('payroll.sampleNote')}</p>
    </article>
  );
}
