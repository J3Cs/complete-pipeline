import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ticketRoutes from './src/routes/ticketRoutes.js';

dotenv.config();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Montaje de rutas
app.use('/api', ticketRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en http://localhost:${PORT}`);
});