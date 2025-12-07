import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  normalizeAsignacion,
  normalizeConsumo,
  normalizeTipoMaquinaria,
} from "../utils/dataTransforms";
import {
  esOperador,
  obtenerRolUsuario,
  ROLES,
} from "../utils/permissionsHelper";
import { buildUserIdMatcher } from "../utils/userUtils";

const tipoOptions = [
  { value: "Liviana", label: "Liviana" },
  { value: "Pesada", label: "Pesada" },
];

const buildEmptyForm = () => ({
  id: null,
  fechaRegistro: new Date().toISOString().split("T")[0],
  estado: 1,
  combustibleReal: 0,
  asignacionRutaId: 0,
  motivo: "",
});

export default function ConsumosPage() {
  const { user } = useAuth();
  const [consumos, setConsumos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(buildEmptyForm);
  const rolNormalizado = obtenerRolUsuario(user);
  const esOperadorUsuario = esOperador(user);
  const puedeRegistrar = rolNormalizado === ROLES.OPERADOR;

  const matchesUsuarioActual = useMemo(() => buildUserIdMatcher(user), [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [consRes, asigRes] = await Promise.all([
        api.get("/ConsumoCombustible/listar"),
        api.get("/AsignacionRutas/listar"),
      ]);

      const asignacionesNormalizadas = (asigRes.data || [])
        .map(normalizeAsignacion)
        .filter(Boolean);

      const consumosNormalizados = (consRes.data || [])
        .map(normalizeConsumo)
        .filter(Boolean);

      const asignacionesFiltradas = esOperadorUsuario
        ? asignacionesNormalizadas.filter((a) =>
            matchesUsuarioActual(a?.choferUsuarioId)
          )
        : asignacionesNormalizadas;

      // Algunos consumos no exponen choferUsuarioId, así que enlazamos por asignación
      const idsAsignacionesUsuario = new Set(
        asignacionesFiltradas
          .map((a) => Number(a.id))
          .filter((id) => !Number.isNaN(id))
      );

      const consumosFiltrados = esOperadorUsuario
        ? consumosNormalizados.filter(
            (c) =>
              matchesUsuarioActual(c?.choferUsuarioId) ||
              (c.asignacionRutaId &&
                idsAsignacionesUsuario.has(Number(c.asignacionRutaId)))
          )
        : consumosNormalizados;

      setAsignaciones(asignacionesFiltradas);
      setConsumos(consumosFiltrados);
      setError(null);
    } catch (e) {
      console.error("Error cargando datos", e);
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [esOperadorUsuario, matchesUsuarioActual]);

  useEffect(() => {
    load();
  }, [load]);

  const asignacionesConConsumo = useMemo(() => {
    const ids = new Set();
    consumos.forEach((c) => {
      if (c.asignacionRutaId) ids.add(c.asignacionRutaId);
    });
    return ids;
  }, [consumos]);

  // Filtrar asignaciones disponibles según el rol y que sigan activas
  const asignacionesDisponibles = useMemo(() => {
    return asignaciones.filter(
      (a) => a.estado === 1 && !asignacionesConConsumo.has(a.id)
    );
  }, [asignaciones, asignacionesConConsumo]);

  // Filtrar consumos según tipo de maquinaria
  const dataFiltrada = useMemo(() => {
    if (!tipoFiltro) return consumos;
    return consumos.filter(
      (c) =>
        normalizeTipoMaquinaria(c.tipoMaquinaria).toLowerCase() ===
        tipoFiltro.toLowerCase()
    );
  }, [consumos, tipoFiltro]);

  const resumenPorTipo = useMemo(() => {
    const base = {
      Total: { estimado: 0, real: 0 },
      Liviana: { estimado: 0, real: 0 },
      Pesada: { estimado: 0, real: 0 },
    };

    dataFiltrada.forEach((c) => {
      const tipo = normalizeTipoMaquinaria(c.tipoMaquinaria);
      base.Total.estimado += c.combustibleEstimado;
      base.Total.real += c.combustibleReal;
      if (!base[tipo]) {
        base[tipo] = { estimado: 0, real: 0 };
      }
      base[tipo].estimado += c.combustibleEstimado;
      base[tipo].real += c.combustibleReal;
    });

    return base;
  }, [dataFiltrada]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const desactivarAsignacion = useCallback(
    async (asignacionId) => {
      const numericId = Number(asignacionId);
      if (Number.isNaN(numericId)) return null;

      const asignacion = asignaciones.find((a) => Number(a.id) === numericId);
      if (!asignacion) return null;

      const payload = {
        id: Number(asignacion.id),
        fechaAsignacion:
          asignacion.fechaAsignacion || new Date().toISOString().split("T")[0],
        estado: 0,
        choferId: Number(asignacion.choferId),
        vehiculoId: Number(asignacion.vehiculoId),
        rutaId: Number(asignacion.rutaId),
        choferIdAnterior: Number(asignacion.choferId),
      };

      try {
        const response = await api.put("/AsignacionRutas/actualizar", payload);
        const nuevoId = Number(response?.data?.id ?? asignacion.id);

        // reflejar cambio en la tabla local inmediatamente
        setAsignaciones((prev) =>
          prev.map((item) =>
            Number(item.id) === numericId
              ? { ...item, estado: 0, estadoTexto: "Inactivo" }
              : item
          )
        );

        return nuevoId;
      } catch (err) {
        console.error("No se pudo desactivar la asignación", err);
        setError(
          "El consumo se registró, pero la asignación no pudo desactivarse"
        );
        throw err;
      }
    },
    [asignaciones]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!puedeRegistrar) {
      setError("Solo los choferes pueden registrar consumo de combustible");
      return;
    }

    try {
      if (!form.asignacionRutaId || form.asignacionRutaId === 0) {
        setError("Debe seleccionar una asignación de ruta");
        return;
      }

      const asignacionSeleccionada = asignaciones.find(
        (a) => a.id === Number(form.asignacionRutaId)
      );

      if (!asignacionSeleccionada) {
        setError("La asignación seleccionada ya no está disponible");
        return;
      }

      if (asignacionSeleccionada.estado !== 1) {
        setError("La asignación seleccionada está inactiva");
        return;
      }

      if (asignacionesConConsumo.has(asignacionSeleccionada.id)) {
        setError("Esta asignación ya tiene un control de combustible");
        return;
      }

      if (!form.fechaRegistro) {
        setError("Debe ingresar una fecha");
        return;
      }

      if (form.combustibleReal <= 0) {
        setError("El combustible real debe ser mayor a 0");
        return;
      }

      let asignacionIdParaConsumo = Number(form.asignacionRutaId);

      if (puedeRegistrar) {
        try {
          const nuevoId = await desactivarAsignacion(asignacionIdParaConsumo);
          if (nuevoId) {
            asignacionIdParaConsumo = Number(nuevoId);
          }
        } catch {
          return; // Error ya manejado en desactivarAsignacion
        }
      }

      const payload = {
        fechaRegistro: form.fechaRegistro,
        estado: Number(form.estado),
        combustibleReal: Number(form.combustibleReal),
        asignacionRutaId: asignacionIdParaConsumo,
        motivo: form.motivo || "",
      };

      await api.post("/ConsumoCombustible/crear", payload);
      setSuccess("Consumo registrado correctamente");

      setForm(buildEmptyForm());
      await load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error al guardar consumo", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al guardar el registro de consumo"
      );
    }
  };
  // Solo el operador (chofer) puede registrar nuevos consumos
  const puedeCrear = puedeRegistrar;

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-500">Cargando consumos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold mb-6">Control de Combustible</h1>

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

      {/* Formulario de creación */}
      {puedeCrear && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <div>
            <label className="block text-sm font-medium">Fecha *</label>
            <input
              type="date"
              name="fechaRegistro"
              value={form.fechaRegistro}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Asignación *</label>
            <select
              name="asignacionRutaId"
              value={form.asignacionRutaId}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              required
            >
              <option value={0}>Seleccione asignación</option>
              {asignacionesDisponibles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.choferNombre || "N/A"} - {a.rutaNombre || "N/A"} (
                  {normalizeTipoMaquinaria(a.tipoMaquinaria)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Combustible (L) *
            </label>
            <input
              type="number"
              name="combustibleReal"
              value={form.combustibleReal}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Motivo</label>
            <input
              type="text"
              name="motivo"
              value={form.motivo}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              placeholder="Ej: Repostaje en parada"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
            >
              Registrar
            </button>
          </div>
        </form>
      )}

      {/* Filtro */}
      <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow">
        <span className="text-sm font-medium">Filtrar por tipo:</span>
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Todos</option>
          {tipoOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-b">
          {["Liviana", "Pesada", "Total"].map((tipo) => {
            const info = resumenPorTipo[tipo] || { estimado: 0, real: 0 };
            const diferencia = info.real - info.estimado;
            return (
              <div key={tipo} className="bg-slate-50 rounded-md p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {tipo}
                </p>
                <p className="text-sm text-gray-600">
                  Estimado:{" "}
                  <span className="font-semibold">
                    {info.estimado.toFixed(2)} L
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Real:{" "}
                  <span className="font-semibold">
                    {info.real.toFixed(2)} L
                  </span>
                </p>
                <p
                  className={`text-sm font-semibold ${
                    diferencia >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  Diferencia: {diferencia.toFixed(2)} L
                </p>
              </div>
            );
          })}
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Chofer</th>
              <th className="px-3 py-2">Ruta</th>
              <th className="px-3 py-2">Vehículo</th>
              <th className="px-3 py-2">Estimado (L)</th>
              <th className="px-3 py-2">Real (L)</th>
              <th className="px-3 py-2">Diferencia</th>
              <th className="px-3 py-2">Motivo</th>
              <th className="px-3 py-2">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {dataFiltrada && dataFiltrada.length > 0 ? (
              dataFiltrada.map((c) => {
                return (
                  <tr
                    key={`consumo-${c.id}`}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="px-3 py-2">{c.fechaRegistro}</td>
                    <td className="px-3 py-2">{c.choferNombre || "N/A"}</td>
                    <td className="px-3 py-2">{c.rutaNombre || "N/A"}</td>
                    <td className="px-3 py-2">{c.vehiculoNombre || "N/A"}</td>
                    <td className="px-3 py-2">
                      {c.combustibleEstimado.toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      {c.combustibleReal.toFixed(2)}
                    </td>
                    <td
                      className={`px-3 py-2 font-semibold ${
                        c.diferencia >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {c.diferencia.toFixed(2)} L
                    </td>
                    <td className="px-3 py-2">{c.motivo || "-"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          normalizeTipoMaquinaria(c.tipoMaquinaria) === "Pesada"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {normalizeTipoMaquinaria(c.tipoMaquinaria)}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="px-3 py-2 text-center text-gray-500">
                  {esOperadorUsuario
                    ? "No tienes registros de consumo"
                    : "No hay registros de consumo"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
