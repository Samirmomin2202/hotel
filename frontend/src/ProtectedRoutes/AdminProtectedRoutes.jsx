import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserDataContext } from "../context/UserContext";

function AdminProtectedRoutes({ children }) {
    const { user, loading } = useContext(UserDataContext);
    if (loading) return <main className="admin-access-loading">Checking access…</main>;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== "admin") return <Navigate to="/" replace />;
    return children;
}

export default AdminProtectedRoutes;
