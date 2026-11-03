// In-browser sample database for the clickable prototype only. Never used by the real build.
import { addDays, format, subMonths } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { TZ } from '../lib/format';

export type Scope = 'all' | 'department' | 'self';
export interface PDept { id: string; code: string; nameLo: string; nameEn: string; description: string | null; isActive: boolean; managerId: string | null }
export interface PPos { id: string; code: string; nameLo: string; nameEn: string; description: string | null; isActive: boolean; departmentId: string }
export interface PEmp {
  id: string; employeeCode: string; firstName: string; lastName: string; gender: 'male' | 'female' | 'other'; dateOfBirth: string;
  phone: string; email: string; address: string | null; photoUrl: string | null; departmentId: string; positionId: string; hireDate: string;
  employmentStatus: 'active' | 'probation' | 'inactive' | 'terminated'; basicSalary: string;
  emergencyContactName: string | null; emergencyContactPhone: string | null; emergencyContactRelation: string | null;
  bankName: string | null; bankAccount: string | null; allowance: number;
}
export interface PRole { id: string; code: string; nameLo: string; nameEn: string; scope: Scope; isSystem: boolean; permissionCodes: string[] }
export interface PUser { id: string; email: string; password: string; isActive: boolean; mustChangePassword: boolean; lastLoginAt: string | null; employeeId: string | null; roles: string[] }
export interface PLeaveType { id: string; code: string; nameLo: string; nameEn: string; defaultDaysPerYear: number; isPaid: boolean; documentRequiredAfterDays: number | null; isActive: boolean }
export interface PBalance { id: string; employeeId: string; year: number; leaveTypeId: string; entitledDays: number; usedDays: number }
export interface PHoliday { id: string; date: string; nameLo: string; nameEn: string }
export interface PAtt { id: string; employeeId: string; workDate: string; checkInAt: string | null; checkOutAt: string | null; workedMinutes: number; lateMinutes: number; earlyLeaveMinutes: number; status: 'present' | 'late' | 'absent' | 'half_day' | 'leave'; note: string | null; overtimeMinutes: number }
export interface PLeave { id: string; employeeId: string; leaveTypeId: string; startDate: string; endDate: string; halfDay: 'none' | 'morning' | 'afternoon'; days: number; reason: string; documentUrl: string | null; status: 'pending' | 'approved' | 'rejected' | 'cancelled'; approverId: string | null; decidedAt: string | null; decisionNote: string | null; createdAt: string }
export interface PNotice { id: string; userId: string; type: string; titleKey: string; data: Record<string, string> | null; readAt: string | null; createdAt: string }
export interface PPayItem { employeeId: string; basic: number; allowance: number; overtimeMinutes: number; bonus: number; otherDeduction: number; unpaidDays: number; note: string | null }
export interface PPayRun { id: string; period: string; status: 'draft' | 'pending' | 'approved' | 'paid'; payDate: string; createdAt: string; submittedAt: string | null; approvedAt: string | null; approvedById: string | null; paidAt: string | null; items: PPayItem[] }
export interface PTaxBracket { upTo: number | null; rate: number }
export interface PSettings {
  companyNameLo: string; companyNameEn: string; logoUrl: string | null; addressLo: string; addressEn: string; taxId: string; phone: string; email: string;
  currencyCode: string; currencySymbol: string; workingDays: number[]; workStart: string; workEnd: string; lateGraceMinutes: number; halfDayMinutes: number;
  payroll: { payDay: number; workDaysPerMonth: number; overtimeRate: number; ssEmployeeRate: number; ssEmployerRate: number; ssCeiling: number; taxBrackets: PTaxBracket[] };
}
export interface PDB {
  version: number; seededOn: string; settings: PSettings; departments: PDept[]; positions: PPos[]; employees: PEmp[]; roles: PRole[]; users: PUser[];
  leaveTypes: PLeaveType[]; balances: PBalance[]; holidays: PHoliday[]; attendance: PAtt[]; leaves: PLeave[]; notifications: PNotice[]; payRuns: PPayRun[];
}

