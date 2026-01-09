/**
 * Manejo de errores específicos de la API de Mercantil Banco
 */

export interface MercantilError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
}

/**
 * Códigos de error conocidos de la API de Mercantil
 */
export const MERCANTIL_ERROR_CODES: Record<string, MercantilError> = {
  // Errores de autenticación
  'AUTH_001': {
    code: 'AUTH_001',
    message: 'Client ID inválido',
    userMessage: 'Error de configuración. Contacte al administrador.',
    severity: 'critical',
    retryable: false
  },
  'AUTH_002': {
    code: 'AUTH_002',
    message: 'Clave secreta inválida',
    userMessage: 'Error de configuración. Contacte al administrador.',
    severity: 'critical',
    retryable: false
  },
  'AUTH_003': {
    code: 'AUTH_003',
    message: 'Token expirado',
    userMessage: 'Sesión expirada. Intente nuevamente.',
    severity: 'medium',
    retryable: true
  },

  // Errores de validación
  'VAL_001': {
    code: 'VAL_001',
    message: 'Número de teléfono inválido',
    userMessage: 'El número de teléfono debe tener el formato 04XX-XXXXXXX.',
    severity: 'low',
    retryable: false
  },
  'VAL_002': {
    code: 'VAL_002',
    message: 'Referencia de pago inválida',
    userMessage: 'La referencia de pago no tiene un formato válido.',
    severity: 'low',
    retryable: false
  },
  'VAL_003': {
    code: 'VAL_003',
    message: 'Monto inválido',
    userMessage: 'El monto debe ser un número positivo.',
    severity: 'low',
    retryable: false
  },
  'VAL_004': {
    code: 'VAL_004',
    message: 'Fecha inválida',
    userMessage: 'La fecha debe estar en formato válido (YYYY-MM-DD).',
    severity: 'low',
    retryable: false
  },

  // Errores de búsqueda
  'SEARCH_001': {
    code: 'SEARCH_001',
    message: 'Pago no encontrado',
    userMessage: 'No se encontró ningún pago con los criterios especificados.',
    severity: 'low',
    retryable: false
  },
  'SEARCH_002': {
    code: 'SEARCH_002',
    message: 'Múltiples pagos encontrados',
    userMessage: 'Se encontraron múltiples pagos. Refine los criterios de búsqueda.',
    severity: 'medium',
    retryable: false
  },
  'SEARCH_003': {
    code: 'SEARCH_003',
    message: 'Criterios de búsqueda insuficientes',
    userMessage: 'Debe proporcionar al menos un criterio de búsqueda válido.',
    severity: 'low',
    retryable: false
  },

  // Errores de red y sistema
  'NET_001': {
    code: 'NET_001',
    message: 'Timeout de conexión',
    userMessage: 'La conexión tardó demasiado. Intente nuevamente.',
    severity: 'medium',
    retryable: true
  },
  'NET_002': {
    code: 'NET_002',
    message: 'Error de conexión',
    userMessage: 'No se pudo conectar con el servidor. Verifique su conexión.',
    severity: 'medium',
    retryable: true
  },
  'SYS_001': {
    code: 'SYS_001',
    message: 'Servicio temporalmente no disponible',
    userMessage: 'El servicio no está disponible temporalmente. Intente más tarde.',
    severity: 'high',
    retryable: true
  },
  'SYS_002': {
    code: 'SYS_002',
    message: 'Error interno del servidor',
    userMessage: 'Error interno del sistema. Contacte al soporte técnico.',
    severity: 'critical',
    retryable: false
  },

  // Errores de cifrado
  'CRYPTO_001': {
    code: 'CRYPTO_001',
    message: 'Error de cifrado',
    userMessage: 'Error en el procesamiento de datos. Contacte al administrador.',
    severity: 'critical',
    retryable: false
  },
  'CRYPTO_002': {
    code: 'CRYPTO_002',
    message: 'Error de descifrado',
    userMessage: 'Error en el procesamiento de respuesta. Intente nuevamente.',
    severity: 'high',
    retryable: true
  }
};

/**
 * Clase para manejar errores de Mercantil
 */
