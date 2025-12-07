import { useEffect, useState } from "react";
import api from "../api/api";

export default function RutasPage() {
  const [rutas, setRutas] = useState([]);
  const [form, setForm] = useState({
    id: null,
    nombre: "",
    puntoInicio: "",
    puntoFin: "",
    distancia: 0,
    estado: 1,
  });
  const [editing, setEditing] = useState(false);

  const load = async () => {
    const res = await api.get("/Rutas/listar");
    setRutas(res.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      distancia: Number(form.distancia),
      estado: Number(form.estado),
    };
    if (editing) {
      await api.put("/Rutas/actualizar", payload);
    } else {
      await api.post("/Rutas/crear", payload);
    }
    setForm({ id: null, nombre: "", puntoInicio: "", puntoFin: "", distancia: 0, estado: 1 });
    setEditing(false);
    load();
  };

  const handleEdit = (r) => {
    setForm(r);
    setEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar ruta?")) return;
    await api.delete(`/Rutas/eliminar/${id}`);
    load();
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Rutas</h1>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm">Nombre</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm">Punto inicio</label>
          <input
            name="puntoInicio"
            value={form.puntoInicio}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm">Punto fin</label>
          <input
            name="puntoFin"
            value={form.puntoFin}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm">Distancia (km)</label>
          <input
            type="number"
            name="distancia"
            value={form.distancia}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            {editing ? "Actualizar" : "Crear"}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Inicio</th>
              <th className="px-3 py-2">Fin</th>
              <th className="px-3 py-2">Distancia</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rutas.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.nombre}</td>
                <td className="px-3 py-2">{r.puntoInicio}</td>
                <td className="px-3 py-2">{r.puntoFin}</td>
                <td className="px-3 py-2">{r.distancia}</td>
                <td className="px-3 py-2 flex gap-2">
                  <button onClick={() => handleEdit(r)} className="text-blue-600">
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-red-600"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
