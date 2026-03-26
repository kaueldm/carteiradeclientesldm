'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Cliente, StatusCliente } from '@/types'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from 'recharts'
import { TrendingUp, Users, Target, Award } from 'lucide-react'

const STATUS_COLORS_MAP: Record<StatusCliente, string> = {
  'Novo': '#3b82f6',
  'Em Contato': '#eab308',
  'Proposta': '#a855f7',
  'Negociação': '#f97316',
  'Fechado': '#22c55e',
  'Perdido': '#ef4444',
}

export default function RelatoriosPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })
      setClientes(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Dados para gráficos
  const statusData = Object.entries(STATUS_COLORS_MAP).map(([status, color]) => ({
    name: status,
    value: clientes.filter(c => c.status === status).length,
    valor: clientes.filter(c => c.status === status).reduce((acc, c) => acc + (c.valor_potencial || 0), 0),
    color,
  }))

  // Evolução mensal
  const evolucaoMensal = (() => {
    const meses: Record<string, { mes: string; clientes: number; valor: number }> = {}
    clientes.forEach(c => {
      const data = new Date(c.created_at)
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      const label = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      if (!meses[chave]) meses[chave] = { mes: label, clientes: 0, valor: 0 }
      meses[chave].clientes++
      meses[chave].valor += c.valor_potencial || 0
    })
    return Object.values(meses).slice(-6)
  })()

  // KPIs
  const totalClientes = clientes.length
  const taxaConversao = totalClientes > 0
    ? ((clientes.filter(c => c.status === 'Fechado').length / totalClientes) * 100).toFixed(1)
    : '0'
  const valorTotal = clientes.filter(c => c.status === 'Fechado').reduce((acc, c) => acc + (c.valor_potencial || 0), 0)
  const valorPipeline = clientes.filter(c => !['Perdido'].includes(c.status)).reduce((acc, c) => acc + (c.valor_potencial || 0), 0)
  const clientesAtivos = clientes.filter(c => !['Fechado', 'Perdido'].includes(c.status)).length

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-800 rounded-2xl h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Relatórios</h1>
        <p className="text-slate-400 text-sm mt-1">Análise completa da sua carteira de clientes</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total de Clientes', value: totalClientes, icon: Users, color: 'bg-blue-500/20 text-blue-400', delay: 0.1 },
          { title: 'Taxa de Conversão', value: `${taxaConversao}%`, icon: Target, color: 'bg-green-500/20 text-green-400', delay: 0.2 },
          { title: 'Valor Fechado', value: `R$ ${valorTotal.toLocaleString('pt-BR')}`, icon: Award, color: 'bg-yellow-500/20 text-yellow-400', delay: 0.3 },
          { title: 'Pipeline Ativo', value: clientesAtivos, icon: TrendingUp, color: 'bg-purple-500/20 text-purple-400', delay: 0.4 },
        ].map((kpi) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: kpi.delay }}
            whileHover={{ y: -4 }}
            className="bg-slate-800 border border-slate-700/50 rounded-2xl p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs font-medium">{kpi.title}</p>
                <p className="text-xl font-bold text-white mt-1">{kpi.value}</p>
              </div>
              <div className={`w-10 h-10 ${kpi.color} rounded-xl flex items-center justify-center`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold mb-4">Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {statusData.filter(d => d.value > 0).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {statusData.filter(d => d.value > 0).map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400 text-xs">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Valor por status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold mb-4">Valor Potencial por Status (R$)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData.filter(d => d.valor > 0)} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(v: unknown) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, 'Valor']}
              />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Evolução mensal */}
        {evolucaoMensal.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 lg:col-span-2"
          >
            <h3 className="text-white font-semibold mb-4">Evolução Mensal de Clientes</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={evolucaoMensal} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="clientes" stroke="#3b82f6" fill="url(#colorClientes)" strokeWidth={2} name="Clientes" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Tabela resumo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5"
      >
        <h3 className="text-white font-semibold mb-4">Resumo por Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-slate-400 text-xs font-medium py-2 pr-4">Status</th>
                <th className="text-right text-slate-400 text-xs font-medium py-2 px-4">Clientes</th>
                <th className="text-right text-slate-400 text-xs font-medium py-2 px-4">% do Total</th>
                <th className="text-right text-slate-400 text-xs font-medium py-2 pl-4">Valor Potencial</th>
              </tr>
            </thead>
            <tbody>
              {statusData.map(row => (
                <tr key={row.name} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }} />
                      <span className="text-white text-sm">{row.name}</span>
                    </div>
                  </td>
                  <td className="text-right text-slate-300 text-sm py-3 px-4">{row.value}</td>
                  <td className="text-right text-slate-300 text-sm py-3 px-4">
                    {totalClientes > 0 ? ((row.value / totalClientes) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="text-right text-slate-300 text-sm py-3 pl-4">
                    {row.valor > 0 ? `R$ ${row.valor.toLocaleString('pt-BR')}` : '—'}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-slate-600">
                <td className="py-3 pr-4 text-white font-semibold text-sm">Total</td>
                <td className="text-right text-white font-semibold text-sm py-3 px-4">{totalClientes}</td>
                <td className="text-right text-white font-semibold text-sm py-3 px-4">100%</td>
                <td className="text-right text-white font-semibold text-sm py-3 pl-4">
                  R$ {valorPipeline.toLocaleString('pt-BR')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
