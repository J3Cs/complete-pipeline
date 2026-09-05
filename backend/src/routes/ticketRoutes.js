import { Router } from 'express';
import { getTickets, createTicket, uploadAttachment, getTicketById } from '../controllers/ticketController.js';
import { getDashboardMetrics } from '../controllers/metricsController.js';
import { uploadSingle } from '../middlewares/upload.js';

const router = Router();

router.get('/tickets', getTickets);
router.post('/tickets', createTicket);
router.post('/tickets/:id/adjuntos', uploadSingle, uploadAttachment);
router.get("/tickets/:id", getTicketById);
router.get("/metrics/dashboard", getDashboardMetrics);

export default router;