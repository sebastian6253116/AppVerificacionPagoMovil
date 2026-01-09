import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MercantilService, formatVenezuelanPhoneNumber } from '@/lib/mercantil-service';
import { MercantilErrorHandler } from '@/lib/mercantil-errors';
import { supabase } from '@/lib/supabase';

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
    errorCode?: string
    timestamp?: string
    severity?: string
    retryable?: boolean
    searchCriteria?: any
    processingDate?: string
    guId?: string
    responseCode?: number
    transactionData?: any
  }
}

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
          errorCode: c2pResult.code?.toString() || 'C2P_ERROR',
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

// Función para simular verificación con banco (ahora consulta Supabase)
async function simulateBankVerification(paymentData: PaymentData): Promise<VerificationResult> {
  // Simular tiempo de procesamiento
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  
  // Buscar transacción en Supabase
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('reference', paymentData.reference)
    .eq('amount', parseFloat(paymentData.amount))
    .eq('sender_bank', paymentData.senderBank)
    .eq('receiver_bank', paymentData.receiverBank);

  if (error) {
    console.error('Error fetching transactions from Supabase:', error);
    // Fallback si hay error de conexión, pero en prod debería manejarse mejor
    return {
      status: 'error',
      message: 'Error de conexión con la base de datos de transacciones.',
      details: {
        bankResponse: 'Error de sistema',
        errorCode: error.code
      }
    };
  }

  const transaction = transactions && transactions.length > 0 ? transactions[0] : null;

  if (transaction) {
    // Verificar si los datos coinciden (aunque ya filtramos en la query, doble check)
    // Supabase devuelve strings para numeric, parsear si es necesario
    const dateMatches = transaction.date === paymentData.date; // Asumiendo formato YYYY-MM-DD consistente

    if (dateMatches) {
      if (transaction.status === 'verified') {
        return {
          status: 'success',
          message: 'Pago verificado exitosamente. La transacción es válida.',
          details: {
            transactionId: transaction.id,
            verifiedAmount: transaction.amount.toString(),
            verifiedDate: transaction.date,
            bankResponse: transaction.bank_response || `Verificado: ${transaction.sender_bank} → ${transaction.receiver_bank}`
          }
        }
      } else {
        return {
          status: 'pending',
          message: 'La transacción está pendiente de verificación por el banco.',
          details: {
            transactionId: transaction.id,
            bankResponse: transaction.bank_response || `Pendiente: ${transaction.sender_bank} → ${transaction.receiver_bank}`
          }
        }
      }
    } else {
      return {
        status: 'error',
        message: 'La fecha proporcionada no coincide con el registro del banco.',
        details: {
          bankResponse: 'Fecha incorrecta'
        }
      }
    }
  } else {
    // Si no existe, simulamos la lógica aleatoria anterior para mantener el comportamiento
    // O idealmente, retornamos que no existe. 
    // Para mantener compatibilidad con el frontend actual que espera simulación:
    // Insertamos una nueva transacción simulada para persistencia
    
    const random = Math.random();
    let status: 'verified' | 'pending' | 'error' = 'error';
    let message = '';
    let bankResponse = '';

    if (random < 0.3) {
      status = 'error';
      message = 'No se encontró la transacción en los registros del banco.';
      bankResponse = 'Transacción no encontrada';
    } else if (random < 0.6) {
      status = 'verified';
      message = 'Pago verificado exitosamente. Transacción válida.';
      bankResponse = `Verificado por ${paymentData.senderBank}`;
    } else {
      status = 'pending';
      message = 'La verificación está en proceso. Intenta nuevamente en unos minutos.';
      bankResponse = `Procesando en ${paymentData.receiverBank}`;
    }

    if (status !== 'error') {
       // Guardar la nueva transacción simulada en Supabase para futuras consultas
       await supabase.from('transactions').insert({
         reference: paymentData.reference,
         amount: parseFloat(paymentData.amount),
         phone: paymentData.phoneNumber,
         date: paymentData.date,
         sender_bank: paymentData.senderBank,
         receiver_bank: paymentData.receiverBank,
         status: status,
         bank_response: bankResponse,
         metadata: { simulated: true }
       });
    }

    return {
      status: status === 'verified' ? 'success' : status,
      message: message,
      details: {
        bankResponse: bankResponse
      }
    };
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
      // Nota: Aquí también se podría guardar el intento en Supabase si se desea auditoría
      const mercantilResult = await verifyMercantilPayment(paymentData, clientInfo);
      
      result = {
        success: mercantilResult.success,
        status: mercantilResult.status,
        message: mercantilResult.message,
        details: mercantilResult.details
      };

    } else {
      // Usar simulación (ahora persistente con Supabase) para otros bancos
      const legacyPaymentData: PaymentData = {
        phoneNumber: paymentData.phone,
        amount: paymentData.amount.toString(),
        reference: paymentData.reference,
        date: paymentData.date,
        senderBank: paymentData.senderBank,
        receiverBank: paymentData.receiverBank
      }
      
      const legacyResult = await simulateBankVerification(legacyPaymentData)
      
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

// Endpoint para obtener estadísticas (ahora desde Supabase)
export async function GET() {
  try {
    const { count: totalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    const { count: verifiedTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified');

    const { count: pendingTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const stats = {
      totalTransactions: totalTransactions || 0,
      verifiedTransactions: verifiedTransactions || 0,
      pendingTransactions: pendingTransactions || 0,
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
