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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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
    totalAsignaciones: 0,
    vehiculosOperativos: 0,
    vehiculosMantenimiento: 0,
    choferesDisponibles: 0,
    combustibleTotal: 0,
    promedioConsumo: 0,
  });
  const [consumosPorMes, setConsumosPorMes] = useState([]);
  const [consumosPorVehiculo, setConsumosPorVehiculo] = useState([]);
  const [consumosPorTipo, setConsumosPorTipo] = useState([]);
  const [rutasMasUsadas, setRutasMasUsadas] = useState([]);
  const [choferesMasActivos, setChoferesMasActivos] = useState([]);
  const [estadoVehiculos, setEstadoVehiculos] = useState([]);
  const [eficienciaVehiculos, setEficienciaVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [vehRes, consRes, chofRes, rutRes, asigRes] = await Promise.all([
          api.get("/Vehiculos/listar"),
          api.get("/ConsumoCombustible/listar"),
          api.get("/Choferes/listar"),
          api.get("/Rutas/listar"),
          api.get("/AsignacionRutas/listar"),
        ]);
        
        const vehiculos = vehRes.data || [];
        const consumos = consRes.data || [];
        const choferes = chofRes.data || [];
        const rutas = rutRes.data || [];
        const asignaciones = asigRes.data || [];
        
        // Estadísticas básicas de vehículos
        const livianos = vehiculos.filter(
          (v) => v.tipoMaquinaria?.toLowerCase() === "liviana"
        ).length;
        const pesados = vehiculos.filter(
          (v) => v.tipoMaquinaria?.toLowerCase() === "pesada"
        ).length;
        
        const vehiculosOperativos = vehiculos.filter(
          (v) => v.estadoOperativo?.toLowerCase() === "operativo"
        ).length;
        const vehiculosMantenimiento = vehiculos.filter(
          (v) => v.estadoOperativo?.toLowerCase() === "mantenimiento"
        ).length;
        
        const choferesDisponibles = choferes.filter(
          (c) => c.disponible === true
        ).length;

        // Calcular combustible total y promedio
        const combustibleTotal = consumos.reduce(
          (sum, c) => sum + (c.combustibleReal || 0),
          0
        );
        const promedioConsumo = consumos.length > 0 
          ? combustibleTotal / consumos.length 
          : 0;

        setStats({
          totalVehiculos: vehiculos.length,
          livianos,
          pesados,
          totalConsumos: consumos.length,
          totalChoferes: choferes.length,
          totalRutas: rutas.length,
          totalAsignaciones: asignaciones.length,
          vehiculosOperativos,
          vehiculosMantenimiento,
          choferesDisponibles,
          combustibleTotal,
          promedioConsumo,
        });

        // Procesar consumos por mes (últimos 6 meses)
        const consumosPorMesMap = {};
        consumos.forEach((c) => {
          if (c.fechaRegistro) {
            const fecha = new Date(c.fechaRegistro);
            const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            const mesLabel = fecha.toLocaleDateString("es-ES", {
              month: "short",
              year: "numeric",
            });
            if (!consumosPorMesMap[mesKey]) {
              consumosPorMesMap[mesKey] = { 
                mes: mesLabel, 
                combustible: 0, 
                registros: 0,
                fecha: fecha 
              };
            }
            consumosPorMesMap[mesKey].combustible += c.combustibleReal || 0;
            consumosPorMesMap[mesKey].registros += 1;
          }
        });
        const consumosMes = Object.values(consumosPorMesMap)
          .sort((a, b) => a.fecha - b.fecha)
          .slice(-6)
          .map(({ mes, combustible, registros }) => ({ 
            mes, 
            combustible: Number(combustible.toFixed(2)), 
            registros 
          }));
        setConsumosPorMes(consumosMes);

        // Top 10 vehículos con mayor consumo
        const consumosPorVehMap = {};
        consumos.forEach((c) => {
          const placa = c.placaVehiculo || "Sin placa";
          const vehiculo = vehiculos.find(v => v.placa === placa);
          if (!consumosPorVehMap[placa]) {
            consumosPorVehMap[placa] = { 
              placa, 
              combustible: 0,
              nombre: vehiculo?.nombre || placa
            };
          }
          consumosPorVehMap[placa].combustible += c.combustibleReal || 0;
        });
        const consumosVeh = Object.values(consumosPorVehMap)
          .sort((a, b) => b.combustible - a.combustible)
          .slice(0, 10)
          .map(item => ({
            ...item,
            combustible: Number(item.combustible.toFixed(2))
          }));
        setConsumosPorVehiculo(consumosVeh);

        // Consumos por tipo de maquinaria
        const combustibleLiviana = consumos
          .filter((c) => c.tipoMaquinaria?.toLowerCase() === "liviana")
          .reduce((sum, c) => sum + (c.combustibleReal || 0), 0);
        const combustiblePesada = consumos
          .filter((c) => c.tipoMaquinaria?.toLowerCase() === "pesada")
          .reduce((sum, c) => sum + (c.combustibleReal || 0), 0);
        
        setConsumosPorTipo([
          { tipo: "Liviana", combustible: Number(combustibleLiviana.toFixed(2)) },
          { tipo: "Pesada", combustible: Number(combustiblePesada.toFixed(2)) },
        ]);

        // Rutas más usadas
        const rutasMap = {};
        asignaciones.forEach((a) => {
          const rutaId = a.rutaId;
          const ruta = rutas.find(r => r.id === rutaId);
          if (ruta) {
            if (!rutasMap[rutaId]) {
              rutasMap[rutaId] = { 
                nombre: ruta.nombre || `Ruta ${rutaId}`, 
                asignaciones: 0,
                distancia: ruta.distancia || 0
              };
            }
            rutasMap[rutaId].asignaciones += 1;
          }
        });
        const rutasTop = Object.values(rutasMap)
          .sort((a, b) => b.asignaciones - a.asignaciones)
          .slice(0, 8);
        setRutasMasUsadas(rutasTop);

        // Choferes más activos
        const choferesMap = {};
        asignaciones.forEach((a) => {
          const choferId = a.choferId;
          const chofer = choferes.find(ch => ch.id === choferId);
          if (chofer) {
            if (!choferesMap[choferId]) {
              choferesMap[choferId] = { 
                nombre: chofer.nombre || `Chofer ${choferId}`, 
                asignaciones: 0 
              };
            }
            choferesMap[choferId].asignaciones += 1;
          }
        });
        const choferesTop = Object.values(choferesMap)
          .sort((a, b) => b.asignaciones - a.asignaciones)
          .slice(0, 8);
        setChoferesMasActivos(choferesTop);

        // Estado de vehículos
        setEstadoVehiculos([
          { estado: "Operativo", cantidad: vehiculosOperativos },
          { estado: "Mantenimiento", cantidad: vehiculosMantenimiento },
        ]);

        // Eficiencia de vehículos (consumo promedio por vehículo)
        const eficienciaMap = {};
        consumos.forEach((c) => {
          const placa = c.placaVehiculo;
          const vehiculo = vehiculos.find(v => v.placa === placa);
          if (vehiculo && vehiculo.consumoCombustibleKm) {
            if (!eficienciaMap[placa]) {
              eficienciaMap[placa] = {
                vehiculo: vehiculo.nombre || placa,
                consumoReal: 0,
                consumoEsperado: vehiculo.consumoCombustibleKm,
                registros: 0
              };
            }
            eficienciaMap[placa].consumoReal += c.combustibleReal || 0;
            eficienciaMap[placa].registros += 1;
          }
        });
        const eficienciaData = Object.values(eficienciaMap)
          .map(item => ({
            vehiculo: item.vehiculo,
            promedio: Number((item.consumoReal / item.registros).toFixed(2)),
            esperado: item.consumoEsperado
          }))
          .slice(0, 6);
        setEficienciaVehiculos(eficienciaData);

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
        subtext: `${stats.vehiculosOperativos} operativos`,
        color: "from-blue-500 to-blue-600",
        textColor: "text-blue-600",
      },
      {
        label: "Vehículos Livianos",
        value: stats.livianos,
        subtext: `${((stats.livianos / stats.totalVehiculos) * 100 || 0).toFixed(0)}% del total`,
        color: "from-green-500 to-green-600",
        textColor: "text-green-600",
      },
      {
        label: "Vehículos Pesados",
        value: stats.pesados,
        subtext: `${((stats.pesados / stats.totalVehiculos) * 100 || 0).toFixed(0)}% del total`,
        color: "from-orange-500 to-orange-600",
        textColor: "text-orange-600",
      },
      {
        label: "Total Consumos",
        value: stats.totalConsumos,
        subtext: `${stats.combustibleTotal.toFixed(2)} L totales`,
        color: "from-red-500 to-red-600",
        textColor: "text-red-600",
      },
      {
        label: "Total Choferes",
        value: stats.totalChoferes,
        subtext: `${stats.choferesDisponibles} disponibles`,
        color: "from-purple-500 to-purple-600",
        textColor: "text-purple-600",
      },
      {
        label: "Total Rutas",
        value: stats.totalRutas,
        subtext: `${stats.totalAsignaciones} asignaciones`,
        color: "from-pink-500 to-pink-600",
        textColor: "text-pink-600",
      },
      {
        label: "Promedio Consumo",
        value: stats.promedioConsumo.toFixed(2),
        subtext: "Litros por registro",
        color: "from-indigo-500 to-indigo-600",
        textColor: "text-indigo-600",
      },
      {
        label: "En Mantenimiento",
        value: stats.vehiculosMantenimiento,
        subtext: "Vehículos",
        color: "from-yellow-500 to-yellow-600",
        textColor: "text-yellow-600",
      },
    ],
    [stats]
  );

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    
    setExportando(true);
    try {
      const element = dashboardRef.current;
      
      // Calcular dimensiones
      const scale = 2;
      const canvas = await toPng(element, {
        quality: 1,
        pixelRatio: scale,
        backgroundColor: "#f3f4f6",
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Crear imagen
      const img = new Image();
      img.src = canvas;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = pageWidth - 20;
      const imgHeight = (img.height * imgWidth) / img.width;
      
      // Si la imagen es más alta que una página, dividirla
      const maxHeight = pageHeight - 20;
      let heightLeft = imgHeight;
      let position = 10;
      let page = 0;

      // Primera página - Header
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text("Dashboard Control de Combustible", pageWidth / 2, 15, { align: "center" });
      pdf.setFontSize(10);
      pdf.text(`Generado: ${new Date().toLocaleString("es-ES")}`, pageWidth / 2, 21, { align: "center" });

      position = 30;

      while (heightLeft > 0) {
        if (page > 0) {
          pdf.addPage();
          position = 10;
        }

        const sliceHeight = Math.min(maxHeight, heightLeft);
        const sourceY = (imgHeight - heightLeft) * (img.height / imgHeight);
        const sourceHeight = sliceHeight * (img.height / imgHeight);

        // Crear canvas temporal para el slice
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = sourceHeight;
        const ctx = tempCanvas.getContext('2d');
        
        ctx.drawImage(
          img,
          0,
          sourceY,
          img.width,
          sourceHeight,
          0,
          0,
          img.width,
          sourceHeight
        );

        pdf.addImage(
          tempCanvas.toDataURL('image/png'),
          'PNG',
          10,
          position,
          imgWidth,
          sliceHeight
        );

        heightLeft -= maxHeight;
        page++;
      }

      // Footer en última página
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Sistema de Control de Combustible - Página ${page}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: "center" }
      );

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Fijo */}
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard de Control de Combustible
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Bienvenido, <span className="font-semibold text-blue-600">{user?.nombre || "Usuario"}</span>
              </p>
            </div>
            <button
              onClick={exportToPDF}
              disabled={exportando}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {exportando ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando PDF...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div ref={dashboardRef} className="max-w-7xl mx-auto px-6 py-8 space-y-8 bg-gray-50">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tarjetas.map((tarjeta, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              <div className={`h-2 bg-gradient-to-r ${tarjeta.color}`}></div>
              <div className="p-6">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                  {tarjeta.label}
                </p>
                <p className={`text-4xl font-bold ${tarjeta.textColor} mb-1`}>
                  {tarjeta.value}
                </p>
                <p className="text-gray-400 text-sm">
                  {tarjeta.subtext}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Consumo por Mes - Area Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Consumo de Combustible Mensual
              </h3>
              <span className="text-xs text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
                Últimos 6 meses
              </span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={consumosPorMes}>
                <defs>
                  <linearGradient id="colorCombustible" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  stroke="#9CA3AF"
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  stroke="#9CA3AF"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="combustible"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCombustible)"
                  name="Combustible (L)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Consumo por Tipo - Pie Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Distribución por Tipo de Maquinaria
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={consumosPorTipo}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ tipo, percent }) =>
                    `${tipo}: ${(percent * 100).toFixed(0)}%`
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
                <Tooltip 
                  formatter={(value) => `${Number(value).toFixed(2)} L`}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Vehículos y Estado */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top 10 Vehículos con Mayor Consumo */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Vehículos con Mayor Consumo
              </h3>
              <span className="text-xs text-gray-500 bg-red-50 px-3 py-1 rounded-full">
                Top 10
              </span>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={consumosPorVehiculo} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="placa" 
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="#9CA3AF"
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  stroke="#9CA3AF"
                  label={{ value: 'Litros', angle: -90, position: 'insideLeft', fill: '#6B7280' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value) => [`${value} L`, 'Consumo']}
                />
                <Bar
                  dataKey="combustible"
                  fill="#3B82F6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Estado de Vehículos */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Estado de Vehículos
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={estadoVehiculos}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cantidad"
                  label={({ estado, cantidad }) => `${estado}: ${cantidad}`}
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Registros y Actividad */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registros por Mes */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Evolución de Registros
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={consumosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  stroke="#9CA3AF"
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  stroke="#9CA3AF"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="registros"
                  stroke="#10B981"
                  strokeWidth={3}
                  name="Registros"
                  dot={{ fill: '#10B981', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Rutas Más Usadas */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Rutas Más Utilizadas
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rutasMasUsadas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="nombre" 
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="#9CA3AF"
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  stroke="#9CA3AF"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="asignaciones"
                  fill="#8B5CF6"
                  radius={[8, 8, 0, 0]}
                  name="Asignaciones"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Choferes y Eficiencia */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Choferes Más Activos */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Choferes Más Activos
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={choferesMasActivos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  type="number" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  stroke="#9CA3AF"
                />
                <YAxis 
                  dataKey="nombre" 
                  type="category" 
                  width={100}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  stroke="#9CA3AF"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="asignaciones"
                  fill="#EC4899"
                  radius={[0, 8, 8, 0]}
                  name="Asignaciones"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Eficiencia de Vehículos */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Eficiencia de Combustible
              </h3>
              <span className="text-xs text-gray-500 bg-green-50 px-3 py-1 rounded-full">
                Real vs Esperado
              </span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={eficienciaVehiculos}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis 
                  dataKey="vehiculo" 
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                />
                <PolarRadiusAxis 
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                />
                <Radar
                  name="Promedio Real"
                  dataKey="promedio"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Esperado"
                  dataKey="esperado"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
                <Legend />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">Resumen General</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm opacity-90 mb-1">Total Combustible</p>
              <p className="text-3xl font-bold">
                {stats.combustibleTotal.toFixed(2)} L
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90 mb-1">Promedio por Registro</p>
              <p className="text-3xl font-bold">
                {stats.promedioConsumo.toFixed(2)} L
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90 mb-1">Eficiencia Promedio</p>
              <p className="text-3xl font-bold">
                {stats.totalVehiculos > 0 
                  ? (stats.combustibleTotal / stats.totalVehiculos).toFixed(2) 
                  : 0} L/V
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90 mb-1">Última Actualización</p>
              <p className="text-3xl font-bold">
                {new Date().toLocaleDateString("es-ES", { day: '2-digit', month: 'short' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
