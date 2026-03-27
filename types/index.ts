export interface User {
  id: string
  nome: string
  email: string
  avatar_url?: string
  role?: 'vendedor' | 'admin'
}

export interface Cliente {
  id: string
  user_id: string
  nome: string
  empresa?: string
  telefone?: string
  email?: string
  status: StatusCliente
  valor_potencial?: number
  observacoes?: string
  cpf_cnpj?: string
  numero_pedido?: string
  numero_orcamento?: string
  comprou_garantia?: boolean
  created_at: string
  updated_at: string
  ultima_interacao?: string
  profiles?: {
    nome_completo: string
  }
}

export type StatusCliente =
  | 'Novo'
  | 'Em Contato'
  | 'Proposta'
  | 'Negociação'
  | 'Fechado'
  | 'Perdido'

export interface Negociacao {
  id: string
  cliente_id: string
  user_id: string
  titulo: string
  valor: number
  status: StatusNegociacao
  descricao?: string
  data_fechamento_prevista?: string
  created_at: string
  updated_at: string
  clientes?: Cliente
}

export type StatusNegociacao =
  | 'Aberta'
  | 'Em Andamento'
  | 'Ganha'
  | 'Perdida'

export interface Tarefa {
  id: string
  cliente_id?: string
  user_id: string
  titulo: string
  descricao?: string
  concluida: boolean
  prioridade: 'Baixa' | 'Media' | 'Alta'
  data_vencimento?: string
  created_at: string
  clientes?: Cliente
}

export interface Interacao {
  id: string
  cliente_id: string
  user_id: string
  tipo: 'Ligação' | 'Email' | 'Reunião' | 'WhatsApp' | 'Visita' | 'Outro'
  descricao: string
  created_at: string
  clientes?: Cliente
}

export interface Meta {
  id: string
  user_id: string
  mes_ano: string
  meta_venda: number
  meta_garantia: number
  created_at: string
  updated_at: string
}

export const STATUS_COLORS: Record<StatusCliente, string> = {
  'Novo': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Em Contato': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Proposta': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Negociação': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Fechado': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Perdido': 'bg-red-500/20 text-red-400 border-red-500/30',
}

export const STATUS_PIPELINE_COLORS: Record<StatusCliente, string> = {
  'Novo': 'border-blue-500',
  'Em Contato': 'border-yellow-500',
  'Proposta': 'border-purple-500',
  'Negociação': 'border-orange-500',
  'Fechado': 'border-green-500',
  'Perdido': 'border-red-500',
}

export interface Notificacao {
  id: string
  titulo: string
  mensagem: string
  criada_por: string
  lida: boolean
  created_at: string
  user_id?: string
}
