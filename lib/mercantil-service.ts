import { MercantilCrypto, MercantilCredentials, MercantilC2PRequest, MercantilC2PResponse, MercantilSearchRequest, MercantilSearchResponse } from './mercantil-crypto';
import { MercantilErrorHandler, RetryHandler } from './mercantil-errors';

/**
 * Servicio para integrar con la API de Mercantil Banco
 * Implementa la búsqueda de pagos móviles usando el endpoint C2P
 */
export class MercantilService {
  private credentials: MercantilCredentials;

  constructor(credentials: MercantilCredentials) {
    this.credentials = credentials;
  }

  /**
   * Solicita una clave de pago C2P en la API de Mercantil
   * @param transactionData - Datos de la transacción
   * @param clientInfo - Información del cliente (IP, User Agent)
   * @param enableRetry - Habilitar reintentos automáticos
   * @returns Resultado de la solicitud
   */
  async requestPaymentKey(
    transactionData: {
      amount: number;
      destinationBankId: string;
      destinationId: string;
      originMobileNumber: string;
      destinationMobileNumber: string;
      invoiceNumber?: string;
    },
    clientInfo: {
      ipAddress: string;
      userAgent: string;
      deviceInfo?: {
        manufacturer?: string;
        model?: string;
        osVersion?: string;
        location?: {
          lat: number;
          lng: number;
        };
      };
    },
    enableRetry: boolean = true
  ): Promise<MercantilC2PResponse> {
    const searchOperation = async (): Promise<MercantilC2PResponse> => {
      try {
        // Validar datos de transacción
        this.validateTransactionData(transactionData);

        // Construir el request según la documentación de Mercantil C2P
        const requestData: MercantilC2PRequest = {
          merchant_identify: {
            integratorId: 1,
            merchantId: parseInt(this.credentials.merchantId),
            terminalId: '1'
          },
          client_identify: {
            ipaddress: clientInfo.ipAddress,
            browser_agent: clientInfo.userAgent,
            mobile: clientInfo.deviceInfo ? {
              manufacturer: clientInfo.deviceInfo.manufacturer || 'Unknown',
              model: clientInfo.deviceInfo.model || 'Unknown',
              os_version: clientInfo.deviceInfo.osVersion || 'Unknown',
              location: clientInfo.deviceInfo.location || {
                lat: 10.4806,
                lng: -66.9036
              }
            } : {
              manufacturer: 'Unknown',
              model: 'Unknown',
              os_version: 'Unknown',
              location: {
                lat: 10.4806,
                lng: -66.9036
              }
            }
          },
          transaction_c2p: {
            trx_type: 'compra',
            payment_method: 'c2p',
            destination_id: MercantilCrypto.encrypt(transactionData.destinationId, this.credentials.secretKey),
            invoice_number: transactionData.invoiceNumber || `INV${Date.now()}`,
            currency: 'VES',
            amount: transactionData.amount,
            destination_bank_id: transactionData.destinationBankId,
            destination_mobile_number: MercantilCrypto.encrypt(transactionData.destinationMobileNumber, this.credentials.secretKey),
            origin_mobile_number: MercantilCrypto.encrypt(transactionData.originMobileNumber, this.credentials.secretKey)
          }
        };

        // Convertir el request a JSON y cifrarlo
        const jsonRequest = JSON.stringify(requestData);
        const encryptedRequest = MercantilCrypto.encrypt(jsonRequest, this.credentials.secretKey);

        // Preparar headers
        const headers = {
          'Content-Type': 'application/json',
          'X-IBM-Client-Id': this.credentials.clientId,
          'Accept': 'application/json'
        };

        // Realizar la petición HTTP con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

        try {
          const response = await fetch(this.credentials.endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              data: encryptedRequest
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = {
              status: response.status,
              statusText: response.statusText,
              message: `HTTP Error: ${response.status} - ${response.statusText}`
            };
            throw errorData;
          }

          const responseData = await response.json();

          // Si la respuesta viene cifrada, descifrarla
          if (responseData.data && typeof responseData.data === 'string') {
            try {
              const decryptedData = MercantilCrypto.decrypt(responseData.data, this.credentials.secretKey);
              return JSON.parse(decryptedData) as MercantilC2PResponse;
            } catch (decryptError) {
              console.error('Error al descifrar respuesta:', decryptError);
              // Si no se puede descifrar, asumir que la respuesta no está cifrada
              return responseData as MercantilC2PResponse;
            }
          }

          return responseData as MercantilC2PResponse;

        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw { message: 'timeout', code: 'NET_001' };
          }
          throw fetchError;
        }

      } catch (error) {
        const mercantilError = MercantilErrorHandler.processError(error, {
          searchCriteria,
          clientInfo,
          endpoint: this.credentials.endpoint
        });
        
        MercantilErrorHandler.logError(mercantilError, {
          operation: 'searchPayment',
          searchCriteria,
          clientInfo
        });
        
        throw mercantilError;
      }
    };

