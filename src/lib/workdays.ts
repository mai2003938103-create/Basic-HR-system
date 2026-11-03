const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Client-side preview of working days (the server's count is authoritative). */
export function countWorkingDays(start: string, end: string, workingDays: number[], holidays: Set<string>, halfDay: string): number {
  if (!start || !end || end < start) return 0;
  let n = 0;
  for (let d = new Date(`${start}T00:00:00Z`); iso(d) <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const wd = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
    if (workingDays.includes(wd) && !holidays.has(iso(d))) n++;
  }
  return halfDay !== 'none' && start === end ? n * 0.5 : n;
}
