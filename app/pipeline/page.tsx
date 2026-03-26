'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/lib/supabase'
import { Cliente, StatusCliente, STATUS_PIPELINE_COLORS } from '@/types'
import ClienteModal from '@/components/ClienteModal'
import { Plus, DollarSign, Building2, Phone } from 'lucide-react'

const COLUNAS: StatusCliente[] = ['Novo', 'Em Contato', 'Proposta', 'Negociação', 'Fechado', 'Perdido']

const COLUNA_COLORS: Record<StatusCliente, string> = {
  'Novo': 'text-blue-400',
  'Em Contato': 'text-yellow-400',
  'Proposta': 'text-purple-400',
  'Negociação': 'text-orange-400',
  'Fechado': 'text-green-400',
  'Perdido': 'text-red-400',
}

export default function PipelinePage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [novoStatus, setNovoStatus] = useState<StatusCliente>('Novo')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setClientes(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const { draggableId, destination } = result
    const novoStatusDest = destination.droppableId as StatusCliente

    setClientes(prev =>
      prev.map(c => c.id === draggableId ? { ...c, status: novoStatusDest } : c)
    )

    await supabase
      .from('clientes')
      .update({ status: novoStatusDest, updated_at: new Date().toISOString() })
      .eq('id', draggableId)
  }

  async function handleSaveCliente(data: Partial<Cliente>) {
    await supabase.from('clientes').insert({ ...data, user_id: userId, status: novoStatus })
    const { data: updated } = await supabase
      .from('clientes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setClientes(updated || [])
  }

  const getClientesByStatus = (status: StatusCliente) =>
    clientes.filter(c => c.status === status)

  const getValorByStatus = (status: StatusCliente) =>
    clientes
      .filter(c => c.status === status)
      .reduce((acc, c) => acc + (c.valor_potencial || 0), 0)

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="text-slate-400 text-sm mt-1">
            {clientes.length} clientes no funil de vendas
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setNovoStatus('Novo'); setModalOpen(true) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </motion.button>
      </motion.div>

      {/* Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUNAS.map((status) => {
            const clientesColuna = getClientesByStatus(status)
            const valorColuna = getValorByStatus(status)
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: COLUNAS.indexOf(status) * 0.05 }}
                className={`flex-shrink-0 w-72 bg-slate-800/50 border-t-2 ${STATUS_PIPELINE_COLORS[status]} rounded-2xl flex flex-col`}
              >
                {/* Header coluna */}
                <div className="p-3 border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${COLUNA_COLORS[status]}`}>{status}</span>
                      <span className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                        {clientesColuna.length}
                      </span>
                    </div>
                    <button
                      onClick={() => { setNovoStatus(status); setModalOpen(true) }}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {valorColuna > 0 && (
                    <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      R$ {valorColuna.toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>

                {/* Cards */}
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 space-y-2 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-slate-700/20' : ''
                      }`}
                    >
                      {clientesColuna.map((cliente, index) => (
                        <Draggable key={cliente.id} draggableId={cliente.id} index={index}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                            >
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className={`bg-slate-800 border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all ${
                                  snap.isDragging
                                    ? 'border-blue-500/50 shadow-lg shadow-blue-500/10 rotate-1'
                                    : 'border-slate-700/50 hover:border-slate-600'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0">
                                    {cliente.nome.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{cliente.nome}</p>
                                    {cliente.empresa && (
                                      <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5 truncate">
                                        <Building2 className="w-3 h-3 flex-shrink-0" />{cliente.empresa}
                                      </p>
                                    )}
                                    {cliente.telefone && (
                                      <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                                        <Phone className="w-3 h-3 flex-shrink-0" />{cliente.telefone}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {cliente.valor_potencial && (
                                  <div className="mt-2 pt-2 border-t border-slate-700/50">
                                    <span className="text-green-400 text-xs font-medium flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      R$ {cliente.valor_potencial.toLocaleString('pt-BR')}
                                    </span>
                                  </div>
                                )}
                              </motion.div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {clientesColuna.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center py-6 text-slate-600 text-xs">
                          Arraste clientes aqui
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </motion.div>
            )
          })}
        </div>
      </DragDropContext>

      <ClienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCliente}
        cliente={null}
      />
    </div>
  )
}
