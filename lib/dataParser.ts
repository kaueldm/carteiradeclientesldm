/**
 * Utilitário para análise inteligente de dados
 * Detecta e classifica: CPF, CNPJ, Email, Estado Atual, etc.
 */

// Regex para validação de CPF (11 dígitos)
const CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/

// Regex para validação de CNPJ (14 dígitos)
const CNPJ_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/

// Regex para validação de Email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Estados Atuais possíveis
const ESTADOS_ATUAIS = ['No WMS', 'Não Entregue', 'Entregue', 'Item Virtual Enviado']

// Status possíveis
const STATUS_OPTIONS = ['Novo', 'Em Contato', 'Proposta', 'Negociação', 'Fechado', 'Perdido']

/**
 * Valida se é um CPF válido (11 dígitos)
 */
export function isCPF(value: string): boolean {
  const cleaned = value.replace(/\D/g, '')
  return cleaned.length === 11 && CPF_REGEX.test(value)
}

/**
 * Valida se é um CNPJ válido (14 dígitos)
 */
export function isCNPJ(value: string): boolean {
  const cleaned = value.replace(/\D/g, '')
  return cleaned.length === 14 && CNPJ_REGEX.test(value)
}

/**
 * Valida se é um Email válido
 */
export function isEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.toLowerCase())
}

/**
 * Detecta e classifica um valor como CPF ou CNPJ
 */
export function detectCPFCNPJ(value: string): 'cpf' | 'cnpj' | null {
  if (!value) return null
  
  const cleaned = value.replace(/\D/g, '')
  
  if (cleaned.length === 11) return 'cpf'
  if (cleaned.length === 14) return 'cnpj'
  
  return null
}

/**
 * Detecta estado atual baseado em texto
 */
export function detectEstadoAtual(value: string): string | null {
  if (!value) return null
  
  const normalized = value.toLowerCase().trim()
  
  for (const estado of ESTADOS_ATUAIS) {
    if (normalized.includes(estado.toLowerCase())) {
      return estado
    }
  }
  
  // Aliases comuns
  if (normalized.includes('wms')) return 'No WMS'
  if (normalized.includes('entregue')) return 'Entregue'
  if (normalized.includes('não entregue') || normalized.includes('nao entregue')) return 'Não Entregue'
  if (normalized.includes('virtual') || normalized.includes('enviado')) return 'Item Virtual Enviado'
  
  return null
}

/**
 * Detecta status baseado em texto
 */
export function detectStatus(value: string): string | null {
  if (!value) return null
  
  const normalized = value.toLowerCase().trim()
  
  for (const status of STATUS_OPTIONS) {
    if (normalized.includes(status.toLowerCase())) {
      return status
    }
  }
  
  // Aliases comuns
  if (normalized.includes('novo')) return 'Novo'
  if (normalized.includes('contato')) return 'Em Contato'
  if (normalized.includes('proposta')) return 'Proposta'
  if (normalized.includes('negociação') || normalized.includes('negociacao')) return 'Negociação'
  if (normalized.includes('fechado')) return 'Fechado'
  if (normalized.includes('perdido')) return 'Perdido'
  
  return null
}

/**
 * Detecta tipo de cliente (orçamento ou pedido) baseado em texto
 */
export function detectTipo(value: string): 'orcamento' | 'pedido' | null {
  if (!value) return null
  
  const normalized = value.toLowerCase().trim()
  
  if (normalized.includes('orçamento') || normalized.includes('orcamento') || normalized.includes('quote')) {
    return 'orcamento'
  }
  
  if (normalized.includes('pedido') || normalized.includes('order') || normalized.includes('fechado')) {
    return 'pedido'
  }
  
  return null
}

/**
 * Detecta se é garantia baseado em texto
 */
export function detectGarantia(value: string): boolean {
  if (!value) return false
  
  const normalized = value.toLowerCase().trim()
  
  return (
    normalized.includes('sim') ||
    normalized.includes('yes') ||
    normalized.includes('verdadeiro') ||
    normalized.includes('true') ||
    normalized.includes('1') ||
    normalized.includes('garantia')
  )
}

/**
 * Valida e limpa um número de telefone
 */
export function cleanPhoneNumber(value: string): string {
  if (!value) return ''
  
  // Remove tudo que não é dígito
  const cleaned = value.replace(/\D/g, '')
  
  // Se tem 11 dígitos (celular), formata como (XX) XXXXX-XXXX
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  
  // Se tem 10 dígitos (fixo), formata como (XX) XXXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  
  return value
}

/**
 * Valida e limpa um CPF/CNPJ
 */
