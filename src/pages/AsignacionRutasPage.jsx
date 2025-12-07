import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  normalizeAsignacion,
  normalizeTipoMaquinaria,
} from "../utils/dataTransforms";
import {
  esOperador,
  obtenerRolUsuario,
  ROLES,
} from "../utils/permissionsHelper";
import { buildUserIdMatcher } from "../utils/userUtils";

export default function AsignacionRutasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [asignaciones, setAsignaciones] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: null,
    fechaAsignacion: new Date().toISOString().split("T")[0],
    choferId: "",
    vehiculoId: "",
    rutaId: "",
    choferIdAnterior: null,
  });
  const [editing, setEditing] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [modalDetalles, setModalDetalles] = useState(null);

  const ESTADO_ACTIVO = 1;

  // Verificar permisos del usuario
  const rolNormalizado = obtenerRolUsuario(user);
  const puedeVerTodo =
    rolNormalizado === ROLES.ADMINISTRADOR ||
    rolNormalizado === ROLES.SUPERVISOR;
  const puedeCrearEditar =
    rolNormalizado === ROLES.ADMINISTRADOR ||
    rolNormalizado === ROLES.SUPERVISOR;
  const esOperadorUsuario = esOperador(user);

  // Redirigir si no tiene permiso
  useEffect(() => {
    if (!puedeVerTodo && !esOperadorUsuario) {
      navigate("/");
    }
  }, [user, navigate, puedeVerTodo, esOperadorUsuario]);

  const matchesUsuarioActual = useMemo(() => buildUserIdMatcher(user), [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resAsignaciones = await api.get("/AsignacionRutas/listar");
      const todasAsignaciones = (resAsignaciones.data || [])
        .map(normalizeAsignacion)
        .filter(Boolean);

      const asigData = esOperadorUsuario
        ? todasAsignaciones.filter((a) =>
            matchesUsuarioActual(a?.choferUsuarioId)
          )
        : todasAsignaciones;

      const [chofRes, vehRes, rutRes] = await Promise.all([
        api.get("/Choferes/listar"),
        api.get("/Vehiculos/listar"),
        api.get("/Rutas/listar"),
      ]);

      setAsignaciones(asigData);
      setChoferes(chofRes.data || []);
      setVehiculos(vehRes.data || []);
      setRutas(rutRes.data || []);
      setError(null);
    } catch (e) {
      console.error("Error cargando datos", e);
      setError("Error al cargar datos de asignación de rutas");
    } finally {
      setLoading(false);
    }
  }, [esOperadorUsuario, matchesUsuarioActual]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Validar campos obligatorios
      if (!form.choferId) {
        setError("Debe seleccionar un chofer");
        return;
      }

      if (!form.vehiculoId) {
        setError("Debe seleccionar un vehículo");
        return;
      }

      if (!form.rutaId) {
        setError("Debe seleccionar una ruta");
        return;
      }

      if (!form.fechaAsignacion) {
        setError("Debe ingresar una fecha de asignación");
        return;
      }

      // Validar que chofer y vehículo sean del mismo tipo de maquinaria
      const choferSeleccionado = choferes.find(
        (c) => c.id === Number(form.choferId)
      );
      const vehiculoSeleccionado = vehiculos.find(
        (v) => v.id === Number(form.vehiculoId)
      );

      if (choferSeleccionado && vehiculoSeleccionado) {
        const choferTipo = choferSeleccionado.tipoMaquinaria;
        const vehiculoTipo =
          vehiculoSeleccionado.tipoMaquinaria === "Liviana" ? 0 : 1;

        if (choferTipo !== vehiculoTipo) {
          setError(
            "El chofer y el vehículo deben ser del mismo tipo de maquinaria"
          );
          return;
        }
      }

      const payload = {
        fechaAsignacion: form.fechaAsignacion,
        estado: ESTADO_ACTIVO,
        choferId: Number(form.choferId),
        vehiculoId: Number(form.vehiculoId),
        rutaId: Number(form.rutaId),
      };

      // Determinar tipoMaquinaria automáticamente basado en el chofer seleccionado
      const resolveTipoMaquinariaFromChofer = (chofer) => {
        if (!chofer) return "Liviana";
        const t = chofer.tipoMaquinaria;
        if (t === 0 || t === "0" || String(t).toLowerCase() === "liviana") return "Liviana";
        if (t === 1 || t === "1" || String(t).toLowerCase() === "pesada") return "Pesada";
        return String(t);
      };

      const tipoMaquinariaSeleccionada = resolveTipoMaquinariaFromChofer(choferSeleccionado);
      payload.tipoMaquinaria = tipoMaquinariaSeleccionada;

      if (editing) {
        payload.id = Number(form.id);
        payload.choferIdAnterior =
          form.choferIdAnterior || Number(form.choferId);
        await api.put("/AsignacionRutas/actualizar", payload);
        setSuccess("Asignación actualizada correctamente");
      } else {
        await api.post("/AsignacionRutas/crear", payload);
        setSuccess("Asignación creada correctamente");
      }

      setForm({
        id: null,
        fechaAsignacion: new Date().toISOString().split("T")[0],
        choferId: "",
        vehiculoId: "",
        rutaId: "",
        choferIdAnterior: null,
      });
      setEditing(false);
      await load();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error al guardar asignación", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al guardar la asignación"
      );
    }
  };

  const handleEdit = (a) => {
    setForm({
      id: a.id,
      fechaAsignacion: a.fechaAsignacion,
      choferId: String(a.choferId),
      vehiculoId: String(a.vehiculoId),
      rutaId: String(a.rutaId),
      choferIdAnterior: a.choferId,
    });
    setEditing(true);
    setError(null);
  };

  const handleDelete = async (a) => {
    if (!window.confirm("¿Eliminar esta asignación?")) return;
    try {
      const tipo = (a.tipoMaquinaria || "").toLowerCase();
      if (tipo === "pesada") {
        await api.delete(`/AsignacionRutas/eliminar/Pesada/${a.id}`);
      } else {
        await api.delete(`/AsignacionRutas/eliminar/Liviana/${a.id}`);
      }

      setSuccess("Asignación eliminada correctamente");
      await load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error al eliminar", err);
      setError("Error al eliminar la asignación");
    }
  };

  const handleCancel = () => {
    setForm({
      id: null,
      fechaAsignacion: new Date().toISOString().split("T")[0],
      choferId: "",
      vehiculoId: "",
      rutaId: "",
      choferIdAnterior: null,
    });
    setEditing(false);
    setError(null);
  };

  const handleVerDetalles = async (a) => {
    try {
      const tipo = (a.tipoMaquinaria || "").toLowerCase();
      const endpoint =
        tipo === "pesada"
          ? `/AsignacionRutas/Pesada/${a.id}`
          : `/AsignacionRutas/Liviana/${a.id}`;
      const res = await api.get(endpoint);
      const detallesNormalizados = normalizeAsignacion(res.data) || a;
      setModalDetalles(detallesNormalizados);
    } catch (err) {
      console.error("Error al cargar detalles", err);
      setError("Error al cargar detalles de la asignación");
    }
  };

  const cerrarModalDetalles = () => {
    setModalDetalles(null);
  };

  // Filtrar asignaciones por tipo de maquinaria
  const dataFiltrada = useMemo(() => {
    if (!tipoFiltro) return asignaciones;
    return asignaciones.filter(
      (a) => a.tipoMaquinaria?.toLowerCase() === tipoFiltro.toLowerCase()
    );
  }, [asignaciones, tipoFiltro]);

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-500">Cargando asignaciones...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Asignación de Rutas</h1>
        <div className="text-sm bg-blue-100 px-3 py-1 rounded">
          Rol: <span className="font-semibold">{obtenerRolUsuario(user)}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Formulario solo para Admin y Supervisor */}
      {puedeCrearEditar && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-sm font-medium">
              Fecha Asignación *
            </label>
            <input
              type="date"
              name="fechaAsignacion"
              value={form.fechaAsignacion}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Chofer *</label>
            <select
              name="choferId"
              value={form.choferId}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              required
            >
              <option value="">Seleccione un chofer</option>
              {choferes
                .filter((c) => c.estado !== 0 && c.estado !== "Eliminado")
                .map((c) => (
                  <option key={`chofer-${c.id}-${c.nombre}`} value={String(c.id)}>
                    {c.nombre} ({c.tipoMaquinaria === 0 ? "Liviana" : "Pesada"})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Vehículo *</label>
            <select
              name="vehiculoId"
              value={form.vehiculoId}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              required
            >
              <option value="">Seleccione un vehículo</option>
              {vehiculos
                .filter((v) => v.estado !== 0 && v.estado !== "Eliminado")
                .map((v) => (
                  <option key={`vehiculo-${v.id}-${v.placa}-${v.nombre}`} value={String(v.id)}>
                    {v.placa} - {v.nombre} ({v.tipoMaquinaria})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Ruta *</label>
            <select
              name="rutaId"
              value={form.rutaId}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              required
            >
              <option value="">Seleccione una ruta</option>
              {rutas.map((r) => (
                <option key={`ruta-${r.id}-${r.nombre}`} value={String(r.id)}>
                  {r.nombre} ({r.distancia} km)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2 md:col-span-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
            >
              {editing ? "Actualizar" : "Crear"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {/* Filtro disponible para todos */}
      <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow">
        <span className="text-sm font-medium">Filtrar por tipo:</span>
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Todos</option>
          <option value="Liviana">Liviana</option>
          <option value="Pesada">Pesada</option>
        </select>
      </div>

      {/* Tabla de asignaciones */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Chofer</th>
              <th className="px-3 py-2">Vehículo</th>
              <th className="px-3 py-2">Ruta</th>
              <th className="px-3 py-2">Distancia (km)</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {dataFiltrada && dataFiltrada.length > 0 ? (
              dataFiltrada.map((a) => {
                return (
                  <tr
                    key={`asignacion-${a.id}`}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="px-3 py-2">{a.fechaAsignacion}</td>
                    <td className="px-3 py-2">{a.choferNombre || "N/A"}</td>
                    <td className="px-3 py-2">
                      {a.vehiculoPlaca} - {a.vehiculoNombre}
                    </td>
                    <td className="px-3 py-2">{a.rutaNombre || "N/A"}</td>
                    <td className="px-3 py-2">{a.rutaDistancia || "N/A"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          normalizeTipoMaquinaria(a.tipoMaquinaria) === "Pesada"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {normalizeTipoMaquinaria(a.tipoMaquinaria) || "N/A"}
                      </span>
                    </td>
                    <td className="px-3 py-2 flex gap-2">
                      <button
                        onClick={() => handleVerDetalles(a)}
                        className="text-green-600 hover:underline text-xs font-medium"
                      >
                        Ver
                      </button>
                      {puedeCrearEditar && (
                        <>
                          <button
                            onClick={() => handleEdit(a)}
                            className="text-blue-600 hover:underline text-xs font-medium"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(a)}
                            className="text-red-600 hover:underline text-xs font-medium"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-3 py-2 text-center text-gray-500">
                  {esOperadorUsuario
                    ? "No tienes asignaciones registradas"
                    : "No hay asignaciones registradas"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de detalles */}
      {modalDetalles && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              Detalles de Asignación
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="font-medium">ID:</span>
                <span>{modalDetalles.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Fecha:</span>
                <span>{modalDetalles.fechaAsignacion}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Chofer:</span>
                <span>{modalDetalles.choferNombre || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Vehículo:</span>
                <span>{modalDetalles.vehiculoPlaca || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Ruta:</span>
                <span>{modalDetalles.rutaNombre || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tipo Maquinaria:</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    normalizeTipoMaquinaria(modalDetalles.tipoMaquinaria) ===
                    "Pesada"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {normalizeTipoMaquinaria(modalDetalles.tipoMaquinaria) ||
                    "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Distancia:</span>
                <span>{modalDetalles.rutaDistancia || "N/A"} km</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={cerrarModalDetalles}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
