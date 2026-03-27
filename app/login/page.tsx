'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro('Email ou senha incorretos. Verifique suas credenciais.')
      setLoading(false)
    } else if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'admin') {
        setMensagem('Olá responsável da equipe, pronto analisar as métricas e acompanhar seu time?')
        setTimeout(() => router.push('/admin'), 1500)
      } else {
        setMensagem('Olá fazedor! Preparado para um dia de altas vendas?')
        setTimeout(() => router.push('/dashboard'), 1500)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ldm-black via-slate-900 to-ldm-blue-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos animados */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-ldm-orange opacity-10 rounded-full blur-3xl"
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-96 h-96 bg-ldm-blue opacity-10 rounded-full blur-3xl"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Card principal */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <motion.div
            className="flex justify-center mb-8"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="relative w-32 h-32">
              <Image
                src="/assets/logo-login.png"
                alt="Loja do Mecânico"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-ldm-orange via-ldm-orange-light to-ldm-orange bg-clip-text text-transparent">
            CRM LDM
          </h1>
          <p className="text-center text-gray-400 mb-8 text-sm">Carteira de Clientes - Loja do Mecânico</p>

          {/* Mensagem de boas-vindas */}
          {mensagem ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-ldm-orange/20 border border-ldm-orange/50 rounded-lg text-center"
            >
              <p className="text-ldm-orange-light text-sm font-medium">{mensagem}</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6 p-4 bg-ldm-orange/10 border border-ldm-orange/30 rounded-lg text-center"
            >
              <p className="text-ldm-orange-light text-sm font-medium">
                Bem-vindo ao seu CRM de vendas
              </p>
            </motion.div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ldm-orange focus:ring-2 focus:ring-ldm-orange/30 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ldm-orange focus:ring-2 focus:ring-ldm-orange/30 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ldm-orange transition"
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {erro && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
              >
                {erro}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !!mensagem}
              className="w-full py-3 bg-gradient-to-r from-ldm-orange to-ldm-orange-dark text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-ldm-orange/50 disabled:opacity-50 transition duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-500 text-xs mt-6">
            © 2024 Loja do Mecânico. Todos os direitos reservados.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
