-- ============================================================
-- CRM LOJA DO MECÂNICO — MIGRATION v3
-- Adição de campos de clientes e sistema de metas
-- ============================================================

-- 1. Adicionar novos campos na tabela de clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS cpf_cnpj text,
ADD COLUMN IF NOT EXISTS numero_pedido text,
ADD COLUMN IF NOT EXISTS numero_orcamento text,
ADD COLUMN IF NOT EXISTS comprou_garantia boolean DEFAULT false;

-- 2. Criar tabela de metas
CREATE TABLE IF NOT EXISTS public.metas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) on delete cascade not null,
  mes_ano text not null, -- Formato 'YYYY-MM'
  meta_venda numeric(12, 2) DEFAULT 0,
  meta_garantia numeric(12, 2) DEFAULT 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  UNIQUE(user_id, mes_ano)
);

-- 3. Habilitar RLS para a tabela de metas
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de segurança para metas
CREATE POLICY "Vendedores gerenciam suas próprias metas"
  ON public.metas FOR ALL
  USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_metas_user_id ON public.metas(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_mes_ano ON public.metas(mes_ano);
CREATE INDEX IF NOT EXISTS idx_clientes_comprou_garantia ON public.clientes(comprou_garantia);
