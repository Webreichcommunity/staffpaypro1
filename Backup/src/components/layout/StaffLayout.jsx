import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Banknote, Building2, CalendarDays, Home, LogOut, QrCode, UserCircle, ClipboardList, ScanLine } from "lucide-react";
import { Button } from "../common/UI";
import { useAuth } from "../../hooks/useAuth";
import { BrandMark } from "../common/Brand";
import { getShop } from "../../services/firestoreService";

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
  const [shop, setShop] = useState(null);

  useEffect(() => {
    if (!userProfile?.shopId) return;
    getShop(userProfile.shopId).then(setShop);
  }, [userProfile?.shopId]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-3 py-2.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden sm:block"><BrandMark compact /></div>
            <img src="/logo.png" alt="StaffPay Pro" className="h-10 w-10 shrink-0 object-contain sm:hidden" />
            <div className="hidden min-w-0 border-l border-gray-200 pl-3 sm:block">
              <p className="truncate text-xs font-bold text-gray-700">Hi, {userProfile?.name?.split(" ")[0] || "Staff"}</p>
              <p className="flex items-center gap-1 truncate text-sm font-black text-gray-950"><Building2 className="h-3.5 w-3.5 text-orange-600" /> {shop?.shopName || "Your shop"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/staff/scan-attendance" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-orange-600 px-3 text-sm font-semibold text-white shadow-sm">
              <ScanLine className="h-4 w-4" /> <span className="hidden xs:inline sm:inline">Scan QR</span><span className="sm:hidden">Scan</span>
            </NavLink>
            <Button tone="light" className="px-2.5" onClick={logout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl p-3 sm:p-5">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white px-1.5 py-1.5 shadow-lg">
        <div className="mx-auto grid max-w-5xl grid-cols-6 gap-1">
          {staffLinks.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `grid min-h-12 place-items-center rounded-lg text-[10px] font-semibold transition ${
                  isActive ? "bg-orange-50 text-orange-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
