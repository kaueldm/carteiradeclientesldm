# SQL de Correção — CRM Loja do Mecânico

Se você recebeu o erro `column "role" does not exist`, é porque a tabela `profiles` já existia com a estrutura antiga. 

**Execute este SQL abaixo no SQL Editor do Supabase para corrigir a estrutura:**

```sql
-- 1. Adicionar colunas faltantes na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'vendedor' CHECK (role IN ('vendedor', 'admin')),
ADD COLUMN IF NOT EXISTS nome_completo text,
ADD COLUMN IF NOT EXISTS pode_alterar_senha boolean DEFAULT true;

-- 2. Migrar dados da coluna 'nome' antiga para 'nome_completo' (opcional)
UPDATE public.profiles SET nome_completo = nome WHERE nome_completo IS NULL AND nome IS NOT NULL;

-- 3. Criar as tabelas de notificações que são novas
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  criada_por uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notificacoes_lidas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  notificacao_id uuid REFERENCES public.notificacoes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lida_em timestamp with time zone DEFAULT now(),
  UNIQUE(notificacao_id, user_id)
);

-- 4. Habilitar RLS nas novas tabelas
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_lidas ENABLE ROW LEVEL SECURITY;

-- 5. Recriar a função de trigger para suportar os novos campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, role)
  VALUES (
    new.id,
    split_part(new.email, '@', 1),
    CASE WHEN new.email = 'admin@ldm.com' THEN 'admin' ELSE 'vendedor' END
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    nome_completo = EXCLUDED.nome_completo;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Atualizar os nomes e permissões dos usuários (Vendedores e Admin)
UPDATE public.profiles SET nome_completo = 'Ana Carolina' WHERE id = (SELECT id FROM auth.users WHERE email = 'ana@ldm.com');
UPDATE public.profiles SET nome_completo = 'Bruna Aparecida' WHERE id = (SELECT id FROM auth.users WHERE email = 'bruna@ldm.com');
UPDATE public.profiles SET nome_completo = 'Bruno Vieira' WHERE id = (SELECT id FROM auth.users WHERE email = 'bruno@ldm.com');
UPDATE public.profiles SET nome_completo = 'Tatiani Aparecida' WHERE id = (SELECT id FROM auth.users WHERE email = 'tatiani@ldm.com');
UPDATE public.profiles SET nome_completo = 'Jessica Alves' WHERE id = (SELECT id FROM auth.users WHERE email = 'jessica@ldm.com');
UPDATE public.profiles SET nome_completo = 'Vitor Costa' WHERE id = (SELECT id FROM auth.users WHERE email = 'vitor@ldm.com');
UPDATE public.profiles SET nome_completo = 'Mario Furtado' WHERE id = (SELECT id FROM auth.users WHERE email = 'mario@ldm.com');

-- Configurar o Admin corretamente
UPDATE public.profiles SET 
  nome_completo = 'Administrador LDM',
  role = 'admin',
  pode_alterar_senha = false
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@ldm.com');

-- 7. Criar as políticas de segurança (RLS) para as novas tabelas e colunas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notificacoes' AND policyname = 'Admin cria notificacoes') THEN
    CREATE POLICY "Admin cria notificacoes" ON public.notificacoes FOR INSERT WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notificacoes' AND policyname = 'Todos podem ver notificacoes') THEN
    CREATE POLICY "Todos podem ver notificacoes" ON public.notificacoes FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notificacoes_lidas' AND policyname = 'Usuarios gerenciam suas proprias leituras') THEN
    CREATE POLICY "Usuarios gerenciam suas proprias leituras" ON public.notificacoes_lidas FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
```
