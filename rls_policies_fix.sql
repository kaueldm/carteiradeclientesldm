-- Script para corrigir políticas de RLS no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Garantir que o usuário admin@ldm.com tenha o role correto
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@ldm.com';

-- 2. Garantir que os vendedores tenham o role correto
UPDATE public.profiles
SET role = 'vendedor'
WHERE email IN (
  'ana@ldm.com',
  'bruna@ldm.com',
  'bruno@ldm.com',
  'tatiani@ldm.com',
  'jessica@ldm.com',
  'vitor@ldm.com',
  'mario@ldm.com'
);

-- 3. Remover políticas antigas de clientes (se existirem)
DROP POLICY IF EXISTS "Vendedores gerenciam seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Clientes são visíveis para o vendedor" ON public.clientes;
DROP POLICY IF EXISTS "Clientes podem ser inseridos por vendedores" ON public.clientes;
DROP POLICY IF EXISTS "Clientes podem ser atualizados por vendedores" ON public.clientes;
DROP POLICY IF EXISTS "Clientes podem ser deletados por vendedores" ON public.clientes;

-- 4. Remover políticas antigas de metas (se existirem)
DROP POLICY IF EXISTS "Vendedores gerenciam suas próprias metas" ON public.metas;
DROP POLICY IF EXISTS "Metas são visíveis para o vendedor" ON public.metas;
DROP POLICY IF EXISTS "Metas podem ser inseridas por vendedores" ON public.metas;
DROP POLICY IF EXISTS "Metas podem ser atualizadas por vendedores" ON public.metas;
DROP POLICY IF EXISTS "Metas podem ser deletadas por vendedores" ON public.metas;

-- 5. Criar novas políticas para clientes
-- Política SELECT: Vendedores veem seus próprios clientes, admin vê todos
CREATE POLICY "clientes_select_policy"
  ON public.clientes FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Política INSERT: Vendedores inserem seus próprios clientes, admin pode inserir para qualquer um
CREATE POLICY "clientes_insert_policy"
  ON public.clientes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Política UPDATE: Vendedores atualizam seus próprios clientes, admin pode atualizar qualquer um
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

-- Política DELETE: Vendedores deletam seus próprios clientes, admin pode deletar qualquer um
CREATE POLICY "clientes_delete_policy"
  ON public.clientes FOR DELETE
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 6. Criar novas políticas para metas
-- Política SELECT: Vendedores veem suas próprias metas, admin vê todas
CREATE POLICY "metas_select_policy"
  ON public.metas FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Política INSERT: Vendedores inserem suas próprias metas, admin pode inserir para qualquer um
CREATE POLICY "metas_insert_policy"
  ON public.metas FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Política UPDATE: Vendedores atualizam suas próprias metas, admin pode atualizar qualquer uma
CREATE POLICY "metas_update_policy"
  ON public.metas FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Política DELETE: Vendedores deletam suas próprias metas, admin pode deletar qualquer uma
CREATE POLICY "metas_delete_policy"
  ON public.metas FOR DELETE
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 7. Garantir que RLS está habilitado nas tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- 8. Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('clientes', 'metas')
ORDER BY tablename, policyname;
