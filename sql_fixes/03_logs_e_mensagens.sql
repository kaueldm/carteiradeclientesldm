-- ============================================================
-- CRIAR TABELAS DE LOGS E MENSAGENS
-- ============================================================

-- 1. Criar tabela de logs (histórico de ações)
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  tabela TEXT,
  registro_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para logs
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_tabela ON public.logs(tabela);

-- 3. Habilitar RLS em logs
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- 4. Criar política de logs (apenas admin pode ver)
DROP POLICY IF EXISTS "logs_admin_only" ON public.logs;
CREATE POLICY "logs_admin_only"
  ON public.logs FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 5. Criar tabela de mensagens (admin para vendedores)
CREATE TABLE IF NOT EXISTS public.mensagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remetente_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destinatario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  para_todos BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar índices para mensagens
CREATE INDEX IF NOT EXISTS idx_mensagens_destinatario_id ON public.mensagens(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_remetente_id ON public.mensagens(remetente_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_created_at ON public.mensagens(created_at);
CREATE INDEX IF NOT EXISTS idx_mensagens_lida ON public.mensagens(lida);

-- 7. Habilitar RLS em mensagens
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas de mensagens
DROP POLICY IF EXISTS "mensagens_select" ON public.mensagens;
DROP POLICY IF EXISTS "mensagens_insert" ON public.mensagens;

CREATE POLICY "mensagens_select"
  ON public.mensagens FOR SELECT
  USING (
    auth.uid() = destinatario_id 
    OR auth.uid() = remetente_id
    OR para_todos = TRUE
  );

CREATE POLICY "mensagens_insert"
  ON public.mensagens FOR INSERT
  WITH CHECK (
    auth.uid() = remetente_id 
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "mensagens_update"
  ON public.mensagens FOR UPDATE
  USING (auth.uid() = destinatario_id)
  WITH CHECK (auth.uid() = destinatario_id);

-- ============================================================
-- FIM DA CRIAÇÃO DE TABELAS
-- ============================================================
