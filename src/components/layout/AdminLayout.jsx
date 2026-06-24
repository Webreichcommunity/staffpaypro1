import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Banknote,
  BarChart3,
  CalendarCheck,
  ClipboardList,
  FileBarChart2,
  Info,
  LogOut,
  Menu,
  QrCode,
  ReceiptText,
  Settings,
  UserCircle,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { Button, IconButton } from "../common/UI";
import { useAuth } from "../../hooks/useAuth";
import { BrandMark } from "../common/Brand";

const adminLinks = [
  { label: "Dashboard", path: "/admin/dashboard", icon: BarChart3 },
  { label: "Staff Management", path: "/admin/staff", icon: Users },
  { label: "Attendance", path: "/admin/attendance", icon: CalendarCheck },
  { label: "Live QR Attendance", path: "/admin/live-qr", icon: QrCode },
  { label: "Leave Requests", path: "/admin/leaves", icon: ClipboardList },
  { label: "Salary Reports", path: "/admin/salary", icon: Banknote },
  { label: "Salary Slips", path: "/admin/salary-slips", icon: ReceiptText },
  { label: "Payments", path: "/admin/payments", icon: WalletCards },
  { label: "Business Reports", path: "/admin/reports", icon: FileBarChart2 },
  { label: "Shop Settings", path: "/admin/shop-settings", icon: Settings },
  { label: "Profile", path: "/admin/profile", icon: UserCircle },
  { label: "About WebReich", path: "/admin/about", icon: Info },
];

const Sidebar = ({ onClose }) => {
  const { logout, userProfile } = useAuth();
  return (
    <aside className="flex h-full w-64 max-w-[85vw] flex-col border-r border-gray-200 bg-white text-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
        <Link to="/admin/dashboard" onClick={onClose} className="flex items-center gap-3">
          <BrandMark compact />
        </Link>
        <button className="lg:hidden" onClick={onClose} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        {adminLinks.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? "bg-orange-50 text-orange-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-3">
        <div className="mb-2 rounded-lg bg-gray-50 p-2.5">
          <p className="text-sm font-semibold">{userProfile?.name || "Shop Admin"}</p>
          <p className="truncate text-xs text-gray-600">{userProfile?.email}</p>
        </div>
        <Button tone="light" className="w-full" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
};

export const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const { userProfile } = useAuth();
  const location = useLocation();
  const current = adminLinks.find((link) => location.pathname.startsWith(link.path));

  return (
    <div className="min-h-screen overflow-x-hidden bg-stone-50 text-gray-900">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <Sidebar />
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-gray-950/50" onClick={() => setOpen(false)} aria-label="Close drawer" />
          <div className="relative h-full">
            <Sidebar onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
      <main className="w-full min-w-0 lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-3 py-2.5 lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <IconButton label="Open menu" className="lg:hidden" onClick={() => setOpen(true)}>
                <Menu className="h-5 w-5" />
              </IconButton>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">StaffPay Pro</p>
                <h1 className="truncate text-xl font-bold text-gray-950">{current?.label || "Admin"}</h1>
              </div>
            </div>
            <Link to="/admin/profile" className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-orange-50 text-orange-700">
                <UserCircle className="h-5 w-5" />
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-gray-950">{userProfile?.name || "Admin"}</p>
                <p className="text-xs text-gray-600">Owner dashboard</p>
              </div>
            </Link>
          </div>
        </header>
        <div className="mx-auto w-full min-w-0 max-w-[1600px] p-3 sm:p-5 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
