import api from "./api";

/**
 * EJEMPLOS DE INTEGRACIÓN API - Módulo de Asignación de Rutas
 *
 * Este archivo contiene ejemplos de cómo usar los endpoints de la API
 * para el módulo de asignación de rutas
 */

// =============================================================================
// 1. OBTENER ASIGNACIÓN PESADA POR ID
// =============================================================================

/**
 * Obtiene los detalles de una asignación de maquinaria pesada
 * GET /AsignacionRutas/Pesada/{id}
 */
export async function obtenerAsignacionPesada(id) {
  try {
    const response = await api.get(`/AsignacionRutas/Pesada/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener asignación pesada:", error);
    throw error;
  }
}

// Uso:
// const asignacion = await obtenerAsignacionPesada(1);
// console.log(asignacion);
// Respuesta esperada:
// {
//   id: 1,
//   fechaAsignacion: "2024-11-17",
//   estado: 1,
//   choferId: 4,
//   vehiculoId: 2,
//   rutaId: 3,
//   chofer: { id: 4, nombre: "Antonio" },
//   vehiculo: { id: 2, placa: "GHI-012" },
//   ruta: { id: 3, nombre: "Ruta Sur" }
// }

// =============================================================================
// 2. OBTENER ASIGNACIÓN LIVIANA POR ID
// =============================================================================

/**
 * Obtiene los detalles de una asignación de maquinaria liviana
 * GET /AsignacionRutas/Liviana/{id}
 */
export async function obtenerAsignacionLiviana(id) {
  try {
    const response = await api.get(`/AsignacionRutas/Liviana/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener asignación liviana:", error);
    throw error;
  }
}

// Uso:
// const asignacion = await obtenerAsignacionLiviana(5);
// console.log(asignacion);

// =============================================================================
// 3. LISTAR TODAS LAS ASIGNACIONES
// =============================================================================

/**
 * Obtiene todas las asignaciones del sistema
 * GET /AsignacionRutas/listar
 */
export async function listarAsignaciones() {
  try {
    const response = await api.get("/AsignacionRutas/listar");
    return response.data;
  } catch (error) {
    console.error("Error al listar asignaciones:", error);
    throw error;
  }
}

// Uso:
// const asignaciones = await listarAsignaciones();
// Respuesta esperada: Array de objetos AsignacionRuta
// [
//   {
//     id: 1,
//     fechaAsignacion: "2024-11-17",
//     estado: 1,
//     choferId: 1,
//     vehiculoId: 1,
//     rutaId: 1
//   },
//   {
//     id: 2,
//     fechaAsignacion: "2024-11-18",
//     estado: 1,
//     choferId: 2,
//     vehiculoId: 2,
//     rutaId: 2
//   }
// ]

// =============================================================================
// 4. OBTENER ASIGNACIONES FILTRADAS POR CHOFER (Para Choferes)
// =============================================================================

/**
 * Obtiene solo las asignaciones de un chofer específico
 * Útil para el rol Chofer
 */
export async function obtenerAsignacionesPorChofer(choferId) {
  try {
    const asignaciones = await listarAsignaciones();
    return asignaciones.filter((a) => a.choferId === choferId);
  } catch (error) {
    console.error("Error al obtener asignaciones del chofer:", error);
    throw error;
  }
}

// Uso:
// const misAsignaciones = await obtenerAsignacionesPorChofer(5);

// =============================================================================
// 5. CREAR ASIGNACIÓN DE RUTA
// =============================================================================

/**
 * Crea una nueva asignación de ruta
 * POST /AsignacionRutas/crear
 *
 * @param {Object} data - Datos de la asignación
 * @param {string} data.fechaAsignacion - Fecha en formato ISO (ej: "2024-11-17")
 * @param {number} data.estado - 0 (Inactivo) o 1 (Activo)
 * @param {number} data.choferId - ID del chofer
 * @param {number} data.vehiculoId - ID del vehículo
 * @param {number} data.rutaId - ID de la ruta
 */
export async function crearAsignacion(data) {
  try {
    // Validar datos
    if (
      !data.choferId ||
      !data.vehiculoId ||
      !data.rutaId ||
      !data.fechaAsignacion
    ) {
      throw new Error("Faltan campos obligatorios");
    }

    const payload = {
      fechaAsignacion: data.fechaAsignacion,
      estado: Number(data.estado),
      choferId: Number(data.choferId),
      vehiculoId: Number(data.vehiculoId),
      rutaId: Number(data.rutaId),
    };

    const response = await api.post("/AsignacionRutas/crear", payload);
    return response.data;
  } catch (error) {
    console.error("Error al crear asignación:", error);
    throw error;
  }
}

// Uso:
// const nueva = await crearAsignacion({
//   fechaAsignacion: "2024-11-20",
//   estado: 1,
//   choferId: 1,
//   vehiculoId: 1,
//   rutaId: 1
// });

// Errores posibles:
// - "Faltan campos obligatorios"
// - "El chofer y el vehículo deben ser del mismo tipo de maquinaria"
// - Error del servidor (400, 500, etc.)

// =============================================================================
// 6. ACTUALIZAR ASIGNACIÓN DE RUTA
// =============================================================================

/**
 * Actualiza una asignación de ruta existente
 * PUT /AsignacionRutas/actualizar
 *
 * @param {Object} data - Datos de la asignación actualizada
 * @param {number} data.id - ID de la asignación a actualizar
 * @param {string} data.fechaAsignacion - Nueva fecha
 * @param {number} data.estado - Nuevo estado
 * @param {number} data.choferId - Nuevo chofer
 * @param {number} data.vehiculoId - Nuevo vehículo
 * @param {number} data.rutaId - Nueva ruta
 * @param {number} data.choferIdAnterior - ID del chofer anterior (para auditoría)
 */
export async function actualizarAsignacion(data) {
  try {
    // Validar datos
    if (!data.id || !data.choferId || !data.vehiculoId || !data.rutaId) {
      throw new Error("Faltan campos obligatorios");
    }

    const payload = {
      id: Number(data.id),
      fechaAsignacion: data.fechaAsignacion,
      estado: Number(data.estado),
      choferId: Number(data.choferId),
      vehiculoId: Number(data.vehiculoId),
      rutaId: Number(data.rutaId),
      choferIdAnterior: data.choferIdAnterior
        ? Number(data.choferIdAnterior)
        : Number(data.choferId),
    };

    const response = await api.put("/AsignacionRutas/actualizar", payload);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar asignación:", error);
    throw error;
  }
}

// Uso:
// const actualizada = await actualizarAsignacion({
//   id: 1,
//   fechaAsignacion: "2024-11-20",
//   estado: 1,
//   choferId: 3,
//   vehiculoId: 1,
//   rutaId: 2,
//   choferIdAnterior: 1
// });

// =============================================================================
// 7. ELIMINAR ASIGNACIÓN PESADA
// =============================================================================

/**
 * Elimina una asignación de maquinaria pesada
 * DELETE /AsignacionRutas/eliminar/Pesada/{id}
 *
 * @param {number} id - ID de la asignación a eliminar
 */
export async function eliminarAsignacionPesada(id) {
  try {
    const response = await api.delete(`/AsignacionRutas/eliminar/Pesada/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar asignación pesada:", error);
    throw error;
  }
}

// Uso:
// await eliminarAsignacionPesada(2);
// console.log("Asignación pesada eliminada");

// =============================================================================
// 8. ELIMINAR ASIGNACIÓN LIVIANA
// =============================================================================

/**
 * Elimina una asignación de maquinaria liviana
 * DELETE /AsignacionRutas/eliminar/Liviana/{id}
 *
 * @param {number} id - ID de la asignación a eliminar
 */
export async function eliminarAsignacionLiviana(id) {
  try {
    const response = await api.delete(
      `/AsignacionRutas/eliminar/Liviana/${id}`
    );
    return response.data;
  } catch (error) {
    console.error("Error al eliminar asignación liviana:", error);
    throw error;
  }
}

// Uso:
// await eliminarAsignacionLiviana(5);
// console.log("Asignación liviana eliminada");

// =============================================================================
// 9. ELIMINAR ASIGNACIÓN AUTOMÁTICO (Detecta tipo)
// =============================================================================

/**
 * Elimina una asignación determinando automáticamente si es Pesada o Liviana
 *
 * @param {Object} asignacion - Objeto de la asignación con vehiculoId
 * @param {Array} vehiculos - Array de vehículos para determinar tipo
 */
export async function eliminarAsignacion(asignacion, vehiculos) {
  try {
    const vehiculo = vehiculos.find((v) => v.id === asignacion.vehiculoId);
    const tipo = vehiculo?.tipoMaquinaria?.toLowerCase();

    if (tipo === "pesada") {
      return await eliminarAsignacionPesada(asignacion.id);
    } else {
      return await eliminarAsignacionLiviana(asignacion.id);
    }
  } catch (error) {
    console.error("Error al eliminar asignación:", error);
    throw error;
  }
}

// Uso:
// await eliminarAsignacion(
//   { id: 1, vehiculoId: 2 },
//   vehiculos
// );

// =============================================================================
// 10. VALIDAR COMPATIBILIDAD DE CHOFER Y VEHÍCULO
// =============================================================================

/**
 * Valida que chofer y vehículo sean del mismo tipo de maquinaria
 *
 * @param {number} choferId - ID del chofer
 * @param {number} vehiculoId - ID del vehículo
 * @param {Array} choferes - Array de choferes
 * @param {Array} vehiculos - Array de vehículos
 * @returns {Object} - { valido: boolean, error: string }
 */
export function validarCompatibilidad(
  choferId,
  vehiculoId,
  choferes,
  vehiculos
) {
  const chofer = choferes.find((c) => c.id === Number(choferId));
  const vehiculo = vehiculos.find((v) => v.id === Number(vehiculoId));

  if (!chofer || !vehiculo) {
    return { valido: false, error: "Chofer o vehículo no encontrado" };
  }

  const choferTipo = chofer.tipoMaquinaria;
  const vehiculoTipo = vehiculo.tipoMaquinaria === "Liviana" ? 0 : 1;

  if (choferTipo !== vehiculoTipo) {
    return {
      valido: false,
      error: "El chofer y el vehículo deben ser del mismo tipo de maquinaria",
    };
  }

  return { valido: true, error: null };
}

// Uso:
// const validacion = validarCompatibilidad(1, 1, choferes, vehiculos);
// if (!validacion.valido) {
//   console.error(validacion.error);
// }

// =============================================================================
// 11. OBTENER DETALLES COMPLETOS DE ASIGNACIÓN
// =============================================================================

/**
 * Obtiene los detalles completos de una asignación
 * Incluye información del chofer, vehículo y ruta
 *
 * @param {Object} asignacion - Objeto de la asignación
 * @param {Array} choferes - Array de choferes
 * @param {Array} vehiculos - Array de vehículos
 * @param {Array} rutas - Array de rutas
 */
export function obtenerDetallesCompletos(
  asignacion,
  choferes,
  vehiculos,
  rutas
) {
  const chofer = choferes.find((c) => c.id === asignacion.choferId);
  const vehiculo = vehiculos.find((v) => v.id === asignacion.vehiculoId);
  const ruta = rutas.find((r) => r.id === asignacion.rutaId);

  return {
    ...asignacion,
    chofer,
    vehiculo,
    ruta,
    tipoMaquinaria: vehiculo?.tipoMaquinaria,
    estadoTexto: asignacion.estado === 1 ? "Activo" : "Inactivo",
  };
}

// Uso:
// const detalles = obtenerDetallesCompletos(
//   asignacion,
//   choferes,
//   vehiculos,
//   rutas
// );
// console.log(detalles.chofer.nombre);
// console.log(detalles.vehiculo.placa);

// =============================================================================
// 12. OBTENER ASIGNACIONES POR ESTADO
// =============================================================================

/**
 * Filtra asignaciones por estado
 *
 * @param {Array} asignaciones - Array de asignaciones
 * @param {number} estado - 0 (Inactivo) o 1 (Activo)
 */
export function obtenerAsignacionesPorEstado(asignaciones, estado) {
  return asignaciones.filter((a) => a.estado === estado);
}

// Uso:
// const activos = obtenerAsignacionesPorEstado(asignaciones, 1);
// const inactivos = obtenerAsignacionesPorEstado(asignaciones, 0);

// =============================================================================
// 13. OBTENER ASIGNACIONES POR TIPO DE MAQUINARIA
// =============================================================================

/**
 * Filtra asignaciones por tipo de maquinaria
 *
 * @param {Array} asignaciones - Array de asignaciones
 * @param {Array} vehiculos - Array de vehículos
 * @param {string} tipo - "Liviana" o "Pesada"
 */
export function obtenerAsignacionesPorTipo(asignaciones, vehiculos, tipo) {
  return asignaciones.filter((a) => {
    const vehiculo = vehiculos.find((v) => v.id === a.vehiculoId);
    return vehiculo?.tipoMaquinaria?.toLowerCase() === tipo.toLowerCase();
  });
}

// Uso:
// const livianas = obtenerAsignacionesPorTipo(asignaciones, vehiculos, "Liviana");
// const pesadas = obtenerAsignacionesPorTipo(asignaciones, vehiculos, "Pesada");

// =============================================================================
// 14. OBTENER ASIGNACIONES POR RUTA
// =============================================================================

/**
 * Filtra asignaciones por ruta
 *
 * @param {Array} asignaciones - Array de asignaciones
 * @param {number} rutaId - ID de la ruta
 */
export function obtenerAsignacionesPorRuta(asignaciones, rutaId) {
  return asignaciones.filter((a) => a.rutaId === rutaId);
}

// Uso:
// const rutaAsignaciones = obtenerAsignacionesPorRuta(asignaciones, 3);

// =============================================================================
// 15. OBTENER ASIGNACIONES POR FECHA RANGO
// =============================================================================

/**
 * Filtra asignaciones por rango de fechas
 *
 * @param {Array} asignaciones - Array de asignaciones
 * @param {string} fechaInicio - Fecha inicio (ISO format)
 * @param {string} fechaFin - Fecha fin (ISO format)
 */
export function obtenerAsignacionesPorFecha(
  asignaciones,
  fechaInicio,
  fechaFin
) {
  return asignaciones.filter((a) => {
    const fecha = new Date(a.fechaAsignacion);
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    return fecha >= inicio && fecha <= fin;
  });
}

// Uso:
// const recientes = obtenerAsignacionesPorFecha(
//   asignaciones,
//   "2024-11-01",
//   "2024-11-30"
// );

// =============================================================================
// EJEMPLO DE USO COMPLETO EN UN COMPONENTE
// =============================================================================

/*
import { useEffect, useState } from "react";
import {
  listarAsignaciones,
  crearAsignacion,
  actualizarAsignacion,
  eliminarAsignacion,
  obtenerDetallesCompletos,
  validarCompatibilidad,
} from "./asignacionesAPI";

function AsignacionesComponent() {
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar asignaciones al montar
  useEffect(() => {
    cargarAsignaciones();
  }, []);

  const cargarAsignaciones = async () => {
    setLoading(true);
    try {
      const datos = await listarAsignaciones();
      setAsignaciones(datos);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async (formData) => {
    try {
      // Validar compatibilidad
      const validacion = validarCompatibilidad(
        formData.choferId,
        formData.vehiculoId,
        choferes,
        vehiculos
      );

      if (!validacion.valido) {
        throw new Error(validacion.error);
      }

      // Crear
      await crearAsignacion(formData);

      // Recargar
      await cargarAsignaciones();
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  const handleEliminar = async (asignacion) => {
    try {
      await eliminarAsignacion(asignacion, vehiculos);
      await cargarAsignaciones();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      {asignaciones.map(a => (
        <div key={a.id}>
          {a.id} - {a.fechaAsignacion}
          <button onClick={() => handleEliminar(a)}>Eliminar</button>
        </div>
      ))}
    </div>
  );
}

export default AsignacionesComponent;
*/
