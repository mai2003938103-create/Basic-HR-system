import { BarChart3, Building2, BriefcaseBusiness, CalendarDays, Clock, LayoutDashboard, ReceiptText, Settings, ShieldCheck, UserRound, Users, UsersRound, Wallet, type LucideIcon } from 'lucide-react';

export interface NavItem {
  key: string;
  to: string;
  icon: LucideIcon;
  permission?: string;
  section?: 'system';
}

/** Modules in the Design System's sidebar order. */
export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', to: '/', icon: LayoutDashboard, permission: 'dashboard.view' },
  { key: 'employees', to: '/employees', icon: Users, permission: 'employee.read' },
  { key: 'departments', to: '/departments', icon: Building2, permission: 'department.read' },
  { key: 'positions', to: '/positions', icon: BriefcaseBusiness, permission: 'position.read' },
  { key: 'attendance', to: '/attendance', icon: Clock, permission: 'attendance.read' },
  { key: 'leave', to: '/leave', icon: CalendarDays, permission: 'leave.read' },
  // Stage 2 (design-first): hidden until the backend grants these permissions.
  { key: 'payroll', to: '/payroll', icon: Wallet, permission: 'payroll.read' },
  { key: 'payslips', to: '/payslips', icon: ReceiptText, permission: 'payslip.self' },
  { key: 'reports', to: '/reports', icon: BarChart3, permission: 'report.view' },
  { key: 'users', to: '/users', icon: UsersRound, permission: 'user.read', section: 'system' },
  { key: 'roles', to: '/roles', icon: ShieldCheck, permission: 'role.manage', section: 'system' },
  { key: 'settings', to: '/settings', icon: Settings, permission: 'settings.manage', section: 'system' },
  { key: 'profile', to: '/profile', icon: UserRound },
];

export const visibleNav = (can: (p: string) => boolean) => NAV_ITEMS.filter((i) => !i.permission || can(i.permission));

/** First page the user may open: used for `/` redirects and after sign-in. */
export const homePath = (can: (p: string) => boolean) => visibleNav(can)[0]?.to ?? '/profile';
