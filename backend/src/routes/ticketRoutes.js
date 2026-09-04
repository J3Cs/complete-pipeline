import { Router } from 'express';
import * as ticketController from '../controllers/ticketController.js';
import { uploadSingle } from '../middlewares/upload.js';

const router = Router();

router.get('/tickets', ticketController.getTickets);
router.post('/tickets', ticketController.createTicket);
router.post('/tickets/:id/adjuntos', uploadSingle, ticketController.uploadAttachment);

export default router;