export const STAGE1_PERMISSIONS: { code: string; module: string }[] = [
  ...['read', 'create', 'update', 'delete'].map((a) => ({ code: `employee.${a}`, module: 'employee' })),
  { code: 'department.read', module: 'department' }, { code: 'department.manage', module: 'department' },
  { code: 'position.read', module: 'position' }, { code: 'position.manage', module: 'position' },
  { code: 'attendance.read', module: 'attendance' }, { code: 'attendance.check', module: 'attendance' }, { code: 'attendance.manage', module: 'attendance' },
  { code: 'leave.read', module: 'leave' }, { code: 'leave.request', module: 'leave' }, { code: 'leave.approve', module: 'leave' }, { code: 'leave.manage', module: 'leave' },
  { code: 'dashboard.view', module: 'dashboard' }, { code: 'user.read', module: 'user' }, { code: 'user.manage', module: 'user' }, { code: 'role.manage', module: 'user' },
];
/** Stage 2 permissions proposed by the design-first prototype (the API contract to build later). */
export const STAGE2_PERMISSIONS: { code: string; module: string }[] = [
  { code: 'payroll.read', module: 'payroll' }, { code: 'payroll.manage', module: 'payroll' }, { code: 'payroll.approve', module: 'payroll' },
  { code: 'payslip.self', module: 'payroll' }, { code: 'report.view', module: 'report' }, { code: 'settings.manage', module: 'settings' },
];
export const ALL_PERMISSIONS = [...STAGE1_PERMISSIONS, ...STAGE2_PERMISSIONS];

let seq = 0;
export const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const today = () => formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');
export const localIso = (date: string, hm: string) => fromZonedTime(`${date}T${hm}:00`, TZ).toISOString();
const ymd = (d: Date) => format(d, 'yyyy-MM-dd');
export const weekday = (date: string) => { const d = new Date(`${date}T00:00:00Z`).getUTCDay(); return d === 0 ? 7 : d; };

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEPTS = [
  { code: 'HR', nameLo: 'ພະແນກບຸກຄະລາກອນ', nameEn: 'Human Resources', staffLo: 'ພະນັກງານບຸກຄະລາກອນ', staffEn: 'HR Officer' },
  { code: 'FIN', nameLo: 'ພະແນກການເງິນ', nameEn: 'Finance', staffLo: 'ພະນັກງານບັນຊີ', staffEn: 'Accountant' },
  { code: 'IT', nameLo: 'ພະແນກໄອທີ', nameEn: 'Information Technology', staffLo: 'ນັກພັດທະນາລະບົບ', staffEn: 'Software Developer' },
  { code: 'SALES', nameLo: 'ພະແນກຂາຍ', nameEn: 'Sales', staffLo: 'ພະນັກງານຂາຍ', staffEn: 'Sales Executive' },
  { code: 'OPS', nameLo: 'ພະແນກປະຕິບັດການ', nameEn: 'Operations', staffLo: 'ພະນັກງານປະຕິບັດການ', staffEn: 'Operations Officer' },
];
const FIRST_M = ['ສົມພອນ', 'ບຸນມີ', 'ຄຳແພງ', 'ອານຸສອນ', 'ສຸກສະຫວັນ', 'ພອນສະຫວັນ', 'ທອງໃສ', 'ວິໄລສັກ', 'ສີສຸວັນ', 'ໄຊຍະສິດ', 'ບຸນທັນ', 'ກິດຕິພອນ', 'ຄຳຫຼ້າ', 'ສົມສັກ'];
const FIRST_F = ['ວັນນາ', 'ນາລີ', 'ມະນີວອນ', 'ສີສະຫວາດ', 'ດາວວອນ', 'ແສງເດືອນ', 'ພອນທິບ', 'ຈັນທະລາ', 'ອາລິສາ', 'ນົງລັກ', 'ບົວພັນ', 'ສຸດາລັດ', 'ເພັດສະໝອນ', 'ລັດດາວັນ'];
const LAST = ['ແກ້ວມະນີ', 'ພົມມະຈັນ', 'ສີຫາລາດ', 'ວົງສະຫວັນ', 'ອິນທະວົງ', 'ສຸລິຍະວົງ', 'ໄຊຍະວົງ', 'ພິລາວົງ', 'ຈັນທະວົງ', 'ຄຳມະນີ'];
const BANKS = ['BCEL', 'LDB', 'APB', 'JDB'];

