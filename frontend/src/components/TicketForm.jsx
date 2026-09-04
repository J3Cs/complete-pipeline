import { useState } from 'react';

export const TicketForm = ({ onTicketCreated }) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim()) return;

    setLoading(true);
    try {
      await onTicketCreated({ titulo, descripcion });
      setTitulo('');
      setDescripcion('');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section class="card">
      <h2>Crear Nuevo Ticket</h2>
      <form onSubmit={handleSubmit}>
        <div class="form-group">
          <label htmlFor="titulo">Título del problema</label>
          <input
            id="titulo"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Fallo en pasarela de pago"
            required
          />
        </div>
        <div class="form-group">
          <label htmlFor="descripcion">Descripción detallada</label>
          <textarea
            id="descripcion"
            rows="3"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Paso a paso para reproducir el fallo..."
            required
          />
        </div>
        <button type="submit" class="btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Ticket'}
        </button>
      </form>
    </section>
  );
};