import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader } from "../components/common/UI";
import { useAuth } from "../hooks/useAuth";

export const ProtectedRoute = ({ role }) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader />;
  if (!currentUser) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!userRole) return <Navigate to="/login" replace />;
  if (role && userRole !== role) {
    return <Navigate to={userRole === "admin" ? "/admin/dashboard" : "/staff/dashboard"} replace />;
  }

  return <Outlet />;
};
