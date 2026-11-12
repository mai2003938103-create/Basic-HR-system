import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from '@/lib/router';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
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
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { clearSettingsCache } from '../../hooks/useSettings';
import { api, apiError } from '../../lib/api';
import { formatDate, formatMoney } from '../../lib/format';
import type { TaxBracket } from '../../lib/payroll';

interface FullSettings {
  companyNameLo: string; companyNameEn: string; addressLo: string; addressEn: string; taxId: string; phone: string; email: string;
  currencyCode: string; currencySymbol: string; workingDays: number[]; workStart: string; workEnd: string; breakStart: string; breakEnd: string; lateGraceMinutes: number; halfDayMinutes: number;
  payroll: PayrollConfig;
}

/** Payroll rules exactly as the API stores them (company_settings.payroll_config). */
interface PayrollConfig {
  payDay: number; workDaysPerMonth: number; hoursPerDay: number;
  overtime: { weekdayRate: number; restDayRate: number; thresholdMinutes: number; maxMinutesPerMonth: number };
  socialSecurity: { employeeRate: number; employerRate: number; ceiling: number };
  incomeTax: { deductSocialSecurity: boolean; brackets: TaxBracket[] };
  proration: 'workingDays' | 'none';
  confirmedBy: string | null; confirmedAt: string | null;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="mb-6 overflow-hidden">
      <div className="pt-6"><SectionTab>{title}</SectionTab></div>
      <div className="p-6">{children}</div>
    </Card>
  );
}

type TabProps = { s: FullSettings; onSaved: (s: FullSettings) => void; onDirty: (dirty: boolean) => void };

/** One save for the whole tab, kept in view, saying whether anything is unsaved and what Save covers. */
function SaveBar({ dirty, busy, onSave, hint }: { dirty: boolean; busy: boolean; onSave: () => void; hint?: string }) {
  const { t } = useTranslation();
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-t border-border bg-surface-card px-4 py-3 shadow-overlay sm:mx-0 sm:rounded-md sm:border sm:px-6">
      <p role="status" className="mr-auto flex items-center gap-2 text-body-sm text-ink-muted">
        {dirty && <span aria-hidden className="size-2 shrink-0 rounded-full bg-warning" />}
        <span className={dirty ? 'font-medium text-ink' : undefined}>{dirty ? t('common.unsavedChanges') : t('common.noChanges')}</span>
        {hint && <span className="hidden md:inline">· {hint}</span>}
      </p>
      <Button loading={busy} disabled={!dirty} onClick={onSave}>{t('common.save')}</Button>
    </div>
  );
}

/** Reports to the page whether the tab's form differs from what was loaded. */
function useDirty(current: unknown, initial: unknown, onDirty: (d: boolean) => void) {
  const dirty = JSON.stringify(current) !== JSON.stringify(initial);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  return dirty;
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

function CompanyTab({ s, onSaved, onDirty }: TabProps) {
  const { t } = useTranslation();
  const [initial] = useState(() => ({ companyNameLo: s.companyNameLo, companyNameEn: s.companyNameEn, // Optional fields are null in the database until filled in; inputs need ''.
    addressLo: s.addressLo ?? '', addressEn: s.addressEn ?? '', taxId: s.taxId ?? '', phone: s.phone ?? '', email: s.email ?? '', currencyCode: s.currencyCode, currencySymbol: s.currencySymbol }));
  const [f, setF] = useState(initial);
  const dirty = useDirty(f, initial, onDirty);
  const { busy, errors, save } = useSave('/settings/company', onSaved);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <>
    <Section title={t('settings.company')}>
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
    <SaveBar dirty={dirty} busy={busy} onSave={() => save(f)} />
    </>
  );
}

