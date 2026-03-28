-- ============================================================
-- ADICIONAR NOVOS CAMPOS NA TABELA CLIENTES
-- ============================================================

-- 1. Adicionar campo 'tipo' (orçamento ou pedido)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'orcamento' 
  CHECK (tipo IN ('orcamento', 'pedido'));

-- 2. Adicionar campo 'estado_atual' (status de entrega)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS estado_atual TEXT DEFAULT 'No WMS'
  CHECK (estado_atual IN ('No WMS', 'Não Entregue', 'Entregue', 'Item Virtual Enviado'));

-- 3. Adicionar campo 'garantia' (boolean)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS garantia BOOLEAN DEFAULT FALSE;

-- 4. Adicionar campo 'valor_garantia' (valor numérico)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS valor_garantia NUMERIC(12, 2) DEFAULT 0;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_tipo ON public.clientes(tipo);
CREATE INDEX IF NOT EXISTS idx_clientes_estado_atual ON public.clientes(estado_atual);
CREATE INDEX IF NOT EXISTS idx_clientes_garantia ON public.clientes(garantia);

-- ============================================================
-- FIM DA ADIÇÃO DE CAMPOS
-- ============================================================
