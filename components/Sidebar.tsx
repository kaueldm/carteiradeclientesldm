'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard,
  Users,
  Kanban,
  BarChart3,
  LogOut,
  Wrench,
  ChevronLeft,
  ChevronRight,
  User,
  Menu,
  X,
  Bell,
  Target,
  ShieldAlert,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/metas', label: 'Metas do Mês', icon: Target },
  { href: '/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/perfil', label: 'Meu Perfil', icon: User },
]

interface SidebarProps {
  userName?: string
  userEmail?: string
}

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function carregarDados() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Verificar se é admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      if (profile?.role === 'admin' || session.user.email === 'admin@ldm.com') {
        setIsAdmin(true)
      }

      const { data } = await supabase
        .from('notificacoes')
        .select('id')
        .eq('lida', false)

      setNotificacoesNaoLidas(data?.length || 0)
    }

    carregarDados()

    // Subscribe para atualizações em tempo real
    const channel = supabase
      .channel('notificacoes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes' },
        () => {
          carregarDados()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b border-slate-700/50 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0 w-9 h-9 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
          <Wrench className="w-5 h-5 text-blue-400" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <p className="text-white font-bold text-sm whitespace-nowrap">Loja do Mecânico</p>
              <p className="text-slate-400 text-xs whitespace-nowrap">CRM</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const temNotificacoes = item.href === '/notificacoes' && notificacoesNaoLidas > 0
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 4 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer relative ${
                  isActive
                    ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {temNotificacoes && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"
                    />
                  )}
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}

        {/* Admin Link */}
        {isAdmin && (
          <Link href="/admin" onClick={() => setMobileOpen(false)}>
            <motion.div
              whileHover={{ x: collapsed ? 0 : 4 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer relative ${
                pathname.startsWith('/admin')
                  ? 'bg-red-600/20 border border-red-500/30 text-red-400'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? 'Painel Admin' : undefined}
            >
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    Painel Admin
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        )}
      </nav>

      {/* Usuário e logout */}
      <div className="p-3 border-t border-slate-700/50 space-y-2">
        {!collapsed && userName && (
          <div className="px-3 py-2 bg-slate-700/30 rounded-xl">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            <p className="text-slate-400 text-xs truncate">{userEmail}</p>
          </div>
        )}
        <motion.button
          whileHover={{ x: collapsed ? 0 : 4 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700/50 z-50"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="hidden lg:flex flex-col h-screen bg-slate-800 border-r border-slate-700/50 fixed left-0 top-0 z-30 overflow-hidden"
      >
        <SidebarContent />

        {/* Botão colapsar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600 transition-all duration-200 shadow-lg"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>
    </>
  )
}
