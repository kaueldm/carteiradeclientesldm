'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Cliente, StatusCliente } from '@/types'
import ClienteModal from '@/components/ClienteModal'
import InteracaoModal from '@/components/InteracaoModal'
import ImportarDadosModalV2 from '@/components/ImportarDadosModalV2'
import { Interacao } from '@/types'
import {
  Plus, Search, Edit2, Trash2,
  Phone, Building2, ArrowLeft, Trash, ShoppingBag, DollarSign
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const STATUS_OPTIONS: StatusCliente[] = ['Novo', 'Em Contato', 'Proposta', 'Negociação', 'Fechado', 'Perdido']
const STATUS_COLORS: Record<StatusCliente, string> = {
  'Novo': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Em Contato': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Proposta': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Negociação': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Fechado': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Perdido': 'bg-red-500/20 text-red-400 border-red-500/30',
}

const ESTADO_COLORS: Record<string, string> = {
  'No WMS': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Não Entregue': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Entregue': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Item Virtual Enviado': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const ESTADO_ATUAL_OPTIONS = ['No WMS', 'Não Entregue', 'Entregue', 'Item Virtual Enviado']

export default function PedidosPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusCliente | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [clienteEdit, setClienteEdit] = useState<Cliente | null>(null)
  const [interacaoModal, setInteracaoModal] = useState<{ open: boolean; cliente: Cliente | null }>({ open: false, cliente: null })
  const [userId, setUserId] = useState('')

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('tipo', 'pedido')
      .order('created_at', { ascending: false })
      
    if (error) {
      toast.error('Erro ao carregar pedidos')
    } else {
      setClientes(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserId(session.user.id)
      await fetchClientes()
    }
    load()
  }, [router, fetchClientes])

  async function handleSaveCliente(data: Partial<Cliente>) {
    const payload = { 
      ...data, 
      user_id: userId, 
      tipo: 'pedido',
      updated_at: new Date().toISOString() 
    }

    let error
    if (clienteEdit) {
      const { error: updateError } = await supabase
        .from('clientes')
        .update(payload)
        .eq('id', clienteEdit.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('clientes')
        .insert([payload])
      error = insertError
    }

    if (error) {
      toast.error('Erro ao salvar pedido')
    } else {
      toast.success('Pedido salvo com sucesso')
      setClienteEdit(null)
      setModalOpen(false)
      await fetchClientes()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao excluir pedido')
    } else {
      toast.success('Pedido excluído')
      setClientes(prev => prev.filter(c => c.id !== id))
    }
  }

  async function handleDeleteAll() {
    if (!confirm('⚠️ Tem certeza que deseja excluir TODOS os pedidos?')) return
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('tipo', 'pedido')
    
    if (error) {
      toast.error('Erro ao excluir todos os pedidos')
    } else {
      toast.success('Todos os pedidos foram excluídos')
      await fetchClientes()
    }
  }

  async function handleUpdateStatus(id: string, status: StatusCliente) {
    const { error } = await supabase
      .from('clientes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) {
      toast.error('Erro ao atualizar status')
    } else {
      setClientes(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    }
  }

  async function handleUpdateEstado(id: string, estado_atual: string) {
    const { error } = await supabase
      .from('clientes')
      .update({ estado_atual, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) {
      toast.error('Erro ao atualizar estado')
    } else {
      setClientes(prev => prev.map(c => c.id === id ? { ...c, estado_atual } : c))
    }
  }

  async function handleSaveInteracao(data: Partial<Interacao>) {
    const { error } = await supabase.from('interacoes').insert({ ...data, user_id: userId })
    if (error) {
      toast.error('Erro ao salvar interação')
    } else {
      toast.success('Interação registrada')
      if (data.cliente_id) {
        await supabase
          .from('clientes')
          .update({ ultima_interacao: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', data.cliente_id)
      }
    }
  }

  const clientesFiltrados = clientes.filter(c => {
    const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.email?.toLowerCase().includes(busca.toLowerCase()) ||
      c.numero_pedido?.includes(busca) ||
      c.cpf_cnpj?.includes(busca)
    const matchStatus = !filtroStatus || c.status === filtroStatus
    return matchBusca && matchStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-green-400" />
                Pedidos
              </h1>
              <p className="text-sm text-slate-400">Gerencie seus pedidos fechados</p>
            </div>
          </div>
          <button
            onClick={() => {
              setClienteEdit(null)
              setModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            Novo Pedido
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome, pedido ou CPF/CNPJ..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as StatusCliente | '')}
            className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">Todos os Status</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <button
            onClick={() => setImportModalOpen(true)}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-white transition-all font-medium"
          >
            Importar
          </button>

          <button
            onClick={handleDeleteAll}
            className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 transition-all font-medium flex items-center gap-2"
          >
            <Trash className="w-4 h-4" />
            Excluir Todos
          </button>
        </div>

        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clientesFiltrados.map((cliente) => (
              <motion.div
                key={cliente.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white truncate">{cliente.nome}</h3>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-400">
                      {cliente.numero_pedido && (
                        <div className="text-blue-400 font-medium">Pedido: {cliente.numero_pedido}</div>
                      )}
                      {cliente.empresa && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {cliente.empresa}
                        </div>
                      )}
                      {cliente.telefone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {cliente.telefone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cliente.valor_potencial && (
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-bold">
                        <DollarSign className="w-3 h-3" />
                        {cliente.valor_potencial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    )}

                    <select
                      value={cliente.estado_atual || 'No WMS'}
                      onChange={(e) => handleUpdateEstado(cliente.id, e.target.value)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium outline-none ${ESTADO_COLORS[cliente.estado_atual || 'No WMS']}`}
                    >
                      {ESTADO_ATUAL_OPTIONS.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>

                    <select
                      value={cliente.status}
                      onChange={(e) => handleUpdateStatus(cliente.id, e.target.value as StatusCliente)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium outline-none ${STATUS_COLORS[cliente.status]}`}
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setInteracaoModal({ open: true, cliente })}
                      className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-blue-400"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setClienteEdit(cliente)
                        setModalOpen(true)
                      }}
                      className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(cliente.id)}
                      className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ClienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCliente}
        cliente={clienteEdit || undefined}
      />

      <InteracaoModal
        open={interacaoModal.open}
        onClose={() => setInteracaoModal({ open: false, cliente: null })}
        onSave={handleSaveInteracao}
        clienteId={interacaoModal.cliente?.id || ''}
        clienteNome={interacaoModal.cliente?.nome || ''}
      />

      <ImportarDadosModalV2
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={fetchClientes}
        tipo="pedido"
      />
    </div>
  )
}
