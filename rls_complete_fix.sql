-- ============================================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO RLS E POLÍTICAS
-- Execute este script inteiro no SQL Editor do Supabase
-- ============================================================

-- 1. Atualizar nomes completos dos vendedores
UPDATE public.profiles SET nome_completo = 'Ana Carolina' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'ana@ldm.com');

UPDATE public.profiles SET nome_completo = 'Bruna Aparecida' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'bruna@ldm.com');

UPDATE public.profiles SET nome_completo = 'Bruno Vieira' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'bruno@ldm.com');

UPDATE public.profiles SET nome_completo = 'Tatiani Aparecida' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'tatiani@ldm.com');

UPDATE public.profiles SET nome_completo = 'Jessica Alves' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'jessica@ldm.com');

UPDATE public.profiles SET nome_completo = 'Vitor Costa' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'vitor@ldm.com');

UPDATE public.profiles SET nome_completo = 'Mario Furtado' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'mario@ldm.com');

-- 2. Configurar admin
UPDATE public.profiles SET 
  nome_completo = 'Administrador LDM',
  role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@ldm.com');

-- 3. Garantir que todos os vendedores têm role 'vendedor'
UPDATE public.profiles SET role = 'vendedor'
WHERE id IN (
  SELECT id FROM auth.users WHERE email IN (
    'ana@ldm.com',
    'bruna@ldm.com',
    'bruno@ldm.com',
    'tatiani@ldm.com',
    'jessica@ldm.com',
    'vitor@ldm.com',
    'mario@ldm.com'
  )
);

-- ============================================================
-- CONFIGURAR POLÍTICAS PARA TABELA: clientes
-- ============================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Vendedores veem apenas seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Vendedores inserem seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Vendedores atualizam seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Vendedores excluem seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert_policy" ON public.clientes;

-- Criar novas políticas para clientes
CREATE POLICY "clientes_select"
  ON public.clientes FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "clientes_insert"
  ON public.clientes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "clientes_update"
  ON public.clientes FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "clientes_delete"
  ON public.clientes FOR DELETE
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- CONFIGURAR POLÍTICAS PARA TABELA: interacoes
-- ============================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Vendedores veem interações de seus clientes" ON public.interacoes;
DROP POLICY IF EXISTS "Vendedores inserem interações" ON public.interacoes;
DROP POLICY IF EXISTS "Vendedores excluem suas interações" ON public.interacoes;

-- Criar novas políticas para interacoes
CREATE POLICY "interacoes_select"
  ON public.interacoes FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "interacoes_insert"
  ON public.interacoes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "interacoes_delete"
  ON public.interacoes FOR DELETE
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- CONFIGURAR POLÍTICAS PARA TABELA: metas
-- ============================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Vendedores gerenciam suas próprias metas" ON public.metas;
DROP POLICY IF EXISTS "metas_select_policy" ON public.metas;
DROP POLICY IF EXISTS "metas_insert_policy" ON public.metas;
DROP POLICY IF EXISTS "metas_update_policy" ON public.metas;
DROP POLICY IF EXISTS "metas_delete_policy" ON public.metas;

-- Criar novas políticas para metas
CREATE POLICY "metas_select"
  ON public.metas FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "metas_insert"
  ON public.metas FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "metas_update"
  ON public.metas FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "metas_delete"
  ON public.metas FOR DELETE
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- CONFIGURAR POLÍTICAS PARA TABELA: notificacoes
-- ============================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admin cria notificações" ON public.notificacoes;
DROP POLICY IF EXISTS "Todos podem ver notificações" ON public.notificacoes;

-- Criar novas políticas para notificações
CREATE POLICY "notificacoes_insert"
  ON public.notificacoes FOR INSERT
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "notificacoes_select"
  ON public.notificacoes FOR SELECT
  USING (true);

-- ============================================================
-- CONFIGURAR POLÍTICAS PARA TABELA: notificacoes_lidas
-- ============================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários gerenciam suas próprias leituras" ON public.notificacoes_lidas;

-- Criar novas políticas para notificações_lidas
CREATE POLICY "notificacoes_lidas_all"
  ON public.notificacoes_lidas FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- GARANTIR QUE RLS ESTÁ HABILITADO EM TODAS AS TABELAS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_lidas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
