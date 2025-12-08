import { useEffect, useMemo, useState, useRef } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function DashboardPage() {
  const { user } = useAuth();
  const dashboardRef = useRef(null);
  const [stats, setStats] = useState({
    totalVehiculos: 0,
    livianos: 0,
    pesados: 0,
    totalConsumos: 0,
    totalChoferes: 0,
    totalRutas: 0,
  });
  const [consumosPorMes, setConsumosPorMes] = useState([]);
  const [consumosPorVehiculo, setConsumosPorVehiculo] = useState([]);
  const [consumosPorTipo, setConsumosPorTipo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [vehRes, consRes, chofRes, rutRes] = await Promise.all([
          api.get("/Vehiculos/listar"),
          api.get("/ConsumoCombustible/listar"),
          api.get("/Choferes/listar"),
          api.get("/Rutas/listar"),
        ]);
        
        const vehiculos = vehRes.data || [];
        const consumos = consRes.data || [];
        const choferes = chofRes.data || [];
        const rutas = rutRes.data || [];
        
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
          totalChoferes: choferes.length,
          totalRutas: rutas.length,
        });

        // Procesar consumos por mes
        const consumosPorMesMap = {};
        consumos.forEach((c) => {
          if (c.fechaRegistro) {
            const fecha = new Date(c.fechaRegistro);
            const mes = fecha.toLocaleDateString("es-ES", {
              month: "short",
              year: "numeric",
            });
            if (!consumosPorMesMap[mes]) {
              consumosPorMesMap[mes] = { mes, combustible: 0, registros: 0 };
            }
            consumosPorMesMap[mes].combustible += c.combustibleReal || 0;
            consumosPorMesMap[mes].registros += 1;
          }
        });
        const consumosMes = Object.values(consumosPorMesMap)
          .sort((a, b) => new Date(a.mes) - new Date(b.mes))
          .slice(-6);
        setConsumosPorMes(consumosMes);

        // Procesar consumos por vehículo (top 10)
        const consumosPorVehMap = {};
        consumos.forEach((c) => {
          const placa = c.placaVehiculo || "Sin placa";
          if (!consumosPorVehMap[placa]) {
            consumosPorVehMap[placa] = { placa, combustible: 0 };
          }
          consumosPorVehMap[placa].combustible += c.combustibleReal || 0;
        });
        const consumosVeh = Object.values(consumosPorVehMap)
          .sort((a, b) => b.combustible - a.combustible)
          .slice(0, 10);
        setConsumosPorVehiculo(consumosVeh);

        // Consumos por tipo de maquinaria
        const consumosTipo = [
          {
            tipo: "Liviana",
            combustible: consumos
              .filter((c) => c.tipoMaquinaria?.toLowerCase() === "liviana")
              .reduce((sum, c) => sum + (c.combustibleReal || 0), 0),
          },
          {
            tipo: "Pesada",
            combustible: consumos
              .filter((c) => c.tipoMaquinaria?.toLowerCase() === "pesada")
              .reduce((sum, c) => sum + (c.combustibleReal || 0), 0),
          },
        ];
        setConsumosPorTipo(consumosTipo);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const tarjetas = useMemo(
    () => [
      {
        label: "Total Vehículos",
        value: stats.totalVehiculos,
        icon: "🚗",
        color: "bg-blue-500",
      },
      {
        label: "Vehículos Livianos",
        value: stats.livianos,
        icon: "🚙",
        color: "bg-green-500",
      },
      {
        label: "Vehículos Pesados",
        value: stats.pesados,
        icon: "🚛",
        color: "bg-orange-500",
      },
      {
        label: "Registros de Consumo",
        value: stats.totalConsumos,
        icon: "⛽",
        color: "bg-red-500",
      },
      {
        label: "Total Choferes",
        value: stats.totalChoferes,
        icon: "👤",
        color: "bg-purple-500",
      },
      {
        label: "Total Rutas",
        value: stats.totalRutas,
        icon: "🗺️",
        color: "bg-pink-500",
      },
    ],
    [stats]
  );

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    
    setExportando(true);
    try {
      const element = dashboardRef.current;
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#f3f4f6",
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 297;
      const imgHeight = (element.offsetHeight * imgWidth) / element.offsetWidth;

      pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`dashboard-combustible-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al exportar el dashboard. Por favor intenta de nuevo.");
    } finally {
      setExportando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Dashboard de Control de Combustible
            </h1>
            <p className="text-gray-600">
              Bienvenido, <span className="font-semibold">{user?.nombre || "Usuario"}</span>
            </p>
          </div>
          <button
            onClick={exportToPDF}
            disabled={exportando}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {exportando ? (
              <>
                <span className="animate-spin">⏳</span>
                Exportando...
              </>
            ) : (
              <>
                <span>📥</span>
                Descargar PDF
              </>
            )}
          </button>
        </div>

        {/* Dashboard Content */}
        <div ref={dashboardRef} className="space-y-6 bg-gray-100 p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tarjetas.map((tarjeta, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">
                      {tarjeta.label}
                    </p>
                    <p className="text-4xl font-bold text-gray-800">
                      {tarjeta.value}
                    </p>
                  </div>
                  <div className={`${tarjeta.color} p-4 rounded-full text-3xl`}>
                    {tarjeta.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consumo por Mes - Area Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                📊 Consumo de Combustible por Mes
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={consumosPorMes}>
                  <defs>
                    <linearGradient id="colorCombustible" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="combustible"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorCombustible)"
                    name="Combustible (L)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Consumo por Tipo - Pie Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                🥧 Distribución por Tipo de Maquinaria
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={consumosPorTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ tipo, combustible }) =>
                      `${tipo}: ${combustible.toFixed(1)}L`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="combustible"
                  >
                    {consumosPorTipo.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top 10 Vehículos con Mayor Consumo - Bar Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                🏆 Top 10 Vehículos con Mayor Consumo
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={consumosPorVehiculo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="placa" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="combustible"
                    fill="#3B82F6"
                    name="Combustible (L)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Registros por Mes - Line Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                📈 Cantidad de Registros por Mes
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={consumosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="registros"
                    stroke="#10B981"
                    strokeWidth={3}
                    name="Registros"
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-500 text-sm">Total Combustible Consumido</p>
                <p className="text-2xl font-bold text-blue-600">
                  {consumosPorTipo
                    .reduce((sum, t) => sum + t.combustible, 0)
                    .toFixed(2)}{" "}
                  L
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Promedio por Registro</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalConsumos > 0
                    ? (
                        consumosPorTipo.reduce((sum, t) => sum + t.combustible, 0) /
                        stats.totalConsumos
                      ).toFixed(2)
                    : 0}{" "}
                  L
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Última Actualización</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Date().toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
