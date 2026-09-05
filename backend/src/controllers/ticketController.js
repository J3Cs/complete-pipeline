import * as ticketService from "../services/ticketService.js";
import * as storageService from "../services/storageService.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getTickets = async (req, res) => {
  try {
    const tickets = await ticketService.getAllTicketsWithAttachments();
    res.json(tickets);
  } catch (error) {
    console.error("Error al obtener tickets:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createTicket = async (req, res) => {
  const { titulo, descripcion } = req.body;

  if (!titulo || !descripcion) {
    return res
      .status(400)
      .json({ error: "El título y la descripción son requeridos." });
  }

  try {
    const nuevoTicket = await ticketService.createTicketInDb(
      titulo,
      descripcion,
    );
    res.status(201).json(nuevoTicket);
  } catch (error) {
    console.error("Error al crear ticket:", error);
    res.status(500).json({ error: error.message });
  }
};

export const uploadAttachment = async (req, res) => {
  const ticketId = req.params.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No se envió ningún archivo." });
  }

  try {
    // 1. Subir a S3
    const s3Key = await storageService.uploadFileToS3(file, ticketId);

    // 2. Registrar en base de datos PostgreSQL
    const adjunto = await ticketService.registerAttachmentInDb(ticketId, s3Key);

    res.status(201).json({
      mensaje: "Archivo subido exitosamente a S3. Evento encolado en SQS.",
      adjunto,
    });
  } catch (error) {
    console.error("Error al adjuntar archivo:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/tickets/:id
// Obtener detalle completo de un ticket con su línea de tiempo
export const getTicketById = async (req, res) => {
  const { id } = req.params;
  
  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({ 
      error: `El ID '${id}' no tiene un formato UUID válido.` 
    });
  }
  try {
    // 1. Obtener la información general del ticket
    const ticketResult = await ticketService.getTicketDetailsFromDb(id);

    if (!ticketResult) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    const ticket = ticketResult;

    // 2. Obtener adjuntos y eventos de procesamiento
    const attachmentsResult = await ticketService.getAttachmentsForTicket(id);

    ticket.adjuntos = attachmentsResult.map((adj) => ({
      id: adj.id,
      s3_key: adj.s3_key,
      url_publica: adj.url_publica,
      procesado: adj.procesado,
      subido_en: adj.subido_en,
    }));

    // 3. Estructurar la línea de tiempo de eventos
    const timeline = [
      {
        evento: "Ticket Creado",
        estado: "COMPLETADO",
        fecha: ticket.created_at,
        detalle: "El ticket fue registrado en el sistema.",
      },
    ];

    ticket.adjuntos.forEach((adj) => {
      timeline.push({
        evento: `Subida de Adjunto: ${adj.s3_key}`,
        estado: "COMPLETADO",
        fecha: adj.subido_en,
        detalle: "Archivo enviado a S3.",
      });

      timeline.push({
        evento: `Procesamiento Async (SQS/Lambda)`,
        estado: adj.procesado ? "PROCESADO" : "PENDIENTE",
        fecha: adj.subido_en,
        detalle:
          adj.procesado
            ? "Mensaje consumido y procesado exitosamente por la Lambda."
            : "Mensaje en cola SQS esperando ejecución.",
      });
    });

    res.json({ ticket, timeline });
  } catch (error) {
    console.error("Error obteniendo detalle del ticket:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
