import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { normalizeTipoMaquinaria } from "../utils/dataTransforms";

const tipoMaquinariaOptions = [
  { value: 0, label: "Liviana" },
  { value: 1, label: "Pesada" },
];

const estadoOptions = [
  { value: 0, label: "Eliminado" },
  { value: 1, label: "Activo" },
];

const OPERADOR_ROLE_ID_DEFAULT = 3; // rol operador fijo solicitado por negocio

const buildEmptyForm = (rolIdDefault = OPERADOR_ROLE_ID_DEFAULT) => ({
  id: null,
  idUsuario: null,
  nombre: "",
  identificacion: "",
  disponible: true,
  estado: 1,
  tipoMaquinaria: 0,
  fechaNacimiento: "",
  email: "",
  nombreUsuario: "",
  hashContrasena: "",
  rolId: rolIdDefault,
});

export default function ChoferesPage() {
  const { roles: rolesFromContext } = useAuth();
  const operadorRoleId = useMemo(() => {
    if (rolesFromContext?.length) {
      const rolOperador = rolesFromContext.find((rol) =>
        rol?.nombre?.toLowerCase()?.includes("operador")
      );
      if (rolOperador) return rolOperador.id;
    }
    return OPERADOR_ROLE_ID_DEFAULT;
  }, [rolesFromContext]);
  const [choferes, setChoferes] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(() => buildEmptyForm(operadorRoleId));
  const [editing, setEditing] = useState(false);

  const load = async () => {
    try {
      const [choferesRes, usuariosRes] = await Promise.all([
        api.get("/Choferes/listar"),
        api.get("/Usuarios/listar").catch((err) => {
          console.warn("No se pudo cargar usuarios", err);
          return { data: [] };
        }),
      ]);

      const usuariosMap = new Map(
        (usuariosRes.data || []).map((usuario) => [usuario.id, usuario])
      );

      const choferesEnriquecidos = (choferesRes.data || []).map((ch) => {
        const idUsuario =
          ch.idUsuario ??
          ch.id_usuario ??
          ch.usuario?.id ??
          ch.usuarioId ??
          null;

        const usuarioAsociado =
          ch.usuario || (idUsuario ? usuariosMap.get(idUsuario) : null);

        return {
          ...ch,
          idUsuario,
          usuario: usuarioAsociado || null,
        };
      });

      setChoferes(choferesEnriquecidos);
      setError(null);
    } catch (e) {
      console.error("Error cargando choferes", e);
      setError("Error al cargar choferes");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!editing) {
      setForm((prev) => ({
        ...prev,
        rolId: operadorRoleId,
      }));
    }
  }, [editing, operadorRoleId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Validar campos obligatorios
      if (!form.nombre.trim()) {
        setError("El nombre es obligatorio");
        return;
      }

      if (!form.identificacion.trim()) {
        setError("La identificación es obligatoria");
        return;
      }

      if (!editing && !form.email.trim()) {
        setError("El email es obligatorio");
        return;
      }

      if (!editing && !form.nombreUsuario.trim()) {
        setError("El nombre de usuario es obligatorio");
        return;
      }

      if (!editing && !form.hashContrasena.trim()) {
        setError("La contraseña es obligatoria");
        return;
      }

      // Construir payload sin campos innecesarios al crear
      if (editing) {
        if (!form.idUsuario) {
          setError("El chofer no tiene un usuario asociado");
          return;
        }
        const payload = {
          id: Number(form.id),
          nombre: form.nombre.trim(),
          identificacion: form.identificacion.trim(),
          disponible: Boolean(form.disponible),
          estado: Number(form.estado),
          tipoMaquinaria: Number(form.tipoMaquinaria),
          fechaNacimiento: form.fechaNacimiento || null,
          idUsuario: Number(form.idUsuario),
        };
        await api.put("/Choferes/actualizar", payload);
      } else {
        const payload = {
          nombre: form.nombre.trim(),
          identificacion: form.identificacion.trim(),
          disponible: Boolean(form.disponible),
          estado: Number(form.estado),
          tipoMaquinaria: Number(form.tipoMaquinaria),
          fechaNacimiento: form.fechaNacimiento || null,
          email: form.email.trim(),
          nombreUsuario: form.nombreUsuario.trim(),
          rolId: Number(operadorRoleId || OPERADOR_ROLE_ID_DEFAULT),
          hashContrasena: form.hashContrasena.trim(),
        };
        await api.post("/Choferes/crear", payload);
      }

      setForm(buildEmptyForm(operadorRoleId));
      setEditing(false);
      await load();
    } catch (err) {
      console.error("Error al guardar chofer", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al guardar el chofer"
      );
    }
  };

  const handleEdit = (ch) => {
    setForm({
      id: ch.id,
      idUsuario: ch.idUsuario ?? ch.usuario?.id ?? null,
      nombre: ch.nombre ?? "",
      identificacion: ch.identificacion ?? "",
      disponible: Boolean(ch.disponible),
      estado: Number(ch.estado ?? 1),
      tipoMaquinaria:
        typeof ch.tipoMaquinaria === "number"
          ? ch.tipoMaquinaria
          : ch.tipoMaquinaria?.toString().toLowerCase().includes("pesad")
          ? 1
          : 0,
      fechaNacimiento: ch.fechaNacimiento || "",
      email: ch.usuario?.email ?? ch.usuario?.Email ?? "",
      nombreUsuario:
        ch.usuario?.nombreUsuario ?? ch.usuario?.Nombre_usuario ?? "",
      hashContrasena: "",
      rolId: operadorRoleId,
    });
    setEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setForm(buildEmptyForm(operadorRoleId));
    setEditing(false);
    setError(null);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Choferes</h1>

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
          <label className="block text-sm font-medium">Identificación *</label>
          <input
            name="identificacion"
            value={form.identificacion}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            required
          />
        </div>
        {!editing && (
          <>
            <div>
              <label className="block text-sm font-medium">Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-2 py-1 text-sm"
                required={!editing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Nombre de usuario *
              </label>
              <input
                name="nombreUsuario"
                value={form.nombreUsuario}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-2 py-1 text-sm"
                required={!editing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Contraseña *</label>
              <input
                name="hashContrasena"
                type="password"
                value={form.hashContrasena}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-2 py-1 text-sm"
                required
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium">
            Fecha de nacimiento
          </label>
          <input
            name="fechaNacimiento"
            type="date"
            value={form.fechaNacimiento}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
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
            {tipoMaquinariaOptions.map((opt) => (
              <option key={`tipo-${opt.value}`} value={opt.value}>
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
            {estadoOptions.map((opt) => (
              <option key={`estado-${opt.value}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input
            id="disponible"
            type="checkbox"
            name="disponible"
            checked={form.disponible}
            onChange={handleChange}
          />
          <label htmlFor="disponible" className="text-sm">
            Disponible
          </label>
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
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Identificación</th>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Tipo Maquinaria</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Disponible</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {choferes && choferes.length > 0 ? (
              choferes.map((c) => (
                <tr key={`chofer-${c.id}`} className="border-t">
                  <td className="px-3 py-2">{c.nombre}</td>
                  <td className="px-3 py-2">{c.identificacion}</td>
                  <td className="px-3 py-2">
                    {c.usuario?.nombreUsuario || c.usuario?.email || "N/A"}
                  </td>
                  <td className="px-3 py-2">
                    {normalizeTipoMaquinaria(c.tipoMaquinaria)}
                  </td>
                  <td className="px-3 py-2">
                    {estadoOptions.find((e) => e.value === Number(c.estado))
                      ?.label || "Activo"}
                  </td>
                  <td className="px-3 py-2">{c.disponible ? "Sí" : "No"}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(c)}
                      className="text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-3 py-2 text-center text-gray-500">
                  No hay choferes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
