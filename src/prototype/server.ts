// Prototype-only API: answers the same routes as the real backend from the in-browser sample database.
import { addDays, format, subMonths } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { TZ } from '../lib/format';
import { countWorkingDays } from '../lib/workdays';
import { calcLine } from './payroll-calc';
import {
  ALL_PERMISSIONS, getDb, localIso, saveDb, today, uid, weekday,
  type PAtt, type PDB, type PEmp, type PLeave, type PPayItem, type PPayRun, type PUser,
} from './db';

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: { field: string; message: string }[]) { super(message); }
}
const notFound = () => new HttpError(404, 'NOT_FOUND', 'errors.common.notFound');
const forbidden = () => new HttpError(403, 'FORBIDDEN', 'errors.common.forbidden');
const invalid = (field: string, message: string) => new HttpError(422, 'VALIDATION', 'errors.validation.failed', [{ field, message }]);
const conflict = (message: string) => new HttpError(409, 'CONFLICT', message);

export interface Req { method: string; path: string; query: Record<string, string>; body: any; responseType?: string }
export interface Res { status: number; data: unknown; headers?: Record<string, string> }

const SESSION = 'hrms_proto_session';
export const session = {
  get(): string | null { try { return localStorage.getItem(SESSION); } catch { return mem; } },
  set(id: string | null) { mem = id; try { if (id) localStorage.setItem(SESSION, id); else localStorage.removeItem(SESSION); } catch { /* ignore */ } },
};
let mem: string | null = null;
export const files = new Map<string, Blob>();

// ---------- helpers ----------
interface Ctx { db: PDB; user: PUser; perms: Set<string>; scope: 'all' | 'department' | 'self'; emp: PEmp | null }
function ctxFor(db: PDB, user: PUser): Ctx {
  const roles = db.roles.filter((r) => user.roles.includes(r.code));
  const perms = new Set(roles.flatMap((r) => r.permissionCodes));
  const rank = { all: 3, department: 2, self: 1 } as const;
  const scope = roles.reduce<'all' | 'department' | 'self'>((s, r) => (rank[r.scope] > rank[s] ? r.scope : s), 'self');
  return { db, user, perms, scope, emp: db.employees.find((e) => e.id === user.employeeId) ?? null };
}
const need = (c: Ctx, p: string) => { if (!c.perms.has(p)) throw forbidden(); };
const canSee = (c: Ctx, e: PEmp) => c.scope === 'all' || (c.scope === 'department' ? e.departmentId === c.emp?.departmentId : e.id === c.emp?.id);
const scoped = (c: Ctx) => c.db.employees.filter((e) => canSee(c, e));
const norm = (s: string) => s.normalize('NFC').replace(/ໍາ/g, 'ຳ').toLowerCase();
const named = <T extends { nameLo: string; nameEn: string; id: string }>(x: T | undefined) => (x ? { id: x.id, nameLo: x.nameLo, nameEn: x.nameEn } : null);
const brief = (e: PEmp) => ({ id: e.id, employeeCode: e.employeeCode, firstName: e.firstName, lastName: e.lastName, departmentId: e.departmentId });
const isWorkingDay = (db: PDB, d: string) => db.settings.workingDays.includes(weekday(d)) && !db.holidays.some((h) => h.date === d);
const minutesOfDay = (iso: string) => { const [h, m] = formatInTimeZone(iso, TZ, 'HH:mm').split(':').map(Number); return h * 60 + m; };
const hmToMin = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };

function list<T>(rows: T[], q: Record<string, string>, sortKeys: Record<string, (r: T) => string | number | null>) {
  const [field, dir] = (q.sort ?? '').split(':');
  const get = sortKeys[field];
  if (get) rows = [...rows].sort((a, b) => { const x = get(a) ?? ''; const y = get(b) ?? ''; const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y)); return dir === 'desc' ? -r : r; });
  const page = Math.max(1, Number(q.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(q.pageSize ?? 20)));
  return { data: rows.slice((page - 1) * pageSize, page * pageSize), meta: { page, pageSize, total: rows.length } };
}
const searchMatch = (q: Record<string, string>, ...parts: (string | null | undefined)[]) => !q.search || norm(parts.filter(Boolean).join(' ')).includes(norm(q.search.trim()));
const required = (body: any, ...fields: string[]) => { for (const f of fields) if (body?.[f] === undefined || body[f] === null || String(body[f]).trim() === '') throw invalid(f, 'errors.validation.required'); };

// ---------- DTOs ----------
function meDto(c: Ctx) {
  return {
    id: c.user.id, email: c.user.email, mustChangePassword: c.user.mustChangePassword, roles: c.user.roles, permissions: [...c.perms], scope: c.scope,
    employee: c.emp ? { id: c.emp.id, employeeCode: c.emp.employeeCode, firstName: c.emp.firstName, lastName: c.emp.lastName, photoUrl: c.emp.photoUrl, departmentId: c.emp.departmentId } : null,
  };
}
function deptDto(db: PDB, id: string) {
  const d = db.departments.find((x) => x.id === id)!;
  const m = db.employees.find((e) => e.id === d.managerId);
  return { ...d, manager: m ? { id: m.id, firstName: m.firstName, lastName: m.lastName } : null, employeeCount: db.employees.filter((e) => e.departmentId === id && e.employmentStatus !== 'terminated').length };
}
function posDto(db: PDB, id: string) {
  const p = db.positions.find((x) => x.id === id)!;
  return { ...p, department: named(db.departments.find((d) => d.id === p.departmentId)), employeeCount: db.employees.filter((e) => e.positionId === id && e.employmentStatus !== 'terminated').length };
}
function empDto(c: Ctx, e: PEmp) {
  const d = c.db.departments.find((x) => x.id === e.departmentId);
  const p = c.db.positions.find((x) => x.id === e.positionId);
  const u = c.db.users.find((x) => x.employeeId === e.id);
  const showSalary = c.perms.has('employee.update') || c.emp?.id === e.id;
  const { basicSalary, ...rest } = e;
  return {
    ...rest, ...(showSalary ? { basicSalary } : {}),
    department: d ? { ...named(d)!, code: d.code } : null, position: p ? { ...named(p)!, code: p.code } : null,
    user: u ? { id: u.id, email: u.email, isActive: u.isActive, roles: u.roles } : null,
  };
}
function attDto(db: PDB, a: PAtt) {
  const e = db.employees.find((x) => x.id === a.employeeId)!;
  const d = db.departments.find((x) => x.id === e.departmentId);
  return { ...a, employee: brief(e), department: d ? { nameLo: d.nameLo, nameEn: d.nameEn } : undefined };
}
function leaveDto(c: Ctx, l: PLeave) {
  const e = c.db.employees.find((x) => x.id === l.employeeId)!;
  const lt = c.db.leaveTypes.find((x) => x.id === l.leaveTypeId)!;
  const ap = c.db.employees.find((x) => x.id === l.approverId);
  const own = c.emp?.id === e.id;
  return {
    ...l, employee: brief(e), leaveType: { ...named(lt)!, code: lt.code }, approver: ap ? { id: ap.id, firstName: ap.firstName, lastName: ap.lastName } : null,
    canApprove: l.status === 'pending' && !own && c.perms.has('leave.approve') && canSee(c, e),
    canCancel: (l.status === 'pending' && (own || c.perms.has('leave.manage'))) || (l.status === 'approved' && c.perms.has('leave.manage') && l.endDate >= today()),
  };
}
function balanceDto(db: PDB, b: PDB['balances'][number]) {
  const lt = db.leaveTypes.find((x) => x.id === b.leaveTypeId)!;
  return { id: b.id, employeeId: b.employeeId, year: b.year, leaveType: lt, entitledDays: b.entitledDays, usedDays: b.usedDays, remainingDays: b.entitledDays - b.usedDays };
}
function userDto(db: PDB, u: PUser) {
  const e = db.employees.find((x) => x.id === u.employeeId);
  const { password: _p, ...rest } = u;
  return { ...rest, employee: e ? { id: e.id, employeeCode: e.employeeCode, firstName: e.firstName, lastName: e.lastName } : null };
}
const roleDto = (db: PDB, r: PDB['roles'][number]) => ({ ...r, userCount: db.users.filter((u) => u.roles.includes(r.code)).length });

