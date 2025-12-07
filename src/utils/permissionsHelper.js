/**
 * Helper para gestionar permisos de usuarios por rol
 */

export const ROLES = {
  ADMINISTRADOR: "Administrador",
  SUPERVISOR: "Supervisor",
  OPERADOR: "Operador",
};

export const PERMISOS = {
  // Asignación de Rutas
  VER_ASIGNACIONES: "ver_asignaciones",
  CREAR_ASIGNACIONES: "crear_asignaciones",
  EDITAR_ASIGNACIONES: "editar_asignaciones",
  ELIMINAR_ASIGNACIONES: "eliminar_asignaciones",
  VER_DETALLES_ASIGNACIONES: "ver_detalles_asignaciones",

  // Choferes
  GESTIONAR_CHOFERES: "gestionar_choferes",

  // Vehículos
  GESTIONAR_VEHICULOS: "gestionar_vehiculos",

  // Rutas
  GESTIONAR_RUTAS: "gestionar_rutas",

  // Control de Combustible
  VER_CONSUMOS: "ver_consumos",
  CREAR_CONSUMOS: "crear_consumos",
  EDITAR_CONSUMOS: "editar_consumos",
  ELIMINAR_CONSUMOS: "eliminar_consumos",
};

/**
 * Normaliza el nombre del rol para el sistema
 * Convierte nombres del backend a nombres del sistema
 */
const normalizarRol = (rol) => {
  // Mapeo de nombres del backend a nombres del sistema
  const mapeoRoles = {
    Administrador: ROLES.ADMINISTRADOR,
    Admin: ROLES.ADMINISTRADOR,
    Administrator: ROLES.ADMINISTRADOR,
    Supervisor: ROLES.SUPERVISOR,
    Operador: ROLES.OPERADOR,
    Chofer: ROLES.OPERADOR,
    Operator: ROLES.OPERADOR,
  };

  return mapeoRoles[rol] || rol;
};

/**
 * Matriz de permisos por rol
 */
const permisosPorRol = {
  [ROLES.ADMINISTRADOR]: [
    PERMISOS.VER_ASIGNACIONES,
    PERMISOS.CREAR_ASIGNACIONES,
    PERMISOS.EDITAR_ASIGNACIONES,
    PERMISOS.ELIMINAR_ASIGNACIONES,
    PERMISOS.VER_DETALLES_ASIGNACIONES,
    PERMISOS.GESTIONAR_CHOFERES,
    PERMISOS.GESTIONAR_VEHICULOS,
    PERMISOS.GESTIONAR_RUTAS,
    PERMISOS.VER_CONSUMOS,
  ],

  [ROLES.SUPERVISOR]: [
    // Supervisor puede asignar rutas pero no controlar combustible
    PERMISOS.VER_ASIGNACIONES,
    PERMISOS.CREAR_ASIGNACIONES,
    PERMISOS.EDITAR_ASIGNACIONES,
    PERMISOS.ELIMINAR_ASIGNACIONES,
    PERMISOS.VER_DETALLES_ASIGNACIONES,
    PERMISOS.VER_CONSUMOS,
  ],

  [ROLES.OPERADOR]: [
    // Operador (incluyendo Choferes) solo ve sus rutas y puede crear control de combustible
    PERMISOS.VER_ASIGNACIONES,
    PERMISOS.VER_DETALLES_ASIGNACIONES,
    PERMISOS.VER_CONSUMOS,
    PERMISOS.CREAR_CONSUMOS,
  ],
};

/**
 * Verifica si un usuario tiene un permiso específico
 * @param {string} rolNombre - Nombre del rol del usuario
 * @param {string} permiso - Permiso a verificar
 * @returns {boolean} - True si tiene el permiso
 */
export const tienePermiso = (rolNombre, permiso) => {
  const rolNormalizado = normalizarRol(rolNombre);
  const permisos = permisosPorRol[rolNormalizado] || [];
  return permisos.includes(permiso);
};

/**
 * Verifica si un usuario puede ver un módulo específico
 * @param {string} rolNombre - Nombre del rol del usuario
 * @param {string} modulo - Módulo a verificar
 * @returns {boolean} - True si puede ver el módulo
 */
export const puedeVerModulo = (rolNombre, modulo) => {
  const rolNormalizado = normalizarRol(rolNombre);
  const modulosPermitidos = {
    choferes: [ROLES.ADMINISTRADOR],
    vehiculos: [ROLES.ADMINISTRADOR],
    rutas: [ROLES.ADMINISTRADOR],
    asignaciones: [ROLES.ADMINISTRADOR, ROLES.SUPERVISOR, ROLES.OPERADOR],
    consumos: [ROLES.ADMINISTRADOR, ROLES.SUPERVISOR, ROLES.OPERADOR],
  };

  return modulosPermitidos[modulo]?.includes(rolNormalizado) || false;
};

/**
 * Obtiene el rol del usuario desde el contexto
 * Normaliza a nombres del sistema
 * @param {Object} user - Objeto del usuario
 * @returns {string} - Nombre del rol normalizado
 */
export const obtenerRolUsuario = (user) => {
  const rolOriginal = user?.rolNombre || "Usuario";
  return normalizarRol(rolOriginal);
};

/**
 * Obtiene el rol original sin normalizar (para display)
 * @param {Object} user - Objeto del usuario
 * @returns {string} - Nombre del rol original
 */
export const obtenerRolOriginal = (user) => {
  return user?.rolNombre || "Usuario";
};

/**
 * Verifica si el usuario es administrador
 * @param {Object} user - Objeto del usuario
 * @returns {boolean} - True si es administrador
 */
export const esAdmin = (user) => {
  return obtenerRolUsuario(user) === ROLES.ADMINISTRADOR;
};

/**
 * Verifica si el usuario es supervisor
 * @param {Object} user - Objeto del usuario
 * @returns {boolean} - True si es supervisor
 */
export const esSupervisor = (user) => {
  return obtenerRolUsuario(user) === ROLES.SUPERVISOR;
};

/**
 * Verifica si el usuario es operador (incluyendo Choferes)
 * @param {Object} user - Objeto del usuario
 * @returns {boolean} - True si es operador
 */
export const esOperador = (user) => {
  return obtenerRolUsuario(user) === ROLES.OPERADOR;
};

/**
 * Verifica si es chofer (alias de esOperador)
 * @param {Object} user - Objeto del usuario
 * @returns {boolean} - True si es chofer/operador
 */
export const esChofer = (user) => {
  return esOperador(user);
};

/**
 * Obtiene descripción amigable de un rol
 * @param {string} rol - Nombre del rol
 * @returns {string} - Descripción del rol
 */
export const obtenerDescripcionRol = (rol) => {
  const rolNormalizado = normalizarRol(rol);
  const descripciones = {
    [ROLES.ADMINISTRADOR]: "Administrador - Acceso completo al sistema (sin control de combustible)",
    [ROLES.SUPERVISOR]: "Supervisor - Puede asignar rutas y ver consumos",
    [ROLES.OPERADOR]: "Operador - Solo puede ver sus rutas asignadas y crear controles de combustible",
  };

  return descripciones[rolNormalizado] || "Usuario desconocido";
};
