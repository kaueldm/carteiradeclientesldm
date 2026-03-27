'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Table } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { Cliente, StatusCliente } from '@/types'

interface ImportarDadosModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ImportarDadosModal({ open, onClose, onSuccess }: ImportarDadosModalProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'success' | 'error'>('upload')
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, imported: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setStep('processing')
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão não encontrada')

      const reader = new FileReader()
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result
          const wb = XLSX.read(bstr, { type: 'binary' })
          const wsname = wb.SheetNames[0]
          const ws = wb.Sheets[wsname]
          const data = XLSX.utils.sheet_to_json(ws) as any[]

          if (data.length === 0) {
            throw new Error('A planilha está vazia')
          }

          setStats({ total: data.length, imported: 0 })

          // Mapeamento inteligente de colunas
          const clientesParaInserir = data.map(row => {
            // Tenta encontrar as colunas por nomes comuns
            const findValue = (keys: string[]) => {
              const key = Object.keys(row).find(k => 
                keys.some(search => k.toLowerCase().includes(search.toLowerCase()))
              )
              return key ? row[key] : undefined
            }

            return {
              user_id: session.user.id,
              nome: findValue(['nome', 'cliente', 'razao social', 'contato']) || 'Cliente Sem Nome',
              empresa: findValue(['empresa', 'fantasia', 'loja']),
              telefone: findValue(['telefone', 'celular', 'fone', 'whatsapp', 'contato']),
              email: findValue(['email', 'e-mail', 'correio']),
              cpf_cnpj: findValue(['cpf', 'cnpj', 'documento', 'identificação']),
              numero_pedido: findValue(['pedido', 'nº pedido', 'ordem']),
              numero_orcamento: findValue(['orçamento', 'nº orçamento', 'proposta']),
              status: 'Novo' as StatusCliente,
              valor_potencial: parseFloat(findValue(['valor', 'total', 'potencial', 'preço']) || '0') || 0,
              observacoes: `Importado via planilha em ${new Date().toLocaleDateString()}`,
            }
          })

          // Inserir no Supabase em lotes de 50 para evitar erros
          const batchSize = 50
          let importedCount = 0

          for (let i = 0; i < clientesParaInserir.length; i += batchSize) {
            const batch = clientesParaInserir.slice(i, i + batchSize)
            const { error: insertError } = await supabase
              .from('clientes')
              .insert(batch)

            if (insertError) throw insertError
            
            importedCount += batch.length
            setStats(prev => ({ ...prev, imported: importedCount }))
          }

          setStep('success')
          onSuccess()
        } catch (err: any) {
          console.error('Erro ao processar dados:', err)
          setError(err.message || 'Erro ao processar a planilha')
          setStep('error')
        }
      }
      reader.readAsBinaryString(file)
    } catch (err: any) {
      console.error('Erro ao ler arquivo:', err)
      setError(err.message || 'Erro ao ler o arquivo')
      setStep('error')
    }
  }

  const reset = () => {
    setStep('upload')
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Table className="w-5 h-5 text-blue-400" />
                Importar Dados
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              {step === 'upload' && (
                <div className="space-y-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-600 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group"
                  >
                    <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium">Clique para selecionar ou arraste</p>
                      <p className="text-slate-400 text-sm mt-1">Planilhas Excel (.xlsx, .xls, .csv)</p>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".xlsx, .xls, .csv"
                      className="hidden" 
                    />
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <strong>Dica:</strong> O sistema identifica automaticamente colunas como Nome, Empresa, Telefone, Email, CPF/CNPJ, Pedido e Orçamento.
                    </p>
                  </div>
                </div>
              )}

              {step === 'processing' && (
                <div className="flex flex-col items-center justify-center py-10 space-y-6">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                    <FileSpreadsheet className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-white">Trabalhando nos dados...</h3>
                    <p className="text-slate-400">
                      Importando {stats.imported} de {stats.total} clientes
                    </p>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-blue-500 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.imported / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-6 space-y-6 text-center">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Sucesso!</h3>
                    <p className="text-slate-400">
                      Foram importados <strong>{stats.total}</strong> clientes com sucesso para sua carteira.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all"
                  >
                    Concluir
                  </button>
                </div>
              )}

              {step === 'error' && (
                <div className="flex flex-col items-center justify-center py-6 space-y-6 text-center">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Ops! Algo deu errado</h3>
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={reset}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-all"
                    >
                      Tentar Novamente
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 bg-slate-800 border border-slate-700 text-slate-400 py-3 rounded-xl font-bold transition-all"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
