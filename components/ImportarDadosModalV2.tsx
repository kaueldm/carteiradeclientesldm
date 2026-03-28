'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Copy, Layers } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { parseTextInput, validateClienteLine, parseNumericValue } from '@/lib/dataParser'

interface ImportarDadosModalV2Props {
  open: boolean
  onClose: () => void
  onImport: () => void
  tipo?: 'orcamento' | 'pedido'
}

interface ClientePreview {
  nome: string
  email?: string
  telefone?: string
  empresa?: string
  cpf_cnpj?: string
  valor_potencial?: number
  status?: string
  estado_atual?: string
  tipo?: string
  garantia?: boolean
}

export default function ImportarDadosModalV2({ open, onClose, onImport, tipo = 'orcamento' }: ImportarDadosModalV2Props) {
  const [tab, setTab] = useState<'excel' | 'texto'>('excel')
  const [step, setStep] = useState<'input' | 'preview' | 'processing' | 'success' | 'error'>('input')
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, imported: 0, errors: 0, skipped: 0 })
  const [preview, setPreview] = useState<ClientePreview[]>([])
  const [textInput, setTextInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function processarClientes(clientes: ClientePreview[]) {
    setStep('processing')
    setError(null)
    setStats({ total: clientes.length, imported: 0, errors: 0, skipped: 0 })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão não encontrada')

      // Buscar clientes existentes para evitar duplicidade (baseado em email ou cpf_cnpj)
      const { data: existentes } = await supabase
        .from('clientes')
        .select('email, cpf_cnpj')
        .eq('user_id', session.user.id)

      const emailsExistentes = new Set(existentes?.map(c => c.email?.toLowerCase()).filter(Boolean))
      const docsExistentes = new Set(existentes?.map(c => c.cpf_cnpj?.replace(/\D/g, '')).filter(Boolean))

      const clientesValidos = []
      let erros = 0
      let pulados = 0

      for (const cliente of clientes) {
        const validacao = validateClienteLine({
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          empresa: cliente.empresa,
          cpf_cnpj: cliente.cpf_cnpj,
          valor_potencial: cliente.valor_potencial,
          status: cliente.status || 'Novo',
          estado_atual: cliente.estado_atual || 'No WMS',
          tipo: cliente.tipo || tipo,
          garantia: cliente.garantia || false,
        })

        if (validacao.valid && validacao.cleaned.nome) {
          const email = validacao.cleaned.email?.toLowerCase()
          const doc = validacao.cleaned.cpf_cnpj?.replace(/\D/g, '')

          if ((email && emailsExistentes.has(email)) || (doc && docsExistentes.has(doc))) {
            pulados++
            continue
          }

          clientesValidos.push({
            user_id: session.user.id,
            ...validacao.cleaned,
            tipo: tipo,
            observacoes: `Importado em ${new Date().toLocaleDateString()}`,
          })
        } else {
          erros++
        }
      }

      if (clientesValidos.length === 0 && pulados === 0) {
        throw new Error('Nenhum cliente válido para importar')
      }

      // Inserir em lotes
      const batchSize = 50
      let importedCount = 0

      for (let i = 0; i < clientesValidos.length; i += batchSize) {
        const batch = clientesValidos.slice(i, i + batchSize)
        const { error: insertError } = await supabase
          .from('clientes')
          .insert(batch)

        if (insertError) throw insertError

        importedCount += batch.length
        setStats(prev => ({ ...prev, imported: importedCount }))
      }

      setStats(prev => ({ ...prev, errors: erros, skipped: pulados }))
      setStep('success')
      setTimeout(() => {
        onImport()
        onClose()
      }, 3000)
    } catch (err: unknown) {
      console.error('Erro ao importar:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao importar dados'
      setError(errorMessage)
      setStep('error')
    }
  }

  function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        
        let allClients: ClientePreview[] = []

        // Processar todas as abas (SheetNames)
        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName]
          const data = XLSX.utils.sheet_to_json(ws) as Record<string, string | number>[]

          const clientesAba = data.map(row => {
            const findValue = (keys: string[]) => {
              const key = Object.keys(row).find(k =>
                keys.some(search => k.toLowerCase().includes(search.toLowerCase()))
              )
              return key ? String(row[key]) : undefined
            }

            return {
              nome: findValue(['nome', 'cliente', 'razao social', 'contato']) || '',
              empresa: findValue(['empresa', 'fantasia', 'loja']),
              telefone: findValue(['telefone', 'celular', 'fone', 'whatsapp']),
              email: findValue(['email', 'e-mail']),
              cpf_cnpj: findValue(['cpf', 'cnpj', 'documento']),
              valor_potencial: parseNumericValue(findValue(['valor', 'total', 'potencial', 'preço'])),
              status: findValue(['status', 'situação']) || 'Novo',
              estado_atual: findValue(['estado', 'estado_atual', 'entrega']) || 'No WMS',
              tipo: tipo,
              garantia: findValue(['garantia', 'comprou_garantia'])?.toLowerCase().includes('sim') || false,
            }
          }).filter(c => c.nome)

          allClients = [...allClients, ...clientesAba]
        })

        if (allClients.length === 0) {
          throw new Error('Nenhum dado encontrado nas abas da planilha')
        }

        // Remover duplicatas dentro da própria planilha (baseado em email ou documento)
        const uniqueClients = allClients.filter((c, index, self) => 
          index === self.findIndex((t) => (
            (t.email && t.email === c.email) || 
            (t.cpf_cnpj && t.cpf_cnpj === c.cpf_cnpj) ||
            (t.nome === c.nome && t.telefone === c.telefone)
          ))
        )

        setPreview(uniqueClients)
        setStep('preview')
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao processar Excel'
        setError(errorMessage)
        setStep('error')
      }
    }
    reader.readAsBinaryString(file)
  }

  function handleTextoImport() {
    if (!textInput.trim()) {
      setError('Cole o texto dos clientes')
      return
    }

    try {
      const clientesData = parseTextInput(textInput)

      if (clientesData.length === 0) {
        throw new Error('Nenhum cliente encontrado no texto')
      }

      const clientesPreview = clientesData.map(cliente => ({
        nome: cliente.nome || '',
        email: cliente.email,
        telefone: cliente.telefone,
        empresa: cliente.empresa,
        cpf_cnpj: cliente.cpf_cnpj,
        valor_potencial: parseNumericValue(cliente.valor_potencial),
        status: cliente.status || 'Novo',
        estado_atual: cliente.estado_atual || 'No WMS',
        tipo: tipo,
        garantia: cliente.garantia === 'true' || false,
      })).filter(c => c.nome)

      setPreview(clientesPreview)
      setStep('preview')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar texto'
      setError(errorMessage)
      setStep('error')
    }
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
            className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
              <h2 className="text-lg font-semibold text-white">Importar Clientes</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {step === 'input' && (
                <>
                  {/* Tabs */}
                  <div className="flex gap-2 bg-slate-900 p-1 rounded-lg">
                    <button
                      onClick={() => setTab('excel')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        tab === 'excel'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel (Múltiplas Abas)
                    </button>
                    <button
                      onClick={() => setTab('texto')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        tab === 'texto'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                      Texto Bruto
                    </button>
                  </div>

                  {/* Excel Upload */}
                  {tab === 'excel' && (
                    <div className="space-y-4">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                      >
                        <Upload className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                        <p className="text-white font-medium">Clique para selecionar ou arraste um arquivo</p>
                        <p className="text-sm text-slate-400 mt-1">Suporta .xlsx, .xls, .csv com múltiplas abas</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleExcelUpload}
                          className="hidden"
                        />
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <Layers className="w-4 h-4 text-blue-400 mt-0.5" />
                        <p className="text-xs text-slate-300">
                          <strong>Performance Divina:</strong> O sistema analisará automaticamente todas as abas da sua planilha e evitará a importação de clientes duplicados que já existam no seu banco de dados.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Texto Bruto */}
                  {tab === 'texto' && (
                    <div className="space-y-4">
                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Cole aqui o texto com os clientes (um por linha). Exemplo:&#10;João Silva, joao@email.com, 11987654321, Empresa XYZ&#10;Maria Santos, maria@email.com, 11912345678, Empresa ABC"
                        className="w-full h-48 bg-slate-700 border border-slate-600 rounded-xl p-4 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                      <button
                        onClick={handleTextoImport}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-all"
                      >
                        Processar Texto
                      </button>
                    </div>
                  )}
                </>
              )}

              {step === 'preview' && (
                <div className="space-y-4">
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <p className="text-sm text-slate-300">
                      <span className="font-bold text-white">{preview.length}</span> cliente(s) único(s) encontrado(s) na planilha.
                    </p>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {preview.map((cliente, idx) => (
                      <div key={idx} className="bg-slate-900 p-3 rounded-lg text-sm">
                        <p className="font-medium text-white">{cliente.nome}</p>
                        <p className="text-slate-400">
                          {cliente.email && `📧 ${cliente.email}`}
                          {cliente.telefone && ` | 📱 ${cliente.telefone}`}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setStep('input')
                        setPreview([])
                      }}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-all"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={() => processarClientes(preview)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-all font-medium"
                    >
                      Confirmar Importação
                    </button>
                  </div>
                </div>
              )}

              {step === 'processing' && (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-white font-medium">Importando...</p>
                  <p className="text-sm text-slate-400 mt-2">
                    {stats.imported} de {stats.total} processados
                  </p>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-white font-medium">Importação concluída!</p>
                  <div className="text-sm text-slate-400 mt-2 space-y-1">
                    <p>✅ {stats.imported} novos clientes adicionados</p>
                    {stats.skipped > 0 && <p>⏭️ {stats.skipped} duplicados ignorados</p>}
                    {stats.errors > 0 && <p>❌ {stats.errors} com erro de formato</p>}
                  </div>
                </div>
              )}

              {step === 'error' && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-white font-medium">Erro na importação</p>
                  <p className="text-sm text-slate-400 mt-2">{error}</p>
                  <button
                    onClick={() => {
                      setStep('input')
                      setError(null)
                    }}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