function notify(db: PDB, userIds: (string | undefined)[], type: string, titleKey: string, data: Record<string, string>) {
  for (const id of new Set(userIds.filter(Boolean) as string[])) db.notifications.unshift({ id: uid('ntf'), userId: id, type, titleKey, data, readAt: null, createdAt: new Date().toISOString() });
}
const usersWith = (db: PDB, perm: string) => db.users.filter((u) => u.isActive && db.roles.some((r) => u.roles.includes(r.code) && r.permissionCodes.includes(perm)));

// ---------- payroll ----------
function buildItems(db: PDB, period: string, prev?: PPayItem[]): PPayItem[] {
  const start = `${period}-01`;
  const end = format(addDays(new Date(`${format(subMonths(new Date(`${period}-15T00:00:00Z`), -1), 'yyyy-MM')}-01T00:00:00Z`), -1), 'yyyy-MM-dd');
  return db.employees
    .filter((e) => (e.employmentStatus === 'active' || e.employmentStatus === 'probation') && e.hireDate <= end)
    .map((e) => {
      const old = prev?.find((p) => p.employeeId === e.id);
      const ot = db.attendance.filter((a) => a.employeeId === e.id && a.workDate >= start && a.workDate <= end).reduce((s, a) => s + (a.overtimeMinutes ?? 0), 0);
      const unpaid = db.leaves.filter((l) => l.employeeId === e.id && l.status === 'approved' && l.leaveTypeId === 'lt_unpaid' && l.startDate <= end && l.endDate >= start)
        .reduce((s, l) => s + countWorkingDays(l.startDate < start ? start : l.startDate, l.endDate > end ? end : l.endDate, db.settings.workingDays, new Set(db.holidays.map((h) => h.date)), l.halfDay), 0);
      return { employeeId: e.id, basic: Number(e.basicSalary), allowance: old?.allowance ?? e.allowance, overtimeMinutes: ot, bonus: old?.bonus ?? 0, otherDeduction: old?.otherDeduction ?? 0, unpaidDays: unpaid, note: old?.note ?? null };
    });
}
function runSummary(db: PDB, r: PPayRun) {
  const lines = r.items.map((i) => calcLine(i, db.settings.payroll));
  const sum = (k: keyof ReturnType<typeof calcLine>) => lines.reduce((s, l) => s + (l[k] as number), 0);
  const ap = db.users.find((u) => u.id === r.approvedById);
  return {
    id: r.id, period: r.period, status: r.status, payDate: r.payDate, employeeCount: r.items.length,
    totalGross: sum('gross'), totalNet: sum('net'), totalTax: sum('incomeTax'), totalSsEmployee: sum('ssEmployee'), totalSsEmployer: sum('ssEmployer'), totalEmployerCost: sum('employerCost'),
    createdAt: r.createdAt, submittedAt: r.submittedAt, approvedAt: r.approvedAt, approvedBy: ap ? { email: ap.email } : null, paidAt: r.paidAt,
  };
}
function lineDto(db: PDB, item: PPayItem) {
  const e = db.employees.find((x) => x.id === item.employeeId)!;
  const d = db.departments.find((x) => x.id === e.departmentId);
  const p = db.positions.find((x) => x.id === e.positionId);
  return { employeeId: e.id, employee: { ...brief(e), department: named(d), position: named(p), bankName: e.bankName, bankAccount: e.bankAccount }, item, calc: calcLine(item, db.settings.payroll) };
}
const findRun = (db: PDB, id: string) => { const r = db.payRuns.find((x) => x.id === id); if (!r) throw notFound(); return r; };
const csv = (rows: (string | number)[][]) => new Blob(['﻿' + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });

// ---------- routes ----------
type Handler = (c: Ctx, req: Req, p: Record<string, string>) => unknown;
const routes: { method: string; re: RegExp; keys: string[]; h: Handler; open?: boolean }[] = [];
function on(method: string, pattern: string, h: Handler, open = false) {
  const keys: string[] = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ method, re, keys, h, open });
}

// auth
on('POST', '/auth/login', (_c, req) => {
  const db = getDb();
  const u = db.users.find((x) => x.email.toLowerCase() === String(req.body?.email ?? '').trim().toLowerCase());
  if (!u || u.password !== req.body?.password) throw new HttpError(401, 'INVALID_CREDENTIALS', 'errors.auth.invalidCredentials');
  if (!u.isActive) throw new HttpError(403, 'ACCOUNT_DISABLED', 'errors.auth.accountDisabled');
  u.lastLoginAt = new Date().toISOString();
  session.set(u.id);
  return { data: { accessToken: `proto.${u.id}`, user: meDto(ctxFor(db, u)) } };
}, true);
on('POST', '/auth/refresh', () => {
  const db = getDb();
  const u = db.users.find((x) => x.id === session.get() && x.isActive);
  if (!u) throw new HttpError(401, 'UNAUTHENTICATED', 'errors.auth.sessionExpired');
  return { data: { accessToken: `proto.${u.id}`, user: meDto(ctxFor(db, u)) } };
}, true);
on('POST', '/auth/logout', () => { session.set(null); return { data: { ok: true } }; }, true);
on('POST', '/auth/reset-password', () => ({ data: { ok: true } }), true);
on('GET', '/auth/me', (c) => ({ data: meDto(c) }));
on('PUT', '/auth/password', (c, req) => {
  if (req.body?.currentPassword !== c.user.password) throw invalid('currentPassword', 'errors.auth.wrongPassword');
  c.user.password = req.body.newPassword; c.user.mustChangePassword = false;
  return { data: meDto(c) };
});

// settings
const publicSettings = (db: PDB) => {
  const s = db.settings;
  return { companyNameLo: s.companyNameLo, companyNameEn: s.companyNameEn, logoUrl: s.logoUrl, currencyCode: s.currencyCode, currencySymbol: s.currencySymbol, workingDays: s.workingDays, workStart: s.workStart, workEnd: s.workEnd };
};
on('GET', '/settings/public', () => ({ data: publicSettings(getDb()) }), true);
on('GET', '/settings', (c) => { need(c, 'settings.manage'); return { data: c.db.settings }; });
on('PUT', '/settings/company', (c, req) => {
  need(c, 'settings.manage'); required(req.body, 'companyNameLo', 'companyNameEn');
  const { companyNameLo, companyNameEn, addressLo, addressEn, taxId, phone, email, currencyCode, currencySymbol } = req.body;
  Object.assign(c.db.settings, { companyNameLo, companyNameEn, addressLo, addressEn, taxId, phone, email, currencyCode, currencySymbol });
  return { data: c.db.settings };
});
on('PUT', '/settings/work-time', (c, req) => {
  need(c, 'settings.manage');
  const b = req.body;
  if (!Array.isArray(b.workingDays) || !b.workingDays.length) throw invalid('workingDays', 'errors.validation.required');
  if (hmToMin(b.workEnd) <= hmToMin(b.workStart)) throw invalid('workEnd', 'errors.settings.endBeforeStart');
  Object.assign(c.db.settings, { workingDays: b.workingDays, workStart: b.workStart, workEnd: b.workEnd, lateGraceMinutes: Number(b.lateGraceMinutes), halfDayMinutes: Number(b.halfDayMinutes) });
  return { data: c.db.settings };
});
on('PUT', '/settings/payroll', (c, req) => {
  need(c, 'settings.manage');
  const b = req.body;
  const brackets = (b.taxBrackets ?? []) as { upTo: number | null; rate: number }[];
  for (let i = 1; i < brackets.length; i++) if (brackets[i - 1].upTo === null || (brackets[i].upTo !== null && brackets[i].upTo! <= brackets[i - 1].upTo!)) throw invalid('taxBrackets', 'errors.settings.bracketOrder');
  c.db.settings.payroll = { payDay: Number(b.payDay), workDaysPerMonth: Number(b.workDaysPerMonth), overtimeRate: Number(b.overtimeRate), ssEmployeeRate: Number(b.ssEmployeeRate), ssEmployerRate: Number(b.ssEmployerRate), ssCeiling: Number(b.ssCeiling), taxBrackets: brackets };
  return { data: c.db.settings };
});

