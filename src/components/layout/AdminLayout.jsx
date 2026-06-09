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
    <aside className="flex h-full w-72 flex-col bg-gray-950 text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <Link to="/admin/dashboard" onClick={onClose} className="flex items-center gap-3">
          <BrandMark compact dark />
        </Link>
        <button className="lg:hidden" onClick={onClose} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {adminLinks.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                isActive ? "bg-orange-600 text-white shadow-orange-glow" : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 rounded-2xl bg-white/5 p-3">
          <p className="text-sm font-semibold">{userProfile?.name || "Shop Admin"}</p>
          <p className="truncate text-xs text-gray-400">{userProfile?.email}</p>
        </div>
        <Button tone="light" className="w-full !text-gray-950" onClick={logout}>
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
    <div className="min-h-screen bg-stone-50 text-gray-900">
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
      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/70 bg-stone-50/85 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <IconButton label="Open menu" className="lg:hidden" onClick={() => setOpen(true)}>
                <Menu className="h-5 w-5" />
              </IconButton>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">StaffPay Pro</p>
                <h1 className="truncate text-xl font-bold text-gray-950">{current?.label || "Admin"}</h1>
              </div>
            </div>
            <Link to="/admin/profile" className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-soft">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gray-950 text-white">
                <UserCircle className="h-5 w-5" />
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-gray-950">{userProfile?.name || "Admin"}</p>
                <p className="text-xs text-gray-500">Owner dashboard</p>
              </div>
            </Link>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
