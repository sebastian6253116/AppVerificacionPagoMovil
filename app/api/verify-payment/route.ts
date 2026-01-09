import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MercantilService, formatVenezuelanPhoneNumber, formatPaymentReference } from '@/lib/mercantil-service';
import { MercantilErrorHandler } from '@/lib/mercantil-errors';

// Esquema de validación para la verificación de pagos
const verifyPaymentSchema = z.object({
  senderBank: z.string().min(1, 'El banco emisor es requerido'),
  receiverBank: z.string().min(1, 'El banco receptor es requerido'),
  reference: z.string().min(1, 'La referencia es requerida'),
  amount: z.number().positive('El monto debe ser positivo'),
  phone: z.string().min(1, 'El teléfono es requerido'),
  date: z.string().min(1, 'La fecha es requerida'),
});

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

// Simulación de base de datos de transacciones
const mockTransactions = [
  {
    id: 'TXN001',
    phoneNumber: '04141234567',
    amount: '100.00',
    reference: '123456789',
    date: '2024-01-15',
    senderBank: 'Banesco Banco Universal',
    receiverBank: 'Mercantil Banco',
    status: 'verified'
  },
  {
    id: 'TXN002',
    phoneNumber: '04161234567',
    amount: '250.50',
    reference: '987654321',
    date: '2024-01-14',
    senderBank: 'Mercantil Banco',
    receiverBank: 'Mercantil Banco',
    status: 'verified'
  },
  {
    id: 'TXN003',
    phoneNumber: '04241234567',
    amount: '75.25',
    reference: '456789123',
    date: '2024-01-13',
    senderBank: 'Banco de Venezuela',
    receiverBank: 'Mercantil Banco',
    status: 'pending'
  }
]

// Función para verificar pago con Mercantil Banco
async function verifyMercantilPayment(data: any, clientInfo: { ipAddress: string; userAgent: string }) {
  try {
    // Crear instancia del servicio Mercantil
    const mercantilService = MercantilService.createFromEnv();
    
    // Formatear datos para la transacción C2P
    const formattedOriginPhone = formatVenezuelanPhoneNumber(data.phone);
    const formattedDestinationPhone = formatVenezuelanPhoneNumber(data.phone); // Asumiendo que es el mismo
    
    // Solicitar clave de pago C2P en la API de Mercantil
    const c2pResult = await mercantilService.requestPaymentKey(
      {
        amount: data.amount,
        destinationBankId: '0105', // Código de Mercantil Banco
        destinationId: data.reference, // Usar referencia como ID destino temporalmente
        originMobileNumber: formattedOriginPhone,
        destinationMobileNumber: formattedDestinationPhone,
        invoiceNumber: `INV-${data.reference}`
      },
      {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        deviceInfo: {
          manufacturer: 'Web',
          model: 'Browser',
          osVersion: 'Unknown',
          location: {
            lat: 10.4806,
            lng: -66.9036
          }
        }
      }
    );

    // Procesar respuesta de Mercantil
    if (c2pResult.code && c2pResult.code !== 99999) {
      return {
        success: true,
        status: 'verified',
        message: 'Solicitud de clave C2P procesada exitosamente',
        details: {
          reference: data.reference,
          amount: data.amount,
          bank: 'Mercantil Banco',
          phone: data.phone,
          date: data.date,
          verificationId: `MER-${Date.now()}`,
          timestamp: new Date().toISOString(),
          processingDate: c2pResult.processingDate,
          guId: c2pResult.infoMsg?.guId,
          responseCode: c2pResult.code
        }
      };
    } else {
      return {
        success: false,
        status: 'error',
        message: c2pResult.infoMsg?.guId ? `Error en solicitud C2P: ${c2pResult.code}` : 'Error procesando solicitud C2P',
        details: {
          errorCode: c2pResult.code || 'C2P_ERROR',
          timestamp: new Date().toISOString(),
          processingDate: c2pResult.processingDate,
          guId: c2pResult.infoMsg?.guId,
          transactionData: {
            reference: data.reference,
            amount: data.amount,
            phone: data.phone
          }
        }
      };
    }
  } catch (error) {
    console.error('Error verificando pago con Mercantil:', error);
    
    // Usar el manejador de errores de Mercantil
    const mercantilError = MercantilErrorHandler.processError(error, {
      operation: 'verifyMercantilPayment',
      searchCriteria: {
        reference: data.reference,
        amount: data.amount,
        phone: data.phone
      }
    });
    
    return {
      success: false,
      status: 'error',
      message: mercantilError.userMessage,
      details: {
        errorCode: mercantilError.code,
        timestamp: new Date().toISOString(),
        severity: mercantilError.severity,
        retryable: mercantilError.retryable,
        searchCriteria: {
          reference: data.reference,
          amount: data.amount,
          phone: data.phone
        }
      }
    };
  }
}