// departments
on('GET', '/departments', (c, req) => {
  need(c, 'department.read');
  const q = req.query;
  let rows = c.db.departments.filter((d) => searchMatch(q, d.code, d.nameLo, d.nameEn) && (q.isActive === undefined || String(d.isActive) === q.isActive));
  if (c.scope !== 'all') rows = rows.filter((d) => d.id === c.emp?.departmentId);
  return list(rows.map((d) => deptDto(c.db, d.id)), q, { code: (d) => d.code, nameLo: (d) => d.nameLo, nameEn: (d) => d.nameEn, employeeCount: (d) => d.employeeCount });
});
on('GET', '/departments/:id', (c, _r, p) => { need(c, 'department.read'); if (!c.db.departments.some((d) => d.id === p.id)) throw notFound(); return { data: deptDto(c.db, p.id) }; });
const saveDept = (c: Ctx, body: any, id?: string) => {
  need(c, 'department.manage'); required(body, 'code', 'nameLo', 'nameEn');
  if (c.db.departments.some((d) => d.code.toUpperCase() === String(body.code).toUpperCase() && d.id !== id)) throw new HttpError(409, 'DUPLICATE', 'errors.common.duplicate', [{ field: 'code', message: 'errors.common.duplicate' }]);
  const fields = { code: String(body.code).toUpperCase(), nameLo: body.nameLo, nameEn: body.nameEn, description: body.description ?? null, isActive: body.isActive ?? true, managerId: body.managerId ?? null };
  if (id) Object.assign(c.db.departments.find((d) => d.id === id)!, fields); else c.db.departments.push({ id: (id = uid('dep')), ...fields });
  return { data: deptDto(c.db, id) };
};
on('POST', '/departments', (c, req) => saveDept(c, req.body));
on('PUT', '/departments/:id', (c, req, p) => saveDept(c, req.body, p.id));
on('DELETE', '/departments/:id', (c, _r, p) => {
  need(c, 'department.manage');
  if (c.db.employees.some((e) => e.departmentId === p.id) || c.db.positions.some((x) => x.departmentId === p.id)) throw conflict('errors.department.inUse');
  c.db.departments = c.db.departments.filter((d) => d.id !== p.id);
  return { data: { ok: true } };
});

// positions
on('GET', '/positions', (c, req) => {
  need(c, 'position.read');
  const q = req.query;
  const rows = c.db.positions.filter((x) => searchMatch(q, x.code, x.nameLo, x.nameEn) && (!q.departmentId || x.departmentId === q.departmentId) && (q.isActive === undefined || String(x.isActive) === q.isActive));
  return list(rows.map((x) => posDto(c.db, x.id)), q, { code: (x) => x.code, nameLo: (x) => x.nameLo, nameEn: (x) => x.nameEn, employeeCount: (x) => x.employeeCount });
});
const savePos = (c: Ctx, body: any, id?: string) => {
  need(c, 'position.manage'); required(body, 'code', 'nameLo', 'nameEn', 'departmentId');
  if (c.db.positions.some((x) => x.code.toUpperCase() === String(body.code).toUpperCase() && x.id !== id)) throw new HttpError(409, 'DUPLICATE', 'errors.common.duplicate', [{ field: 'code', message: 'errors.common.duplicate' }]);
  const fields = { code: String(body.code).toUpperCase(), nameLo: body.nameLo, nameEn: body.nameEn, description: body.description ?? null, isActive: body.isActive ?? true, departmentId: body.departmentId };
  if (id) Object.assign(c.db.positions.find((x) => x.id === id)!, fields); else c.db.positions.push({ id: (id = uid('pos')), ...fields });
  return { data: posDto(c.db, id) };
};
on('POST', '/positions', (c, req) => savePos(c, req.body));
on('PUT', '/positions/:id', (c, req, p) => savePos(c, req.body, p.id));
on('DELETE', '/positions/:id', (c, _r, p) => {
  need(c, 'position.manage');
  if (c.db.employees.some((e) => e.positionId === p.id)) throw conflict('errors.position.inUse');
  c.db.positions = c.db.positions.filter((x) => x.id !== p.id);
  return { data: { ok: true } };
});

// employees
on('GET', '/employees', (c, req) => {
  need(c, 'employee.read');
  const q = req.query;
  const rows = scoped(c).filter((e) => searchMatch(q, e.employeeCode, e.firstName, e.lastName, e.email, e.phone) && (!q.departmentId || e.departmentId === q.departmentId) && (!q.status || e.employmentStatus === q.status));
  return list(rows.map((e) => empDto(c, e)), q, { employeeCode: (e) => e.employeeCode, firstName: (e) => e.firstName, lastName: (e) => e.lastName, hireDate: (e) => e.hireDate, employmentStatus: (e) => e.employmentStatus });
});
on('GET', '/employees/me', (c) => { if (!c.emp) throw new HttpError(404, 'NOT_FOUND', 'errors.attendance.noEmployee'); return { data: empDto(c, c.emp) }; });
const findEmp = (c: Ctx, id: string) => { const e = c.db.employees.find((x) => x.id === id); if (!e || !canSee(c, e)) throw notFound(); return e; };
on('GET', '/employees/:id', (c, _r, p) => { need(c, 'employee.read'); return { data: empDto(c, findEmp(c, p.id)) }; });
const saveEmp = (c: Ctx, body: any, id?: string) => {
  need(c, id ? 'employee.update' : 'employee.create');
  required(body, 'employeeCode', 'firstName', 'lastName', 'departmentId', 'positionId', 'hireDate');
  if (c.db.employees.some((e) => e.employeeCode.toUpperCase() === String(body.employeeCode).toUpperCase() && e.id !== id)) throw new HttpError(409, 'DUPLICATE', 'errors.common.duplicate', [{ field: 'employeeCode', message: 'errors.common.duplicate' }]);
  const pos = c.db.positions.find((x) => x.id === body.positionId);
  if (!pos || pos.departmentId !== body.departmentId) throw invalid('positionId', 'errors.employee.positionMismatch');
  const { account, ...fields } = body;
  delete fields.createAccount; delete fields.accountPassword; delete fields.accountRole;
  fields.basicSalary = String(fields.basicSalary ?? 0);
  if (id) Object.assign(findEmp(c, id), fields);
  else {
    id = uid('emp');
    c.db.employees.push({ photoUrl: null, bankName: null, bankAccount: null, allowance: 0, ...fields, id });
    for (const lt of c.db.leaveTypes.filter((x) => x.isActive)) c.db.balances.push({ id: uid('bal'), employeeId: id, year: Number(today().slice(0, 4)), leaveTypeId: lt.id, entitledDays: lt.defaultDaysPerYear, usedDays: 0 });
    if (account) {
      if (c.db.users.some((u) => u.email.toLowerCase() === String(account.email).toLowerCase())) throw new HttpError(409, 'DUPLICATE', 'errors.common.duplicate', [{ field: 'email', message: 'errors.common.duplicate' }]);
      c.db.users.push({ id: uid('usr'), email: account.email, password: account.password, isActive: true, mustChangePassword: true, lastLoginAt: null, employeeId: id, roles: account.roleCodes });
    }
  }
  return { data: empDto(c, c.db.employees.find((e) => e.id === id)!) };
};
on('POST', '/employees', (c, req) => saveEmp(c, req.body));
on('PUT', '/employees/:id', (c, req, p) => saveEmp(c, req.body, p.id));
on('PATCH', '/employees/:id/status', (c, req, p) => {
  need(c, 'employee.update');
  const e = findEmp(c, p.id);
  e.employmentStatus = req.body.status;
  const u = c.db.users.find((x) => x.employeeId === e.id);
  if (u && (e.employmentStatus === 'inactive' || e.employmentStatus === 'terminated')) u.isActive = false;
  return { data: empDto(c, e) };
});
on('POST', '/employees/:id/photo', async (c, req, p) => {
  need(c, 'employee.update');
  const e = findEmp(c, p.id);
  const f = (req.body as FormData).get('photo') as File | null;
  if (!f) throw invalid('photo', 'errors.upload.missing');
  e.photoUrl = await new Promise<string>((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.readAsDataURL(f); });
  return { data: empDto(c, e) };
});

