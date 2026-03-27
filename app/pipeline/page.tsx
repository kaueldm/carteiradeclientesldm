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
    <div className="min-h-screen flex flex-col p-4 lg:p-6 bg-gradient-to-br from-ldm-black via-slate-900 to-ldm-blue-dark">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-ldm-orange to-ldm-orange-light bg-clip-text text-transparent">Pipeline de Vendas</h1>
          <p className="text-gray-400 text-sm mt-1">
            {clientes.length} clientes no funil
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setNovoStatus('Novo'); setModalOpen(true) }}
          className="flex items-center gap-2 bg-gradient-to-r from-ldm-orange to-ldm-orange-dark hover:shadow-lg hover:shadow-ldm-orange/50 text-white px-6 py-3 rounded-xl font-semibold transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </motion.button>
      </motion.div>

      {/* Kanban Container com grid responsivo */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 auto-rows-max overflow-y-auto">
          {COLUNAS.map((status) => {
            const clientesColuna = getClientesByStatus(status)
            const valorColuna = getValorByStatus(status)
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: COLUNAS.indexOf(status) * 0.05 }}
                className={`w-full bg-white/5 backdrop-blur-xl border-t-4 ${STATUS_PIPELINE_COLORS[status]} rounded-2xl flex flex-col shadow-lg hover:shadow-xl transition-all h-fit max-h-[calc(100vh-200px)]`}
              >
                {/* Header coluna */}
                <div className="p-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-base font-bold ${COLUNA_COLORS[status]}`}>{status}</span>
                      <span className="bg-ldm-orange/20 text-ldm-orange text-xs font-semibold px-3 py-1 rounded-full border border-ldm-orange/30">
                        {clientesColuna.length}
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setNovoStatus(status); setModalOpen(true) }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-ldm-orange hover:bg-ldm-orange/20 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                  {valorColuna > 0 && (
                    <p className="text-gray-400 text-xs flex items-center gap-1 font-semibold">
                      <DollarSign className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">R$ {(valorColuna / 1000).toFixed(1)}k</span>
                    </p>
                  )}
                </div>

                {/* Cards com scroll interno */}
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] transition-all ${
                        snapshot.isDraggingOver ? 'bg-ldm-orange/10 border border-ldm-orange/30' : ''
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
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`bg-white/5 backdrop-blur-sm border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all ${
                                  snap.isDragging
                                    ? 'border-ldm-orange/50 shadow-lg shadow-ldm-orange/20 scale-105'
                                    : 'border-white/10 hover:border-ldm-orange/30 hover:bg-white/10'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-ldm-orange to-ldm-orange-dark rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg shadow-ldm-orange/30">
                                    {cliente.nome.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-semibold truncate">{cliente.nome}</p>
                                    {cliente.empresa && (
                                      <p className="text-gray-400 text-xs flex items-center gap-1 mt-1 truncate">
                                        <Building2 className="w-3 h-3 flex-shrink-0" />{cliente.empresa}
                                      </p>
                                    )}
                                    {cliente.telefone && (
                                      <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                                        <Phone className="w-3 h-3 flex-shrink-0" />{cliente.telefone}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {cliente.valor_potencial && (
                                  <div className="mt-2 pt-2 border-t border-white/10">
                                    <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      R$ {(cliente.valor_potencial / 1000).toFixed(1)}k
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
                        <div className="text-center py-12 text-gray-500 text-sm font-medium">
                          <p>Sem clientes</p>
                          <p className="text-xs text-gray-600 mt-1">Arraste ou crie um novo</p>
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
