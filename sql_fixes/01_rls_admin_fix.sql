-- ============================================================
-- CORREÇÃO CRÍTICA: RLS PARA ADMIN ACESSAR TODOS OS DADOS
-- ============================================================

-- 1. Garantir que a coluna 'role' existe em profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'vendedor';

-- 2. Definir admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@ldm.com');

-- 3. REMOVER POLÍTICAS ANTIGAS DE CLIENTES
DROP POLICY IF EXISTS "Vendedores veem apenas seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Vendedores inserem seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Vendedores atualizam seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Vendedores excluem seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete" ON public.clientes;

-- 4. CRIAR NOVAS POLÍTICAS DE CLIENTES COM ACESSO ADMIN TOTAL
CREATE POLICY "clientes_select_policy"
  ON public.clientes FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "clientes_insert_policy"
  ON public.clientes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "clientes_update_policy"
  ON public.clientes FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "clientes_delete_policy"
  ON public.clientes FOR DELETE
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 5. REMOVER POLÍTICAS ANTIGAS DE INTERAÇÕES
DROP POLICY IF EXISTS "Vendedores veem interações de seus clientes" ON public.interacoes;
DROP POLICY IF EXISTS "Vendedores inserem interações" ON public.interacoes;
DROP POLICY IF EXISTS "Vendedores excluem suas interações" ON public.interacoes;
DROP POLICY IF EXISTS "interacoes_select" ON public.interacoes;
DROP POLICY IF EXISTS "interacoes_insert" ON public.interacoes;
DROP POLICY IF EXISTS "interacoes_delete" ON public.interacoes;

-- 6. CRIAR NOVAS POLÍTICAS DE INTERAÇÕES COM ACESSO ADMIN TOTAL
CREATE POLICY "interacoes_select_policy"
  ON public.interacoes FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "interacoes_insert_policy"
  ON public.interacoes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "interacoes_delete_policy"
  ON public.interacoes FOR DELETE
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 7. GARANTIR RLS HABILITADO
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FIM DA CORREÇÃO
-- ============================================================
