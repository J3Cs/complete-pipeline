import { TicketItem } from "./TicketItem";

export function TicketList({
  tickets,
  loading,
  onRefresh,
  onUploadAttachment,
  onSelectTicket,
}) {
  if (loading) {
    return (
      <div className="p-4 text-center text-slate-500">Cargando tickets...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">
          Tickets Registrados
        </h2>
        <button
          onClick={onRefresh}
          className="px-3 py-1 bg-green-700 hover:bg-green-900 text-slate-700 text-xs font-semibold rounded text-white transition-colors"
        >
          Actualizar
        </button>
      </div>

      {tickets.length === 0 ? (
        <p className="text-slate-500 text-sm">
          No hay tickets registrados aún.
        </p>
      ) : (
        tickets.map((ticket) => (
          <TicketItem
            key={ticket.id}
            ticket={ticket}
            onUploadAttachment={onUploadAttachment}
            onSelectTicket={onSelectTicket} // <-- Pasar prop aquí
          />
        ))
      )}
    </div>
  );
}
