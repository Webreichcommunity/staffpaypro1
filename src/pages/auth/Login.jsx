import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Alert, Button, Card, Input } from "../../components/common/UI";
import { useAuth } from "../../hooks/useAuth";

export const Login = () => {
  const { login, currentUser, userRole, isAccessVerified, loading, authError } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search || ""}`
    : "";
  const destination = requestedPath || (userRole === "admin" ? "/admin/dashboard" : "/staff/dashboard");

  useEffect(() => {
    if (!loading && currentUser && userRole && isAccessVerified) {
      navigate(destination, { replace: true });
    }
  }, [currentUser, destination, isAccessVerified, loading, navigate, userRole]);

  if (!loading && currentUser && userRole && isAccessVerified) {
    return <Navigate to={destination} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(form.identifier, form.password);
    } catch (err) {
      setError(err.message || "Login failed. Please check email, password, and Google account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-gray-900">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
              <img src="/logo.png" alt="" className="h-5 w-5 object-contain" />
              Staff Attendance, Payroll and Leave Suite
            </div>
            <h1 className="text-5xl font-black leading-tight text-gray-950">StaffPay Pro</h1>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              A polished SaaS dashboard for shop owners to run QR attendance, salary slips, leave approvals, and staff payments from one secure Firebase app.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {["Live QR", "GPS Radius", "Salary PDF"].map((item) => (
                <div key={item} className="rounded-2xl bg-white/80 p-4 text-sm font-bold text-gray-800 shadow-soft">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
        <Card className="mx-auto w-full max-w-md p-6 sm:p-8">
          <div className="mb-6 text-center">
            <img src="/logo.png" alt="StaffPay Pro" className="mx-auto h-16 w-16 object-contain" />
            <h2 className="mt-4 text-2xl font-black text-gray-950">Login to StaffPay Pro</h2>
            <p className="mt-1 text-sm text-gray-500">Admin and staff access is protected by Firebase Authentication.</p>
          </div>
          {(error || authError) && <div className="mb-4"><Alert tone="danger">{error || authError}</Alert></div>}
          <form onSubmit={submit} className="grid gap-4">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-10 h-4 w-4 text-gray-400" />
              <Input label="Email / Admin ID / Username" required className="pl-10" value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} />
            </div>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-10 h-4 w-4 text-gray-400" />
              <Input label="Password" type="password" required className="pl-10" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </div>
            <Button type="submit" loading={busy} className="w-full !min-h-12">Login</Button>
          </form>
          <div className="mt-4 flex gap-2 rounded-lg bg-orange-50 p-3 text-xs font-medium leading-5 text-gray-700">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
            Staff must verify the same Google account registered in their staff profile after password login.
          </div>
          <p className="mt-5 text-center text-xs text-gray-500">
            Need the first owner account?{" "}
            <Link to="/create-admin" className="font-bold text-orange-700 hover:text-orange-800">
              Create main admin
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
};
