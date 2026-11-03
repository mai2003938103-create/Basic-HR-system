import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ErrorState } from '../../components/common/EmptyState';
import { FormField } from '../../components/common/FormField';
import { PageHeader, SectionTab } from '../../components/common/layout-bits';
import { LoadingState } from '../../components/common/LoadingState';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useQuery } from '../../hooks/useQuery';
import { clearSettingsCache } from '../../hooks/useSettings';
import { api, apiError } from '../../lib/api';
import { formatMoney } from '../../lib/format';
import type { PayrollSettings, TaxBracket } from '../../lib/payroll';

interface FullSettings {
  companyNameLo: string; companyNameEn: string; addressLo: string; addressEn: string; taxId: string; phone: string; email: string;
  currencyCode: string; currencySymbol: string; workingDays: number[]; workStart: string; workEnd: string; lateGraceMinutes: number; halfDayMinutes: number;
  payroll: PayrollSettings;
}

function Section({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Card className="mb-6 overflow-hidden">
      <div className="pt-6"><SectionTab>{title}</SectionTab></div>
      <div className="p-6">{children}</div>
      {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
    </Card>
  );
}

function useSave(path: string, onSaved: (s: FullSettings) => void) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = async (body: unknown) => {
    setBusy(true);
    setErrors({});
    try {
      const r = await api.put<{ data: FullSettings }>(path, body);
      clearSettingsCache();
      onSaved(r.data.data);
      toast.success(t('common.saved'));
    } catch (e) {
      const info = apiError(e);
      setErrors(info.fieldErrors);
      toast.error(t(info.messageKey));
    } finally {
      setBusy(false);
    }
  };
  return { busy, errors, save };
}

function CompanyTab({ s, onSaved }: { s: FullSettings; onSaved: (s: FullSettings) => void }) {
  const { t } = useTranslation();
  const [f, setF] = useState({ companyNameLo: s.companyNameLo, companyNameEn: s.companyNameEn, addressLo: s.addressLo, addressEn: s.addressEn, taxId: s.taxId, phone: s.phone, email: s.email, currencyCode: s.currencyCode, currencySymbol: s.currencySymbol });
  const { busy, errors, save } = useSave('/settings/company', onSaved);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <Section title={t('settings.company')} footer={<Button loading={busy} onClick={() => save(f)}>{t('common.save')}</Button>}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label={t('settings.nameLo')} required error={errors.companyNameLo}><Input value={f.companyNameLo} onChange={set('companyNameLo')} /></FormField>
        <FormField label={t('settings.nameEn')} required error={errors.companyNameEn}><Input value={f.companyNameEn} onChange={set('companyNameEn')} /></FormField>
        <FormField label={t('settings.addressLo')}><Input value={f.addressLo} onChange={set('addressLo')} /></FormField>
        <FormField label={t('settings.addressEn')}><Input value={f.addressEn} onChange={set('addressEn')} /></FormField>
        <FormField label={t('settings.taxId')} hint={t('settings.taxIdHint')}><Input value={f.taxId} onChange={set('taxId')} /></FormField>
        <FormField label={t('settings.phone')}><Input value={f.phone} onChange={set('phone')} /></FormField>
        <FormField label={t('settings.email')}><Input type="email" value={f.email} onChange={set('email')} /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('settings.currencyCode')}><Input value={f.currencyCode} onChange={set('currencyCode')} maxLength={3} /></FormField>
          <FormField label={t('settings.currencySymbol')}><Input value={f.currencySymbol} onChange={set('currencySymbol')} maxLength={3} /></FormField>
        </div>
      </div>
    </Section>
  );
}

