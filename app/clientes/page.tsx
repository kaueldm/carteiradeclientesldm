'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Cliente, StatusCliente, STATUS_COLORS } from '@/types'
import ClienteModal from '@/components/ClienteModal'
import InteracaoModal from '@/components/InteracaoModal'
import ImportarDadosModalV2 from '@/components/ImportarDadosModalV2'
import { Interacao } from '@/types'
import {
  Plus, Search, Filter, Edit2, Trash2, MessageSquare,
  Phone, Building2, DollarSign, ChevronDown, X, Table, FileText, Hash, ShieldCheck
} from 'lucide-react'

const STATUS_OPTIONS: StatusCliente[] = ['Novo', 'Em Contato', 'Proposta', 'Negociação', 'Fechado', 'Perdido']

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusCliente | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
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
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', uid)
      .single()

    const { data: sessionData } = await supabase.auth.getSession()
    const isAdmin = (profile as { role?: string } | null)?.role === 'admin' || sessionData.session?.user.email === 'admin@ldm.com'

    let query = supabase.from('clientes').select('*')
    if (!isAdmin) {
      query = query.eq('user_id', uid)
    }
    
    const { data } = await query.order('created_at', { ascending: false })
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
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUserId = session?.user.id || userId

      if (!currentUserId) {
        console.error('Usuário não autenticado')
        return
      }

      if (clienteEdit) {
        const { error } = await supabase
          .from('clientes')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', clienteEdit.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert({ ...data, user_id: currentUserId })
        if (error) throw error
      }
      await fetchClientes(currentUserId)
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      alert('Erro ao salvar cliente. Verifique o console ou as permissões do banco.')
    }
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
      (c.email || '').toLowerCase().includes(busca.toLowerCase()) ||
      (c.cpf_cnpj || '').includes(busca) ||
      (c.numero_pedido || '').includes(busca) ||
      (c.numero_orcamento || '').includes(busca)
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
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all border border-slate-700"
          >
            <Table className="w-4 h-4 text-blue-400" />
            Importar Dados
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setClienteEdit(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </motion.button>
        </div>
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
            placeholder="Buscar por nome, empresa, telefone, documento ou pedido..."
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
            className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm appearance-none min-w-[180px] cursor-pointer"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
          >
            <option value="" className="bg-slate-800">Todos os status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
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
                      {cliente.comprou_garantia && (
                        <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> GARANTIA
                        </span>
                      )}
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
                      {cliente.cpf_cnpj && (
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <FileText className="w-3 h-3" />{cliente.cpf_cnpj}
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
                      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-xs focus:border-blue-500 transition-all appearance-none cursor-pointer pr-8"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
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
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all ${expandedId === cliente.id ? 'rotate-180' : ''}`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                <AnimatePresence>
                  {expandedId === cliente.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-700/50 bg-slate-900/30"
                    >
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Info Adicional */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informações Detalhadas</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Nº Pedido</p>
                              <p className="text-sm text-white flex items-center gap-1"><Hash className="w-3 h-3 text-slate-500" /> {cliente.numero_pedido || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Nº Orçamento</p>
                              <p className="text-sm text-white flex items-center gap-1"><Hash className="w-3 h-3 text-slate-500" /> {cliente.numero_orcamento || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Email</p>
                              <p className="text-sm text-white truncate">{cliente.email || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Última Interação</p>
                              <p className="text-sm text-white">
                                {cliente.ultima_interacao ? new Date(cliente.ultima_interacao).toLocaleDateString('pt-BR') : 'Nunca'}
                              </p>
                            </div>
                          </div>
                          {cliente.observacoes && (
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Observações</p>
                              <p className="text-sm text-slate-300 mt-1 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">{cliente.observacoes}</p>
                            </div>
                          )}
                        </div>

                        {/* Histórico */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Últimas Interações</h4>
                            <button 
                              onClick={() => setInteracaoModal({ open: true, cliente })}
                              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase"
                            >
                              + Adicionar
                            </button>
                          </div>
                          <div className="space-y-2">
                            {!interacoes[cliente.id] ? (
                              <div className="h-20 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : interacoes[cliente.id].length === 0 ? (
                              <p className="text-xs text-slate-600 italic py-4 text-center">Nenhuma interação registrada</p>
                            ) : (
                              interacoes[cliente.id].map(inter => (
                                <div key={inter.id} className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/30">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-blue-400">{inter.tipo}</span>
                                    <span className="text-[10px] text-slate-500">{new Date(inter.created_at).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                  <p className="text-xs text-slate-300 line-clamp-2">{inter.descricao}</p>
                                </div>
                              ))
                            )}
                          </div>
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

      {/* Modais */}
      <ClienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCliente}
        cliente={clienteEdit}
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
        onImport={() => fetchClientes(userId)}
      />
    </div>
  )
}
