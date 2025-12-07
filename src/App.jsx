import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import AsignacionRutasPage from "./pages/AsignacionRutasPage";
import ChoferesPage from "./pages/ChoferesPage";
import ConsumosPage from "./pages/ConsumosPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RutasPage from "./pages/RutasPage";
import VehiculosPage from "./pages/VehiculosPage";
import { ROLES } from "./utils/permissionsHelper";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-100">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/choferes"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR]}>
                    <ChoferesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vehiculos"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR]}>
                    <VehiculosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rutas"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR]}>
                    <RutasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/asignaciones"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.ADMINISTRADOR,
                      ROLES.SUPERVISOR,
                      ROLES.OPERADOR,
                    ]}
                  >
                    <AsignacionRutasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consumos"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.ADMINISTRADOR,
                      ROLES.SUPERVISOR,
                      ROLES.OPERADOR,
                    ]}
                  >
                    <ConsumosPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
