import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function MetricsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    try {
      // Ajusta la URL según la variable de entorno o puerto de tu backend en Express (ej: http://localhost:5000/api/metrics/dashboard)
      const res = await fetch(`${API_URL}/metrics/dashboard`);
      if (!res.ok) throw new Error("Error al consultar las métricas");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Polling cada 10 segundos
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 animate-pulse">
        Cargando telemetría de la infraestructura...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950/50 border border-red-800 text-red-200 rounded-xl text-sm">
        ⚠️ {error}. Verifica que el backend Express y LocalStack/AWS estén
        activos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de Estado (SQS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Mensajes en Cola (SQS)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-indigo-400">
              {data?.sqs?.enCola ?? 0}
            </span>
            <span className="text-xs text-slate-500">
              Pendientes de procesar
            </span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            En Procesamiento Activo
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-400">
              {data?.sqs?.enProceso ?? 0}
            </span>
            <span className="text-xs text-slate-500">
              Mensajes tomados por Lambda
            </span>
          </div>
        </div>
      </div>

      {/* Gráfica de Errores CloudWatch */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Errores de Procesamiento (CloudWatch)
            </h3>
            <p className="text-xs text-slate-400">
              Intervalos de 5 minutos (Última hora)
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            En vivo
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data?.errors ?? []}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorErrores" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.5rem",
                  color: "#f8fafc",
                }}
              />
              <Area
                type="monotone"
                dataKey="errores"
                name="Errores"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorErrores)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
