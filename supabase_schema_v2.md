# Supabase SQL Schema v2 — CRM Loja do Mecânico (Atualizado)

Execute este SQL no **SQL Editor** do Supabase para criar todas as tabelas necessárias, incluindo suporte a Admin e Sistema de Notificações.

## SQL Completo

```sql
-- ============================================================
-- CRM LOJA DO MECÂNICO — SCHEMA COMPLETO v2
-- Suporte a Admin, Notificações e Métricas Avançadas
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: profiles
-- Armazena informações dos usuários (vendedores e admin)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nome_completo text,
  role text not null default 'vendedor'
    check (role in ('vendedor', 'admin')),
  pode_alterar_senha boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "Usuários podem ver seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = id or (select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuários podem inserir seu próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger para criar perfil automaticamente
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome_completo, role)
  values (
    new.id,
    split_part(new.email, '@', 1),
    case when new.email = 'admin@ldm.com' then 'admin' else 'vendedor' end
  )
  on conflict (id) do nothing;
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

alter table public.clientes enable row level security;

create policy "Vendedores veem apenas seus próprios clientes"
  on public.clientes for select
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Vendedores inserem seus próprios clientes"
  on public.clientes for insert
  with check (auth.uid() = user_id);

create policy "Vendedores atualizam seus próprios clientes"
  on public.clientes for update
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Vendedores excluem seus próprios clientes"
  on public.clientes for delete
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');

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

alter table public.interacoes enable row level security;

create policy "Vendedores veem interações de seus clientes"
  on public.interacoes for select
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Vendedores inserem interações"
  on public.interacoes for insert
  with check (auth.uid() = user_id);

create policy "Vendedores excluem suas interações"
  on public.interacoes for delete
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');

-- ============================================================
-- TABELA: notificacoes
-- Sistema de notificações do admin para vendedores
-- ============================================================
create table if not exists public.notificacoes (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  mensagem text not null,
  criada_por uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now()
);

alter table public.notificacoes enable row level security;

create policy "Admin cria notificações"
  on public.notificacoes for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Todos podem ver notificações"
  on public.notificacoes for select
  using (true);

-- ============================================================
-- TABELA: notificacoes_lidas
-- Rastreia quais notificações foram lidas por cada usuário
-- ============================================================
create table if not exists public.notificacoes_lidas (
  id uuid primary key default uuid_generate_v4(),
  notificacao_id uuid references public.notificacoes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  lida_em timestamp with time zone default now(),
  unique(notificacao_id, user_id)
);

alter table public.notificacoes_lidas enable row level security;

create policy "Usuários gerenciam suas próprias leituras"
  on public.notificacoes_lidas for all
  using (auth.uid() = user_id);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
create index if not exists idx_clientes_user_id on public.clientes(user_id);
create index if not exists idx_clientes_status on public.clientes(status);
create index if not exists idx_interacoes_cliente_id on public.interacoes(cliente_id);
create index if not exists idx_interacoes_user_id on public.interacoes(user_id);
create index if not exists idx_notificacoes_created_at on public.notificacoes(created_at desc);
create index if not exists idx_notificacoes_lidas_user_id on public.notificacoes_lidas(user_id);

-- ============================================================
-- FIM DO SCHEMA v2
-- ============================================================
```

## Após criar as tabelas, execute para atualizar os nomes dos vendedores:

```sql
-- Atualizar nomes completos dos vendedores com sobrenomes
UPDATE public.profiles SET nome_completo = 'Ana Carolina' WHERE id = (SELECT id FROM auth.users WHERE email = 'ana@ldm.com');
UPDATE public.profiles SET nome_completo = 'Bruna Aparecida' WHERE id = (SELECT id FROM auth.users WHERE email = 'bruna@ldm.com');
UPDATE public.profiles SET nome_completo = 'Bruno Vieira' WHERE id = (SELECT id FROM auth.users WHERE email = 'bruno@ldm.com');
UPDATE public.profiles SET nome_completo = 'Tatiani Aparecida' WHERE id = (SELECT id FROM auth.users WHERE email = 'tatiani@ldm.com');
UPDATE public.profiles SET nome_completo = 'Jessica Alves' WHERE id = (SELECT id FROM auth.users WHERE email = 'jessica@ldm.com');
UPDATE public.profiles SET nome_completo = 'Vitor Costa' WHERE id = (SELECT id FROM auth.users WHERE email = 'vitor@ldm.com');
UPDATE public.profiles SET nome_completo = 'Mario Furtado' WHERE id = (SELECT id FROM auth.users WHERE email = 'mario@ldm.com');

-- Configurar admin
UPDATE public.profiles SET 
  nome_completo = 'Administrador LDM',
  role = 'admin',
  pode_alterar_senha = false
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@ldm.com');
```

## Notas Importantes

- O usuário admin (`admin@ldm.com`) não pode alterar sua senha (campo `pode_alterar_senha = false`)
- Os vendedores podem alterar suas senhas normalmente
- As notificações são criadas apenas pelo admin
- Cada vendedor vê todas as notificações, mas o sistema rastreia quais foram lidas
- O admin pode ver todos os dados de todos os vendedores através das políticas RLS
