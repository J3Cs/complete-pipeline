-- Estructura para el Sistema de Tickets de Soporte
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'ABIERTO', -- ABIERTO, EN_PROCESO, CERRADO
    usuario_id INT REFERENCES usuarios(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS adjuntos_tickets (
    id SERIAL PRIMARY KEY,
    ticket_id INT REFERENCES tickets(id),
    s3_key VARCHAR(255) NOT NULL,
    url_publica TEXT,
    procesado BOOLEAN DEFAULT FALSE,
    subido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuario semilla por defecto
INSERT INTO usuarios (nombre, email) 
VALUES ('Soporte General', 'soporte@empresa.com') 
ON CONFLICT (email) DO NOTHING;