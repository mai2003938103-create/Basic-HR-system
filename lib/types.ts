export interface Named {
  id: string;
  nameLo: string;
  nameEn: string;
}
export interface Department extends Named {
  code: string;
  description: string | null;
  isActive: boolean;
  manager: { id: string; firstName: string; lastName: string } | null;
  employeeCount: number;
}
export interface Position extends Named {
  code: string;
  description: string | null;
  isActive: boolean;
  department: Named;
  employeeCount: number;
}
export type EmploymentStatus = 'active' | 'probation' | 'inactive' | 'terminated';
export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string | null;
  photoUrl: string | null;
  departmentId: string;
  positionId: string;
  hireDate: string;
  employmentStatus: EmploymentStatus;
  basicSalary?: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  department: (Named & { code: string }) | null;
  position: (Named & { code: string }) | null;
  user: { id: string; email: string; isActive: boolean; roles: string[] } | null;
}
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day' | 'leave';
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  workedMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: AttendanceStatus;
  note: string | null;
  employee?: { id: string; employeeCode: string; firstName: string; lastName: string; departmentId: string };
  department?: { nameLo: string; nameEn: string };
}
export interface LeaveType extends Named {
  code: string;
  defaultDaysPerYear: number;
  isPaid: boolean;
  documentRequiredAfterDays: number | null;
  isActive: boolean;
}
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export interface LeaveRequest {
  id: string;
  employee: { id: string; firstName: string; lastName: string; employeeCode: string; departmentId: string };
  leaveType: Named & { code: string };
  startDate: string;
  endDate: string;
  halfDay: 'none' | 'morning' | 'afternoon';
  days: number;
  reason: string;
  documentUrl: string | null;
  status: LeaveStatus;
  approver: { id: string; firstName: string; lastName: string } | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
  canApprove: boolean;
  canCancel: boolean;
}
export interface LeaveBalance {
  id: string;
  employeeId: string;
  year: number;
  leaveType: LeaveType;
  entitledDays: number;
  usedDays: number;
  remainingDays: number;
}
export interface Holiday {
  id: string;
  date: string;
  nameLo: string;
  nameEn: string;
}
export interface UserRow {
  id: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  employeeId: string | null;
  employee: { id: string; employeeCode: string; firstName: string; lastName: string } | null;
  roles: string[];
}
export interface Role {
  id: string;
  code: string;
  nameLo: string;
  nameEn: string;
  scope: 'all' | 'department' | 'self';
  isSystem: boolean;
  permissionCodes: string[];
  userCount: number;
}
