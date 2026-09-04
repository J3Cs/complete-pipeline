import * as ticketService from '../services/ticketService.js';
import * as storageService from '../services/storageService.js';

export const getTickets = async (req, res) => {
  try {
    const tickets = await ticketService.getAllTicketsWithAttachments();
    res.json(tickets);
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createTicket = async (req, res) => {
  const { titulo, descripcion, usuario_id } = req.body;

  if (!titulo || !descripcion) {
    return res.status(400).json({ error: 'El título y la descripción son requeridos.' });
  }

  try {
    const nuevoTicket = await ticketService.createTicketInDb(titulo, descripcion, usuario_id);
    res.status(201).json(nuevoTicket);
  } catch (error) {
    console.error('Error al crear ticket:', error);
    res.status(500).json({ error: error.message });
  }
};

export const uploadAttachment = async (req, res) => {
  const ticketId = req.params.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No se envió ningún archivo.' });
  }

  try {
    // 1. Subir a S3
    const s3Key = await storageService.uploadFileToS3(file, ticketId);

    // 2. Registrar en base de datos PostgreSQL
    const adjunto = await ticketService.registerAttachmentInDb(ticketId, s3Key);

    res.status(201).json({
      mensaje: 'Archivo subido exitosamente a S3. Evento encolado en SQS.',
      adjunto,
    });
  } catch (error) {
    console.error('Error al adjuntar archivo:', error);
    res.status(500).json({ error: error.message });
  }
};