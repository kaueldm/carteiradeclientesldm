'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { MessageSquare, LogOut, Bell, Filter, ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Correcting imports from framer-motion
import { motion, AnimatePresence } from 'framer-motion'

interface VendedorMetricas {
  id: string
  nome: string
  totalClientes: number
  clientesFechados: number
  valorTotal: number
  taxaConversao: number
  vendasGarantia: number
}

interface ClienteAdmin {
  id: string
  nome: string
  empresa?: string
  telefone?: string
  email?: string
  status: string
  valor_potencial?: number
  user_id: string
  comprou_garantia?: boolean
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [vendedores, setVendedores] = useState<VendedorMetricas[]>([])
  const [clientes, setClientes] = useState<ClienteAdmin[]>([])
  const [loading, setLoading] = useState(true)

  const [filtroVendedor, setFiltroVendedor] = useState<string>('todos')
  const [notificacaoTitulo, setNotificacaoTitulo] = useState('')
  const [notificacaoMsg, setNotificacaoMsg] = useState('')
  const [abrirNotif, setAbrirNotif] = useState(false)

  const verificarAdmin = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [router])

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)

      const { data: usuarios, error: usuariosError } = await supabase
        .from('profiles')
        .select('id, nome_completo')
        .eq('role', 'vendedor')
        .order('nome_completo', { ascending: true })

      if (usuariosError) throw usuariosError

      const { data: todosClientes, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })

      if (clientesError) throw clientesError

      setClientes(todosClientes || [])

      const metricas: VendedorMetricas[] = (usuarios || []).map((user) => {
        const clientesVendedor = (todosClientes || []).filter(c => c.user_id === user.id)
        const totalClientes = clientesVendedor.length
        const clientesFechados = clientesVendedor.filter(c => c.status === 'Fechado').length
        const valorTotal = clientesVendedor
          .filter(c => c.status === 'Fechado')
          .reduce((sum, c) => sum + (Number(c.valor_potencial) || 0), 0)
        const vendasGarantia = clientesVendedor
          .filter(c => c.comprou_garantia && c.status === 'Fechado')
          .reduce((sum, c) => sum + (Number(c.valor_potencial) || 0), 0)
        const taxaConversao = totalClientes > 0 ? (clientesFechados / totalClientes) * 100 : 0

        return {
          id: user.id,
          nome: user.nome_completo || 'Desconhecido',
          totalClientes,
          clientesFechados,
          valorTotal,
          vendasGarantia,
          taxaConversao: Math.round(taxaConversao),
        }
      })

      setVendedores(metricas)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    verificarAdmin()
    carregarDados()
  }, [verificarAdmin, carregarDados])

  async function enviarNotificacao() {
    if (!notificacaoTitulo || !notificacaoMsg) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      await supabase.from('notificacoes').insert({
        titulo: notificacaoTitulo,
        mensagem: notificacaoMsg,
        criada_por: session?.user.id,
      })

      setNotificacaoTitulo('')
      setNotificacaoMsg('')
      setAbrirNotif(false)
      alert('Notificação enviada com sucesso!')
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const dadosFiltrados = filtroVendedor === 'todos' ? vendedores : vendedores.filter(v => v.id === filtroVendedor)
  const clientesFiltrados = filtroVendedor === 'todos' 
    ? clientes 
    : clientes.filter(c => c.user_id === filtroVendedor)

  const totalVendasGlobal = dadosFiltrados.reduce((sum, v) => sum + v.valorTotal, 0)
  const totalGarantiasGlobal = dadosFiltrados.reduce((sum, v) => sum + v.vendasGarantia, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white hidden sm:block">Painel Administrativo</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAbrirNotif(!abrirNotif)}
              className={`p-2.5 rounded-xl transition-all ${abrirNotif ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              title="Enviar Notificação"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all font-medium text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Notificação */}
        <AnimatePresence>
          {abrirNotif && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-slate-900 border border-blue-500/30 rounded-2xl space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Enviar Notificação Geral
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    placeholder="Título da notificação"
                    value={notificacaoTitulo}
                    onChange={(e) => setNotificacaoTitulo(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <textarea
                    placeholder="Conteúdo da mensagem..."
                    value={notificacaoMsg}
                    onChange={(e) => setNotificacaoMsg(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setAbrirNotif(false)} className="px-6 py-2.5 text-slate-400 hover:text-white font-medium">Cancelar</button>
                  <button onClick={enviarNotificacao} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">Enviar para Todos</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtros e KPIs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
            <div className="p-2 text-slate-500"><Filter className="w-4 h-4" /></div>
            <select
              value={filtroVendedor}
              onChange={(e) => setFiltroVendedor(e.target.value)}
              className="bg-transparent text-white border-none focus:ring-0 text-sm font-medium pr-8 cursor-pointer w-full"
            >
              <option value="todos" className="bg-slate-900">Todos os Vendedores</option>
              {vendedores.map(v => (
                <option key={v.id} value={v.id} className="bg-slate-900">{v.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Clientes</p>
              <p className="text-xl font-bold text-white">{clientesFiltrados.length}</p>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Vendas</p>
              <p className="text-xl font-bold text-emerald-400">R$ {totalVendasGlobal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Garantias</p>
              <p className="text-xl font-bold text-orange-400">R$ {totalGarantiasGlobal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Conversão</p>
              <p className="text-xl font-bold text-blue-400">
                {Math.round(clientesFiltrados.length > 0 ? (clientesFiltrados.filter(c => c.status === 'Fechado').length / clientesFiltrados.length) * 100 : 0)}%
              </p>
            </div>
          </div>
        </div>

        {/* Tabela de Vendedores */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white">Desempenho por Vendedor</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Vendedor</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Clientes</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Fechados</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Total Vendas</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Garantias</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {vendedores.filter(v => filtroVendedor === 'todos' || v.id === filtroVendedor).map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 font-bold text-xs">
                          {v.nome.charAt(0)}
                        </div>
                        <span className="font-medium text-white">{v.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">{v.totalClientes}</td>
                    <td className="px-6 py-4 text-center font-medium text-emerald-400">{v.clientesFechados}</td>
                    <td className="px-6 py-4 text-right font-bold text-white">R$ {v.valorTotal.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-right font-bold text-orange-400">R$ {v.vendasGarantia.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full" style={{ width: `${v.taxaConversao}%` }} />
                        </div>
                        <span className="text-xs font-bold">{v.taxaConversao}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-white font-bold mb-6">Vendas por Vendedor</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendedores.filter(v => v.valorTotal > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="valorTotal" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
