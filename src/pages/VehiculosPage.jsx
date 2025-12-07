import { useEffect, useState } from "react";
import api from "../api/api";
import { normalizeTipoMaquinaria } from "../utils/dataTransforms";

const tipoOptions = [
  { value: "Liviana", label: "Liviana" },
  { value: "Pesada", label: "Pesada" },
];

const estadoOperativoOptions = [
  { value: "Operativo", label: "Operativo" },
  { value: "Mantenimiento", label: "Mantenimiento" },
];

const estadoVehiculoOptions = [
  { value: "Eliminado", label: "Eliminado" },
  { value: "Activo", label: "Activo" },
];

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    id: null,
    placa: "",
    tipoMaquinaria: "Liviana",
    estadoOperativo: "Operativo",
    capacidadCombustible: 0,
    fechaRegistro: new Date().toISOString().split("T")[0],
    consumoCombustibleKm: 0,
    estado: "Activo",
    descripcion: "",
    nombre: "",
    tipoMaquinariaAnterior: null,
  });
  const [editing, setEditing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/Vehiculos/listar");
      setVehiculos(res.data || []);
    } catch (e) {
      console.error("Error cargando vehículos", e);
      setError("Error al cargar vehículos");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const obtenerTipoMaquinaria = (valor) =>
    normalizeTipoMaquinaria(valor ?? "Liviana");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Validar campos obligatorios
      if (!form.placa.trim()) {
        setError("La placa es obligatoria");
        return;
      }

      if (!form.nombre.trim()) {
        setError("El nombre es obligatorio");
        return;
      }

      if (form.capacidadCombustible <= 0) {
        setError("La capacidad de combustible debe ser mayor a 0");
        return;
      }

      if (form.consumoCombustibleKm <= 0) {
        setError("El consumo de combustible por km debe ser mayor a 0");
        return;
      }

      // Construir payload con solo los campos que el backend espera
      const payload = {
        placa: form.placa.trim(),
        nombre: form.nombre.trim(),
        tipoMaquinaria: form.tipoMaquinaria,
        estadoOperativo: form.estadoOperativo,
        capacidadCombustible: Number(form.capacidadCombustible),
        fechaRegistro: form.fechaRegistro,
        consumoCombustibleKm: Number(form.consumoCombustibleKm),
        estado: form.estado,
        descripcion: form.descripcion.trim(),
      };

      if (editing) {
        payload.id = Number(form.id);
        payload.tipoMaquinariaAnterior =
          form.tipoMaquinariaAnterior || form.tipoMaquinaria;
        await api.put("/Vehiculos/actualizar", payload);
      } else {
        await api.post("/Vehiculos/crear", payload);
      }

      setForm({
        id: null,
        placa: "",
        tipoMaquinaria: "Liviana",
        estadoOperativo: "Operativo",
        capacidadCombustible: 0,
        fechaRegistro: new Date().toISOString().split("T")[0],
        consumoCombustibleKm: 0,
        estado: "Activo",
        descripcion: "",
        nombre: "",
        tipoMaquinariaAnterior: null,
      });
      setEditing(false);
      await load();
    } catch (err) {
      console.error("Error al guardar vehículo", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al guardar el vehículo"
      );
    }
  };

  const handleEdit = (v) => {
    const tipoNormalizado = obtenerTipoMaquinaria(v.tipoMaquinaria);
    setForm({
      ...v,
      tipoMaquinaria: tipoNormalizado,
      tipoMaquinariaAnterior: tipoNormalizado,
    });
    setEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setForm({
      id: null,
      placa: "",
      tipoMaquinaria: "Liviana",
      estadoOperativo: "Operativo",
      capacidadCombustible: 0,
      fechaRegistro: new Date().toISOString().split("T")[0],
      consumoCombustibleKm: 0,
      estado: "Activo",
      descripcion: "",
      nombre: "",
      tipoMaquinariaAnterior: null,
    });
    setEditing(false);
    setError(null);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Vehículos</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div>
          <label className="block text-sm font-medium">Placa *</label>
          <input
            name="placa"
            value={form.placa}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Nombre *</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Tipo Maquinaria</label>
          <select
            name="tipoMaquinaria"
            value={form.tipoMaquinaria}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
          >
            {tipoOptions.map((opt) => (
              <option key={`tipo-${opt.value}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">
            Capacidad Combustible *
          </label>
          <input
            type="number"
            step="0.01"
            name="capacidadCombustible"
            value={form.capacidadCombustible}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Consumo Combustible/Km *
          </label>
          <input
            type="number"
            step="0.01"
            name="consumoCombustibleKm"
            value={form.consumoCombustibleKm}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Fecha Registro</label>
          <input
            type="date"
            name="fechaRegistro"
            value={form.fechaRegistro}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Estado Operativo</label>
          <select
            name="estadoOperativo"
            value={form.estadoOperativo}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
          >
            {estadoOperativoOptions.map((opt) => (
              <option key={`estado-op-${opt.value}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Estado</label>
          <select
            name="estado"
            value={form.estado}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
          >
            {estadoVehiculoOptions.map((opt) => (
              <option key={`estado-${opt.value}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm font-medium">Descripción</label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            rows="2"
          />
        </div>
        <div className="flex items-end gap-2 md:col-span-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            {editing ? "Actualizar" : "Crear"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Placa</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Estado Operativo</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Capacidad (L)</th>
              <th className="px-3 py-2">Consumo (L/km)</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehiculos && vehiculos.length > 0 ? (
              vehiculos.map((v) => (
                <tr key={`vehiculo-${v.id}`} className="border-t">
                  <td className="px-3 py-2">{v.placa}</td>
                  <td className="px-3 py-2">{v.nombre}</td>
                  <td className="px-3 py-2">{v.tipoMaquinaria}</td>
                  <td className="px-3 py-2">{v.estadoOperativo}</td>
                  <td className="px-3 py-2">{v.estado || "Activo"}</td>
                  <td className="px-3 py-2">{v.capacidadCombustible}</td>
                  <td className="px-3 py-2">{v.consumoCombustibleKm}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(v)}
                      className="text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-3 py-2 text-center text-gray-500">
                  No hay vehículos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
