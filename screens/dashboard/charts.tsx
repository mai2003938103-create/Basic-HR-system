import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, CardTitle } from '../../components/ui/card';

export interface Series {
  key: string;
  label: string;
  color: string; // a CSS var() token
}

const axis = { stroke: 'var(--ink-muted)', fontSize: 12, tickLine: false, axisLine: { stroke: 'var(--border)' } } as const;

function TooltipBox({ active, payload, label, labelFormatter, valueFormat }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; labelFormatter?: (l: string) => string; valueFormat?: (n: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-border bg-surface-card px-3 py-2 text-body-sm text-ink shadow-overlay">
      <p className="mb-1 font-semibold">{labelFormatter ? labelFormatter(String(label)) : label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: p.color }} />
          <span className="text-ink-muted">{p.name}</span>
          <span className="tabular ml-auto pl-3 font-medium">{valueFormat ? valueFormat(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 px-6 text-body-sm text-ink-muted">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

/** Visually hidden table so screen-reader users get the same numbers. */
function DataTableSr<T extends Record<string, unknown>>({ caption, rows, x, series, xFormat }: { caption: string; rows: T[]; x: keyof T; series: Series[]; xFormat?: (v: string) => string }) {
  return (
    // Wrapped: a table cannot shrink to the 1px sr-only box and would widen the page on phones.
    <div className="sr-only"><table>
      <caption>{caption}</caption>
      <thead><tr><th scope="col" />{series.map((s) => <th key={s.key} scope="col">{s.label}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}><th scope="row">{xFormat ? xFormat(String(r[x])) : String(r[x])}</th>{series.map((s) => <td key={s.key}>{String(r[s.key] ?? 0)}</td>)}</tr>
        ))}
      </tbody>
    </table></div>
  );
}

export function ChartCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={cn('relative', className)}>
      <CardHeader><CardTitle className="text-subhead">{title}</CardTitle></CardHeader>
      {children}
    </Card>
  );
}

/** Vertical bars; several series stack with a 2px surface gap between segments. */
export function BarsChart<T extends Record<string, unknown>>({ title, rows, x, series, xFormat, valueFormat, height = 260, className }: { title: string; rows: T[]; x: keyof T & string; series: Series[]; xFormat?: (v: string) => string; valueFormat?: (n: number) => string; height?: number; className?: string }) {
  const stacked = series.length > 1;
  return (
    <ChartCard title={title} className={className}>
      <div className="pt-2"><Legend series={series} /></div>
      <div className="px-2 pb-4 pt-2" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -12 }} barCategoryGap={stacked ? '18%' : '28%'}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis dataKey={x as string} {...axis} tickFormatter={xFormat} interval="preserveStartEnd" minTickGap={16} />
            <YAxis {...axis} allowDecimals={false} width={valueFormat ? 56 : 44} tickFormatter={valueFormat} />
            <Tooltip cursor={{ fill: 'var(--surface-sunken)' }} content={<TooltipBox labelFormatter={xFormat} valueFormat={valueFormat} />} />
            {series.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} stackId={stacked ? 'a' : undefined} fill={s.color} stroke="var(--surface-card)" strokeWidth={stacked ? 1 : 0} radius={!stacked || i === series.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={36} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTableSr caption={title} rows={rows} x={x} series={series} xFormat={xFormat} />
    </ChartCard>
  );
}

/** Ranked horizontal bars with the value written at the end of each bar. */
export function RankedBars({ title, rows, className }: { title: string; rows: { label: string; value: number }[]; className?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ChartCard title={title} className={className}>
      <ul className="flex flex-col gap-3 p-6">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-body-sm">
            <span className="truncate" title={r.label}>{r.label}</span>
            <span className="h-3 rounded-r-[4px] bg-[var(--chart-1)]" style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value ? 4 : 0 }} aria-hidden />
            <span className="tabular text-right font-medium">{r.value}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
