import { dbPool } from "../config/db.js";

export const getAllTicketsWithAttachments = async () => {
  const query = `
    SELECT t.id, t.titulo, t.descripcion, t.estado, t.created_at,
           COALESCE(
             json_agg(
               json_build_object('id', a.id, 's3_key', a.s3_key, 'subido_en', a.subido_en)
             ) FILTER (WHERE a.id IS NOT NULL), '[]'
           ) AS adjuntos
    FROM tickets t
    LEFT JOIN adjuntos_tickets a ON t.id = a.ticket_id
    GROUP BY t.id
    ORDER BY t.created_at DESC;
  `;
  const { rows } = await dbPool.query(query);
  return rows;
};

export const createTicketInDb = async (titulo, descripcion) => {
  const query = `
    INSERT INTO tickets (titulo, descripcion) 
    VALUES ($1, $2) 
    RETURNING *;
  `;
  const { rows } = await dbPool.query(query, [titulo, descripcion]);
  return rows[0];
};

export const registerAttachmentInDb = async (ticketId, s3Key) => {
  const query = `
    INSERT INTO adjuntos_tickets (ticket_id, s3_key) 
    VALUES ($1, $2) 
    RETURNING *;
  `;
  const { rows } = await dbPool.query(query, [ticketId, s3Key]);
  return rows[0];
};

export const getTicketDetailsFromDb = async (ticketId) => {
  const ticketQuery = `SELECT id, titulo, descripcion, estado, prioridad, created_at 
       FROM tickets 
       WHERE id = $1`;
  const { rows } = await dbPool.query(ticketQuery, [ticketId]);
  return rows[0];
};

export const getAttachmentsForTicket = async (ticketId) => {
  const attachmentsQuery = `
    SELECT id, s3_key, url_publica, procesado, subido_en
     FROM adjuntos_tickets
     WHERE ticket_id = $1
     ORDER BY subido_en ASC
  `;
  const { rows } = await dbPool.query(attachmentsQuery, [ticketId]);
  return rows;
};
