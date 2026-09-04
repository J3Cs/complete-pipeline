import multer from 'multer';

// Guardar temporalmente el archivo en memoria antes de pasarlo a S3
const storage = multer.memoryStorage();

export const uploadSingle = multer({ storage }).single('archivo');