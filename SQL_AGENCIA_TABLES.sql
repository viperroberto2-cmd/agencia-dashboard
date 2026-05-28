-- ============================================================================
-- AGENCIA RG PRODUCTION - TABLAS SUPABASE
-- Ejecutar esto en Supabase > SQL Editor
-- ============================================================================

-- 1. CLIENTES
CREATE TABLE IF NOT EXISTS agencia_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE,
  telefono TEXT,
  estado TEXT CHECK (estado IN ('activo', 'pausado', 'terminado')) DEFAULT 'activo',
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- 2. CONECTORES (OAuth tokens)
CREATE TABLE IF NOT EXISTS agencia_conectores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES agencia_clientes(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('whatsapp', 'facebook', 'instagram', 'youtube', 'gdrive')) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cliente_id, tipo)
);

-- 3. VIDEOS GENERADOS
CREATE TABLE IF NOT EXISTS agencia_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES agencia_clientes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT CHECK (estado IN ('borrador', 'aprobado', 'publicado', 'entregado', 'rechazado')) DEFAULT 'borrador',
  imagen_url TEXT,
  video_url TEXT,
  audio_url TEXT,
  formatos JSONB DEFAULT '{}', -- {tiktok_url, instagram_url, youtube_url, facebook_url, gdrive_url}
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_entrega TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- 4. TRABAJOS/CAMPAIGNS
CREATE TABLE IF NOT EXISTS agencia_trabajos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES agencia_clientes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'entregado')) DEFAULT 'pendiente',
  videos_necesarios INT DEFAULT 1,
  videos_completados INT DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- 5. MEMORIA/SKILLS POR CLIENTE
CREATE TABLE IF NOT EXISTS agencia_memoria_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES agencia_clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'brand_voice', 'estilo', 'restricciones', 'preferencias', 'skill_*'
  contenido JSONB NOT NULL,
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cliente_id, tipo)
);

-- 6. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_agencia_clientes_estado ON agencia_clientes(estado);
CREATE INDEX IF NOT EXISTS idx_agencia_conectores_cliente ON agencia_conectores(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agencia_videos_cliente ON agencia_videos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agencia_videos_estado ON agencia_videos(estado);
CREATE INDEX IF NOT EXISTS idx_agencia_trabajos_cliente ON agencia_trabajos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agencia_memoria_cliente ON agencia_memoria_cliente(cliente_id);

-- 7. ROW LEVEL SECURITY (Opcional pero recomendado)
ALTER TABLE agencia_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencia_conectores ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencia_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencia_trabajos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencia_memoria_cliente ENABLE ROW LEVEL SECURITY;

PRINT 'Tablas creadas exitosamente ✅';
