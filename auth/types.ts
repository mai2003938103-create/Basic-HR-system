export interface MeDto {
  id: string;
  email: string;
  mustChangePassword: boolean;
  roles: string[];
  permissions: string[];
  scope: 'all' | 'department' | 'self';
  employee: { id: string; employeeCode: string; firstName: string; lastName: string; photoUrl: string | null; departmentId: string } | null;
}
