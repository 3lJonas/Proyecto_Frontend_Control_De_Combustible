import api from "./api";

// Usuarios / Auth
export const AuthService = {
  login: (data) => api.post("/Usuarios/login", data),
  registrar: (data) => api.post("/Usuarios/registrar", data),
  listar: () => api.get("/Usuarios/listar"),
  actualizar: (data) => api.put("/Usuarios/actualizar", data),
  borrar: (id) => api.delete(`/Usuarios/borrar/${id}`),
};

export const RolesService = {
  listar: () => api.get("/Roles/listar"),
};

export const ChoferesService = {
  listar: () => api.get("/Choferes/listar"),
  obtener: (id) => api.get(`/Choferes/${id}`),
  crear: (data) => api.post("/Choferes/crear", data),
  actualizar: (data) => api.put("/Choferes/actualizar", data),
  eliminar: (id) => api.delete(`/Choferes/eliminar/${id}`),
};

export const VehiculosService = {
  listar: () => api.get("/Vehiculos/listar"),
  obtenerLiviana: (id) => api.get(`/Vehiculos/Liviana/${id}`),
  obtenerPesada: (id) => api.get(`/Vehiculos/Pesada/${id}`),
  crear: (data) => api.post("/Vehiculos/crear", data),
  actualizar: (data) => api.put("/Vehiculos/actualizar", data),
  eliminarPesada: (id) => api.delete(`/Vehiculos/eliminar/Pesada/${id}`),
  eliminarLiviana: (id) => api.delete(`/Vehiculos/eliminar/Liviana/${id}`),
};

export const RutasService = {
  listar: () => api.get("/Rutas/listar"),
  obtener: (id) => api.get(`/Rutas/${id}`),
  crear: (data) => api.post("/Rutas/crear", data),
  actualizar: (data) => api.put("/Rutas/actualizar", data),
  eliminar: (id) => api.delete(`/Rutas/eliminar/${id}`),
};

export const AsignacionRutasService = {
  listar: () => api.get("/AsignacionRutas/listar"),
  obtenerPesada: (id) => api.get(`/AsignacionRutas/Pesada/${id}`),
  obtenerLiviana: (id) => api.get(`/AsignacionRutas/Liviana/${id}`),
  crear: (data) => api.post("/AsignacionRutas/crear", data),
  actualizar: (data) => api.put("/AsignacionRutas/actualizar", data),
  eliminarLiviana: (id) => api.delete(`/AsignacionRutas/eliminar/Liviana/${id}`),
  eliminarPesada: (id) => api.delete(`/AsignacionRutas/eliminar/Pesada/${id}`),
};

export const ConsumoCombustibleService = {
  listar: () => api.get("/ConsumoCombustible/listar"),
  obtener: (id) => api.get(`/ConsumoCombustible/${id}`),
  obtenerLiviana: (id) => api.get(`/ConsumoCombustible/Liviana/${id}`),
  obtenerPesada: (id) => api.get(`/ConsumoCombustible/Pesada/${id}`),
  crear: (data) => api.post("/ConsumoCombustible/crear", data),
  actualizarPesada: (data) => api.put("/ConsumoCombustible/actualizar/Pesada", data),
  actualizarLiviana: (data) => api.put("/ConsumoCombustible/actualizar/Liviana", data),
  eliminarLiviana: (id) => api.delete(`/ConsumoCombustible/eliminar/Liviana/${id}`),
  eliminarPesada: (id) => api.delete(`/ConsumoCombustible/eliminar/Pesada/${id}`),
};