export function holidaysFor(year: number): PHoliday[] {
  // Sample Lao public holidays: HR confirms the official list each year.
  const list: [string, string, string][] = [
    ['01-01', 'ວັນປີໃໝ່ສາກົນ', "International New Year's Day"],
    ['03-08', 'ວັນແມ່ຍິງສາກົນ', "International Women's Day"],
    ['04-14', 'ບຸນປີໃໝ່ລາວ', 'Lao New Year'], ['04-15', 'ບຸນປີໃໝ່ລາວ', 'Lao New Year'], ['04-16', 'ບຸນປີໃໝ່ລາວ', 'Lao New Year'],
    ['05-01', 'ວັນກຳມະກອນສາກົນ', 'International Labour Day'],
    ['10-07', 'ວັນຄູແຫ່ງຊາດ', "National Teachers' Day"],
    ['12-02', 'ວັນຊາດ', 'National Day'],
  ];
  return list.map(([md, lo, en]) => ({ id: `hol_${year}${md.replace('-', '')}`, date: `${year}-${md}`, nameLo: lo, nameEn: en }));
}

export const DEFAULT_TAX: PTaxBracket[] = [
  { upTo: 2_500_000, rate: 0 }, { upTo: 5_000_000, rate: 5 }, { upTo: 15_000_000, rate: 10 },
  { upTo: 25_000_000, rate: 15 }, { upTo: 65_000_000, rate: 20 }, { upTo: null, rate: 25 },
];

