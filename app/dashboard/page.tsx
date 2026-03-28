'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Cliente, StatusCliente, Meta } from '@/types'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import {
  Users, TrendingUp, DollarSign,
  CheckCircle, Target, ShieldCheck, ArrowUpRight
} from 'lucide-react'

const STATUS_COLORS_MAP: Record<StatusCliente, string> = {
  'Novo': '#3b82f6',
  'Em Contato': '#eab308',
  'Proposta': '#a855f7',
  'Negociação': '#f97316',
  'Fechado': '#22c55e',
  'Perdido': '#ef4444',
}

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  color: string
  delay?: number
  progress?: number
}

function KPICard({ title, value, subtitle, icon: Icon, color, delay = 0, progress }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 cursor-default relative overflow-hidden"
    >
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
            className="text-2xl font-bold text-white mt-1"
          >
            {value}
          </motion.p>
          {subtitle && <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-wider font-bold">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {progress !== undefined && (
        <div className="mt-4 space-y-1.5 relative z-10">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-medium">Progresso</span>
            <span className="text-white font-bold">{Math.min(100, Math.round(progress))}%</span>
          </div>
          <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, progress)}%` }}
              transition={{ delay: delay + 0.5, duration: 1 }}
              className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function DashboardPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('nome_completo, role')
        .eq('id', session.user.id)
        .single()

      setUserName(profile?.nome_completo || session.user.email?.split('@')[0] || 'Vendedor')

      const isAdminUser = (profile as { role?: string } | null)?.role === 'admin' || session.user.email === 'admin@ldm.com'

      // Carregar clientes
      let query = supabase.from('clientes').select('*')
      if (!isAdminUser) {
        query = query.eq('user_id', session.user.id)
      }
      const { data: clientesData } = await query.order('created_at', { ascending: false })

      setClientes(clientesData || [])

      // Carregar meta do mês atual
      const now = new Date()
      const mesAno = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      
      const { data: metaData } = await supabase
        .from('metas')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('mes_ano', mesAno)
        .maybeSingle()

      setMeta(metaData)
      setLoading(false)
    }
    loadData()
  }, [])

  const totalClientes = clientes.length
  const clientesFechados = clientes.filter(c => c.status === 'Fechado').length
  
  // Cálculo de Vendas (Soma do valor potencial de clientes com status 'Fechado')
  const totalVendas = clientes
    .filter(c => c.status === 'Fechado')
    .reduce((acc, c) => acc + (c.valor_potencial || 0), 0)

  // Cálculo de Garantias (Soma do valor potencial de clientes que compraram garantia)
  const totalGarantias = clientes
    .filter(c => c.comprou_garantia && c.status === 'Fechado')
    .reduce((acc, c) => acc + (c.valor_potencial || 0), 0)

  const valorPotencial = clientes
    .filter(c => !['Fechado', 'Perdido'].includes(c.status))
    .reduce((acc, c) => acc + (c.valor_potencial || 0), 0)

  const statusData = Object.entries(STATUS_COLORS_MAP).map(([status, color]) => ({
    name: status,
    value: clientes.filter(c => c.status === status).length,
    color,
  })).filter(d => d.value > 0)

  const barData = Object.entries(STATUS_COLORS_MAP).map(([status]) => ({
    status,
    quantidade: clientes.filter(c => c.status === status).length,
  }))

  const recentClientes = clientes.slice(0, 5)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            Olá, {userName.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Resumo da sua carteira e metas de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-slate-400 text-sm">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </motion.div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Clientes"
          value={totalClientes}
          subtitle="Carteira Geral"
          icon={Users}
          color="bg-blue-500/20 text-blue-400"
          delay={0.1}
        />
        <KPICard
          title="Negócios Fechados"
          value={clientesFechados}
          subtitle="Conversões"
          icon={CheckCircle}
          color="bg-green-500/20 text-green-400"
          delay={0.2}
        />
        <KPICard
          title="Valor em Vendas"
          value={`R$ ${totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          subtitle="Realizado"
          icon={DollarSign}
          color="bg-emerald-500/20 text-emerald-400"
          delay={0.3}
        />
        <KPICard
          title="Valor Potencial"
          value={`R$ ${valorPotencial.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          subtitle="Em Aberto"
          icon={TrendingUp}
          color="bg-purple-500/20 text-purple-400"
          delay={0.4}
        />
      </div>

      {/* Seção de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard
          title="Meta de Venda"
          value={`R$ ${totalVendas.toLocaleString('pt-BR')} / R$ ${(meta?.meta_venda || 0).toLocaleString('pt-BR')}`}
          subtitle={meta?.meta_venda ? `Objetivo Mensal` : "Meta não definida"}
          icon={Target}
          color="bg-blue-600/20 text-blue-400"
          delay={0.5}
          progress={meta?.meta_venda ? (totalVendas / meta.meta_venda) * 100 : 0}
        />
        <KPICard
          title="Meta de Garantia"
          value={`R$ ${totalGarantias.toLocaleString('pt-BR')} / R$ ${(meta?.meta_garantia || 0).toLocaleString('pt-BR')}`}
          subtitle={meta?.meta_garantia ? `Objetivo Mensal` : "Meta não definida"}
          icon={ShieldCheck}
          color="bg-orange-500/20 text-orange-400"
          delay={0.6}
          progress={meta?.meta_garantia ? (totalGarantias / meta.meta_garantia) * 100 : 0}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pizza - Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-400" />
            Clientes por Status
          </h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500">
              Nenhum cliente cadastrado ainda
            </div>
          )}
          {/* Legenda */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400 text-xs">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Barras - Quantidade por status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart className="w-4 h-4 text-blue-400" />
            Distribuição do Pipeline
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="status"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={STATUS_COLORS_MAP[entry.status as StatusCliente] || '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Clientes recentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Últimos Clientes Adicionados</h3>
          <a href="/clientes" className="text-blue-400 text-sm hover:text-blue-300 transition-colors flex items-center gap-1">
            Ver todos <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        {recentClientes.length > 0 ? (
          <div className="space-y-2">
            {recentClientes.map((cliente, i) => (
              <motion.div
                key={cliente.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.05 }}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-semibold text-sm">
                    {cliente.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{cliente.nome}</p>
                    {cliente.empresa && (
                      <p className="text-slate-400 text-xs">{cliente.empresa}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {cliente.valor_potencial && (
                    <span className="text-slate-400 text-xs hidden sm:block">
                      R$ {cliente.valor_potencial.toLocaleString('pt-BR')}
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg border ${
                    {
                      'Novo': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                      'Em Contato': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                      'Proposta': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                      'Negociação': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                      'Fechado': 'bg-green-500/20 text-green-400 border-green-500/30',
                      'Perdido': 'bg-red-500/20 text-red-400 border-red-500/30',
                    }[cliente.status]
                  }`}>
                    {cliente.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Nenhum cliente cadastrado ainda.</p>
            <a href="/clientes" className="text-blue-400 text-sm hover:underline mt-1 inline-block">
              Adicionar primeiro cliente →
            </a>
          </div>
        )}
      </motion.div>
    </div>
  )
}
