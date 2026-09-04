import { useState, useEffect } from 'react';
import { getTickets, createTicket, uploadAttachment } from './api/ticketsApi';
import { TicketForm } from './components/TicketForm';
import { TicketList } from './components/TicketList';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

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
    <div class="container">
      <header>
        <h1>Sistema de Tickets de Soporte</h1>
        <p class="subtitle">
          Frontend con React + Express + PostgreSQL + LocalStack
        </p>
      </header>

      <main>
        <TicketForm onTicketCreated={handleCreateTicket} />
        <TicketList
          tickets={tickets}
          loading={loading}
          onRefresh={fetchAllTickets}
          onUploadAttachment={handleUploadAttachment}
        />
      </main>
    </div>
  );
}