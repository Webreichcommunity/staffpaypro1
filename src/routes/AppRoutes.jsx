import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../components/layout/AdminLayout";
import { StaffLayout } from "../components/layout/StaffLayout";
import { Login } from "../pages/auth/Login";
import { CreateAdmin } from "../pages/auth/CreateAdmin";
import {
  AdminAttendance,
  AdminAbout,
  AdminDashboard,
  AdminLeaves,
  AdminPayments,
  AdminProfile,
  AdminReports,
  AdminSalary,
  AdminSalarySlips,
  AdminShopSettings,
  AdminStaffDetail,
  AdminStaffForm,
  AdminStaffManagement,
  LiveQR,
} from "../pages/admin/AdminPages";
import {
  StaffAttendance,
  StaffDashboard,
  StaffLeaves,
  StaffProfile,
  StaffPunch,
  StaffSalarySlips,
  StaffScanAttendance,
} from "../pages/staff/StaffPages";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicLiveQR } from "../pages/public/PublicLiveQR";
import { HomePage } from "../pages/public/HomePage";

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/live-qr" element={<PublicLiveQR />} />
    <Route path="/login" element={<Login />} />
    <Route path="/create-admin" element={<CreateAdmin />} />
    <Route element={<ProtectedRoute role="admin" />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="staff" element={<AdminStaffManagement />} />
        <Route path="staff/new" element={<AdminStaffForm />} />
        <Route path="staff/:id" element={<AdminStaffDetail />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="live-qr" element={<LiveQR />} />
        <Route path="leaves" element={<AdminLeaves />} />
        <Route path="salary" element={<AdminSalary />} />
        <Route path="salary-slips" element={<AdminSalarySlips />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="shop-settings" element={<AdminShopSettings />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="about" element={<AdminAbout />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute role="staff" />}>
      <Route path="/staff" element={<StaffLayout />}>
        <Route index element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="punch" element={<StaffPunch />} />
        <Route path="scan-attendance" element={<StaffScanAttendance />} />
        <Route path="attendance" element={<StaffAttendance />} />
        <Route path="leaves" element={<StaffLeaves />} />
        <Route path="salary-slips" element={<StaffSalarySlips />} />
        <Route path="profile" element={<StaffProfile />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);