const DAYS = [1, 2, 3, 4, 5, 6, 7];
function WorkTimeTab({ s, onSaved }: { s: FullSettings; onSaved: (s: FullSettings) => void }) {
  const { t } = useTranslation();
  const [f, setF] = useState({ workingDays: s.workingDays, workStart: s.workStart, workEnd: s.workEnd, lateGraceMinutes: String(s.lateGraceMinutes), halfDayMinutes: String(s.halfDayMinutes) });
  const { busy, errors, save } = useSave('/settings/work-time', onSaved);
  const toggle = (d: number) => setF((x) => ({ ...x, workingDays: x.workingDays.includes(d) ? x.workingDays.filter((y) => y !== d) : [...x.workingDays, d].sort() }));
  return (
    <>
      <Section title={t('settings.workTime')} footer={<Button loading={busy} onClick={() => save(f)}>{t('common.save')}</Button>}>
        <fieldset className="mb-6">
          <legend className="mb-2 text-label">{t('settings.workingDays')}</legend>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <label key={d} className="flex cursor-pointer items-center gap-2 rounded-pill border border-border-strong px-4 py-2 text-label has-[:checked]:border-primary has-[:checked]:bg-primary-tint">
                <Checkbox checked={f.workingDays.includes(d)} onCheckedChange={() => toggle(d)} />
                {t(`settings.days.d${d}`)}
              </label>
            ))}
          </div>
          {errors.workingDays && <p className="mt-2 text-body-sm text-danger-text">{t(errors.workingDays)}</p>}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label={t('settings.workStart')}><Input type="time" value={f.workStart} onChange={(e) => setF((x) => ({ ...x, workStart: e.target.value }))} /></FormField>
          <FormField label={t('settings.workEnd')} error={errors.workEnd}><Input type="time" value={f.workEnd} onChange={(e) => setF((x) => ({ ...x, workEnd: e.target.value }))} /></FormField>
          <FormField label={t('settings.lateGrace')} hint={t('settings.lateGraceHint')}><Input type="number" min={0} max={120} value={f.lateGraceMinutes} onChange={(e) => setF((x) => ({ ...x, lateGraceMinutes: e.target.value }))} /></FormField>
          <FormField label={t('settings.halfDay')} hint={t('settings.halfDayHint')}><Input type="number" min={60} max={480} step={30} value={f.halfDayMinutes} onChange={(e) => setF((x) => ({ ...x, halfDayMinutes: e.target.value }))} /></FormField>
        </div>
      </Section>
      <Section title={t('settings.leaveAndHolidays')}>
        <p className="mb-4 text-body-sm text-ink-muted">{t('settings.leaveAndHolidaysHint')}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link to="/leave?tab=types">{t('leave.types')}<ArrowRight /></Link></Button>
          <Button variant="outline" asChild><Link to="/leave?tab=holidays">{t('leave.holidays')}<ArrowRight /></Link></Button>
        </div>
      </Section>
    </>
  );
}

function taxOn(amount: number, brackets: TaxBracket[]) {
  let prev = 0;
  let tax = 0;
  for (const b of brackets) {
    const cap = b.upTo ?? Infinity;
    if (amount <= prev) break;
    tax += ((Math.min(amount, cap) - prev) * b.rate) / 100;
    prev = cap;
  }
  return Math.round(tax);
}

