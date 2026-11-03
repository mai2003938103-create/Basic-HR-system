import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { useAuth } from './auth/useAuth';
import { homePath } from './lib/permissions';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import { DepartmentsPage } from './pages/departments/DepartmentsPage';
import { DepartmentDetailPage } from './pages/departments/DepartmentDetailPage';
import { PositionsPage } from './pages/positions/PositionsPage';
import { EmployeesPage } from './pages/employees/EmployeesPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { LeavePage } from './pages/leave/LeavePage';
import { UsersPage } from './pages/users/UsersPage';
import { RolesPage } from './pages/users/RolesPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { EmployeeFormPage } from './pages/employees/EmployeeFormPage';
import { EmployeeDetailPage } from './pages/employees/EmployeeDetailPage';

function Home() {
  const { can } = useAuth();
  const to = homePath(can);
  return to === '/' ? <div className="text-page-title">Systory HRMS</div> : <Navigate to={to} replace />;
}

function NotFound() {
  const { t } = useTranslation();
  return <p className="py-24 text-center text-subhead">{t('errors.notFoundPage')}</p>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="departments" element={<ProtectedRoute permission="department.read"><DepartmentsPage /></ProtectedRoute>} />
        <Route path="departments/:id" element={<ProtectedRoute permission="department.read"><DepartmentDetailPage /></ProtectedRoute>} />
        <Route path="employees" element={<ProtectedRoute permission="employee.read"><EmployeesPage /></ProtectedRoute>} />
        <Route path="employees/new" element={<ProtectedRoute permission="employee.create"><EmployeeFormPage /></ProtectedRoute>} />
        <Route path="employees/:id" element={<ProtectedRoute permission="employee.read"><EmployeeDetailPage /></ProtectedRoute>} />
        <Route path="employees/:id/edit" element={<ProtectedRoute permission="employee.update"><EmployeeFormPage /></ProtectedRoute>} />
        <Route path="attendance" element={<ProtectedRoute permission="attendance.read"><AttendancePage /></ProtectedRoute>} />
        <Route path="leave" element={<ProtectedRoute permission="leave.read"><LeavePage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute permission="user.read"><UsersPage /></ProtectedRoute>} />
        <Route path="roles" element={<ProtectedRoute permission="role.manage"><RolesPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="positions" element={<ProtectedRoute permission="position.read"><PositionsPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
