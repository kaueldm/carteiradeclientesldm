-- ============================================================
-- CRM LOJA DO MECÂNICO — SCRIPT DE CORREÇÃO DE PERMISSÕES (RLS)
-- Execute este SQL no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. Garantir que a tabela de clientes tem RLS habilitado
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas para evitar conflitos (opcional, mas recomendado)
DROP POLICY IF EXISTS "Vendedores veem apenas seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Vendedores inserem seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Vendedores atualizam seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Vendedores excluem seus próprios clientes" ON public.clientes;

-- 3. Criar política de LEITURA (Vendedores veem os seus, Admin vê todos)
CREATE POLICY "Leitura de clientes"
  ON public.clientes FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (auth.jwt() ->> 'email' = 'admin@ldm.com')
  );

-- 4. Criar política de INSERÇÃO (Qualquer autenticado pode inserir se for o dono do dado)
CREATE POLICY "Inserção de clientes"
  ON public.clientes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Criar política de ATUALIZAÇÃO (Dono do dado ou Admin)
CREATE POLICY "Atualização de clientes"
  ON public.clientes FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (auth.jwt() ->> 'email' = 'admin@ldm.com')
  );

-- 6. Criar política de EXCLUSÃO (Dono do dado ou Admin)
CREATE POLICY "Exclusão de clientes"
  ON public.clientes FOR DELETE
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (auth.jwt() ->> 'email' = 'admin@ldm.com')
  );

-- 7. Corrigir permissões para a tabela de notificações (Vendedores precisam ler)
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos podem ver notificações" ON public.notificacoes;
CREATE POLICY "Todos podem ver notificações"
  ON public.notificacoes FOR SELECT
  USING (true);

-- 8. Garantir que o perfil Admin está configurado corretamente
UPDATE public.profiles 
SET role = 'admin' 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@ldm.com');

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
