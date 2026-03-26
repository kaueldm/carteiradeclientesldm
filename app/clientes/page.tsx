'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Cliente, StatusCliente, STATUS_COLORS } from '@/types'
import ClienteModal from '@/components/ClienteModal'
import InteracaoModal from '@/components/InteracaoModal'
import { Interacao } from '@/types'
import {
  Plus, Search, Filter, Edit2, Trash2, MessageSquare,
  Phone, Mail, Building2, DollarSign, ChevronDown, X
} from 'lucide-react'

const STATUS_OPTIONS: StatusCliente[] = ['Novo', 'Em Contato', 'Proposta', 'Negociação', 'Fechado', 'Perdido']

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusCliente | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [clienteEdit, setClienteEdit] = useState<Cliente | null>(null)
  const [interacaoModal, setInteracaoModal] = useState<{ open: boolean; cliente: Cliente | null }>({ open: false, cliente: null })
  const [userId, setUserId] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [interacoes, setInteracoes] = useState<Record<string, Interacao[]>>({})

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      await fetchClientes(session.user.id)
    }
    load()
  }, [])

  async function fetchClientes(uid: string) {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setClientes(data || [])
    setLoading(false)
  }

  async function fetchInteracoes(clienteId: string) {
    const { data } = await supabase
      .from('interacoes')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })
      .limit(10)
    setInteracoes(prev => ({ ...prev, [clienteId]: data || [] }))
  }

  async function handleSaveCliente(data: Partial<Cliente>) {
    if (clienteEdit) {
      await supabase
        .from('clientes')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', clienteEdit.id)
    } else {
      await supabase
        .from('clientes')
        .insert({ ...data, user_id: userId })
    }
    await fetchClientes(userId)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    setClientes(prev => prev.filter(c => c.id !== id))
  }

  async function handleUpdateStatus(id: string, status: StatusCliente) {
    await supabase
      .from('clientes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    setClientes(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  async function handleSaveInteracao(data: Partial<Interacao>) {
    await supabase.from('interacoes').insert({ ...data, user_id: userId })
    if (data.cliente_id) {
      await fetchInteracoes(data.cliente_id)
      // Atualizar ultima_interacao
      await supabase
        .from('clientes')
        .update({ ultima_interacao: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', data.cliente_id)
    }
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      if (!interacoes[id]) fetchInteracoes(id)
    }
  }

  const clientesFiltrados = clientes.filter(c => {
    const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.empresa || '').toLowerCase().includes(busca.toLowerCase()) ||
      (c.telefone || '').includes(busca) ||
      (c.email || '').toLowerCase().includes(busca.toLowerCase())
    const matchStatus = !filtroStatus || c.status === filtroStatus
    return matchBusca && matchStatus
  })

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 text-sm mt-1">
            {clientesFiltrados.length} de {clientes.length} clientes
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setClienteEdit(null); setModalOpen(true) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </motion.button>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, empresa, telefone ou email..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value as StatusCliente | '')}
            className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-8 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm appearance-none min-w-[160px]"
          >
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </motion.div>

      {/* Lista de clientes */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 text-slate-500"
        >
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 opacity-50" />
          </div>
          <p className="text-lg font-medium">Nenhum cliente encontrado</p>
          <p className="text-sm mt-1">
            {busca || filtroStatus ? 'Tente ajustar os filtros' : 'Adicione seu primeiro cliente'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {clientesFiltrados.map((cliente, i) => (
              <motion.div
                key={cliente.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.03 }}
                className="bg-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden"
              >
                {/* Row principal */}
                <div className="flex items-center gap-3 p-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                    {cliente.nome.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm">{cliente.nome}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-lg border ${STATUS_COLORS[cliente.status]}`}>
                        {cliente.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {cliente.empresa && (
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <Building2 className="w-3 h-3" />{cliente.empresa}
                        </span>
                      )}
                      {cliente.telefone && (
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <Phone className="w-3 h-3" />{cliente.telefone}
                        </span>
                      )}
                      {cliente.valor_potencial && (
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />R$ {cliente.valor_potencial.toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status rápido */}
                  <div className="hidden sm:block">
                    <select
                      value={cliente.status}
                      onChange={e => handleUpdateStatus(cliente.id, e.target.value as StatusCliente)}
                      className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-xs focus:border-blue-500 transition-all"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setInteracaoModal({ open: true, cliente })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                      title="Registrar interação"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setClienteEdit(cliente); setModalOpen(true) }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cliente.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleExpand(cliente.id)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all ${expandedId === cliente.id ? 'bg-slate-700 text-white' : ''}`}
                    >
                      <motion.div animate={{ rotate: expandedId === cliente.id ? 180 : 0 }}>
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>
                  </div>
                </div>

                {/* Expansão - histórico de interações */}
                <AnimatePresence>
                  {expandedId === cliente.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-slate-700/50"
                    >
                      <div className="p-4 space-y-3">
                        {/* Detalhes */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {cliente.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Mail className="w-4 h-4 text-slate-500" />
                              <span className="truncate">{cliente.email}</span>
                            </div>
                          )}
                          {cliente.observacoes && (
                            <div className="sm:col-span-3 bg-slate-700/30 rounded-xl p-3">
                              <p className="text-slate-400 text-xs font-medium mb-1">Observações</p>
                              <p className="text-slate-300 text-sm">{cliente.observacoes}</p>
                            </div>
                          )}
                        </div>

                        {/* Histórico */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Histórico de Interações</p>
                            <button
                              onClick={() => setInteracaoModal({ open: true, cliente })}
                              className="text-blue-400 text-xs hover:text-blue-300 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />Nova interação
                            </button>
                          </div>
                          {interacoes[cliente.id]?.length > 0 ? (
                            <div className="space-y-2">
                              {interacoes[cliente.id].map(int => (
                                <div key={int.id} className="flex gap-3 bg-slate-700/30 rounded-xl p-3">
                                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="w-3 h-3 text-blue-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-400 text-xs font-medium">{int.tipo}</span>
                                      <span className="text-slate-500 text-xs">
                                        {new Date(int.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="text-slate-300 text-sm mt-0.5">{int.descricao}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-500 text-sm text-center py-3">
                              Nenhuma interação registrada ainda
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal cliente */}
      <ClienteModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setClienteEdit(null) }}
        onSave={handleSaveCliente}
        cliente={clienteEdit}
      />

      {/* Modal interação */}
      <InteracaoModal
        open={interacaoModal.open}
        onClose={() => setInteracaoModal({ open: false, cliente: null })}
        onSave={handleSaveInteracao}
        clienteId={interacaoModal.cliente?.id || ''}
        clienteNome={interacaoModal.cliente?.nome || ''}
      />
    </div>
  )
}