    if (enableRetry) {
      const retryHandler = new RetryHandler(3);
      return await retryHandler.execute(searchOperation);
    } else {
      return await searchOperation();
    }
  }

  /**
   * Valida las credenciales de Mercantil
   * @returns true si las credenciales son válidas
   */
  validateCredentials(): boolean {
    return (
      !!this.credentials.clientId &&
      !!this.credentials.merchantId &&
      !!this.credentials.secretKey &&
      !!this.credentials.endpoint &&
      MercantilCrypto.validateSecretKey(this.credentials.secretKey)
    );
  }

  /**
   * Valida los datos de transacción C2P
   * @param transactionData - Datos a validar
   */
  private validateTransactionData(transactionData: {
    amount: number;
    destinationBankId: string;
    destinationId: string;
    originMobileNumber: string;
    destinationMobileNumber: string;
    invoiceNumber?: string;
  }): void {
    // Validar monto
    if (typeof transactionData.amount !== 'number' || transactionData.amount <= 0) {
      throw { code: 'VAL_003', message: 'Monto inválido' };
    }

    // Validar código de banco destino
    if (!transactionData.destinationBankId || typeof transactionData.destinationBankId !== 'string') {
      throw { code: 'VAL_005', message: 'Código de banco destino inválido' };
    }

    // Validar cédula/RIF destino
    if (!transactionData.destinationId || typeof transactionData.destinationId !== 'string') {
      throw { code: 'VAL_006', message: 'Identificación destino inválida' };
    }

    // Validar número de teléfono origen
    const phoneRegex = /^58[0-9]{10}$/;
    if (!phoneRegex.test(transactionData.originMobileNumber.replace(/[\s-]/g, ''))) {
      throw { code: 'VAL_001', message: 'Número de teléfono origen inválido' };
    }

    // Validar número de teléfono destino
    if (!phoneRegex.test(transactionData.destinationMobileNumber.replace(/[\s-]/g, ''))) {
      throw { code: 'VAL_007', message: 'Número de teléfono destino inválido' };
    }

    // Validar número de factura si se proporciona
    if (transactionData.invoiceNumber) {
      if (typeof transactionData.invoiceNumber !== 'string' || 
          transactionData.invoiceNumber.trim().length === 0) {
        throw { code: 'VAL_002', message: 'Número de factura inválido' };
      }
    }
  }

  /**
   * Obtiene las credenciales desde las variables de entorno
   * @param environment - Ambiente a usar ('prod' o 'cert')
   * @returns Credenciales de Mercantil
   */
  static getCredentialsFromEnv(environment: 'prod' | 'cert' = 'cert'): MercantilCredentials {
    const envPrefix = environment === 'prod' ? 'MERCANTIL_SEARCH' : 'MERCANTIL_CERT';
    
    return {
      clientId: process.env[`${envPrefix}_CLIENT_ID`] || '',
      merchantId: process.env[`${envPrefix}_MERCHANT_ID`] || '',
      secretKey: process.env[`${envPrefix}_SECRET_KEY`] || '',
      endpoint: process.env[`${envPrefix}_ENDPOINT`] || ''
    };
  }

  /**
   * Crea una instancia del servicio usando variables de entorno
   * @param environment - Ambiente a usar ('prod' o 'cert')
   * @returns Instancia del servicio
   */
  static createFromEnv(environment?: 'prod' | 'cert'): MercantilService {
    const env = environment || (process.env.MERCANTIL_ENVIRONMENT as 'prod' | 'cert') || 'cert';
    const credentials = this.getCredentialsFromEnv(env);
    return new MercantilService(credentials);
  }
}

/**
 * Función helper para formatear números de teléfono venezolanos
 * @param phoneNumber - Número de teléfono
 * @returns Número formateado para la API
 */
export function formatVenezuelanPhoneNumber(phoneNumber: string): string {
  // Remover espacios, guiones y paréntesis
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Si empieza con +58, remover el prefijo
  if (cleaned.startsWith('+58')) {
    cleaned = cleaned.substring(3);
  }
  
  // Si empieza con 58, remover el prefijo
  if (cleaned.startsWith('58')) {
    cleaned = cleaned.substring(2);
  }
  
  // Validar que tenga 10 dígitos (formato 04XX-XXXXXXX)
  if (cleaned.length === 10 && cleaned.startsWith('04')) {
    return cleaned;
  }
  
  throw new Error('Número de teléfono venezolano inválido. Debe tener el formato 04XX-XXXXXXX');
}

/**
 * Función helper para formatear referencias de pago
 * @param reference - Referencia de pago
 * @returns Referencia formateada
 */
export function formatPaymentReference(reference: string): string {
  // Remover espacios y convertir a mayúsculas
  return reference.replace(/\s/g, '').toUpperCase();
}