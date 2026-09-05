import { useState, useEffect } from "react";
import { getTickets, createTicket, uploadAttachment } from "./api/ticketsApi";
import { TicketForm } from "./components/TicketForm";
import { TicketList } from "./components/TicketList";
import MetricsDashboard from "./components/MetricsDashboard";
import { TicketDetailModal } from './components/TicketDetailModal'; // Importar el modal

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null); // Estado para la traza

  const fetchAllTickets = async () => {
    setLoading(true);
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTickets();
  }, []);

  const handleCreateTicket = async (ticketData) => {
    await createTicket(ticketData);
    await fetchAllTickets();
  };

  const handleUploadAttachment = async (ticketId, file) => {
    await uploadAttachment(ticketId, file);
    await fetchAllTickets();
  };

  return (
    <div className="container mx-2 md:mx-auto p-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Sistema de Tickets de Soporte
        </h1>
      </header>

      <main>
        <div className="flex flex-row justify-around gap-2">
          <div>
            <TicketForm onTicketCreated={handleCreateTicket} />
            <TicketList
              tickets={tickets}
              loading={loading}
              onRefresh={fetchAllTickets}
              onUploadAttachment={handleUploadAttachment}
              onSelectTicket={(id) => setSelectedTicketId(id)} // Callback para abrir modal
            />
          </div>
          <div className="w-full md:w-1/2">
            <MetricsDashboard />
          </div>
        </div>
      </main>
      {/* Renderizar modal si hay un ID seleccionado */}
      {selectedTicketId && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}
    </div>
  );
}
