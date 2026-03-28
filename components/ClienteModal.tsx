'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, User, Building2, Phone, Mail, DollarSign, FileText, Hash, ShieldCheck } from 'lucide-react'
import { Cliente, StatusCliente } from '@/types'

interface ClienteModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Cliente>) => Promise<void>
  cliente?: Cliente | null
}

const STATUS_OPTIONS: StatusCliente[] = ['Novo', 'Em Contato', 'Proposta', 'Negociação', 'Fechado', 'Perdido']

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
    tipo: 'orcamento',
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
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
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

                {/* CPF/CNPJ */}
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

                {/* Empresa */}
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

                {/* Telefone */}
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

                {/* Email */}
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

                {/* Nº Pedido */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nº Pedido</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={form.numero_pedido}
                      onChange={e => setForm({ ...form, numero_pedido: e.target.value })}
                      placeholder="000000"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Nº Orçamento */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nº Orçamento</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={form.numero_orcamento}
                      onChange={e => setForm({ ...form, numero_orcamento: e.target.value })}
                      placeholder="000000"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as StatusCliente })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm appearance-none cursor-pointer"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s} className="bg-slate-800 text-white">{s}</option>
                    ))}
                  </select>
                </div>

                {/* Valor potencial */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Valor Potencial (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      value={form.valor_potencial}
                      onChange={e => setForm({ ...form, valor_potencial: e.target.value })}
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Comprou Garantia */}
                <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                  <div className="flex items-center h-5">
                    <input
                      id="comprou_garantia"
                      type="checkbox"
                      checked={form.comprou_garantia}
                      onChange={e => setForm({ ...form, comprou_garantia: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700"
                    />
                  </div>
                  <label htmlFor="comprou_garantia" className="flex items-center gap-2 text-sm font-medium text-slate-300 cursor-pointer">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Cliente comprou garantia?
                  </label>
                </div>

                {/* Observações */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Observações</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <textarea
                      value={form.observacoes}
                      onChange={e => setForm({ ...form, observacoes: e.target.value })}
                      placeholder="Notas sobre o cliente..."
                      rows={3}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2 sticky bottom-0 bg-slate-800 py-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white py-2.5 rounded-xl transition-all text-sm font-medium flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {cliente ? 'Salvar Alterações' : 'Adicionar Cliente'}
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
