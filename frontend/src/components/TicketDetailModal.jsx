import { useEffect, useState } from "react";
import { getTicketDetails } from "../api/ticketsApi";

export function TicketDetailModal({ ticketId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticketId) return;
    
    setLoading(true);
    getTicketDetails(ticketId)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ticketId]);

  if (!ticketId) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold text-lg"
        >
          ✕
        </button>

        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">
            Cargando trazabilidad e historial del ticket...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-950/50 border border-red-800 text-red-200 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header del Ticket */}
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-indigo-400">
                  #{data.ticket.id} - {data.ticket.titulo}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  {data.ticket.estado}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-2">{data.ticket.descripcion}</p>
            </div>

            {/* Timeline Traza Async */}
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-4 uppercase tracking-wider">
                Línea de Tiempo y Trazabilidad (S3 / SQS / Lambda)
              </h3>

              <div className="relative border-l-2 border-slate-800 pl-4 ml-2 space-y-6">
                {data.timeline.map((item, index) => (
                  <div key={index} className="relative group">
                    {/* Indicador de Estado */}
                    <div
                      className={`absolute -left-[21px] top-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        item.estado === "COMPLETADO" || item.estado === "PROCESADO"
                          ? "bg-emerald-500"
                          : item.estado === "FALLIDO"
                          ? "bg-rose-500"
                          : "bg-amber-500 animate-pulse"
                      }`}
                    />

                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{item.evento}</span>
                        <span className="text-slate-500">
                          {new Date(item.fecha).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{item.detalle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}