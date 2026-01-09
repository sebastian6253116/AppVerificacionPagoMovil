'use client'

import { useState, useRef, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, CreditCard, Phone, DollarSign, Calendar, ChevronDown } from 'lucide-react'

interface PaymentData {
  phoneNumber: string
  amount: string
  reference: string
  date: string
  senderBank: string
  receiverBank: string
}

interface VerificationResult {
  status: 'success' | 'error' | 'pending'
  message: string
  details?: {
    transactionId?: string
    verifiedAmount?: string
    verifiedDate?: string
    bankResponse?: string
  }
}

export default function HomePage() {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    phoneNumber: '',
    amount: '',
    reference: '',
    date: '',
    senderBank: '',
    receiverBank: 'Mercantil Banco'
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  
  // Estados para búsqueda progresiva
  const [senderBankSearch, setSenderBankSearch] = useState('')
  const [receiverBankSearch, setReceiverBankSearch] = useState('')
  const [showSenderDropdown, setShowSenderDropdown] = useState(false)
  const [showReceiverDropdown, setShowReceiverDropdown] = useState(false)
  
  // Referencias para los dropdowns
  const senderDropdownRef = useRef<HTMLDivElement>(null)
  const receiverDropdownRef = useRef<HTMLDivElement>(null)

  // Lista actualizada de bancos venezolanos activos 2025 según SUDEBAN
  const venezuelanBanks = [
    { code: '0102', name: 'Banco de Venezuela' },
    { code: '0134', name: 'Banesco Banco Universal' },
    { code: '0105', name: 'Mercantil Banco' },
    { code: '0191', name: 'Banco Nacional de Crédito (BNC)' },
    { code: '0108', name: 'BBVA Provincial' },
    { code: '0114', name: 'Bancaribe' },
    { code: '0115', name: 'Banco Exterior' },
    { code: '0104', name: 'Venezolano de Crédito' },
    { code: '0151', name: 'BFC Banco Fondo Común' },
    { code: '0174', name: 'Banplus Banco Universal' },
    { code: '0138', name: 'Banco Plaza' },
    { code: '0137', name: 'Banco Sofitasa' },
    { code: '0128', name: 'Banco Caroní' },
    { code: '0171', name: 'Banco Activo' },
    { code: '0157', name: 'DelSur Banco Universal' },
    { code: '0156', name: '100% Banco' },
    { code: '0172', name: 'Bancamiga Banco Universal' },
    { code: '0173', name: 'Banco Internacional de Desarrollo' },
    { code: '0175', name: 'Banco Digital de Los Trabajadores' },
    { code: '0163', name: 'Banco del Tesoro' },
    { code: '0177', name: 'Banco de la Fuerza Armada Nacional Bolivariana' },
    { code: '0166', name: 'Banco Agrícola de Venezuela' },
    { code: '0168', name: 'Bancrecer (Microfinanciero)' },
    { code: '0169', name: 'R4 Banco Microfinanciero' },
    { code: '0146', name: 'Bangente' },
    { code: '0178', name: 'N58 Banco Digital' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        status: 'error',
        message: 'Error al conectar con el servidor. Intenta nuevamente.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof PaymentData, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }))
  }
  
  // Filtrar bancos basado en la búsqueda
  const getFilteredBanks = (searchTerm: string) => {
    if (!searchTerm) return venezuelanBanks
    return venezuelanBanks.filter(bank => 
      bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.code.includes(searchTerm)
    )
  }
  
  // Manejar selección de banco emisor
  const handleSenderBankSelect = (bank: { code: string; name: string }) => {
    setPaymentData(prev => ({ ...prev, senderBank: bank.name }))
    setSenderBankSearch(bank.name)
    setShowSenderDropdown(false)
  }
  
  // Manejar selección de banco receptor
  const handleReceiverBankSelect = (bank: { code: string; name: string }) => {
    setPaymentData(prev => ({ ...prev, receiverBank: bank.name }))
    setReceiverBankSearch(bank.name)
    setShowReceiverDropdown(false)
  }
  
  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (senderDropdownRef.current && !senderDropdownRef.current.contains(event.target as Node)) {
        setShowSenderDropdown(false)
      }
      if (receiverDropdownRef.current && !receiverDropdownRef.current.contains(event.target as Node)) {
        setShowReceiverDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Sincronizar búsqueda con valores seleccionados
  useEffect(() => {
    if (paymentData.senderBank && !senderBankSearch) {
      setSenderBankSearch(paymentData.senderBank)
    }
  }, [paymentData.senderBank, senderBankSearch])
  
  useEffect(() => {
    if (paymentData.receiverBank && !receiverBankSearch) {
      setReceiverBankSearch(paymentData.receiverBank)
    }
  }, [paymentData.receiverBank, receiverBankSearch])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-success-600" />
      case 'error':
        return <XCircle className="w-6 h-6 text-error-600" />
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'success':
        return 'status-success'
      case 'error':
        return 'status-error'
      case 'pending':
        return 'status-pending'
      default:
        return ''
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <CreditCard className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verificación de Pago Móvil
          </h1>
          <p className="text-lg text-gray-600">
            Verifica tus pagos móviles de forma rápida y segura
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Número de Teléfono *
              </label>
              <input
                type="tel"
                id="phoneNumber"
                className="input-field"
                placeholder="0414-1234567"
                value={paymentData.phoneNumber}
                onChange={(e) => {
                  // Formatear automáticamente el número
                  let value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length > 0 && !value.startsWith('04')) {
                    if (value.startsWith('4')) {
                      value = '0' + value;
                    } else if (!value.startsWith('0')) {
                      value = '04' + value;
                    }
                  }
                  if (value.length > 4) {
                    value = value.slice(0, 4) + '-' + value.slice(4, 11);
                  }
                  handleInputChange('phoneNumber', value);
                }}
                maxLength={12}
                pattern="04[0-9]{2}-[0-9]{7}"
                title="Formato: 04XX-XXXXXXX (números venezolanos)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Formato: 04XX-XXXXXXX (ejemplo: 0412-1234567)
              </p>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Monto (Bs.)
              </label>
              <input
                type="number"
                id="amount"
                className="input-field"
                placeholder="100.00"
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
                Número de Referencia
              </label>
              <input
                type="text"
                id="reference"
                className="input-field"
                placeholder="123456789"
                value={paymentData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Fecha del Pago
              </label>
              <input
                type="date"
                id="date"
                className="input-field"
                value={paymentData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            <div ref={senderDropdownRef} className="relative">
              <label htmlFor="senderBank" className="block text-sm font-medium text-gray-700 mb-2">
                Banco Emisor (desde donde se envió el pago) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="senderBank"
                  className="input-field pr-10"
                  placeholder="Buscar banco emisor..."
                  value={senderBankSearch}
                  onChange={(e) => {
                    setSenderBankSearch(e.target.value)
                    setShowSenderDropdown(true)
                    if (!e.target.value) {
                      setPaymentData(prev => ({ ...prev, senderBank: '' }))
                    }
                  }}
                  onFocus={() => setShowSenderDropdown(true)}
                  required
                />
                <ChevronDown 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer"
                  onClick={() => setShowSenderDropdown(!showSenderDropdown)}
                />
              </div>
              
              {showSenderDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {getFilteredBanks(senderBankSearch).length > 0 ? (
                    getFilteredBanks(senderBankSearch).map((bank) => (
                      <div
                        key={bank.code}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleSenderBankSelect(bank)}
                      >
                        <div className="font-medium">{bank.name}</div>
                        <div className="text-gray-500 text-xs">Código: {bank.code}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      No se encontraron bancos
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                Escribe para buscar el banco desde donde el cliente realizó el pago móvil
              </p>
            </div>

            <div ref={receiverDropdownRef} className="relative">
              <label htmlFor="receiverBank" className="block text-sm font-medium text-gray-700 mb-2">
                Banco Receptor (donde se recibe el pago) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="receiverBank"
                  className="input-field pr-10"
                  placeholder="Buscar banco receptor..."
                  value={receiverBankSearch}
                  onChange={(e) => {
                    setReceiverBankSearch(e.target.value)
                    setShowReceiverDropdown(true)
                    if (!e.target.value) {
                      setPaymentData(prev => ({ ...prev, receiverBank: '' }))
                    }
                  }}
                  onFocus={() => setShowReceiverDropdown(true)}
                  required
                />
                <ChevronDown 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer"
                  onClick={() => setShowReceiverDropdown(!showReceiverDropdown)}
                />
              </div>
              
              {showReceiverDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {getFilteredBanks(receiverBankSearch).length > 0 ? (
                    getFilteredBanks(receiverBankSearch).map((bank) => (
                      <div
                        key={bank.code}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleReceiverBankSelect(bank)}
                      >
                        <div className="font-medium">{bank.name}</div>
                        <div className="text-gray-500 text-xs">Código: {bank.code}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      No se encontraron bancos
                    </div>
                  )}
                </div>
              )}
              
              {paymentData.receiverBank === 'Mercantil Banco' && (
                <p className="text-xs text-blue-600 mt-1">
                  ✓ Este banco utiliza verificación en tiempo real con API integrada
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Escribe para buscar el banco donde se recibe y verifica el pago
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 inline mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar Pago'
              )}
            </button>
          </form>
        </div>

        {result && (
          <div className={`mt-6 ${getStatusClass(result.status)}`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getStatusIcon(result.status)}
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">
                  {result.status === 'success' ? 'Pago Verificado' : 
                   result.status === 'error' ? 'Error en Verificación' : 
                   'Verificación Pendiente'}
                </h3>
                <p className="mt-1 text-sm">{result.message}</p>
                
                {result.details && (
                  <div className="mt-3 text-sm">
                    <h4 className="font-medium mb-2">Detalles:</h4>
                    <ul className="space-y-1">
                      {result.details.transactionId && (
                        <li><strong>ID Transacción:</strong> {result.details.transactionId}</li>
                      )}
                      {result.details.verifiedAmount && (
                        <li><strong>Monto Verificado:</strong> Bs. {result.details.verifiedAmount}</li>
                      )}
                      {result.details.verifiedDate && (
                        <li><strong>Fecha Verificada:</strong> {result.details.verifiedDate}</li>
                      )}
                      {result.details.bankResponse && (
                        <li><strong>Respuesta del Banco:</strong> {result.details.bankResponse}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Consejos de Seguridad</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Verifica siempre los datos antes de enviar</li>
            <li>• Guarda el número de referencia de tus pagos</li>
            <li>• No compartas información sensible por medios no seguros</li>
            <li>• Contacta a tu banco si hay discrepancias</li>
          </ul>
        </div>
      </div>
    </div>
  )
}