const DAYS = [1, 2, 3, 4, 5, 6, 7];
function WorkTimeTab({ s, onSaved, onDirty }: TabProps) {
  const { t } = useTranslation();
  const [initial] = useState(() => ({ workingDays: s.workingDays, workStart: s.workStart, workEnd: s.workEnd, breakStart: s.breakStart ?? '12:00', breakEnd: s.breakEnd ?? '13:30', lateGraceMinutes: String(s.lateGraceMinutes), halfDayMinutes: String(s.halfDayMinutes) }));
  const [f, setF] = useState(initial);
  const dirty = useDirty(f, initial, onDirty);
  const { busy, errors, save } = useSave('/settings/work-time', onSaved);
  const toggle = (d: number) => setF((x) => ({ ...x, workingDays: x.workingDays.includes(d) ? x.workingDays.filter((y) => y !== d) : [...x.workingDays, d].sort() }));
  return (
    <>
      <Section title={t('settings.workTime')}>
        <fieldset className="mb-6">
          <legend className="mb-2 text-label">{t('settings.workingDays')}</legend>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <label key={d} className="flex cursor-pointer items-center gap-2 rounded-pill border border-border-strong px-4 py-2 text-label has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-tint">
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
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label={t('settings.breakStart')} error={errors.breakStart} hint={t('settings.breakHint')}><Input type="time" value={f.breakStart} onChange={(e) => setF((x) => ({ ...x, breakStart: e.target.value }))} /></FormField>
          <FormField label={t('settings.breakEnd')} error={errors.breakEnd}><Input type="time" value={f.breakEnd} onChange={(e) => setF((x) => ({ ...x, breakEnd: e.target.value }))} /></FormField>
        </div>
      </Section>
      <Section title={t('settings.leaveAndHolidays')}>
        <p className="mb-4 text-body-sm text-ink-muted">{t('settings.leaveAndHolidaysHint')}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link to="/leave?tab=types">{t('leave.types')}<ArrowRight /></Link></Button>
          <Button variant="outline" asChild><Link to="/leave?tab=holidays">{t('leave.holidays')}<ArrowRight /></Link></Button>
        </div>
      </Section>
      <SaveBar dirty={dirty} busy={busy} onSave={() => save(f)} />
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

function PayrollTab({ s, onSaved, onDirty }: TabProps) {
  const { t } = useTranslation();
  const p = s.payroll;
  const [f, setF] = useState({
    payDay: String(p.payDay), workDaysPerMonth: String(p.workDaysPerMonth), weekdayRate: String(p.overtime.weekdayRate), restDayRate: String(p.overtime.restDayRate),
    ssEmployeeRate: String(p.socialSecurity.employeeRate), ssEmployerRate: String(p.socialSecurity.employerRate), ssCeiling: String(p.socialSecurity.ceiling),
  });
  const [initialF] = useState(f);
  const [initialBrackets] = useState(() => p.incomeTax.brackets.map((b) => ({ upTo: b.upTo === null ? '' : String(b.upTo), rate: String(b.rate) })));
  const [brackets, setBrackets] = useState(initialBrackets);
  const dirty = useDirty({ f, brackets }, { f: initialF, brackets: initialBrackets }, onDirty);
  const [sample, setSample] = useState('6000000');
  const { busy, errors, save } = useSave('/settings/payroll', onSaved);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const parsed: TaxBracket[] = useMemo(() => brackets.map((b) => ({ upTo: b.upTo === '' ? null : Number(b.upTo), rate: Number(b.rate) })), [brackets]);
  const cur = { code: s.currencyCode, symbol: s.currencySymbol };
  const gross = Number(sample) || 0;
  const ss = Math.round((Math.min(gross, Number(f.ssCeiling) || 0) * (Number(f.ssEmployeeRate) || 0)) / 100);
  const tax = taxOn(Math.max(0, gross - (p.incomeTax.deductSocialSecurity ? ss : 0)), parsed);
  const [confirming, setConfirming] = useState(false);
  // Fields this page does not edit are sent back unchanged, so saving never resets them.
  const n = (v: string) => Number(v);
  const body = {
    payDay: n(f.payDay), workDaysPerMonth: n(f.workDaysPerMonth), hoursPerDay: p.hoursPerDay, proration: p.proration,
    overtime: { ...p.overtime, weekdayRate: n(f.weekdayRate), restDayRate: n(f.restDayRate) },
    socialSecurity: { employeeRate: n(f.ssEmployeeRate), employerRate: n(f.ssEmployerRate), ceiling: n(f.ssCeiling) },
    incomeTax: { ...p.incomeTax, brackets: parsed },
  };
  const confirmRates = async () => {
    try {
      const r = await api.post<{ data: FullSettings }>('/settings/payroll/confirm');
      clearSettingsCache();
      onSaved(r.data.data);
      toast.success(t('settings.ratesConfirmedToast'));
    } catch (e) {
      toast.error(t(apiError(e).messageKey));
    }
  };

  return (
    <>
      {p.confirmedAt ? (
        <p role="status" className="mb-6 rounded-sm bg-success-tint px-4 py-3 text-body-sm text-success-text">{t('settings.ratesConfirmed', { date: formatDate(p.confirmedAt) })}</p>
      ) : (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-sm bg-warning-tint px-4 py-3">
          <p className="min-w-0 flex-1 basis-80 text-body-sm text-warning-text">{t('settings.payrollWarning')}</p>
          <Button variant="outline" size="sm" disabled={dirty} title={dirty ? t('settings.saveBeforeConfirm') : undefined} onClick={() => setConfirming(true)}>{t('settings.confirmRates')}</Button>
        </div>
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('settings.confirmRatesTitle')}
        description={t('settings.confirmRatesDesc')}
        confirmLabel={t('settings.confirmRates')}
        acknowledge={t('settings.confirmRatesAck')}
        onConfirm={confirmRates}
      />
      <Section title={t('settings.payrollGeneral')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label={t('settings.payDay')} hint={t('settings.payDayHint')}><Input type="number" min={1} max={31} value={f.payDay} onChange={set('payDay')} /></FormField>
          <FormField label={t('settings.workDaysPerMonth')} hint={t('settings.workDaysPerMonthHint')}><Input type="number" min={20} max={31} value={f.workDaysPerMonth} onChange={set('workDaysPerMonth')} /></FormField>
          <FormField label={t('settings.overtimeRate')} hint={t('settings.overtimeRateHint')} error={errors['overtime.weekdayRate']}><Input type="number" min={100} max={1000} step={10} value={f.weekdayRate} onChange={set('weekdayRate')} /></FormField>
          <FormField label={t('settings.overtimeRestRate')} hint={t('settings.overtimeRateHint')} error={errors['overtime.restDayRate']}><Input type="number" min={100} max={1000} step={10} value={f.restDayRate} onChange={set('restDayRate')} /></FormField>
        </div>
      </Section>
      <Section title={t('settings.socialSecurity')}>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label={t('settings.ssEmployee')}><Input type="number" min={0} max={20} step={0.1} value={f.ssEmployeeRate} onChange={set('ssEmployeeRate')} /></FormField>
          <FormField label={t('settings.ssEmployer')}><Input type="number" min={0} max={20} step={0.1} value={f.ssEmployerRate} onChange={set('ssEmployerRate')} /></FormField>
          <FormField label={t('settings.ssCeiling')} hint={t('settings.ssCeilingHint')}><Input type="number" min={0} step={100000} value={f.ssCeiling} onChange={set('ssCeiling')} /></FormField>
        </div>
      </Section>
      <Section title={t('settings.taxBrackets')}>
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
        {errors['incomeTax.brackets'] && <p className="mt-2 text-body-sm text-danger-text">{t(errors['incomeTax.brackets'])}</p>}
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
      <SaveBar dirty={dirty} busy={busy} hint={t('settings.payrollSaveHint')} onSave={() => save(body)} />
    </>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const [sp, setSp] = useSearchParams();
  const q = useQuery(() => api.get<{ data: FullSettings }>('/settings').then((r) => r.data.data), []);
  const [s, setS] = useState<FullSettings>();
  // Bumped on save so the tab remounts with the saved values as its new baseline.
  const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  useEffect(() => { if (q.data) setS(q.data); }, [q.data]);
  useUnsavedChanges(dirty);
  const tabs = ['company', 'workTime', 'payroll'];
  const tab = tabs.includes(sp.get('tab') ?? '') ? sp.get('tab')! : tabs[0];
  const go = (v: string) => { setDirty(false); setSp(() => new URLSearchParams({ tab: v }), { replace: true }); };
  const saved = (next: FullSettings) => { setS(next); setVersion((n) => n + 1); };
  const tabKey = `${tab}-${version}`;
  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      {q.error ? <ErrorState onRetry={q.reload} message={apiError(q.error).messageKey} /> : !s ? <LoadingState rows={5} /> : (
        <Tabs value={tab} onValueChange={(v) => (dirty ? setPendingTab(v) : go(v))}>
          <TabsList>{tabs.map((k) => <TabsTrigger key={k} value={k}>{t(`settings.tabs.${k}`)}</TabsTrigger>)}</TabsList>
          <TabsContent value="company"><CompanyTab key={tabKey} s={s} onSaved={saved} onDirty={setDirty} /></TabsContent>
          <TabsContent value="workTime"><WorkTimeTab key={tabKey} s={s} onSaved={saved} onDirty={setDirty} /></TabsContent>
          <TabsContent value="payroll"><PayrollTab key={tabKey} s={s} onSaved={saved} onDirty={setDirty} /></TabsContent>
        </Tabs>
      )}
      <ConfirmDialog
        open={pendingTab !== null}
        onOpenChange={(o) => !o && setPendingTab(null)}
        title={t('common.unsavedTitle')}
        description={t('common.unsavedDesc')}
        confirmLabel={t('common.discard')}
        tone="danger"
        onConfirm={() => { if (pendingTab) go(pendingTab); }}
      />
    </>
  );
}
