'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, Save, TrendingUp, ShieldCheck, Calendar, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout'
import { Meta } from '@/types'

export default function MetasPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mesAno, setMesAno] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [meta, setMeta] = useState<Partial<Meta>>({
    meta_venda: 0,
    meta_garantia: 0
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    carregarMeta()
  }, [mesAno])

  async function carregarMeta() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('mes_ano', mesAno)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setMeta(data)
      } else {
        setMeta({ meta_venda: 0, meta_garantia: 0 })
      }
    } catch (error) {
      console.error('Erro ao carregar meta:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase
        .from('metas')
        .upsert({
          user_id: session.user.id,
          mes_ano: mesAno,
          meta_venda: meta.meta_venda,
          meta_garantia: meta.meta_garantia,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,mes_ano' })

      if (error) throw error
      setMessage({ type: 'success', text: 'Metas salvas com sucesso!' })
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
      setMessage({ type: 'error', text: 'Erro ao salvar metas. Tente novamente.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Target className="w-7 h-7 text-blue-500" />
              Metas do Mês
            </h1>
            <p className="text-slate-400">Defina seus objetivos de vendas e garantias para o mês.</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-xl border border-slate-700">
            <Calendar className="w-5 h-5 text-slate-400 ml-2" />
            <input
              type="month"
              value={mesAno}
              onChange={(e) => setMesAno(e.target.value)}
              className="bg-transparent text-white border-none focus:ring-0 text-sm cursor-pointer"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Meta de Venda */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Meta de Venda</h3>
                  <p className="text-sm text-slate-400">Valor total em vendas (R$)</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                <input
                  type="number"
                  value={meta.meta_venda}
                  onChange={(e) => setMeta({ ...meta, meta_venda: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white text-xl font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Meta de Garantia */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Meta de Garantia</h3>
                  <p className="text-sm text-slate-400">Valor em garantias vendidas (R$)</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                <input
                  type="number"
                  value={meta.meta_garantia}
                  onChange={(e) => setMeta({ ...meta, meta_garantia: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white text-xl font-bold focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col items-center gap-4 pt-4">
              {message && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                    message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {message.type === 'success' ? <Save className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {message.text}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                className="w-full md:w-64 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Metas
                  </>
                )}
              </motion.button>
              <p className="text-xs text-slate-500 text-center">
                As metas são salvas mensalmente e podem ser editadas a qualquer momento.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
