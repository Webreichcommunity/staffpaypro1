import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Alert, Button, Card, Input } from "../../components/common/UI";
import { useAuth } from "../../hooks/useAuth";
import { createMainAdminAccount, hasExistingAdmin } from "../../services/authService";

const initialForm = {
  adminId: "",
  username: "",
  name: "",
  email: "",
  phone: "",
  shopName: "",
  password: "",
  confirmPassword: "",
};

export const CreateAdmin = () => {
  const { currentUser, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    hasExistingAdmin()
      .then(setAdminExists)
      .catch(() => {
        setWarning("Could not verify existing admins. If your Firestore rules block public setup checks, create only one main admin and then restrict this route.");
      })
      .finally(() => setChecking(false));
  }, []);

  if (!loading && currentUser && userRole) {
    return <Navigate to={userRole === "admin" ? "/admin/dashboard" : "/staff/dashboard"} replace />;
  }

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setBusy(true);
    try {
      await createMainAdminAccount(form);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Admin creation failed. Please check Firebase Auth and Firestore rules.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-gray-900">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
              <UserPlus className="h-4 w-4" />
              First Admin Setup
            </div>
            <h1 className="text-5xl font-black leading-tight text-gray-950">Create Main Admin</h1>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              Create the owner account, admin ID, username, password, and default shop profile. After setup, login works with email, admin ID, or username.
            </p>
          </div>
        </section>

        <Card className="mx-auto w-full max-w-2xl p-6 sm:p-8">
          <div className="mb-6 text-center">
            <img src="/logo.png" alt="StaffPay Pro" className="mx-auto h-16 w-16 object-contain" />
            <h2 className="mt-4 text-2xl font-black text-gray-950">Main Admin Registration</h2>
            <p className="mt-1 text-sm text-gray-500">Firebase Auth still uses email/password internally. Admin ID and username are saved as login aliases.</p>
          </div>

          {checking && <div className="mb-4"><Alert>Checking existing admin setup...</Alert></div>}
          {warning && <div className="mb-4"><Alert>{warning}</Alert></div>}
          {error && <div className="mb-4"><Alert tone="danger">{error}</Alert></div>}

          {adminExists ? (
            <div className="grid gap-4">
              <Alert tone="danger">A main admin already exists. For security, create new admins from the Admin Panel instead of this setup page.</Alert>
              <Link to="/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Admin ID" required placeholder="bhamare-admin" value={form.adminId} onChange={(event) => setField("adminId", event.target.value)} />
                <Input label="Username" required placeholder="owner" value={form.username} onChange={(event) => setField("username", event.target.value)} />
                <Input label="Owner name" required value={form.name} onChange={(event) => setField("name", event.target.value)} />
                <Input label="Email for Firebase login" type="email" required value={form.email} onChange={(event) => setField("email", event.target.value)} />
                <Input label="Phone" value={form.phone} onChange={(event) => setField("phone", event.target.value)} />
                <Input label="Shop name" value={form.shopName} onChange={(event) => setField("shopName", event.target.value)} />
                <Input label="Password" type="password" required value={form.password} onChange={(event) => setField("password", event.target.value)} />
                <Input label="Confirm password" type="password" required value={form.confirmPassword} onChange={(event) => setField("confirmPassword", event.target.value)} />
              </div>
              <Button type="submit" loading={busy || checking} className="w-full !min-h-12">Create Main Admin</Button>
              <Link to="/login" className="text-center text-sm font-semibold text-orange-700 hover:text-orange-800">
                Already have an admin account? Login
              </Link>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
};
