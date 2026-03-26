'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { User, Mail, Save, Key, CheckCircle } from 'lucide-react'

export default function PerfilPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingPass, setLoadingPass] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgPass, setMsgPass] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      setEmail(session.user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', session.user.id)
        .single()

      setNome(profile?.nome || '')
    }
    load()
  }, [])

  async function handleSaveNome(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    await supabase
      .from('profiles')
      .upsert({ id: userId, nome, updated_at: new Date().toISOString() })
    setMsg('Nome atualizado com sucesso!')
    setLoading(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleSaveSenha(e: React.FormEvent) {
    e.preventDefault()
    if (novaSenha !== confirmarSenha) {
      setMsgPass('As senhas não coincidem.')
      return
    }
    if (novaSenha.length < 6) {
      setMsgPass('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoadingPass(true)
    setMsgPass('')
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) {
      setMsgPass('Erro ao atualizar senha: ' + error.message)
    } else {
      setMsgPass('Senha atualizada com sucesso!')
      setNovaSenha('')
      setConfirmarSenha('')
    }
    setLoadingPass(false)
    setTimeout(() => setMsgPass(''), 4000)
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
        <p className="text-slate-400 text-sm mt-1">Gerencie suas informações pessoais</p>
      </motion.div>

      {/* Avatar e info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-500/20 border-2 border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 font-bold text-2xl">
            {nome ? nome.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">{nome || 'Vendedor'}</h2>
            <p className="text-slate-400 text-sm">{email}</p>
            <span className="inline-block mt-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-lg">
              Vendedor LDM
            </span>
          </div>
        </div>
      </motion.div>

      {/* Editar nome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5"
      >
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" />
          Informações Pessoais
        </h3>
        <form onSubmit={handleSaveNome} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome de Exibição</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-slate-700/30 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-400 text-sm cursor-not-allowed"
              />
            </div>
            <p className="text-slate-500 text-xs mt-1">O email não pode ser alterado</p>
          </div>
          {msg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2.5 text-green-400 text-sm"
            >
              <CheckCircle className="w-4 h-4" />{msg}
            </motion.div>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Nome
          </motion.button>
        </form>
      </motion.div>

      {/* Alterar senha */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5"
      >
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-yellow-400" />
          Alterar Senha
        </h3>
        <form onSubmit={handleSaveSenha} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nova Senha *</label>
            <input
              type="password"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
          {msgPass && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm border ${
                msgPass.includes('sucesso')
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <CheckCircle className="w-4 h-4" />{msgPass}
            </motion.div>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loadingPass}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-800 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
          >
            {loadingPass ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Key className="w-4 h-4" />}
            Alterar Senha
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
