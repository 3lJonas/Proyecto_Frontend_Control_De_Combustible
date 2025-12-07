/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";
import { parseJwt } from "../utils/jwt";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    const userInfo = localStorage.getItem("userInfo");

    async function init() {
      let loadedRoles = [];
      try {
        console.log("Cargando roles desde /Roles/listar...");
        const resRoles = await api.get("/Roles/listar");
        loadedRoles = resRoles.data || [];
        console.log("✅ Roles cargados:", loadedRoles);
        setRoles(loadedRoles);
      } catch (e) {
        console.error("❌ Error cargando roles", e);
      } finally {
        if (token && userInfo) {
          try {
            const storedUser = JSON.parse(userInfo);
            // Asignar rolNombre desde el objeto del usuario si existe
            if (!storedUser.rolNombre) {
              if (loadedRoles.length > 0 && storedUser.rolId) {
                const rol = loadedRoles.find((r) => r.id === storedUser.rolId);
                storedUser.rolNombre = rol?.nombre || "Usuario";
              } else {
                storedUser.rolNombre = "Usuario";
              }
            }
            setUser(storedUser);
          } catch (parseErr) {
            console.error("Error parsing userInfo", parseErr);
            localStorage.removeItem("userInfo");
          }
        }
        setLoading(false);
      }
    }

    init();
  }, []);

  const login = async (nombreUsuario, hashContrasena) => {
    try {
      const res = await api.post("/Usuarios/login", {
        nombreUsuario,
        hashContrasena,
      });

      console.log("Login response:", res.data);

      // Extraer token de la respuesta
      const token = res.data?.token || res.data?.jwtToken || res.data?.jwt;

      if (!token) {
        throw new Error("No token received from server");
      }

      // Decodificar el JWT para obtener la información del usuario
      const decodedToken = parseJwt(token);
      console.log("Decoded token:", decodedToken);

      localStorage.setItem("jwtToken", token);

      // Construir userData desde el token decodificado
      const userData = {
        id: decodedToken?.idUsuario || decodedToken?.sub || null,
        nombreUsuario: decodedToken?.unique_name || nombreUsuario,
        email: decodedToken?.email || null,
        rolNombre: decodedToken?.Rol || res.data?.rolNombre || "Usuario",
        // Guardar otros datos del token si están disponibles
        ...decodedToken,
      };

      console.log("✅ Usuario construido desde token:", userData);
      console.log(`✅ Rol asignado: ${userData.rolNombre}`);

      localStorage.setItem("userInfo", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userInfo");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, roles, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