// attendance
on('GET', '/attendance/today', (c) => {
  if (!c.emp) throw new HttpError(404, 'NOT_FOUND', 'errors.attendance.noEmployee');
  const d = today();
  const onLeave = c.db.leaves.some((l) => l.employeeId === c.emp!.id && l.status === 'approved' && l.startDate <= d && l.endDate >= d && l.halfDay === 'none');
  return { data: { date: d, isWorkingDay: isWorkingDay(c.db, d), onLeave, record: (() => { const a = c.db.attendance.find((x) => x.employeeId === c.emp!.id && x.workDate === d); return a ? attDto(c.db, a) : null; })() } };
});
on('POST', '/attendance/check-in', (c) => {
  need(c, 'attendance.check');
  if (!c.emp) throw new HttpError(422, 'NO_EMPLOYEE', 'errors.attendance.noEmployee');
  const d = today();
  if (c.db.attendance.some((x) => x.employeeId === c.emp!.id && x.workDate === d && x.checkInAt)) throw conflict('errors.attendance.alreadyCheckedIn');
  const now = new Date().toISOString();
  const late = Math.max(0, minutesOfDay(now) - hmToMin(c.db.settings.workStart));
  const isLate = late > c.db.settings.lateGraceMinutes;
  const a: PAtt = { id: uid('att'), employeeId: c.emp.id, workDate: d, checkInAt: now, checkOutAt: null, workedMinutes: 0, lateMinutes: isLate ? late : 0, earlyLeaveMinutes: 0, status: isLate ? 'late' : 'present', note: null, overtimeMinutes: 0 };
  c.db.attendance = c.db.attendance.filter((x) => !(x.employeeId === c.emp!.id && x.workDate === d));
  c.db.attendance.push(a);
  return { data: attDto(c.db, a) };
});
const finishTimes = (db: PDB, a: PAtt) => {
  if (!a.checkInAt || !a.checkOutAt) return;
  const inM = minutesOfDay(a.checkInAt); const outM = minutesOfDay(a.checkOutAt);
  const s = db.settings;
  const span = outM - inM;
  a.workedMinutes = Math.max(0, span > 300 ? span - 60 : span);
  a.earlyLeaveMinutes = Math.max(0, hmToMin(s.workEnd) - outM);
  a.overtimeMinutes = Math.max(0, outM - hmToMin(s.workEnd) - 30);
  const late = Math.max(0, inM - hmToMin(s.workStart));
  a.lateMinutes = late > s.lateGraceMinutes ? late : 0;
  a.status = a.workedMinutes < s.halfDayMinutes + 60 && a.earlyLeaveMinutes > 120 ? 'half_day' : a.lateMinutes ? 'late' : 'present';
};
on('POST', '/attendance/check-out', (c) => {
  need(c, 'attendance.check');
  const a = c.db.attendance.find((x) => x.employeeId === c.emp?.id && x.workDate === today());
  if (!a?.checkInAt) throw conflict('errors.attendance.notCheckedIn');
  if (a.checkOutAt) throw conflict('errors.attendance.alreadyCheckedOut');
  a.checkOutAt = new Date().toISOString();
  finishTimes(c.db, a);
  return { data: attDto(c.db, a) };
});
const attRows = (c: Ctx, q: Record<string, string>) => {
  const ids = new Set(scoped(c).filter((e) => !q.departmentId || e.departmentId === q.departmentId).map((e) => e.id));
  return c.db.attendance.filter((a) => ids.has(a.employeeId) && (!q.from || a.workDate >= q.from) && (!q.to || a.workDate <= q.to) && (!q.status || a.status === q.status) && (!q.employeeId || a.employeeId === q.employeeId));
};
on('GET', '/attendance', (c, req) => {
  need(c, 'attendance.read');
  return list(attRows(c, req.query).map((a) => attDto(c.db, a)), req.query, { workDate: (a) => a.workDate, checkInAt: (a) => a.checkInAt, workedMinutes: (a) => a.workedMinutes, lateMinutes: (a) => a.lateMinutes });
});
on('GET', '/attendance/export', (c, req) => {
  need(c, 'attendance.read');
  const lo = req.query.lang !== 'en';
  const t = (x: string | null) => (x ? formatInTimeZone(x, TZ, 'HH:mm') : '');
  const rows = attRows(c, req.query).sort((a, b) => b.workDate.localeCompare(a.workDate)).map((a) => { const e = c.db.employees.find((x) => x.id === a.employeeId)!; return [a.workDate, e.employeeCode, `${e.firstName} ${e.lastName}`, t(a.checkInAt), t(a.checkOutAt), a.workedMinutes, a.lateMinutes, a.status]; });
  return csv([lo ? ['ວັນທີ', 'ລະຫັດ', 'ຊື່', 'ເຂົ້າ', 'ອອກ', 'ນາທີເຮັດວຽກ', 'ນາທີມາຊ້າ', 'ສະຖານະ'] : ['Date', 'Code', 'Name', 'In', 'Out', 'Worked min', 'Late min', 'Status'], ...rows]);
});
on('PUT', '/attendance/:id', (c, req, p) => {
  need(c, 'attendance.manage');
  const a = c.db.attendance.find((x) => x.id === p.id);
  if (!a) throw notFound();
  if (!String(req.body?.note ?? '').trim()) throw invalid('note', 'errors.attendance.noteRequired');
  if (req.body.checkInAt && req.body.checkOutAt && req.body.checkOutAt <= req.body.checkInAt) throw invalid('checkOutAt', 'errors.attendance.invalidTimes');
  Object.assign(a, { checkInAt: req.body.checkInAt, checkOutAt: req.body.checkOutAt, note: req.body.note });
  if (a.checkInAt && a.checkOutAt) finishTimes(c.db, a); else if (!a.checkInAt) Object.assign(a, { status: 'absent', workedMinutes: 0, lateMinutes: 0 });
  return { data: attDto(c.db, a) };
});

