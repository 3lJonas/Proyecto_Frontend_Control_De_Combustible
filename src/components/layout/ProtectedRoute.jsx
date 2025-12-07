import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { obtenerRolUsuario } from "../../utils/permissionsHelper";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-4">Cargando...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles) {
    const rolNormalizado = obtenerRolUsuario(user);
    if (!allowedRoles.includes(rolNormalizado)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