// Función para simular verificación con banco (fallback)
function simulateBankVerification(paymentData: PaymentData): VerificationResult {
  // Simular tiempo de procesamiento
  const processingDelay = Math.random() * 1000 + 500
  
  // Buscar transacción en mock database
  const transaction = mockTransactions.find(t => 
    t.phoneNumber.replace(/[^0-9]/g, '') === paymentData.phoneNumber.replace(/[^0-9]/g, '') &&
    t.reference === paymentData.reference
  )

  if (transaction) {
    // Verificar si los datos coinciden
    const amountMatches = parseFloat(transaction.amount) === parseFloat(paymentData.amount)
    const dateMatches = transaction.date === paymentData.date
    const senderBankMatches = transaction.senderBank === paymentData.senderBank
    const receiverBankMatches = transaction.receiverBank === paymentData.receiverBank

    if (amountMatches && dateMatches && senderBankMatches && receiverBankMatches) {
      if (transaction.status === 'verified') {
        return {
          status: 'success',
          message: 'Pago verificado exitosamente. La transacción es válida.',
          details: {
            transactionId: transaction.id,
            verifiedAmount: transaction.amount,
            verifiedDate: transaction.date,
            bankResponse: `Verificado: ${transaction.senderBank} → ${transaction.receiverBank}`
          }
        }
      } else {
        return {
          status: 'pending',
          message: 'La transacción está pendiente de verificación por el banco.',
          details: {
            transactionId: transaction.id,
            bankResponse: `Pendiente: ${transaction.senderBank} → ${transaction.receiverBank}`
          }
        }
      }
    } else {
      return {
        status: 'error',
        message: 'Los datos proporcionados no coinciden con los registros del banco.',
        details: {
          bankResponse: 'Datos inconsistentes'
        }
      }
    }
  } else {
    // Simular diferentes escenarios
    const random = Math.random()
    
    if (random < 0.3) {
      // 30% probabilidad de transacción no encontrada
      return {
        status: 'error',
        message: 'No se encontró la transacción en los registros del banco.',
        details: {
          bankResponse: 'Transacción no encontrada'
        }
      }
    } else if (random < 0.6) {
      // 30% probabilidad de verificación exitosa (nueva transacción)
      const newTransactionId = `TXN${Date.now().toString().slice(-6)}`
      return {
        status: 'success',
        message: 'Pago verificado exitosamente. Transacción válida.',
        details: {
          transactionId: newTransactionId,
          verifiedAmount: paymentData.amount,
          verifiedDate: paymentData.date,
          bankResponse: `Verificado por ${paymentData.bank}`
        }
      }
    } else {
      // 40% probabilidad de verificación pendiente
      return {
        status: 'pending',
        message: 'La verificación está en proceso. Intenta nuevamente en unos minutos.',
        details: {
          bankResponse: `Procesando en ${paymentData.bank}`
        }
      }
    }
  }
}

// Función para validar datos de entrada
function validatePaymentData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.phoneNumber || !/^\d{11}$/.test(data.phoneNumber.replace(/[^0-9]/g, ''))) {
    errors.push('Número de teléfono inválido')
  }
  
  if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
    errors.push('Monto inválido')
  }
  
  if (!data.reference || data.reference.length < 6) {
    errors.push('Número de referencia inválido')
  }
  
  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('Fecha inválida')
  }
  
  if (!data.bank || data.bank.trim() === '') {
    errors.push('Banco requerido')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos con Zod
    const validationResult = verifyPaymentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          message: 'Datos inválidos',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    const paymentData = validationResult.data
    
    // Obtener información del cliente
    const clientInfo = {
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }
    
    let result
    
    // Verificar si el banco receptor es Mercantil Banco
    if (paymentData.receiverBank.toLowerCase().includes('mercantil')) {
      // Usar API real de Mercantil
      result = await verifyMercantilPayment(paymentData, clientInfo)
    } else {
      // Usar simulación para otros bancos
      const legacyPaymentData: PaymentData = {
        phoneNumber: paymentData.phone,
        amount: paymentData.amount.toString(),
        reference: paymentData.reference,
        date: paymentData.date,
        senderBank: paymentData.senderBank,
        receiverBank: paymentData.receiverBank
      }
      
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      const legacyResult = simulateBankVerification(legacyPaymentData)
      
      // Convertir resultado legacy al nuevo formato
      result = {
        success: legacyResult.status === 'success',
        status: legacyResult.status,
        message: legacyResult.message,
        details: {
          ...legacyResult.details,
          timestamp: new Date().toISOString()
        }
      }
    }
    
    // Log para debugging
    console.log('Payment verification:', {
      input: paymentData,
      result: result,
      clientInfo: clientInfo
    })
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error in payment verification:', error)
    
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        message: 'Error interno del servidor. Intenta nuevamente.',
        details: {
          errorCode: 'INTERNAL_SERVER_ERROR',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

// Endpoint para obtener estadísticas (opcional)
export async function GET() {
  try {
    const stats = {
      totalTransactions: mockTransactions.length,
      verifiedTransactions: mockTransactions.filter(t => t.status === 'verified').length,
      pendingTransactions: mockTransactions.filter(t => t.status === 'pending').length,
      supportedBanks: [
        'Banco de Venezuela',
        'Banesco',
        'Mercantil',
        'Provincial',
        'Bicentenario',
        'Banco del Tesoro',
        'Bancaribe',
        'Exterior'
      ]
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}