// leave types, holidays, balances
on('GET', '/leave-types', (c) => ({ data: c.db.leaveTypes }));
const saveLt = (c: Ctx, b: any, id?: string) => {
  need(c, 'leave.manage'); required(b, 'code', 'nameLo', 'nameEn');
  const fields = { code: String(b.code).toUpperCase(), nameLo: b.nameLo, nameEn: b.nameEn, defaultDaysPerYear: Number(b.defaultDaysPerYear), isPaid: !!b.isPaid, documentRequiredAfterDays: b.documentRequiredAfterDays, isActive: b.isActive ?? true };
  if (id) Object.assign(c.db.leaveTypes.find((x) => x.id === id)!, fields); else c.db.leaveTypes.push({ id: (id = uid('lt')), ...fields });
  return { data: c.db.leaveTypes.find((x) => x.id === id) };
};
on('POST', '/leave-types', (c, req) => saveLt(c, req.body));
on('PUT', '/leave-types/:id', (c, req, p) => saveLt(c, req.body, p.id));
on('GET', '/holidays', (c, req) => ({ data: c.db.holidays.filter((h) => !req.query.year || h.date.startsWith(req.query.year)).sort((a, b) => a.date.localeCompare(b.date)) }));
on('POST', '/holidays', (c, req) => {
  need(c, 'leave.manage'); required(req.body, 'date', 'nameLo', 'nameEn');
  if (c.db.holidays.some((h) => h.date === req.body.date)) throw new HttpError(409, 'DUPLICATE', 'errors.common.duplicate', [{ field: 'date', message: 'errors.common.duplicate' }]);
  const h = { id: uid('hol'), date: req.body.date, nameLo: req.body.nameLo, nameEn: req.body.nameEn };
  c.db.holidays.push(h);
  return { data: h };
});
on('DELETE', '/holidays/:id', (c, _r, p) => { need(c, 'leave.manage'); c.db.holidays = c.db.holidays.filter((h) => h.id !== p.id); return { data: { ok: true } }; });
on('GET', '/leave-balances', (c, req) => {
  const empId = req.query.employeeId ?? c.emp?.id;
  if (!empId) return { data: [] };
  if (empId !== c.emp?.id) findEmp(c, empId);
  const year = Number(req.query.year ?? today().slice(0, 4));
  return { data: c.db.balances.filter((b) => b.employeeId === empId && b.year === year).map((b) => balanceDto(c.db, b)) };
});
on('PUT', '/leave-balances/:id', (c, req, p) => {
  need(c, 'leave.manage');
  const b = c.db.balances.find((x) => x.id === p.id);
  if (!b) throw notFound();
  b.entitledDays = Number(req.body.entitledDays);
  return { data: balanceDto(c.db, b) };
});

// leave requests
on('GET', '/leave-requests', (c, req) => {
  need(c, 'leave.read');
  const q = req.query;
  let rows = c.db.leaves;
  if (q.mine === 'true') rows = rows.filter((l) => l.employeeId === c.emp?.id);
  else {
    const ids = new Set(scoped(c).map((e) => e.id));
    rows = rows.filter((l) => ids.has(l.employeeId));
    if (q.toApprove === 'true') rows = rows.filter((l) => l.status === 'pending' && l.employeeId !== c.emp?.id);
  }
  if (q.status) rows = rows.filter((l) => l.status === q.status);
  rows = rows.filter((l) => { const e = c.db.employees.find((x) => x.id === l.employeeId)!; return searchMatch(q, e.employeeCode, e.firstName, e.lastName); });
  return list(rows.map((l) => leaveDto(c, l)), q, { createdAt: (l) => l.createdAt, startDate: (l) => l.startDate, days: (l) => l.days, status: (l) => l.status });
});
on('POST', '/leave-requests', (c, req) => {
  need(c, 'leave.request');
  if (!c.emp) throw new HttpError(422, 'NO_EMPLOYEE', 'errors.attendance.noEmployee');
  const fd = req.body as FormData;
  const b = { leaveTypeId: String(fd.get('leaveTypeId') ?? ''), startDate: String(fd.get('startDate') ?? ''), endDate: String(fd.get('endDate') ?? ''), halfDay: String(fd.get('halfDay') ?? 'none') as PLeave['halfDay'], reason: String(fd.get('reason') ?? '') };
  required(b, 'leaveTypeId', 'startDate', 'endDate', 'reason');
  if (b.endDate < b.startDate) throw invalid('endDate', 'errors.leave.invalidRange');
  const days = countWorkingDays(b.startDate, b.endDate, c.db.settings.workingDays, new Set(c.db.holidays.map((h) => h.date)), b.halfDay);
  if (!days) throw invalid('endDate', 'errors.leave.zeroDays');
  const lt = c.db.leaveTypes.find((x) => x.id === b.leaveTypeId)!;
  const file = fd.get('document') as File | null;
  if (lt.documentRequiredAfterDays !== null && days > lt.documentRequiredAfterDays && !file) throw invalid('document', 'errors.leave.documentRequired');
  if (c.db.leaves.some((l) => l.employeeId === c.emp!.id && (l.status === 'pending' || l.status === 'approved') && l.startDate <= b.endDate && l.endDate >= b.startDate)) throw conflict('errors.leave.overlap');
  const bal = c.db.balances.find((x) => x.employeeId === c.emp!.id && x.leaveTypeId === lt.id && x.year === Number(b.startDate.slice(0, 4)));
  if (bal && bal.entitledDays - bal.usedDays < days) throw conflict('errors.leave.insufficientBalance');
  let documentUrl: string | null = null;
  if (file) { const fid = uid('doc'); files.set(fid, file); documentUrl = `/api/files/leave/${fid}`; }
  const l: PLeave = { id: uid('lv'), employeeId: c.emp.id, ...b, days, documentUrl, status: 'pending', approverId: null, decidedAt: null, decisionNote: null, createdAt: new Date().toISOString() };
  c.db.leaves.unshift(l);
  const mgr = c.db.departments.find((d) => d.id === c.emp!.departmentId)?.managerId;
  const approvers = usersWith(c.db, 'leave.approve').filter((u) => u.id !== c.user.id && (u.employeeId === mgr || ctxFor(c.db, u).scope === 'all'));
  notify(c.db, approvers.map((u) => u.id), 'leave.requested', 'notifications.leaveRequested', { employeeName: `${c.emp.firstName} ${c.emp.lastName}`, startDate: l.startDate, endDate: l.endDate, leaveRequestId: l.id });
  return { data: leaveDto(c, l) };
});
on('PUT', '/leave-requests/:id/:action', (c, req, p) => {
  const l = c.db.leaves.find((x) => x.id === p.id);
  if (!l) throw notFound();
  const dto = leaveDto(c, l);
  const bal = c.db.balances.find((x) => x.employeeId === l.employeeId && x.leaveTypeId === l.leaveTypeId && x.year === Number(l.startDate.slice(0, 4)));
  const owner = c.db.users.find((u) => u.employeeId === l.employeeId);
  const data = { startDate: l.startDate, endDate: l.endDate, leaveRequestId: l.id };
  if (p.action === 'approve' || p.action === 'reject') {
    if (!dto.canApprove) throw l.status !== 'pending' ? conflict('errors.leave.notPending') : forbidden();
    Object.assign(l, { status: p.action === 'approve' ? 'approved' : 'rejected', approverId: c.emp?.id ?? null, decidedAt: new Date().toISOString(), decisionNote: req.body?.note || null });
    if (p.action === 'approve' && bal) bal.usedDays += l.days;
    notify(c.db, [owner?.id], p.action === 'approve' ? 'leave.approved' : 'leave.rejected', p.action === 'approve' ? 'notifications.leaveApproved' : 'notifications.leaveRejected', data);
  } else if (p.action === 'cancel') {
    if (!dto.canCancel) throw forbidden();
    if (l.status === 'approved' && bal) bal.usedDays -= l.days;
    l.status = 'cancelled';
  } else throw notFound();
  return { data: leaveDto(c, l) };
});
on('GET', '/files/leave/:id', (_c, _r, p) => { const f = files.get(p.id); if (!f) throw notFound(); return f; });

