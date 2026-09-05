const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const getTickets = async () => {
  const response = await fetch(`${API_URL}/tickets`);
  if (!response.ok) throw new Error("Error al obtener los tickets");
  return response.json();
};

export const createTicket = async (ticketData) => {
  const response = await fetch(`${API_URL}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ticketData),
  });
  if (!response.ok) throw new Error("Error al crear el ticket");
  return response.json();
};

export const uploadAttachment = async (ticketId, file) => {
  const formData = new FormData();
  formData.append("archivo", file);

  const response = await fetch(`${API_URL}/tickets/${ticketId}/adjuntos`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Error al subir el archivo a S3");
  return response.json();
};

export const getTicketDetails = async (id) => {
  const res = await fetch(`${API_URL}/tickets/${id}`);
  if (!res.ok) throw new Error("Error al obtener los detalles del ticket");
  return await res.json();
};
