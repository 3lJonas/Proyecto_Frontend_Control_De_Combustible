import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalVehiculos: 0,
    livianos: 0,
    pesados: 0,
    totalConsumos: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const [vehRes, consRes] = await Promise.all([
          api.get("/Vehiculos/listar"),
          api.get("/ConsumoCombustible/listar"),
        ]);
        const vehiculos = vehRes.data || [];
        const consumos = consRes.data || [];
        const livianos = vehiculos.filter(
          (v) => v.tipoMaquinaria?.toLowerCase() === "liviana"
        ).length;
        const pesados = vehiculos.filter(
          (v) => v.tipoMaquinaria?.toLowerCase() === "pesada"
        ).length;
        setStats({
          totalVehiculos: vehiculos.length,
          livianos,
          pesados,
          totalConsumos: consumos.length,
        });
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const tarjetas = useMemo(
    () => [
      { label: "Vehículos", value: stats.totalVehiculos },
      { label: "Livianos", value: stats.livianos },
      { label: "Pesados", value: stats.pesados },
      { label: "Registros de consumo", value: stats.totalConsumos },
    ],
    [stats]
  );

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-semibold mb-6">Dashboard</h1>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tarjetas.map((tarjeta, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition"
          >
            <p className="text-gray-600 text-sm font-medium">{tarjeta.label}</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {tarjeta.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