function PayrollTab({ s, onSaved }: { s: FullSettings; onSaved: (s: FullSettings) => void }) {
  const { t } = useTranslation();
  const p = s.payroll;
  const [f, setF] = useState({ payDay: String(p.payDay), workDaysPerMonth: String(p.workDaysPerMonth), overtimeRate: String(p.overtimeRate), ssEmployeeRate: String(p.ssEmployeeRate), ssEmployerRate: String(p.ssEmployerRate), ssCeiling: String(p.ssCeiling) });
  const [brackets, setBrackets] = useState(p.taxBrackets.map((b) => ({ upTo: b.upTo === null ? '' : String(b.upTo), rate: String(b.rate) })));
  const [sample, setSample] = useState('6000000');
  const { busy, errors, save } = useSave('/settings/payroll', onSaved);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const parsed: TaxBracket[] = useMemo(() => brackets.map((b) => ({ upTo: b.upTo === '' ? null : Number(b.upTo), rate: Number(b.rate) })), [brackets]);
  const cur = { code: s.currencyCode, symbol: s.currencySymbol };
  const gross = Number(sample) || 0;
  const ss = Math.round((Math.min(gross, Number(f.ssCeiling) || 0) * (Number(f.ssEmployeeRate) || 0)) / 100);
  const tax = taxOn(Math.max(0, gross - ss), parsed);

  return (
    <>
      <p className="mb-6 rounded-sm bg-warning-tint px-4 py-3 text-body-sm text-warning-text">{t('settings.payrollWarning')}</p>
      <Section title={t('settings.payrollGeneral')}>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label={t('settings.payDay')} hint={t('settings.payDayHint')}><Input type="number" min={1} max={31} value={f.payDay} onChange={set('payDay')} /></FormField>
          <FormField label={t('settings.workDaysPerMonth')} hint={t('settings.workDaysPerMonthHint')}><Input type="number" min={20} max={31} value={f.workDaysPerMonth} onChange={set('workDaysPerMonth')} /></FormField>
          <FormField label={t('settings.overtimeRate')} hint={t('settings.overtimeRateHint')}><Input type="number" min={100} max={300} step={10} value={f.overtimeRate} onChange={set('overtimeRate')} /></FormField>
        </div>
      </Section>
      <Section title={t('settings.socialSecurity')}>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label={t('settings.ssEmployee')}><Input type="number" min={0} max={20} step={0.1} value={f.ssEmployeeRate} onChange={set('ssEmployeeRate')} /></FormField>
          <FormField label={t('settings.ssEmployer')}><Input type="number" min={0} max={20} step={0.1} value={f.ssEmployerRate} onChange={set('ssEmployerRate')} /></FormField>
          <FormField label={t('settings.ssCeiling')} hint={t('settings.ssCeilingHint')}><Input type="number" min={0} step={100000} value={f.ssCeiling} onChange={set('ssCeiling')} /></FormField>
        </div>
      </Section>
      <Section
        title={t('settings.taxBrackets')}
        footer={<Button loading={busy} onClick={() => save({ ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, Number(v)])), taxBrackets: parsed })}>{t('common.save')}</Button>}
      >
        <p className="mb-4 text-body-sm text-ink-muted">{t('settings.taxBracketsHint')}</p>
        <div className="overflow-x-auto rounded-sm border border-border">
          <table className="w-full text-body">
            <thead><tr className="bg-surface-sunken text-left text-caption text-ink-muted"><th className="px-4 py-3">{t('settings.from')}</th><th className="px-4 py-3">{t('settings.upTo')}</th><th className="px-4 py-3">{t('settings.rate')}</th><th className="px-4 py-3" /></tr></thead>
            <tbody>
              {brackets.map((b, i) => {
                const from = i === 0 ? 0 : Number(brackets[i - 1].upTo) || 0;
                const last = i === brackets.length - 1;
                return (
                  <tr key={i} className="border-t border-border">
                    <td className="tabular whitespace-nowrap px-4 py-2 text-ink-muted">{formatMoney(from, cur)}</td>
                    <td className="px-4 py-2">
                      <Input aria-label={`${t('settings.upTo')} ${i + 1}`} type="number" min={0} step={100000} placeholder={t('settings.noCeiling')} className="w-44" value={b.upTo} onChange={(e) => setBrackets((x) => x.map((y, j) => (j === i ? { ...y, upTo: e.target.value } : y)))} />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2"><Input aria-label={`${t('settings.rate')} ${i + 1}`} type="number" min={0} max={50} className="w-24" value={b.rate} onChange={(e) => setBrackets((x) => x.map((y, j) => (j === i ? { ...y, rate: e.target.value } : y)))} />%</div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {!last && <Button variant="subtle" size="iconSm" aria-label={`${t('common.delete')} ${i + 1}`} onClick={() => setBrackets((x) => x.filter((_, j) => j !== i))}><Trash2 /></Button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {errors.taxBrackets && <p className="mt-2 text-body-sm text-danger-text">{t(errors.taxBrackets)}</p>}
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => setBrackets((x) => [...x.slice(0, -1), { upTo: '', rate: '' }, x[x.length - 1]])}><Plus />{t('settings.addBracket')}</Button>

        <div className="mt-6 rounded-sm bg-primary-tint p-4">
          <p className="mb-3 text-label">{t('settings.preview')}</p>
          <div className="flex flex-wrap items-end gap-6">
            <FormField label={t('settings.previewGross')} className="w-56"><Input type="number" min={0} step={100000} value={sample} onChange={(e) => setSample(e.target.value)} /></FormField>
            <dl className="flex flex-wrap gap-6 pb-2">
              <div><dt className="text-body-sm text-ink-muted">{t('payroll.ssEmployee')}</dt><dd className="tabular text-label">{formatMoney(ss, cur)}</dd></div>
              <div><dt className="text-body-sm text-ink-muted">{t('payroll.incomeTax')}</dt><dd className="tabular text-label">{formatMoney(tax, cur)}</dd></div>
              <div><dt className="text-body-sm text-ink-muted">{t('payroll.net')}</dt><dd className="tabular text-label text-primary-hover">{formatMoney(gross - ss - tax, cur)}</dd></div>
            </dl>
          </div>
        </div>
      </Section>
    </>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const [sp, setSp] = useSearchParams();
  const q = useQuery(() => api.get<{ data: FullSettings }>('/settings').then((r) => r.data.data), []);
  const [s, setS] = useState<FullSettings>();
  useEffect(() => { if (q.data) setS(q.data); }, [q.data]);
  const tabs = ['company', 'workTime', 'payroll'];
  const tab = tabs.includes(sp.get('tab') ?? '') ? sp.get('tab')! : tabs[0];
  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      {q.error ? <ErrorState onRetry={q.reload} message={apiError(q.error).messageKey} /> : !s ? <LoadingState rows={5} /> : (
        <Tabs value={tab} onValueChange={(v) => setSp(() => new URLSearchParams({ tab: v }), { replace: true })}>
          <TabsList>{tabs.map((k) => <TabsTrigger key={k} value={k}>{t(`settings.tabs.${k}`)}</TabsTrigger>)}</TabsList>
          <TabsContent value="company"><CompanyTab s={s} onSaved={setS} /></TabsContent>
          <TabsContent value="workTime"><WorkTimeTab s={s} onSaved={setS} /></TabsContent>
          <TabsContent value="payroll"><PayrollTab s={s} onSaved={setS} /></TabsContent>
        </Tabs>
      )}
    </>
  );
}
