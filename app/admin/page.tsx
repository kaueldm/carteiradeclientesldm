'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { MessageSquare, LogOut, Filter, ShieldCheck, ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface VendedorMetricas {
  id: string
  nome: string
  email: string
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
  vendedor_nome?: string
}

// Lista de vendedores permitidos
const VENDEDORES_PERMITIDOS = [
  { email: 'ana@ldm.com', nome: 'Ana Carolina' },
  { email: 'bruna@ldm.com', nome: 'Bruna Aparecida' },
  { email: 'bruno@ldm.com', nome: 'Bruno Vieira' },
  { email: 'tatiani@ldm.com', nome: 'Tatiani Aparecida' },
  { email: 'jessica@ldm.com', nome: 'Jessica Alves' },
  { email: 'vitor@ldm.com', nome: 'Vitor Costa' },
  { email: 'mario@ldm.com', nome: 'Mario Furtado' },
]

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

    if (profile?.role !== 'admin' && data.session.user.email !== 'admin@ldm.com') {
      router.push('/dashboard')
    }
  }, [router])

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)

      // Carregar todos os vendedores permitidos
      const { data: usuarios, error: usuariosError } = await supabase
        .from('profiles')
        .select('id, nome_completo, email')
        .in('email', VENDEDORES_PERMITIDOS.map(v => v.email))
        .order('nome_completo', { ascending: true })

      if (usuariosError) throw usuariosError

      // Carregar todos os clientes
      const { data: todosClientes, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })

      if (clientesError) throw clientesError

      // Criar mapa de vendedores para referência rápida
      const vendedoresMap = new Map((usuarios || []).map(u => [u.id, u]))

      // Enriquecer clientes com nome do vendedor
      const clientesEnriquecidos = (todosClientes || []).map(c => ({
        ...c,
        vendedor_nome: vendedoresMap.get(c.user_id)?.nome_completo || 'Desconhecido'
      }))

      setClientes(clientesEnriquecidos)

      // Calcular métricas para cada vendedor
      const metricas: VendedorMetricas[] = (usuarios || []).map((user) => {
        const clientesVendedor = clientesEnriquecidos.filter(c => c.user_id === user.id)
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
          email: user.email || '',
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
  }, [verificarAdmin])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

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
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white">Painel Administrativo</h1>
                <p className="text-xs text-slate-400">Gestão de Vendedores</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAbrirNotif(!abrirNotif)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium text-sm ${
                abrirNotif ? 'bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              Enviar mensagem aos vendedores
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
                  <button onClick={enviarNotificacao} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all">Enviar Agora</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resumo Global */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <p className="text-sm text-slate-400 mb-1">Total de Vendas (Geral)</p>
            <h2 className="text-3xl font-bold text-emerald-400">
              R$ {totalVendasGlobal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <p className="text-sm text-slate-400 mb-1">Total em Garantias</p>
            <h2 className="text-3xl font-bold text-blue-400">
              R$ {totalGarantiasGlobal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <p className="text-sm text-slate-400 mb-1">Taxa Média de Conversão</p>
            <h2 className="text-3xl font-bold text-purple-400">
              {vendedores.length > 0 ? Math.round(vendedores.reduce((sum, v) => sum + v.taxaConversao, 0) / vendedores.length) : 0}%
            </h2>
          </div>
        </div>

        {/* Filtro e Gráfico */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart className="w-5 h-5 text-blue-400" />
              Desempenho por Vendedor
            </h2>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={filtroVendedor}
                onChange={(e) => setFiltroVendedor(e.target.value)}
                className="flex-1 md:w-64 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none"
              >
                <option value="todos">Todos os Vendedores</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosFiltrados}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="nome" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Vendas']}
                />
                <Bar dataKey="valorTotal" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela de Vendedores */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">Métricas Detalhadas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase font-bold">
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4">Clientes</th>
                  <th className="px-6 py-4">Vendas</th>
                  <th className="px-6 py-4">Conversão</th>
                  <th className="px-6 py-4">Total Vendido</th>
                  <th className="px-6 py-4">Garantias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dadosFiltrados.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{v.nome}</p>
                      <p className="text-xs text-slate-500">{v.email}</p>
                    </td>
                    <td className="px-6 py-4 text-white">{v.totalClientes}</td>
                    <td className="px-6 py-4 text-emerald-400 font-bold">{v.clientesFechados}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full w-16 overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: `${v.taxaConversao}%` }} />
                        </div>
                        <span className="text-xs text-white">{v.taxaConversao}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-bold">R$ {v.valorTotal.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-blue-400 font-bold">R$ {v.vendasGarantia.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela de Clientes Recentes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">Últimas Atividades</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase font-bold">
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {clientesFiltrados.slice(0, 10).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{c.nome}</p>
                      <p className="text-xs text-slate-500">{c.empresa || 'Sem empresa'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{c.vendedor_nome}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${c.status === 'Fechado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-white font-medium">
                      {c.valor_potencial ? `R$ ${c.valor_potencial.toLocaleString('pt-BR')}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
