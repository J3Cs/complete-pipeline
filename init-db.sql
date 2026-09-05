-- Estructura para el Sistema de Tickets de Soporte
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla principal de Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50) DEFAULT 'PENDIENTE', -- PENDIENTE, EN_COLA, PROCESADO, ERROR
    prioridad VARCHAR(20) DEFAULT 'MEDIA',  -- BAJA, MEDIA, ALTA, CRITICA
    s3_bucket VARCHAR(100),
    s3_key VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Eventos / Timeline de Procesamiento Asíncrono
CREATE TABLE IF NOT EXISTS ticket_events (
    id SERIAL PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    paso VARCHAR(50) NOT NULL, -- TICKET_CREADO, SUBIDO_A_S3, ENCOLADO_SQS, PROCESADO_LAMBDA, ERROR_LAMBDA
    detalles JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS adjuntos_tickets (
    id SERIAL PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    s3_key VARCHAR(255) NOT NULL,
    url_publica TEXT,
    procesado BOOLEAN DEFAULT FALSE,
    subido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuario semilla por defecto
INSERT INTO usuarios (nombre, email) 
VALUES ('Soporte General', 'soporte@empresa.com') 
ON CONFLICT (email) DO NOTHING;
