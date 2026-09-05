import { useState } from "react";

export const TicketItem = ({ ticket, onUploadAttachment, onSelectTicket }) => {
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

  // ID único asignado por cada ticket de la lista
  const inputId = `file-upload-${ticket.id}`;

  return (
    <div className="rounded-lg border border-slate-300 p-4 bg-slate-50 shadow-md space-y-3 mb-4">
      {/* Encabezado del Ticket */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-indigo-600 font-bold">
          #{ticket.id} - {ticket.titulo}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectTicket(ticket.id)}
            className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded transition-colors font-medium"
          >
            Ver Traza 🔍
          </button>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-200 text-slate-700">
            {ticket.estado}
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-600">{ticket.descripcion}</p>

      <div className="text-xs text-slate-500">
        Creado:{" "}
        {ticket.created_at
          ? new Date(ticket.created_at).toLocaleString()
          : "Sin fecha"}
      </div>

      {/* Lista de Archivos Adjuntos (vía SQS / Lambda) */}
      <div className="text-xs text-slate-700 pt-2 border-t border-slate-200">
        <label className="font-semibold block mb-1">
          Archivos en S3 (Procesados vía SQS/Lambda):
        </label>

        <div className="flex flex-wrap gap-2 my-2">
          {ticket.adjuntos && ticket.adjuntos.length > 0 ? (
            ticket.adjuntos.map((adj) => (
              <span
                key={adj.id || adj.s3_key}
                className="text-xs text-slate-600 bg-slate-200 border border-slate-300 px-2 py-1 rounded flex items-center gap-1"
              >
                📄 {adj.s3_key}
              </span>
            ))
          ) : (
            <em className="text-slate-400 text-xs">Sin evidencias adjuntas</em>
          )}
        </div>

        {/* Formulario de Subida aislado por ID dinámico */}
        <form className="text-sm mt-3" onSubmit={handleFileSubmit}>
          <div className="flex items-center gap-3">
            <label
              htmlFor={inputId}
              className="cursor-pointer rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Seleccionar archivo
            </label>

            <input
              id={inputId}
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="sr-only"
            />

            <span className="text-xs text-slate-600 truncate max-w-[200px]">
              {file ? file.name : "Ningún archivo seleccionado"}
            </span>

            <button
              type="submit"
              className="rounded-md bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 py-1.5 px-3 transition-colors ml-auto"
              disabled={!file || uploading}
            >
              {uploading ? "Subiendo..." : "Subir a S3"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