// users and roles
on('GET', '/users', (c, req) => {
  need(c, 'user.read');
  const q = req.query;
  const rows = c.db.users.filter((u) => { const e = c.db.employees.find((x) => x.id === u.employeeId); return searchMatch(q, u.email, e?.firstName, e?.lastName, e?.employeeCode) && (q.isActive === undefined || String(u.isActive) === q.isActive) && (!q.role || u.roles.includes(q.role)); });
  return list(rows.map((u) => userDto(c.db, u)), q, { email: (u) => u.email, lastLoginAt: (u) => u.lastLoginAt });
});
const saveUser = (c: Ctx, b: any, id?: string) => {
  need(c, 'user.manage');
  if (c.db.users.some((u) => u.email.toLowerCase() === String(b.email).toLowerCase() && u.id !== id)) throw new HttpError(409, 'DUPLICATE', 'errors.common.duplicate', [{ field: 'email', message: 'errors.common.duplicate' }]);
  if (b.employeeId && c.db.users.some((u) => u.employeeId === b.employeeId && u.id !== id)) throw invalid('employeeId', 'errors.user.employeeHasAccount');
  if (id) Object.assign(c.db.users.find((u) => u.id === id)!, { email: b.email, roles: b.roleCodes, employeeId: b.employeeId });
  else c.db.users.push({ id: (id = uid('usr')), email: b.email, password: b.password, isActive: true, mustChangePassword: true, lastLoginAt: null, employeeId: b.employeeId, roles: b.roleCodes });
  return { data: userDto(c.db, c.db.users.find((u) => u.id === id)!) };
};
on('POST', '/users', (c, req) => saveUser(c, req.body));
on('PUT', '/users/:id', (c, req, p) => saveUser(c, req.body, p.id));
on('PATCH', '/users/:id/status', (c, req, p) => {
  need(c, 'user.manage');
  if (p.id === c.user.id) throw conflict('errors.user.cannotDeactivateSelf');
  const u = c.db.users.find((x) => x.id === p.id); if (!u) throw notFound();
  u.isActive = !!req.body.isActive;
  return { data: userDto(c.db, u) };
});
on('POST', '/users/:id/reset-link', (c) => { need(c, 'user.manage'); return { data: { url: `${location.origin}${location.pathname}#/reset-password?token=prototype-sample-token`, expiresAt: new Date(Date.now() + 86400000).toISOString() } }; });
on('GET', '/roles', (c) => { need(c, 'role.manage'); return { data: c.db.roles.map((r) => roleDto(c.db, r)) }; });
on('GET', '/roles/assignable', (c) => { need(c, 'user.manage'); return { data: c.db.roles.filter((r) => r.code !== 'super_admin' || c.user.roles.includes('super_admin')).map((r) => ({ code: r.code, nameLo: r.nameLo, nameEn: r.nameEn })) }; });
on('GET', '/permissions', (c) => { need(c, 'role.manage'); return { data: ALL_PERMISSIONS }; });
const saveRole = (c: Ctx, b: any, id?: string) => {
  need(c, 'role.manage'); required(b, 'code', 'nameLo', 'nameEn');
  const existing = c.db.roles.find((r) => r.id === id);
  if (existing?.code === 'super_admin') throw conflict('errors.role.superAdminLocked');
  const fields = { code: b.code, nameLo: b.nameLo, nameEn: b.nameEn, scope: b.scope, permissionCodes: b.permissionCodes ?? [] };
  if (existing) Object.assign(existing, fields); else c.db.roles.push({ id: (id = uid('role')), isSystem: false, ...fields });
  return { data: roleDto(c.db, c.db.roles.find((r) => r.id === id)!) };
};
on('POST', '/roles', (c, req) => saveRole(c, req.body));
on('PUT', '/roles/:id', (c, req, p) => saveRole(c, req.body, p.id));

