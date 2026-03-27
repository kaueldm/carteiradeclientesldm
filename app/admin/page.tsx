'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, TrendingUp, MessageSquare, LogOut, Bell, Filter } from 'lucide-react'
import Image from 'next/image'

interface VendedorMetricas {
  id: string
  nome: string
  totalClientes: number
  clientesFechados: number
  valorTotal: number
  taxaConversao: number
}

export default function AdminPage() {
  const router = useRouter()
  const [vendedores, setVendedores] = useState<VendedorMetricas[]>([])

  const [filtroVendedor, setFiltroVendedor] = useState<string>('todos')
  const [notificacaoTitulo, setNotificacaoTitulo] = useState('')
  const [notificacaoMsg, setNotificacaoMsg] = useState('')
  const [abrirNotif, setAbrirNotif] = useState(false)

  useEffect(() => {
    const init = async () => {
      await verificarAdmin()
      await carregarMetricas()
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function verificarAdmin() {
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
  }

  async function carregarMetricas() {
    try {
      const { data: usuarios } = await supabase
        .from('profiles')
        .select('id, nome_completo')
        .eq('role', 'vendedor')

      if (!usuarios) return

      const metricas: VendedorMetricas[] = []

      for (const user of usuarios) {
        const { data: clientes } = await supabase
          .from('clientes')
          .select('*')
          .eq('user_id', user.id)

        const totalClientes = clientes?.length || 0
        const clientesFechados = clientes?.filter(c => c.status === 'Fechado').length || 0
        const valorTotal = clientes?.reduce((sum, c) => sum + (c.valor_potencial || 0), 0) || 0
        const taxaConversao = totalClientes > 0 ? (clientesFechados / totalClientes) * 100 : 0

        metricas.push({
          id: user.id,
          nome: user.nome_completo || 'Desconhecido',
          totalClientes,
          clientesFechados,
          valorTotal,
          taxaConversao: Math.round(taxaConversao),
        })
      }

      setVendedores(metricas)
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    }
  }

  async function enviarNotificacao() {
    if (!notificacaoTitulo || !notificacaoMsg) return

    try {
      const { data: user } = await supabase.auth.getUser()
      await supabase.from('notificacoes').insert({
        titulo: notificacaoTitulo,
        mensagem: notificacaoMsg,
        criada_por: user.user?.id,
      })

      setNotificacaoTitulo('')
      setNotificacaoMsg('')
      setAbrirNotif(false)
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const dadosFiltrados = filtroVendedor === 'todos' ? vendedores : vendedores.filter(v => v.id === filtroVendedor)

  return (
    <div className="min-h-screen bg-gradient-to-br from-ldm-black via-slate-900 to-ldm-blue-dark">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image src="/assets/logo-menu.png" alt="LDM" fill className="object-contain" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-ldm-orange to-ldm-orange-light bg-clip-text text-transparent">
              Painel Admin
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setAbrirNotif(!abrirNotif)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <Bell className="w-6 h-6 text-ldm-orange" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Painel de Notificações */}
        {abrirNotif && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-white/5 backdrop-blur-xl border border-ldm-orange/30 rounded-xl"
          >
            <h2 className="text-lg font-bold text-ldm-orange mb-4">Enviar Notificação aos Vendedores</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Título da mensagem"
                value={notificacaoTitulo}
                onChange={(e) => setNotificacaoTitulo(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-ldm-orange focus:ring-2 focus:ring-ldm-orange/30"
              />
              <textarea
                placeholder="Mensagem completa"
                value={notificacaoMsg}
                onChange={(e) => setNotificacaoMsg(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-ldm-orange focus:ring-2 focus:ring-ldm-orange/30"
              />
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={enviarNotificacao}
                  className="px-6 py-2 bg-gradient-to-r from-ldm-orange to-ldm-orange-dark text-white rounded-lg font-semibold"
                >
                  Enviar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setAbrirNotif(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg"
                >
                  Cancelar
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filtro de Vendedor */}
        <div className="mb-8 flex items-center gap-4">
          <Filter className="w-5 h-5 text-ldm-orange" />
          <select
            value={filtroVendedor}
            onChange={(e) => setFiltroVendedor(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-ldm-orange focus:ring-2 focus:ring-ldm-orange/30"
          >
            <option value="todos">Todos os Vendedores</option>
            {vendedores.map(v => (
              <option key={v.id} value={v.id}>{v.nome}</option>
            ))}
          </select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total de Clientes</p>
                <p className="text-3xl font-bold text-ldm-orange">
                  {dadosFiltrados.reduce((sum, v) => sum + v.totalClientes, 0)}
                </p>
              </div>
              <Users className="w-12 h-12 text-ldm-orange/30" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Clientes Fechados</p>
                <p className="text-3xl font-bold text-ldm-blue">
                  {dadosFiltrados.reduce((sum, v) => sum + v.clientesFechados, 0)}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-ldm-blue/30" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Valor Total</p>
                <p className="text-3xl font-bold text-green-400">
                  R$ {(dadosFiltrados.reduce((sum, v) => sum + v.valorTotal, 0) / 1000).toFixed(1)}k
                </p>
              </div>
              <MessageSquare className="w-12 h-12 text-green-400/30" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Taxa Média de Conversão</p>
                <p className="text-3xl font-bold text-purple-400">
                  {Math.round(dadosFiltrados.reduce((sum, v) => sum + v.taxaConversao, 0) / (dadosFiltrados.length || 1))}%
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-400/30" />
            </div>
          </motion.div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Barras */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"
          >
            <h3 className="text-lg font-bold text-white mb-4">Clientes por Vendedor</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosFiltrados}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="nome" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="totalClientes" fill="#FF8C00" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Gráfico de Pizza */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"
          >
            <h3 className="text-lg font-bold text-white mb-4">Taxa de Conversão</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosFiltrados}
                  dataKey="taxaConversao"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {dadosFiltrados.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#FF8C00', '#0066CC', '#00CC66', '#FF6B6B'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Tabela de Vendedores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-x-auto"
        >
          <h3 className="text-lg font-bold text-white mb-4">Detalhes dos Vendedores</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-ldm-orange">Vendedor</th>
                <th className="text-left py-3 px-4 text-ldm-orange">Total de Clientes</th>
                <th className="text-left py-3 px-4 text-ldm-orange">Fechados</th>
                <th className="text-left py-3 px-4 text-ldm-orange">Valor Total</th>
                <th className="text-left py-3 px-4 text-ldm-orange">Taxa de Conversão</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.map((vendedor) => (
                <tr key={vendedor.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="py-3 px-4 text-white">{vendedor.nome}</td>
                  <td className="py-3 px-4 text-gray-300">{vendedor.totalClientes}</td>
                  <td className="py-3 px-4 text-green-400">{vendedor.clientesFechados}</td>
                  <td className="py-3 px-4 text-ldm-orange">R$ {(vendedor.valorTotal / 1000).toFixed(1)}k</td>
                  <td className="py-3 px-4 text-purple-400">{vendedor.taxaConversao}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  )
}