export function cleanCPFCNPJ(value: string): string {
  if (!value) return ''
  
  const cleaned = value.replace(/\D/g, '')
  
  // CPF: XXX.XXX.XXX-XX
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
  }
  
  // CNPJ: XX.XXX.XXX/XXXX-XX
  if (cleaned.length === 14) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`
  }
  
  return value
}

/**
 * Valida um valor numérico (para preços)
 */
export function parseNumericValue(value: string | number | undefined): number {
  if (!value) return 0
  
  if (typeof value === 'number') return value
  
  // Remove tudo que não é dígito ou ponto/vírgula
  const cleaned = String(value)
    .replace(/[^\d.,]/g, '')
    .replace(',', '.')
  
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Valida uma linha inteira antes de inserir
 */
export function validateClienteLine(line: Record<string, any>): {
  valid: boolean
  errors: string[]
  cleaned: Record<string, any>
} {
  const errors: string[] = []
  const cleaned = { ...line }
  
  // Nome é obrigatório
  if (!cleaned.nome || String(cleaned.nome).trim() === '') {
    errors.push('Nome do cliente é obrigatório')
  }
  
  // Limpar e validar telefone
  if (cleaned.telefone) {
    cleaned.telefone = cleanPhoneNumber(String(cleaned.telefone))
  }
  
  // Limpar e validar CPF/CNPJ
  if (cleaned.cpf_cnpj) {
    const tipo = detectCPFCNPJ(String(cleaned.cpf_cnpj))
    if (!tipo) {
      errors.push('CPF/CNPJ inválido')
    } else {
      cleaned.cpf_cnpj = cleanCPFCNPJ(String(cleaned.cpf_cnpj))
    }
  }
  
  // Validar email
  if (cleaned.email && !isEmail(String(cleaned.email))) {
    errors.push('Email inválido')
  }
  
  // Detectar estado atual se não fornecido
  if (!cleaned.estado_atual && cleaned.estado_atual_texto) {
    cleaned.estado_atual = detectEstadoAtual(String(cleaned.estado_atual_texto))
  }
  
  // Detectar status se não fornecido
  if (!cleaned.status && cleaned.status_texto) {
    cleaned.status = detectStatus(String(cleaned.status_texto))
  }
  
  // Detectar tipo se não fornecido
  if (!cleaned.tipo && cleaned.tipo_texto) {
    cleaned.tipo = detectTipo(String(cleaned.tipo_texto))
  }
  
  // Detectar garantia
  if (cleaned.comprou_garantia_texto) {
    cleaned.garantia = detectGarantia(String(cleaned.comprou_garantia_texto))
  }
  
  // Validar valores numéricos
  if (cleaned.valor_potencial) {
    cleaned.valor_potencial = parseNumericValue(cleaned.valor_potencial)
  }
  
  if (cleaned.valor_garantia) {
    cleaned.valor_garantia = parseNumericValue(cleaned.valor_garantia)
  }
  
  return {
    valid: errors.length === 0,
    errors,
    cleaned
  }
}

/**
 * Parser de texto bruto - separa clientes por linha
 */
export function parseTextInput(text: string): Array<Record<string, string>> {
  if (!text) return []
  
  const lines = text.split('\n').filter(line => line.trim() !== '')
  const clientes: Array<Record<string, string>> = []
  
  for (const line of lines) {
    // Ignorar linhas que parecem ser cabeçalhos
    if (line.toLowerCase().includes('cliente') && line.toLowerCase().includes('email')) {
      continue
    }
    
    const cliente: Record<string, string> = {}
    
    // Dividir por vírgula, ponto-e-vírgula ou tab
    const parts = line.split(/[,;\t]/).map(p => p.trim()).filter(p => p !== '')
    
    if (parts.length === 0) continue
    
    // Primeira parte é sempre o nome
    cliente.nome = parts[0]
    
    // Procurar por email, telefone, CPF/CNPJ nos outros campos
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i]
      
      if (isEmail(part)) {
        cliente.email = part
      } else if (detectCPFCNPJ(part)) {
        cliente.cpf_cnpj = part
      } else if (part.match(/\d{10,11}/)) {
        cliente.telefone = part
      } else if (detectEstadoAtual(part)) {
        cliente.estado_atual = detectEstadoAtual(part) || ''
      } else if (detectStatus(part)) {
        cliente.status = detectStatus(part) || ''
      } else if (detectTipo(part)) {
        cliente.tipo = detectTipo(part) || ''
      } else if (!cliente.empresa) {
        cliente.empresa = part
      }
    }
    
    if (cliente.nome) {
      clientes.push(cliente)
    }
  }
  
  return clientes
}
