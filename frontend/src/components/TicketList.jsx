import { TicketItem } from './TicketItem';

export const TicketList = ({ tickets, loading, onRefresh, onUploadAttachment }) => {
  return (
    <section class="card">
      <div class="section-header">
        <h2>Tickets Registrados</h2>
        <button class="btn-secondary" onClick={onRefresh} disabled={loading}>
          🔄 Actualizar
        </button>
      </div>

      {loading ? (
        <p class="loading">Cargando tickets desde el servidor...</p>
      ) : tickets.length === 0 ? (
        <p class="loading">No hay tickets registrados.</p>
      ) : (
        <div class="tickets-grid">
          {tickets.map((ticket) => (
            <TicketItem
              key={ticket.id}
              ticket={ticket}
              onUploadAttachment={onUploadAttachment}
            />
          ))}
        </div>
      )}
    </section>
  );
};