// components/AuthGuard.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface AuthGuardProps {
  allowedRole: "POS" | "KDS";
}

export const AuthGuard = ({ allowedRole }: AuthGuardProps) => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  // 1. Not logged in? Send back to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role Mismatch?
  // If they are POS trying to enter KDS (or vice versa),
  // force them back to their authorized dashboard.
  if (user.role !== allowedRole) {
    const authorizedPath = user.role === "POS" ? "/pos" : "/kds";
    console.warn(
      `Unauthorized access attempt to ${allowedRole} by ${user.role}`,
    );
    return <Navigate to={authorizedPath} replace />;
  }

  // 3. Role matches perfectly -> Render the route
  return <Outlet />;
};
