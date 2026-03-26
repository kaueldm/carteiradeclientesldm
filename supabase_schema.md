# Supabase SQL Schema — CRM Loja do Mecânico

Execute o SQL abaixo no **SQL Editor** do Supabase para criar todas as tabelas necessárias de uma só vez.

## SQL Completo

```sql
-- ============================================================
-- CRM LOJA DO MECÂNICO — SCHEMA COMPLETO
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: profiles
-- Armazena o nome de exibição dos vendedores
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table public.profiles enable row level security;

-- Políticas de segurança para profiles
create policy "Usuários podem ver seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuários podem inserir seu próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger para criar perfil automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TABELA: clientes
-- Carteira de clientes de cada vendedor
-- ============================================================
create table if not exists public.clientes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  empresa text,
  telefone text,
  email text,
  status text not null default 'Novo'
    check (status in ('Novo', 'Em Contato', 'Proposta', 'Negociação', 'Fechado', 'Perdido')),
  valor_potencial numeric(12, 2),
  observacoes text,
  ultima_interacao timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table public.clientes enable row level security;

-- Políticas de segurança para clientes
create policy "Vendedores veem apenas seus próprios clientes"
  on public.clientes for select
  using (auth.uid() = user_id);

create policy "Vendedores inserem seus próprios clientes"
  on public.clientes for insert
  with check (auth.uid() = user_id);

create policy "Vendedores atualizam seus próprios clientes"
  on public.clientes for update
  using (auth.uid() = user_id);

create policy "Vendedores excluem seus próprios clientes"
  on public.clientes for delete
  using (auth.uid() = user_id);

-- ============================================================
-- TABELA: interacoes
-- Histórico de interações com clientes
-- ============================================================
create table if not exists public.interacoes (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  tipo text not null default 'Ligação'
    check (tipo in ('Ligação', 'Email', 'Reunião', 'WhatsApp', 'Visita', 'Outro')),
  descricao text not null,
  created_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table public.interacoes enable row level security;

-- Políticas de segurança para interacoes
create policy "Vendedores veem interações de seus clientes"
  on public.interacoes for select
  using (auth.uid() = user_id);

create policy "Vendedores inserem interações"
  on public.interacoes for insert
  with check (auth.uid() = user_id);

create policy "Vendedores excluem suas interações"
  on public.interacoes for delete
  using (auth.uid() = user_id);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
create index if not exists idx_clientes_user_id on public.clientes(user_id);
create index if not exists idx_clientes_status on public.clientes(status);
create index if not exists idx_interacoes_cliente_id on public.interacoes(cliente_id);
create index if not exists idx_interacoes_user_id on public.interacoes(user_id);

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
```

## Após criar as tabelas, execute os usuários no Authentication

Vá em **Authentication > Users** no Supabase e crie manualmente, ou use o script abaixo via SQL com a função de admin:

Os usuários devem ser criados via **Authentication > Add User** no painel do Supabase com os emails e senhas fornecidos. Após criar, execute o script abaixo para definir os nomes de exibição:

```sql
-- Atualizar nomes dos vendedores (execute após criar os usuários no Auth)
-- Substitua os UUIDs pelos IDs reais gerados pelo Supabase Auth

-- Exemplo (substitua os UUIDs pelos reais):
-- UPDATE public.profiles SET nome = 'Ana Carolina' WHERE id = 'UUID_DA_ANA';
-- UPDATE public.profiles SET nome = 'Bruna Aparecida' WHERE id = 'UUID_DA_BRUNA';
-- etc.

-- OU use a função abaixo para atualizar pelo email:
UPDATE public.profiles SET nome = 'Ana Carolina'
WHERE id = (SELECT id FROM auth.users WHERE email = 'ana@ldm.com');

UPDATE public.profiles SET nome = 'Bruna Aparecida'
WHERE id = (SELECT id FROM auth.users WHERE email = 'bruna@ldm.com');

UPDATE public.profiles SET nome = 'Bruno Vieira'
WHERE id = (SELECT id FROM auth.users WHERE email = 'bruno@ldm.com');

UPDATE public.profiles SET nome = 'Tatiani Aparecida'
WHERE id = (SELECT id FROM auth.users WHERE email = 'tatiani@ldm.com');

UPDATE public.profiles SET nome = 'Jessica Alves'
WHERE id = (SELECT id FROM auth.users WHERE email = 'jessica@ldm.com');

UPDATE public.profiles SET nome = 'Vitor Costa'
WHERE id = (SELECT id FROM auth.users WHERE email = 'vitor@ldm.com');

UPDATE public.profiles SET nome = 'Mario Furtado'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mario@ldm.com');
```
