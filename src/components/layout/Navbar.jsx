import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { obtenerRolUsuario, ROLES } from "../../utils/permissionsHelper";

export default function Navbar() {
  const { user, logout } = useAuth();
  const rolNormalizado = obtenerRolUsuario(user);

  return (
    <nav className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
      <div className="font-bold text-lg">Control de Combustible</div>
      <div className="flex gap-4 items-center">
        {user && (
          <>
            <Link to="/" className="hover:underline text-sm">
              Dashboard
            </Link>

            {/* Admin: acceso a todo */}
            {rolNormalizado === ROLES.ADMINISTRADOR && (
              <>
                <Link to="/choferes" className="hover:underline text-sm">
                  Choferes
                </Link>
                <Link to="/vehiculos" className="hover:underline text-sm">
                  Vehículos
                </Link>
                <Link to="/rutas" className="hover:underline text-sm">
                  Rutas
                </Link>
                <Link to="/asignaciones" className="hover:underline text-sm">
                  Asignaciones
                </Link>
                <Link to="/consumos" className="hover:underline text-sm">
                  Reportes Combustible
                </Link>
              </>
            )}

            {/* Supervisor: gestión de asignaciones y ver consumos */}
            {rolNormalizado === ROLES.SUPERVISOR && (
              <>
                <Link to="/asignaciones" className="hover:underline text-sm">
                  Asignaciones
                </Link>
                <Link to="/consumos" className="hover:underline text-sm">
                  Reportes Combustible
                </Link>
              </>
            )}

            {/* Operador: solo ver y crear consumos */}
            {rolNormalizado === ROLES.OPERADOR && (
              <>
                <Link to="/asignaciones" className="hover:underline text-sm">
                  Mis Rutas
                </Link>
                <Link to="/consumos" className="hover:underline text-sm">
                  Mi Combustible
                </Link>
              </>
            )}
          </>
        )}

        {!user ? (
          <Link
            to="/login"
            className="bg-blue-600 px-3 py-1 rounded-md text-sm"
          >
            Login
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs bg-slate-700 px-2 py-1 rounded">
              {rolNormalizado}
            </span>
            <button
              onClick={logout}
              className="bg-red-600 px-3 py-1 rounded-md text-sm hover:bg-red-700"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