export function seed(): PDB {
  const r = rng(20261103);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const now = today();
  const year = Number(now.slice(0, 4));
  const settings: PSettings = {
    companyNameLo: 'ບໍລິສັດ ຊິສໂຕຣີ ຈຳກັດ', companyNameEn: 'Systory Co., Ltd.', logoUrl: null,
    addressLo: 'ບ້ານໂພນສະອາດ, ເມືອງໄຊເສດຖາ, ນະຄອນຫຼວງວຽງຈັນ', addressEn: 'Phonsaath Village, Xaysettha District, Vientiane Capital',
    taxId: '123456789-000', phone: '021 455 123', email: 'hr@systory.la',
    currencyCode: 'LAK', currencySymbol: '₭', workingDays: [1, 2, 3, 4, 5], workStart: '08:00', workEnd: '17:00', lateGraceMinutes: 15, halfDayMinutes: 240,
    payroll: { payDay: 25, workDaysPerMonth: 22, overtimeRate: 150, ssEmployeeRate: 5.5, ssEmployerRate: 6, ssCeiling: 4_500_000, taxBrackets: DEFAULT_TAX },
  };
  const roles: PRole[] = [
    { id: 'role_super', code: 'super_admin', nameLo: 'ຜູ້ດູແລລະບົບສູງສຸດ', nameEn: 'Super Admin', scope: 'all', isSystem: true, permissionCodes: ALL_PERMISSIONS.map((p) => p.code) },
    { id: 'role_hr', code: 'hr_admin', nameLo: 'ຜູ້ດູແລຝ່າຍບຸກຄະລາກອນ', nameEn: 'HR Admin', scope: 'all', isSystem: true, permissionCodes: ALL_PERMISSIONS.map((p) => p.code).filter((c) => c !== 'role.manage' && c !== 'payroll.approve') },
    { id: 'role_mgr', code: 'manager', nameLo: 'ຫົວໜ້າພະແນກ', nameEn: 'Manager', scope: 'department', isSystem: true, permissionCodes: ['employee.read', 'department.read', 'position.read', 'attendance.read', 'attendance.check', 'leave.read', 'leave.request', 'leave.approve', 'dashboard.view', 'payslip.self', 'report.view'] },
    { id: 'role_emp', code: 'employee', nameLo: 'ພະນັກງານ', nameEn: 'Employee', scope: 'self', isSystem: true, permissionCodes: ['attendance.check', 'attendance.read', 'leave.request', 'leave.read', 'payslip.self'] },
    { id: 'role_dir', code: 'director', nameLo: 'ຜູ້ອຳນວຍການ', nameEn: 'Director', scope: 'all', isSystem: false, permissionCodes: ['employee.read', 'department.read', 'position.read', 'attendance.read', 'leave.read', 'dashboard.view', 'payroll.read', 'payroll.approve', 'report.view', 'payslip.self'] },
  ];
  const leaveTypes: PLeaveType[] = [
    { id: 'lt_annual', code: 'ANNUAL', nameLo: 'ລາພັກປະຈຳປີ', nameEn: 'Annual Leave', defaultDaysPerYear: 15, isPaid: true, documentRequiredAfterDays: null, isActive: true },
    { id: 'lt_sick', code: 'SICK', nameLo: 'ລາປ່ວຍ', nameEn: 'Sick Leave', defaultDaysPerYear: 30, isPaid: true, documentRequiredAfterDays: 2, isActive: true },
    { id: 'lt_personal', code: 'PERSONAL', nameLo: 'ລາກິດສ່ວນຕົວ', nameEn: 'Personal Leave', defaultDaysPerYear: 3, isPaid: true, documentRequiredAfterDays: null, isActive: true },
    { id: 'lt_unpaid', code: 'UNPAID', nameLo: 'ລາບໍ່ຮັບເງິນເດືອນ', nameEn: 'Unpaid Leave', defaultDaysPerYear: 10, isPaid: false, documentRequiredAfterDays: null, isActive: true },
    { id: 'lt_maternity', code: 'MATERNITY', nameLo: 'ລາເກີດລູກ', nameEn: 'Maternity Leave', defaultDaysPerYear: 105, isPaid: true, documentRequiredAfterDays: 0, isActive: true },
  ];
  const departments: PDept[] = [];
  const positions: PPos[] = [];
  const employees: PEmp[] = [];
  const users: PUser[] = [
    { id: 'usr_admin', email: 'admin@systory.la', password: 'Demo1234', isActive: true, mustChangePassword: false, lastLoginAt: localIso(now, '07:58'), employeeId: null, roles: ['super_admin'] },
  ];
  let n = 1;
  for (const d of DEPTS) {
    const deptId = `dep_${d.code.toLowerCase()}`;
    departments.push({ id: deptId, code: d.code, nameLo: d.nameLo, nameEn: d.nameEn, description: null, isActive: true, managerId: null });
    const mgrPos = { id: `pos_${d.code.toLowerCase()}_mgr`, code: `${d.code}-MGR`, nameLo: `ຫົວໜ້າ${d.nameLo}`, nameEn: `${d.nameEn} Manager`, description: null, isActive: true, departmentId: deptId };
    const stfPos = { id: `pos_${d.code.toLowerCase()}_stf`, code: `${d.code}-STF`, nameLo: d.staffLo, nameEn: d.staffEn, description: null, isActive: true, departmentId: deptId };
    positions.push(mgrPos, stfPos);
    const size = d.code === 'SALES' ? 7 : d.code === 'OPS' ? 6 : 5;
    for (let i = 0; i < size; i++, n++) {
      const female = r() < 0.5;
      const code = `EMP${String(n).padStart(4, '0')}`;
      const isMgr = i === 0;
      const hire = ymd(subMonths(new Date(`${now}T00:00:00Z`), Math.floor(2 + r() * 70)));
      const status: PEmp['employmentStatus'] = n === 24 ? 'inactive' : n === 27 ? 'terminated' : i === size - 1 && n % 2 ? 'probation' : 'active';
      const salary = isMgr ? 12_000_000 + Math.round(r() * 6) * 500_000 : 4_500_000 + Math.round(r() * 8) * 250_000;
      const e: PEmp = {
        id: `emp_${n}`, employeeCode: code, firstName: female ? FIRST_F[n % FIRST_F.length] : FIRST_M[n % FIRST_M.length], lastName: LAST[(n * 3) % LAST.length],
        gender: female ? 'female' : 'male', dateOfBirth: `${1980 + Math.floor(r() * 22)}-${String(1 + Math.floor(r() * 12)).padStart(2, '0')}-${String(1 + Math.floor(r() * 27)).padStart(2, '0')}`,
        phone: `020 ${5500 + n} ${String(1000 + Math.floor(r() * 8999))}`, email: `${code.toLowerCase()}@systory.la`,
        address: pick(['ບ້ານສີສັງວອນ, ເມືອງໄຊເສດຖາ', 'ບ້ານດົງປ່າລານ, ເມືອງສີສັດຕະນາກ', 'ບ້ານໂພນທັນ, ເມືອງໄຊເສດຖາ', 'ບ້ານຫາຍໂສກ, ເມືອງຈັນທະບູລີ']),
        photoUrl: null, departmentId: deptId, positionId: isMgr ? mgrPos.id : stfPos.id, hireDate: hire, employmentStatus: status, basicSalary: String(salary),
        emergencyContactName: `${pick(FIRST_M)} ${LAST[(n * 7) % LAST.length]}`, emergencyContactPhone: `020 ${7700 + n} ${String(1000 + Math.floor(r() * 8999))}`, emergencyContactRelation: pick(['ພໍ່', 'ແມ່', 'ຜົວ', 'ເມຍ', 'ອ້າຍ', 'ເອື້ອຍ']),
        bankName: pick(BANKS), bankAccount: `0${Math.floor(100000000 + r() * 899999999)}`, allowance: isMgr ? 1_500_000 : 500_000,
      };
      employees.push(e);
      if (isMgr) departments[departments.length - 1].managerId = e.id;
      const role = d.code === 'HR' && isMgr ? 'hr_admin' : isMgr ? 'manager' : 'employee';
      if (status !== 'terminated') users.push({ id: `usr_${n}`, email: e.email, password: 'Demo1234', isActive: status !== 'inactive', mustChangePassword: false, lastLoginAt: r() < 0.8 ? localIso(ymd(addDays(new Date(`${now}T00:00:00Z`), -Math.floor(r() * 6))), '08:0' + Math.floor(r() * 9)) : null, employeeId: e.id, roles: [role] });
    }
  }
  // A director (custom role) for the payroll approval flow.
  users.push({ id: 'usr_director', email: 'director@systory.la', password: 'Demo1234', isActive: true, mustChangePassword: false, lastLoginAt: null, employeeId: null, roles: ['director'] });

  const holidays = [...holidaysFor(year - 1), ...holidaysFor(year), ...holidaysFor(year + 1)];
  const holidaySet = new Set(holidays.map((h) => h.date));
  const balances: PBalance[] = [];
  for (const e of employees) for (const lt of leaveTypes) {
    if (lt.code === 'MATERNITY' && e.gender !== 'female') continue;
    balances.push({ id: `bal_${e.id}_${lt.id}`, employeeId: e.id, year, leaveTypeId: lt.id, entitledDays: lt.defaultDaysPerYear, usedDays: 0 });
  }

  // Leave requests: a mix of decided and pending ones around today.
  const leaves: PLeave[] = [];
  const active = employees.filter((e) => e.employmentStatus === 'active' || e.employmentStatus === 'probation');
  const isWork = (dt: string) => settings.workingDays.includes(weekday(dt)) && !holidaySet.has(dt);
  const workdaysFrom = (start: string, count: number) => { const out: string[] = []; let d = new Date(`${start}T00:00:00Z`); while (out.length < count) { const s = ymd(d); if (isWork(s)) out.push(s); d = addDays(d, 1); } return out; };
  const plan: [number, string, number, number, PLeave['status'], string][] = [
    [8, 'lt_annual', -20, 3, 'approved', 'ພາຄອບຄົວໄປທ່ຽວຫຼວງພະບາງ'], [3, 'lt_sick', -12, 1, 'approved', 'ເປັນໄຂ້'], [12, 'lt_personal', -9, 1, 'rejected', 'ທຸລະສ່ວນຕົວ'],
    [9, 'lt_annual', 4, 2, 'pending', 'ກັບບ້ານຕ່າງແຂວງ'], [14, 'lt_sick', 0, 1, 'approved', 'ໄປໂຮງໝໍກວດສຸຂະພາບ'], [17, 'lt_annual', 6, 3, 'pending', 'ງານແຕ່ງດອງພີ່ນ້ອງ'],
    [20, 'lt_personal', 2, 1, 'pending', 'ຕິດຕໍ່ເອກະສານລາຊະການ'], [7, 'lt_unpaid', -30, 2, 'approved', 'ທຸລະຄອບຄົວ'], [22, 'lt_annual', -2, 2, 'approved', 'ພັກຜ່ອນ'],
    [10, 'lt_personal', 9, 1, 'pending', 'ພາລູກໄປສະໝັກຮຽນ'], [26, 'lt_unpaid', -40, 3, 'approved', 'ທຸລະຕ່າງແຂວງ'], [4, 'lt_annual', -60, 2, 'approved', 'ພັກຜ່ອນ'],
  ];
  for (const [en, lt, offset, count, status, reason] of plan) {
    const emp = employees[en - 1];
    const dates = workdaysFrom(ymd(addDays(new Date(`${now}T00:00:00Z`), offset)), count);
    const mgr = departments.find((dd) => dd.id === emp.departmentId)?.managerId ?? null;
    leaves.push({
      id: uid('lv'), employeeId: emp.id, leaveTypeId: lt, startDate: dates[0], endDate: dates[dates.length - 1], halfDay: 'none', days: count, reason,
      documentUrl: null, status, approverId: status === 'pending' ? null : mgr === emp.id ? 'emp_1' : mgr, decidedAt: status === 'pending' ? null : localIso(ymd(addDays(new Date(`${dates[0]}T00:00:00Z`), -2)), '10:30'),
      decisionNote: status === 'rejected' ? 'ຊ່ວງນີ້ວຽກປິດບັນຊີຫຼາຍ, ກະລຸນາເລືອກວັນອື່ນ' : null, createdAt: localIso(ymd(addDays(new Date(`${dates[0]}T00:00:00Z`), offset > 0 ? -3 : -5)), '09:15'),
    });
    if (status === 'approved') { const b = balances.find((x) => x.employeeId === emp.id && x.leaveTypeId === lt && x.year === year); if (b) b.usedDays += count; }
  }
  const onLeave = (empId: string, dt: string) => leaves.some((l) => l.employeeId === empId && l.status === 'approved' && l.startDate <= dt && l.endDate >= dt);

  // Attendance for the last ~75 days, plus this morning's check-ins.
  const attendance: PAtt[] = [];
  const start = addDays(new Date(`${now}T00:00:00Z`), -75);
  for (let d = start; ymd(d) <= now; d = addDays(d, 1)) {
    const dt = ymd(d);
    if (!isWork(dt)) continue;
    for (const e of active) {
      if (e.hireDate > dt) continue;
      const isToday = dt === now;
      if (isToday && (e.id === 'emp_8' || r() < 0.25)) continue; // not checked in yet
      if (onLeave(e.id, dt)) { attendance.push({ id: uid('att'), employeeId: e.id, workDate: dt, checkInAt: null, checkOutAt: null, workedMinutes: 0, lateMinutes: 0, earlyLeaveMinutes: 0, status: 'leave', note: null, overtimeMinutes: 0 }); continue; }
      const roll = r();
      if (roll < 0.03 && !isToday) { attendance.push({ id: uid('att'), employeeId: e.id, workDate: dt, checkInAt: null, checkOutAt: null, workedMinutes: 0, lateMinutes: 0, earlyLeaveMinutes: 0, status: 'absent', note: null, overtimeMinutes: 0 }); continue; }
      const late = roll > 0.94 ? 16 + Math.floor(r() * 40) : 0;
      const inMin = late ? 8 * 60 + late : 7 * 60 + 40 + Math.floor(r() * 30);
      const half = roll > 0.85 && roll <= 0.88 && !isToday;
      const ot = !half && r() < 0.12 ? 60 + Math.floor(r() * 4) * 30 : 0;
      const outMin = half ? 12 * 60 : 17 * 60 + Math.floor(r() * 25) + ot;
      const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      attendance.push({
        id: uid('att'), employeeId: e.id, workDate: dt, checkInAt: localIso(dt, hm(inMin)), checkOutAt: isToday ? null : localIso(dt, hm(outMin)),
        workedMinutes: isToday ? 0 : outMin - inMin - (half ? 0 : 60), lateMinutes: late, earlyLeaveMinutes: half ? 5 * 60 : 0,
        status: half ? 'half_day' : late ? 'late' : 'present', note: null, overtimeMinutes: ot,
      });
    }
  }

  // Payroll runs for the three previous months.
  const payRuns: PPayRun[] = [];
  for (let k = 3; k >= 1; k--) {
    const p = format(subMonths(new Date(`${now.slice(0, 7)}-15T00:00:00Z`), k), 'yyyy-MM');
    const status: PPayRun['status'] = k === 1 ? 'pending' : 'paid';
    payRuns.push({
      id: `pay_${p}`, period: p, status, payDate: `${p}-25`, createdAt: localIso(`${p}-20`, '09:00'), submittedAt: localIso(`${p}-21`, '14:00'),
      approvedAt: status === 'paid' ? localIso(`${p}-22`, '10:00') : null, approvedById: status === 'paid' ? 'usr_director' : null, paidAt: status === 'paid' ? localIso(`${p}-25`, '09:00') : null,
      items: employees.filter((e) => e.hireDate <= `${p}-01` && (e.employmentStatus === 'active' || e.employmentStatus === 'probation')).map((e) => ({
        employeeId: e.id, basic: Number(e.basicSalary), allowance: e.allowance, overtimeMinutes: Math.floor(r() * 5) * 60, bonus: r() < 0.15 ? 500_000 : 0,
        otherDeduction: r() < 0.1 ? 300_000 : 0, unpaidDays: 0, note: null,
      })),
    });
  }

  const notifications: PNotice[] = [];
  const hrUser = users.find((u) => u.roles.includes('hr_admin'))!;
  for (const l of leaves.filter((x) => x.status === 'pending')) {
    const emp = employees.find((e) => e.id === l.employeeId)!;
    const mgrId = departments.find((dd) => dd.id === emp.departmentId)?.managerId;
    const mgrUser = users.find((u) => u.employeeId === mgrId);
    const data = { employeeName: `${emp.firstName} ${emp.lastName}`, startDate: l.startDate, endDate: l.endDate, leaveRequestId: l.id };
    for (const u of new Set([mgrUser?.id, hrUser.id].filter(Boolean) as string[])) notifications.push({ id: uid('ntf'), userId: u, type: 'leave.requested', titleKey: 'notifications.leaveRequested', data, readAt: null, createdAt: l.createdAt });
  }
  const director = users.find((u) => u.id === 'usr_director')!;
  const pending = payRuns.find((p) => p.status === 'pending');
  if (pending) notifications.push({ id: uid('ntf'), userId: director.id, type: 'payroll.submitted', titleKey: 'notifications.payrollSubmitted', data: { period: pending.period, payRunId: pending.id }, readAt: null, createdAt: pending.submittedAt! });

  return { version: 1, seededOn: now, settings, departments, positions, employees, roles, users, leaveTypes, balances, holidays, attendance, leaves, notifications, payRuns };
}

const KEY = 'hrms_proto_db_v1';
let db: PDB | null = null;
export function getDb(): PDB {
  if (db) return db;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const parsed = JSON.parse(raw) as PDB; if (parsed.version === 1 && parsed.seededOn === today()) return (db = parsed); }
  } catch { /* storage unavailable */ }
  return (db = seed());
}
export function saveDb() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage unavailable: keep in memory */ }
}
export function resetDb() {
  db = seed();
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
