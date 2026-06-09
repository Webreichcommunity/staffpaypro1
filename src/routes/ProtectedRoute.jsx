import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader } from "../components/common/UI";
import { useAuth } from "../hooks/useAuth";

export const ProtectedRoute = ({ role }) => {
  const { currentUser, userRole, isAccessVerified, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader />;
  if (!currentUser) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!userRole) return <Navigate to="/login" replace />;
  if (userRole === "staff" && !isAccessVerified) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && userRole !== role) {
    return <Navigate to={userRole === "admin" ? "/admin/dashboard" : "/staff/dashboard"} replace />;
  }

  return <Outlet />;
};
