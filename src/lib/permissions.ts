import { Building2, BriefcaseBusiness, CalendarDays, Clock, LayoutDashboard, ShieldCheck, UserRound, Users, UsersRound, type LucideIcon } from 'lucide-react';

export interface NavItem {
  key: string;
  to: string;
  icon: LucideIcon;
  permission?: string;
  section?: 'system';
}

/** Stage 1 modules in the Design System's sidebar order. */
export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', to: '/', icon: LayoutDashboard, permission: 'dashboard.view' },
  { key: 'employees', to: '/employees', icon: Users, permission: 'employee.read' },
  { key: 'departments', to: '/departments', icon: Building2, permission: 'department.read' },
  { key: 'positions', to: '/positions', icon: BriefcaseBusiness, permission: 'position.read' },
  { key: 'attendance', to: '/attendance', icon: Clock, permission: 'attendance.read' },
  { key: 'leave', to: '/leave', icon: CalendarDays, permission: 'leave.read' },
  { key: 'users', to: '/users', icon: UsersRound, permission: 'user.read', section: 'system' },
  { key: 'roles', to: '/roles', icon: ShieldCheck, permission: 'role.manage', section: 'system' },
  { key: 'profile', to: '/profile', icon: UserRound },
];

export const visibleNav = (can: (p: string) => boolean) => NAV_ITEMS.filter((i) => !i.permission || can(i.permission));

/** First page the user may open: used for `/` redirects and after sign-in. */
export const homePath = (can: (p: string) => boolean) => visibleNav(can)[0]?.to ?? '/profile';
