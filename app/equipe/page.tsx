'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Users, Shield, TrendingUp, Target, ArrowLeft } from 'lucide-react'

interface Vendedor {
  id: string
  nome_completo: string
  email: string
  role: string
  gestor_id?: string
  totalClientes?: number
  clientesFechados?: number
  valorTotal?: number
}

export default function EquipePage() {
  const router = useRouter()
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Verificar role do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      setUserRole(profile?.role || 'vendedor')
      await fetchEquipe()
    }
    load()
  }, [router])

  const fetchEquipe = useCallback(async () => {
    setLoading(true)
    try {
      // Buscar todos os vendedores
      const { data: usuarios } = await supabase
        .from('profiles')
        .select('id, nome_completo, email, role, gestor_id')
        .order('role', { ascending: false })
        .order('nome_completo', { ascending: true })

      // Buscar métricas de clientes para cada vendedor
      const { data: clientes } = await supabase
        .from('clientes')
        .select('user_id, status, valor_potencial')

      // Calcular métricas
      const vendedoresComMetricas = (usuarios || []).map(user => {
        const clientesVendedor = (clientes || []).filter(c => c.user_id === user.id)
        const totalClientes = clientesVendedor.length
        const clientesFechados = clientesVendedor.filter(c => c.status === 'Fechado').length
        const valorTotal = clientesVendedor
          .filter(c => c.status === 'Fechado')
          .reduce((sum, c) => sum + (Number(c.valor_potencial) || 0), 0)

        return {
          ...user,
          totalClientes,
          clientesFechados,
          valorTotal,
        }
      })

      setVendedores(vendedoresComMetricas)
    } catch (error) {
      console.error('Erro ao carregar equipe:', error)
    }
    setLoading(false)
  }, [])

  const admin = vendedores.find(v => v.role === 'admin')
  const vendedoresNormais = vendedores.filter(v => v.role !== 'admin')

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando equipe...</p>
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
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Equipe</h1>
              <p className="text-sm text-slate-400">Estrutura organizacional e desempenho</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">{vendedores.length} membros</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hierarquia Visual */}
        <div className="space-y-6">
          {/* Gestão (Admin) */}
          {admin && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Gestão
              </h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-600/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{admin.nome_completo}</h3>
                      <p className="text-sm text-slate-400">{admin.email}</p>
                      <p className="text-xs text-blue-400 mt-1">Administrador</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-right">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Clientes</p>
                      <p className="text-xl font-bold text-white">{admin.totalClientes || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Vendas</p>
                      <p className="text-xl font-bold text-emerald-400">{admin.clientesFechados || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Faturamento</p>
                      <p className="text-xl font-bold text-orange-400">
                        R$ {(admin.valorTotal || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Vendedores */}
          {vendedoresNormais.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Vendedores ({vendedoresNormais.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendedoresNormais.map((vendedor, index) => (
                  <motion.div
                    key={vendedor.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center text-emerald-400 font-bold">
                          {vendedor.nome_completo.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{vendedor.nome_completo}</h3>
                          <p className="text-xs text-slate-500">{vendedor.email}</p>
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded border border-emerald-500/30">
                        Vendedor
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase font-bold">Clientes</p>
                        <p className="text-lg font-bold text-white mt-1">{vendedor.totalClientes || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase font-bold">Fechados</p>
                        <p className="text-lg font-bold text-emerald-400 mt-1">{vendedor.clientesFechados || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase font-bold">Faturamento</p>
                        <p className="text-lg font-bold text-orange-400 mt-1">
                          R$ {(vendedor.valorTotal || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>

                    {vendedor.totalClientes > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-400">Taxa de Conversão</span>
                          <span className="font-bold text-blue-400">
                            {Math.round((vendedor.clientesFechados / vendedor.totalClientes) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full transition-all"
                            style={{ width: `${(vendedor.clientesFechados / vendedor.totalClientes) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resumo de Equipe */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Resumo da Equipe
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Total de Clientes</p>
              <p className="text-2xl font-bold text-white mt-2">
                {vendedores.reduce((sum, v) => sum + (v.totalClientes || 0), 0)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Clientes Fechados</p>
              <p className="text-2xl font-bold text-emerald-400 mt-2">
                {vendedores.reduce((sum, v) => sum + (v.clientesFechados || 0), 0)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Faturamento Total</p>
              <p className="text-2xl font-bold text-orange-400 mt-2">
                R$ {vendedores.reduce((sum, v) => sum + (v.valorTotal || 0), 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Taxa Média</p>
              <p className="text-2xl font-bold text-blue-400 mt-2">
                {Math.round(
                  vendedores.reduce((sum, v) => {
                    if (v.totalClientes === 0) return sum
                    return sum + (v.clientesFechados / v.totalClientes)
                  }, 0) / vendedores.filter(v => v.totalClientes > 0).length * 100
                )}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
