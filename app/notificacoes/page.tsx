'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Notificacao } from '@/types'
import { Bell, Trash2, CheckCircle2 } from 'lucide-react'

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      
      // Carregar notificações
      const { data } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false })
      
      setNotificacoes(data || [])
      setLoading(false)
    }
    load()

    // Subscribe para atualizações em tempo real
    const channel = supabase
      .channel('notificacoes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes' },
        (payload) => {
          setNotificacoes(prev => [payload.new as Notificacao, ...prev])
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  async function marcarComoLida(id: string) {
    await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id)

    setNotificacoes(prev =>
      prev.map(n => n.id === id ? { ...n, lida: true } : n)
    )
  }

  async function deletarNotificacao(id: string) {
    await supabase
      .from('notificacoes')
      .delete()
      .eq('id', id)

    setNotificacoes(prev => prev.filter(n => n.id !== id))
  }

  const naoLidas = notificacoes.filter(n => !n.lida).length

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col p-4 lg:p-6 bg-gradient-to-br from-ldm-black via-slate-900 to-ldm-blue-dark">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-8 h-8 text-ldm-orange" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-ldm-orange to-ldm-orange-light bg-clip-text text-transparent">
            Notificações
          </h1>
        </div>
        <p className="text-gray-400 text-sm">
          {naoLidas > 0 ? `${naoLidas} notificação${naoLidas > 1 ? 's' : ''} não lida${naoLidas > 1 ? 's' : ''}` : 'Todas as notificações lidas'}
        </p>
      </motion.div>

      {/* Lista de Notificações */}
      <div className="flex-1 space-y-3">
        {notificacoes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <Bell className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg font-medium">Nenhuma notificação</p>
            <p className="text-gray-500 text-sm mt-1">Você verá as mensagens dos administradores aqui</p>
          </motion.div>
        ) : (
          notificacoes.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border transition-all ${
                notif.lida
                  ? 'bg-white/5 border-white/10 hover:bg-white/10'
                  : 'bg-ldm-orange/10 border-ldm-orange/30 hover:bg-ldm-orange/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.lida ? 'bg-gray-500' : 'bg-ldm-orange'}`} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-white font-semibold text-base">{notif.titulo}</h3>
                      <p className="text-gray-300 text-sm mt-1 whitespace-pre-wrap break-words">{notif.mensagem}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                    <span>
                      {new Date(notif.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notif.lida && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => marcarComoLida(notif.id)}
                      className="p-2 hover:bg-ldm-orange/20 rounded-lg text-ldm-orange transition-all"
                      title="Marcar como lida"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => deletarNotificacao(notif.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                    title="Deletar notificação"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
