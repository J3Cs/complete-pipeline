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
    <section className="rounded-lg bg-slate-50 p-4 shadow-md mb-6">
      <h2 className="text-lg font-semibold">Crear Nuevo Ticket</h2>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col text-sm text-slate-600 mb-2">
          <label htmlFor="titulo" className="font-medium">
            Título del problema
          </label>
          <input
            id="titulo"
            className='rounded-md border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Fallo en pasarela de pago"
            required
          />
        </div>
        <div className="flex flex-col text-sm text-slate-600 mb-4">
          <label htmlFor="descripcion" className="font-medium">
            Descripción detallada
          </label>
          <textarea
            className='rounded-md border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            id="descripcion"
            rows="3"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Paso a paso para reproducir el fallo..."
            required
          />
        </div>
        <button type="submit" className="rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 py-2 px-4" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Ticket'}
        </button>
      </form>
    </section>
  );
};