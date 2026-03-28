'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, User, Building2, Phone, Mail, DollarSign, FileText, Hash, ShieldCheck, Truck } from 'lucide-react'
import { Cliente, StatusCliente } from '@/types'

interface ClienteModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Cliente>) => Promise<void>
  cliente?: Cliente | null
}

const STATUS_OPTIONS: StatusCliente[] = ['Novo', 'Em Contato', 'Proposta', 'Negociação', 'Fechado', 'Perdido']
const ESTADO_ATUAL_OPTIONS = ['No WMS', 'Não Entregue', 'Entregue', 'Item Virtual Enviado']

export default function ClienteModal({ open, onClose, onSave, cliente }: ClienteModalProps) {
  const [form, setForm] = useState({
    nome: '',
    empresa: '',
    telefone: '',
    email: '',
    status: 'Novo' as StatusCliente,
    valor_potencial: '',
    observacoes: '',
    cpf_cnpj: '',
    numero_pedido: '',
    numero_orcamento: '',
    comprou_garantia: false,
    garantia: false,
    valor_garantia: '',
    estado_atual: 'No WMS',
    tipo: 'orcamento' as 'orcamento' | 'pedido',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (cliente) {
      setForm({
        nome: cliente.nome || '',
        empresa: cliente.empresa || '',
        telefone: cliente.telefone || '',
        email: cliente.email || '',
        status: cliente.status || 'Novo',
        valor_potencial: cliente.valor_potencial?.toString() || '',
        observacoes: cliente.observacoes || '',
        cpf_cnpj: cliente.cpf_cnpj || '',
        numero_pedido: cliente.numero_pedido || '',
        numero_orcamento: cliente.numero_orcamento || '',
        comprou_garantia: cliente.comprou_garantia || false,
        garantia: cliente.garantia || false,
        valor_garantia: cliente.valor_garantia?.toString() || '',
        estado_atual: cliente.estado_atual || 'No WMS',
        tipo: cliente.tipo || 'orcamento',
      })
    } else {
      setForm({
        nome: '',
        empresa: '',
        telefone: '',
        email: '',
        status: 'Novo',
        valor_potencial: '',
        observacoes: '',
        cpf_cnpj: '',
        numero_pedido: '',
        numero_orcamento: '',
        comprou_garantia: false,
        garantia: false,
        valor_garantia: '',
        estado_atual: 'No WMS',
        tipo: 'orcamento',
      })
    }
  }, [cliente, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSave({
      ...form,
      valor_potencial: form.valor_potencial ? parseFloat(form.valor_potencial) : undefined,
      valor_garantia: form.valor_garantia ? parseFloat(form.valor_garantia) : undefined,
    })
    setLoading(false)
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
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50 sticky top-0 bg-slate-800 z-10">
              <h2 className="text-lg font-semibold text-white">
                {cliente ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Nome do Cliente *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={form.nome}
                      onChange={e => setForm({ ...form, nome: e.target.value })}
                      required
                      placeholder="Nome completo"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">CPF ou CNPJ</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={form.cpf_cnpj}
                      onChange={e => setForm({ ...form, cpf_cnpj: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Empresa</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={form.empresa}
                      onChange={e => setForm({ ...form, empresa: e.target.value })}
                      placeholder="Nome da empresa"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      value={form.telefone}
                      onChange={e => setForm({ ...form, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="email@cliente.com"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Tipo de Registro</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm({ ...form, tipo: e.target.value as 'orcamento' | 'pedido' })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  >
                    <option value="orcamento">Orçamento</option>
                    <option value="pedido">Pedido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Estado do Pedido</label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      value={form.estado_atual}
                      onChange={e => setForm({ ...form, estado_atual: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm appearance-none cursor-pointer"
                    >
                      {ESTADO_ATUAL_OPTIONS.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Status Comercial</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as StatusCliente })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm appearance-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Valor (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      step="0.01"
                      value={form.valor_potencial}
                      onChange={e => setForm({ ...form, valor_potencial: e.target.value })}
                      placeholder="0,00"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="comprou_garantia"
                    checked={form.comprou_garantia}
                    onChange={e => setForm({ ...form, comprou_garantia: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700"
                  />
                  <label htmlFor="comprou_garantia" className="text-sm text-slate-300 cursor-pointer">Comprou Garantia</label>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={e => setForm({ ...form, observacoes: e.target.value })}
                  rows={3}
                  placeholder="Detalhes adicionais..."
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50 sticky bottom-0 bg-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-600/20"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