// notifications
on('GET', '/notifications', (c, req) => {
  const rows = c.db.notifications.filter((n) => n.userId === c.user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { ...list(rows, req.query, {}), unread: rows.filter((n) => !n.readAt).length };
});
on('PUT', '/notifications/read-all', (c) => { for (const n of c.db.notifications) if (n.userId === c.user.id && !n.readAt) n.readAt = new Date().toISOString(); return { data: { ok: true } }; });
on('PUT', '/notifications/:id/read', (c, _r, p) => { const n = c.db.notifications.find((x) => x.id === p.id && x.userId === c.user.id); if (n) n.readAt = new Date().toISOString(); return { data: n }; });

// dashboard
on('GET', '/dashboard/summary', (c) => {
  need(c, 'dashboard.view');
  const emps = scoped(c);
  const ids = new Set(emps.map((e) => e.id));
  const d = today();
  const att = c.db.attendance.filter((a) => a.workDate === d && ids.has(a.employeeId));
  const working = emps.filter((e) => e.employmentStatus === 'active' || e.employmentStatus === 'probation');
  const onLeave = c.db.leaves.filter((l) => ids.has(l.employeeId) && l.status === 'approved' && l.startDate <= d && l.endDate >= d).length;
  const present = att.filter((a) => a.checkInAt).length;
  return { data: {
    totalEmployees: emps.filter((e) => e.employmentStatus !== 'terminated').length, activeEmployees: working.length, inactiveEmployees: emps.filter((e) => e.employmentStatus === 'inactive').length,
    departments: c.scope === 'all' ? c.db.departments.filter((x) => x.isActive).length : 1, presentToday: present,
    absentToday: Math.max(0, working.length - present - onLeave), onLeaveToday: onLeave,
    pendingLeave: c.db.leaves.filter((l) => ids.has(l.employeeId) && l.status === 'pending' && l.employeeId !== c.emp?.id).length,
  } };
});
on('GET', '/dashboard/charts', (c) => {
  need(c, 'dashboard.view');
  const emps = scoped(c);
  const ids = new Set(emps.map((e) => e.id));
  const statuses = ['active', 'probation', 'inactive', 'terminated'] as const;
  const days: { date: string; present: number; late: number; half_day: number; absent: number; leave: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const dt = format(addDays(new Date(`${today()}T00:00:00Z`), -i), 'yyyy-MM-dd');
    if (!isWorkingDay(c.db, dt)) continue;
    const row = { date: dt, present: 0, late: 0, half_day: 0, absent: 0, leave: 0 };
    for (const a of c.db.attendance) if (a.workDate === dt && ids.has(a.employeeId)) row[a.status]++;
    days.push(row);
  }
  const months: { month: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) { const m = format(subMonths(new Date(`${today()}T00:00:00Z`), i), 'yyyy-MM'); months.push({ month: m, count: emps.filter((e) => e.hireDate.startsWith(m)).length }); }
  return { data: {
    byStatus: statuses.map((s) => ({ status: s, count: emps.filter((e) => e.employmentStatus === s).length })).filter((x) => x.count),
    attendance30d: days,
    byDepartment: c.db.departments.map((d) => ({ departmentId: d.id, nameLo: d.nameLo, nameEn: d.nameEn, count: emps.filter((e) => e.departmentId === d.id && e.employmentStatus !== 'terminated').length })).filter((x) => x.count).sort((a, b) => b.count - a.count),
    hiresByMonth: months,
  } };
});

// payroll (Stage 2 design-first contract)
const payPerm = (c: Ctx) => { if (!c.perms.has('payroll.read') && !c.perms.has('payroll.manage') && !c.perms.has('payroll.approve')) throw forbidden(); };
on('GET', '/payroll/runs', (c, req) => {
  payPerm(c);
  return { data: c.db.payRuns.filter((r) => !req.query.year || r.period.startsWith(req.query.year)).sort((a, b) => b.period.localeCompare(a.period)).map((r) => runSummary(c.db, r)) };
});
on('POST', '/payroll/runs', (c, req) => {
  need(c, 'payroll.manage');
  const period = String(req.body?.period ?? '');
  if (!/^\d{4}-\d{2}$/.test(period)) throw invalid('period', 'errors.validation.required');
  if (c.db.payRuns.some((r) => r.period === period)) throw new HttpError(409, 'DUPLICATE', 'errors.payroll.periodExists', [{ field: 'period', message: 'errors.payroll.periodExists' }]);
  const r: PPayRun = { id: `pay_${period}`, period, status: 'draft', payDate: `${period}-${String(c.db.settings.payroll.payDay).padStart(2, '0')}`, createdAt: new Date().toISOString(), submittedAt: null, approvedAt: null, approvedById: null, paidAt: null, items: buildItems(c.db, period) };
  c.db.payRuns.push(r);
  return { data: runSummary(c.db, r) };
});
on('GET', '/payroll/runs/:id', (c, _r, p) => {
  payPerm(c);
  const r = findRun(c.db, p.id);
  return { data: {
    ...runSummary(c.db, r), lines: r.items.map((i) => lineDto(c.db, i)),
    canEdit: r.status === 'draft' && c.perms.has('payroll.manage'), canSubmit: r.status === 'draft' && c.perms.has('payroll.manage'),
    canApprove: r.status === 'pending' && c.perms.has('payroll.approve'), canPay: r.status === 'approved' && c.perms.has('payroll.manage'),
  } };
});
on('PUT', '/payroll/runs/:id/items/:employeeId', (c, req, p) => {
  need(c, 'payroll.manage');
  const r = findRun(c.db, p.id);
  if (r.status !== 'draft') throw conflict('errors.payroll.notDraft');
  const it = r.items.find((x) => x.employeeId === p.employeeId); if (!it) throw notFound();
  for (const k of ['allowance', 'bonus', 'otherDeduction', 'overtimeMinutes', 'unpaidDays'] as const) if (req.body[k] !== undefined) { const v = Number(req.body[k]); if (!(v >= 0)) throw invalid(k, 'errors.validation.money'); it[k] = v; }
  it.note = req.body.note || null;
  return { data: lineDto(c.db, it) };
});
on('POST', '/payroll/runs/:id/recalculate', (c, _r, p) => {
  need(c, 'payroll.manage');
  const r = findRun(c.db, p.id);
  if (r.status !== 'draft') throw conflict('errors.payroll.notDraft');
  r.items = buildItems(c.db, r.period, r.items);
  return { data: runSummary(c.db, r) };
});
on('PUT', '/payroll/runs/:id/:action', (c, req, p) => {
  const r = findRun(c.db, p.id);
  const now = new Date().toISOString();
  const managers = usersWith(c.db, 'payroll.manage').map((u) => u.id);
  if (p.action === 'submit') { need(c, 'payroll.manage'); if (r.status !== 'draft') throw conflict('errors.payroll.notDraft'); Object.assign(r, { status: 'pending', submittedAt: now }); notify(c.db, usersWith(c.db, 'payroll.approve').map((u) => u.id), 'payroll.submitted', 'notifications.payrollSubmitted', { period: r.period, payRunId: r.id }); }
  else if (p.action === 'approve') { need(c, 'payroll.approve'); if (r.status !== 'pending') throw conflict('errors.payroll.notPending'); Object.assign(r, { status: 'approved', approvedAt: now, approvedById: c.user.id }); notify(c.db, managers, 'payroll.approved', 'notifications.payrollApproved', { period: r.period, payRunId: r.id }); }
  else if (p.action === 'reject') { need(c, 'payroll.approve'); if (r.status !== 'pending') throw conflict('errors.payroll.notPending'); Object.assign(r, { status: 'draft', submittedAt: null }); notify(c.db, managers, 'payroll.returned', 'notifications.payrollReturned', { period: r.period, payRunId: r.id, note: String(req.body?.note ?? '') }); }
  else if (p.action === 'pay') {
    need(c, 'payroll.manage'); if (r.status !== 'approved') throw conflict('errors.payroll.notApproved');
    Object.assign(r, { status: 'paid', paidAt: now });
    notify(c.db, r.items.map((i) => c.db.users.find((u) => u.employeeId === i.employeeId)?.id), 'payslip.ready', 'notifications.payslipReady', { period: r.period, payRunId: r.id });
  } else throw notFound();
  return { data: runSummary(c.db, r) };
});
on('DELETE', '/payroll/runs/:id', (c, _r, p) => {
  need(c, 'payroll.manage');
  const r = findRun(c.db, p.id);
  if (r.status !== 'draft') throw conflict('errors.payroll.notDraft');
  c.db.payRuns = c.db.payRuns.filter((x) => x.id !== r.id);
  return { data: { ok: true } };
});
on('GET', '/payroll/runs/:id/export', (c, req, p) => {
  payPerm(c);
  const r = findRun(c.db, p.id);
  const lo = req.query.lang !== 'en';
  return csv([
    lo ? ['ລະຫັດ', 'ຊື່', 'ທະນາຄານ', 'ເລກບັນຊີ', 'ເງິນເດືອນລວມ', 'ປະກັນສັງຄົມ', 'ອາກອນ', 'ຫັກອື່ນໆ', 'ຮັບສຸດທິ'] : ['Code', 'Name', 'Bank', 'Account', 'Gross', 'Social security', 'Income tax', 'Other deductions', 'Net pay'],
    ...r.items.map((i) => { const e = c.db.employees.find((x) => x.id === i.employeeId)!; const l = calcLine(i, c.db.settings.payroll); return [e.employeeCode, `${e.firstName} ${e.lastName}`, e.bankName ?? '', e.bankAccount ?? '', l.gross, l.ssEmployee, l.incomeTax, l.otherDeduction, l.net]; }),
  ]);
});
on('GET', '/payslips', (c, req) => {
  const empId = req.query.employeeId ?? c.emp?.id;
  if (!empId) return { data: [] };
  if (empId === c.emp?.id) need(c, 'payslip.self'); else { payPerm(c); findEmp(c, empId); }
  return { data: c.db.payRuns.filter((r) => r.status === 'paid' && r.items.some((i) => i.employeeId === empId)).sort((a, b) => b.period.localeCompare(a.period))
    .map((r) => { const l = calcLine(r.items.find((i) => i.employeeId === empId)!, c.db.settings.payroll); return { payRunId: r.id, employeeId: empId, period: r.period, payDate: r.payDate, paidAt: r.paidAt, gross: l.gross, totalDeductions: l.totalDeductions, net: l.net }; }) };
});
on('GET', '/payslips/:runId/:employeeId', (c, _r, p) => {
  const r = findRun(c.db, p.runId);
  if (p.employeeId === c.emp?.id) { need(c, 'payslip.self'); if (r.status !== 'paid') throw notFound(); } else { payPerm(c); findEmp(c, p.employeeId); }
  const it = r.items.find((i) => i.employeeId === p.employeeId); if (!it) throw notFound();
  const s = c.db.settings;
  return { data: { period: r.period, payDate: r.payDate, status: r.status, company: { nameLo: s.companyNameLo, nameEn: s.companyNameEn, addressLo: s.addressLo, addressEn: s.addressEn, taxId: s.taxId }, rates: s.payroll, ...lineDto(c.db, it) } };
});

// reports (Stage 2 design-first contract)
on('GET', '/reports/headcount', (c) => {
  need(c, 'report.view');
  const emps = scoped(c).filter((e) => e.employmentStatus !== 'terminated');
  const now = today();
  const years = (d: string) => (new Date(`${now}T00:00:00Z`).getTime() - new Date(`${d}T00:00:00Z`).getTime()) / (365.25 * 86400000);
  const months: { month: string; hires: number; exits: number }[] = [];
  for (let i = 11; i >= 0; i--) { const m = format(subMonths(new Date(`${now}T00:00:00Z`), i), 'yyyy-MM'); months.push({ month: m, hires: scoped(c).filter((e) => e.hireDate.startsWith(m)).length, exits: i === 2 ? 1 : i === 7 ? 1 : 0 }); }
  return { data: {
    total: emps.length,
    byDepartment: c.db.departments.map((d) => { const es = emps.filter((e) => e.departmentId === d.id); return { departmentId: d.id, nameLo: d.nameLo, nameEn: d.nameEn, active: es.filter((e) => e.employmentStatus === 'active').length, probation: es.filter((e) => e.employmentStatus === 'probation').length, inactive: es.filter((e) => e.employmentStatus === 'inactive').length, male: es.filter((e) => e.gender === 'male').length, female: es.filter((e) => e.gender === 'female').length, total: es.length }; }).filter((x) => x.total),
    byGender: (['male', 'female', 'other'] as const).map((g) => ({ gender: g, count: emps.filter((e) => e.gender === g).length })).filter((x) => x.count),
    byTenure: [['lt1', 0, 1], ['1to3', 1, 3], ['3to5', 3, 5], ['gt5', 5, 99]].map(([k, a, b]) => ({ bucket: k as string, count: emps.filter((e) => years(e.hireDate) >= (a as number) && years(e.hireDate) < (b as number)).length })),
    movement: months,
  } };
});
on('GET', '/reports/attendance', (c, req) => {
  need(c, 'report.view');
  const month = req.query.month ?? today().slice(0, 7);
  const emps = scoped(c).filter((e) => (e.employmentStatus === 'active' || e.employmentStatus === 'probation') && (!req.query.departmentId || e.departmentId === req.query.departmentId));
  let workDays = 0;
  for (let d = new Date(`${month}-01T00:00:00Z`); format(d, 'yyyy-MM') === month && format(d, 'yyyy-MM-dd') < today(); d = addDays(d, 1)) if (isWorkingDay(c.db, format(d, 'yyyy-MM-dd'))) workDays++;
  const rows = emps.map((e) => {
    const att = c.db.attendance.filter((a) => a.employeeId === e.id && a.workDate.startsWith(month) && a.workDate < today()); // today is still in progress
    const cnt = (s: PAtt['status']) => att.filter((a) => a.status === s).length;
    const present = cnt('present') + cnt('late') + cnt('half_day');
    const d = c.db.departments.find((x) => x.id === e.departmentId);
    return { id: e.id, employee: brief(e), department: named(d), workDays, present: cnt('present'), late: cnt('late'), halfDay: cnt('half_day'), absent: cnt('absent'), leave: cnt('leave'), lateMinutes: att.reduce((s, a) => s + a.lateMinutes, 0), overtimeHours: att.reduce((s, a) => s + (a.overtimeMinutes ?? 0), 0) / 60, rate: workDays ? Math.round((present / workDays) * 1000) / 10 : 0 };
  });
  return { data: { month, workDays, rows } };
});
on('GET', '/reports/leave', (c, req) => {
  need(c, 'report.view');
  const year = Number(req.query.year ?? today().slice(0, 4));
  const emps = scoped(c).filter((e) => e.employmentStatus !== 'terminated' && (!req.query.departmentId || e.departmentId === req.query.departmentId));
  const ids = new Set(emps.map((e) => e.id));
  const approved = c.db.leaves.filter((l) => ids.has(l.employeeId) && l.status === 'approved' && l.startDate.startsWith(String(year)));
  return { data: {
    year,
    byType: c.db.leaveTypes.map((lt) => ({ leaveTypeId: lt.id, nameLo: lt.nameLo, nameEn: lt.nameEn, days: approved.filter((l) => l.leaveTypeId === lt.id).reduce((s, l) => s + l.days, 0), requests: approved.filter((l) => l.leaveTypeId === lt.id).length })),
    byMonth: Array.from({ length: 12 }, (_, i) => { const m = `${year}-${String(i + 1).padStart(2, '0')}`; return { month: m, days: approved.filter((l) => l.startDate.startsWith(m)).reduce((s, l) => s + l.days, 0) }; }),
    rows: emps.map((e) => ({ id: e.id, employee: brief(e), department: named(c.db.departments.find((d) => d.id === e.departmentId)), balances: c.db.balances.filter((b) => b.employeeId === e.id && b.year === year).map((b) => ({ code: c.db.leaveTypes.find((x) => x.id === b.leaveTypeId)!.code, entitled: b.entitledDays, used: b.usedDays })) })),
  } };
});
on('GET', '/reports/payroll', (c, req) => {
  need(c, 'report.view'); payPerm(c);
  const year = req.query.year ?? today().slice(0, 4);
  const runs = c.db.payRuns.filter((r) => r.period.startsWith(year) && r.status !== 'draft').sort((a, b) => a.period.localeCompare(b.period));
  const latest = runs[runs.length - 1];
  return { data: {
    year: Number(year),
    byMonth: runs.map((r) => ({ ...runSummary(c.db, r) })),
    byDepartment: latest ? c.db.departments.map((d) => { const items = latest.items.filter((i) => c.db.employees.find((e) => e.id === i.employeeId)?.departmentId === d.id).map((i) => calcLine(i, c.db.settings.payroll)); return { departmentId: d.id, nameLo: d.nameLo, nameEn: d.nameEn, headcount: items.length, gross: items.reduce((s, l) => s + l.gross, 0), employerCost: items.reduce((s, l) => s + l.employerCost, 0) }; }).filter((x) => x.headcount) : [],
    latestPeriod: latest?.period ?? null,
  } };
});

// ---------- dispatcher ----------
const MUTATES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
export async function handle(req: Req): Promise<Res> {
  const db = getDb();
  for (const r of routes) {
    if (r.method !== req.method) continue;
    const m = req.path.match(r.re);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    try {
      let c: Ctx | null = null;
      if (!r.open) {
        const u = db.users.find((x) => x.id === session.get() && x.isActive);
        if (!u) throw new HttpError(401, 'UNAUTHENTICATED', 'errors.auth.unauthenticated');
        c = ctxFor(db, u);
      }
      const data = await r.h(c as Ctx, req, params);
      if (MUTATES.has(req.method) || req.path === '/auth/login') saveDb();
      return { status: 200, data };
    } catch (e) {
      if (e instanceof HttpError) return { status: e.status, data: { error: { code: e.code, message: e.message, details: e.details } } };
      console.error('[prototype]', e);
      return { status: 500, data: { error: { code: 'INTERNAL', message: 'errors.common.internal' } } };
    }
  }
  return { status: 404, data: { error: { code: 'NOT_FOUND', message: 'errors.common.notFound' } } };
}
export { localIso };
