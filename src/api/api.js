import axios from "axios";

const api = axios.create({
  baseURL: "https://4.249.91.119:8081", // API Gateway en HTTPS
  timeout: 10000, // TIEMPO DE ESPERA MÁXIMO
});

// SE ENVÍA AUTOMÁTICAMENTE EL JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwtToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// SE MANEJAN LOS ERRORES
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    // Si es 401 en endpoints protegidos, forzamos logout y redirección.
    // No redirigimos en login ni en carga inicial de roles para evitar bucles.
    if (
      status === 401 &&
      !url.includes("/Usuarios/login") &&
      !url.includes("/Roles/listar")
    ) {
      console.log("ERROR EN LA CONSULTA", error);
      localStorage.removeItem("jwtToken"); // Eliminar el token inválido
      window.location.href = "/login"; // Redirigir al login
    }

    return Promise.reject(error);
  }
);

export default api;
