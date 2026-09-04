import { useState } from 'react';

export const TicketItem = ({ ticket, onUploadAttachment }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      await onUploadAttachment(ticket.id, file);
      setFile(null);
      e.target.reset();
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div class="ticket-card">
      <div class="ticket-header">
        <span class="ticket-title">#{ticket.id} - {ticket.titulo}</span>
        <span class="badge-status">{ticket.estado}</span>
      </div>
      <p class="ticket-desc">{ticket.descripcion}</p>
      <div class="ticket-date">
        Creado: {new Date(ticket.creado_en).toLocaleString()}
      </div>

      <div class="attachments-section">
        <label>Archivos en S3 (Procesados vía SQS/Lambda):</label>
        <div>
          {ticket.adjuntos && ticket.adjuntos.length > 0 ? (
            ticket.adjuntos.map((adj) => (
              <span key={adj.id} class="attachment-tag">
                📄 {adj.s3_key}
              </span>
            ))
          ) : (
            <em style={{ fontSize: '12px', color: '#94a3b8' }}>
              Sin evidencias adjuntas
            </em>
          )}
        </div>

        <form class="upload-form" onSubmit={handleFileSubmit}>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
          <button type="submit" class="btn-secondary" disabled={uploading}>
            {uploading ? 'Subiendo...' : 'Subir a S3'}
          </button>
        </form>
      </div>
    </div>
  );
};