export class MercantilErrorHandler {
  /**
   * Procesa un error de la API de Mercantil
   * @param error - Error recibido
   * @param context - Contexto adicional del error
   * @returns Error procesado con información para el usuario
   */
  static processError(error: any, context?: any): MercantilError {
    // Si es un error conocido
    if (error.code && MERCANTIL_ERROR_CODES[error.code]) {
      return MERCANTIL_ERROR_CODES[error.code];
    }

    // Mapear errores HTTP comunes
    if (error.status) {
      switch (error.status) {
        case 400:
          return {
            code: 'HTTP_400',
            message: 'Solicitud inválida',
            userMessage: 'Los datos enviados no son válidos. Verifique la información.',
            severity: 'low',
            retryable: false
          };
        case 401:
          return MERCANTIL_ERROR_CODES['AUTH_001'];
        case 403:
          return {
            code: 'HTTP_403',
            message: 'Acceso denegado',
            userMessage: 'No tiene permisos para realizar esta operación.',
            severity: 'high',
            retryable: false
          };
        case 404:
          return MERCANTIL_ERROR_CODES['SEARCH_001'];
        case 408:
          return MERCANTIL_ERROR_CODES['NET_001'];
        case 429:
          return {
            code: 'HTTP_429',
            message: 'Demasiadas solicitudes',
            userMessage: 'Ha excedido el límite de solicitudes. Intente más tarde.',
            severity: 'medium',
            retryable: true
          };
        case 500:
        case 502:
        case 503:
          return MERCANTIL_ERROR_CODES['SYS_001'];
        case 504:
          return MERCANTIL_ERROR_CODES['NET_001'];
      }
    }

    // Mapear errores de red
    if (error.message) {
      const message = error.message.toLowerCase();
      
      if (message.includes('timeout') || message.includes('timed out')) {
        return MERCANTIL_ERROR_CODES['NET_001'];
      }
      
      if (message.includes('network') || message.includes('connection')) {
        return MERCANTIL_ERROR_CODES['NET_002'];
      }
      
      if (message.includes('encrypt') || message.includes('cifr')) {
        return MERCANTIL_ERROR_CODES['CRYPTO_001'];
      }
      
      if (message.includes('decrypt') || message.includes('descifr')) {
        return MERCANTIL_ERROR_CODES['CRYPTO_002'];
      }
    }

    // Error genérico
    return {
      code: 'UNKNOWN',
      message: error.message || 'Error desconocido',
      userMessage: 'Ocurrió un error inesperado. Intente nuevamente o contacte al soporte.',
      severity: 'medium',
      retryable: true
    };
  }

  /**
   * Determina si un error es recuperable automáticamente
   * @param error - Error a evaluar
   * @returns true si el error es recuperable
   */
  static isRetryable(error: MercantilError): boolean {
    return error.retryable && error.severity !== 'critical';
  }

  /**
   * Obtiene el tiempo de espera recomendado antes de reintentar
   * @param attempt - Número de intento (empezando en 1)
   * @param error - Error ocurrido
   * @returns Tiempo en milisegundos
   */
  static getRetryDelay(attempt: number, error: MercantilError): number {
    if (!error.retryable) return 0;
    
    // Backoff exponencial con jitter
    const baseDelay = 1000; // 1 segundo
    const maxDelay = 30000; // 30 segundos
    
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    const jitter = Math.random() * 0.1 * delay; // 10% de jitter
    
    return Math.floor(delay + jitter);
  }

  /**
   * Registra un error para monitoreo
   * @param error - Error a registrar
   * @param context - Contexto adicional
   */
  static logError(error: MercantilError, context?: any): void {
    const logData = {
      timestamp: new Date().toISOString(),
      error: {
        code: error.code,
        message: error.message,
        severity: error.severity
      },
      context
    };

    // En desarrollo, usar console
    if (process.env.NODE_ENV === 'development') {
      console.error('Mercantil API Error:', logData);
    } else {
      // En producción, enviar a servicio de logging
      // TODO: Integrar con servicio de logging (Sentry, LogRocket, etc.)
      console.error('Mercantil API Error:', logData);
    }
  }
}

/**
 * Hook para manejar reintentos automáticos
 */
export class RetryHandler {
  private maxRetries: number;
  private currentAttempt: number = 0;

  constructor(maxRetries: number = 3) {
    this.maxRetries = maxRetries;
  }

  /**
   * Ejecuta una función con reintentos automáticos
   * @param fn - Función a ejecutar
   * @returns Resultado de la función
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.currentAttempt = 0;
    
    while (this.currentAttempt < this.maxRetries) {
      this.currentAttempt++;
      
      try {
        return await fn();
      } catch (error) {
        const mercantilError = MercantilErrorHandler.processError(error);
        
        // Si no es recuperable o es el último intento, lanzar error
        if (!MercantilErrorHandler.isRetryable(mercantilError) || 
            this.currentAttempt >= this.maxRetries) {
          MercantilErrorHandler.logError(mercantilError, {
            attempt: this.currentAttempt,
            maxRetries: this.maxRetries
          });
          throw mercantilError;
        }
        
        // Esperar antes del siguiente intento
        const delay = MercantilErrorHandler.getRetryDelay(this.currentAttempt, mercantilError);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`Reintentando operación (${this.currentAttempt}/${this.maxRetries}) en ${delay}ms...`);
      }
    }
    
    throw new Error('Máximo número de reintentos alcanzado');
  }
}