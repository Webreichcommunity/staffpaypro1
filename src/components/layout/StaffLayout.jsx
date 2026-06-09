import { NavLink, Outlet } from "react-router-dom";
import { Banknote, CalendarDays, Home, LogOut, QrCode, UserCircle, ClipboardList, ScanLine } from "lucide-react";
import { Button } from "../common/UI";
import { useAuth } from "../../hooks/useAuth";
import { BrandMark } from "../common/Brand";

const staffLinks = [
  { label: "Home", path: "/staff/dashboard", icon: Home },
  { label: "Punch", path: "/staff/punch", icon: QrCode },
  { label: "Attendance", path: "/staff/attendance", icon: CalendarDays },
  { label: "Leaves", path: "/staff/leaves", icon: ClipboardList },
  { label: "Salary", path: "/staff/salary-slips", icon: Banknote },
  { label: "Profile", path: "/staff/profile", icon: UserCircle },
];

export const StaffLayout = () => {
  const { userProfile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-gray-900">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-stone-50/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandMark compact />
            <p className="hidden text-sm font-semibold text-gray-500 sm:block">Hi, {userProfile?.name?.split(" ")[0] || "Staff"}</p>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/staff/scan-attendance" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-bold text-white shadow-orange-glow">
              <ScanLine className="h-4 w-4" /> Scan QR
            </NavLink>
            <Button tone="light" className="!min-h-10 px-3" onClick={logout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white/95 px-2 pb-2 pt-2 shadow-2xl backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-6 gap-1">
          {staffLinks.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `grid min-h-14 place-items-center rounded-2xl text-[11px] font-semibold transition ${
                  isActive ? "bg-orange-600 text-white shadow-orange-glow" : "text-gray-500 hover:bg-orange-50 hover:text-orange-700"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
