import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {

  const userStr = localStorage.getItem("user");
  const location = useLocation();

  if (!userStr) {
    // Not logged in
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Logged in but doesn't have required role
      // For now, redirect to dashboard or show an unauthorized page
      return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
  } catch (e) {
    // Invalid user JSON
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/" replace />;
  }
}
