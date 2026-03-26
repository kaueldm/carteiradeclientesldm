'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, MessageSquare } from 'lucide-react'
import { Interacao } from '@/types'

interface InteracaoModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Interacao>) => Promise<void>
  clienteId: string
  clienteNome: string
}

const TIPOS = ['Ligação', 'Email', 'Reunião', 'WhatsApp', 'Visita', 'Outro'] as const

export default function InteracaoModal({ open, onClose, onSave, clienteId, clienteNome }: InteracaoModalProps) {
  const [form, setForm] = useState({
    tipo: 'Ligação' as Interacao['tipo'],
    descricao: '',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descricao.trim()) return
    setLoading(true)
    await onSave({ ...form, cliente_id: clienteId })
    setLoading(false)
    setForm({ tipo: 'Ligação', descricao: '' })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
              <div>
                <h2 className="text-lg font-semibold text-white">Registrar Interação</h2>
                <p className="text-slate-400 text-sm">{clienteNome}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tipo de Interação</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIPOS.map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setForm({ ...form, tipo })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                        form.tipo === tipo
                          ? 'bg-blue-600 text-white border border-blue-500'
                          : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição *</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <textarea
                    value={form.descricao}
                    onChange={e => setForm({ ...form, descricao: e.target.value })}
                    required
                    placeholder="Descreva o que foi discutido..."
                    rows={4}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl transition-all text-sm font-medium">
                  Cancelar
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white py-2.5 rounded-xl transition-all text-sm font-medium flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Registrar</>}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
