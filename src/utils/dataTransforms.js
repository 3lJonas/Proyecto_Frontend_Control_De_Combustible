const LIVIANA = "Liviana";
const PESADA = "Pesada";

export const TIPO_MAQUINARIA = {
  LIVIANA,
  PESADA,
};

export function normalizeTipoMaquinaria(valor) {
  if (valor === null || valor === undefined) return "Desconocido";

  if (typeof valor === "number") {
    return valor === 0 ? LIVIANA : PESADA;
  }

  const texto = valor?.toString().toLowerCase() ?? "";
  if (texto.includes("livian")) return LIVIANA;
  if (texto.includes("pesad")) return PESADA;
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "Desconocido";
}

const toNumber = (valor, precision = 2) => {
  if (valor === null || valor === undefined || valor === "") return 0;
  const num = Number(valor);
  if (Number.isNaN(num)) return 0;
  return precision === null ? num : Number(num.toFixed(precision));
};

const pick = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key];
  }
  return undefined;
};

export function normalizeAsignacion(rawAsignacion) {
  if (!rawAsignacion) return null;

  const chofer = pick(rawAsignacion, "chofer", "Chofer") || null;
  const vehiculo = pick(rawAsignacion, "vehiculo", "Vehiculo") || null;
  const ruta = pick(rawAsignacion, "ruta", "Ruta") || null;
  const choferUsuario = pick(chofer, "usuario", "Usuario") || null;

  const estadoValor = pick(rawAsignacion, "estado", "Estado") ?? 0;

  return {
    id: pick(rawAsignacion, "id", "Id") ?? null,
    fechaAsignacion:
      pick(rawAsignacion, "fechaAsignacion", "FechaAsignacion") || "",
    estado: estadoValor,
    estadoTexto: estadoValor === 1 ? "Activo" : "Inactivo",
    choferId:
      pick(chofer, "id", "Id") ??
      pick(rawAsignacion, "choferId", "ChoferId") ??
      null,
    choferUsuarioId:
      pick(choferUsuario, "id", "Id") ??
      pick(chofer, "idUsuario", "IdUsuario") ??
      pick(rawAsignacion, "choferId", "ChoferId") ??
      null,
    choferNombre: pick(chofer, "nombre", "Nombre") || "",
    choferDisponible: pick(chofer, "disponible", "Disponible") ?? true,
    choferTipoMaquinaria: normalizeTipoMaquinaria(
      pick(chofer, "tipoMaquinaria", "TipoMaquinaria")
    ),
    vehiculoId:
      pick(vehiculo, "id", "Id") ??
      pick(rawAsignacion, "vehiculoId", "VehiculoId") ??
      null,
    vehiculoNombre: pick(vehiculo, "nombre", "Nombre") || "",
    vehiculoPlaca: pick(vehiculo, "placa", "Placa") || "",
    vehiculoTipo: normalizeTipoMaquinaria(
      pick(vehiculo, "tipoMaquinaria", "TipoMaquinaria")
    ),
    vehiculoConsumoKm: toNumber(
      pick(vehiculo, "consumoCombustibleKm", "ConsumoCombustibleKm")
    ),
    rutaId:
      pick(ruta, "id", "Id") ?? pick(rawAsignacion, "rutaId", "RutaId") ?? null,
    rutaNombre: pick(ruta, "nombre", "Nombre") || "",
    rutaDistancia: toNumber(pick(ruta, "distancia", "Distancia"), 3),
    rutaPuntoInicio: pick(ruta, "puntoInicio", "PuntoInicio") || "",
    rutaPuntoFin: pick(ruta, "puntoFin", "PuntoFin") || "",
    tipoMaquinaria:
      normalizeTipoMaquinaria(
        pick(vehiculo, "tipoMaquinaria", "TipoMaquinaria") ??
          pick(chofer, "tipoMaquinaria", "TipoMaquinaria")
      ) || "Desconocido",
    raw: rawAsignacion,
  };
}

export function normalizeConsumo(rawConsumo) {
  if (!rawConsumo) return null;

  const asignacion = normalizeAsignacion(
    pick(rawConsumo, "asignacionRuta", "AsignacionRuta")
  );

  const combustibleReal = toNumber(
    pick(rawConsumo, "combustibleReal", "CombustibleReal"),
    3
  );
  const combustibleEstimado = toNumber(
    pick(rawConsumo, "combustibleEstimado", "CombustibleEstimado"),
    3
  );
  const estadoValor = pick(rawConsumo, "estado", "Estado") ?? 0;

  return {
    id: pick(rawConsumo, "id", "Id") ?? null,
    fechaRegistro: pick(rawConsumo, "fechaRegistro", "FechaRegistro") || "",
    estado: estadoValor,
    estadoTexto: estadoValor === 1 ? "Activo" : "Inactivo",
    combustibleReal,
    combustibleEstimado,
    diferencia: toNumber(combustibleReal - combustibleEstimado, 3),
    motivo: pick(rawConsumo, "motivo", "Motivo") || "",
    asignacion,
    asignacionRutaId: asignacion?.id ?? null,
    choferUsuarioId: asignacion?.choferUsuarioId ?? null,
    choferNombre: asignacion?.choferNombre || "",
    vehiculoNombre: asignacion?.vehiculoNombre || "",
    vehiculoTipo: asignacion?.tipoMaquinaria || "Desconocido",
    rutaNombre: asignacion?.rutaNombre || "",
    rutaDistancia: asignacion?.rutaDistancia ?? 0,
    tipoMaquinaria: asignacion?.tipoMaquinaria || "Desconocido",
    raw: rawConsumo,
  };
}
