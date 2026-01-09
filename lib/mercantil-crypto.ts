import CryptoJS from 'crypto-js';

/**
 * Utilidades de cifrado para la API de Mercantil Banco
 * Implementa el algoritmo AES/ECB/PKCS5Padding requerido
 */
export class MercantilCrypto {
  /**
   * Cifra un texto usando AES/ECB/PKCS5Padding
   * @param text - Texto a cifrar
   * @param secretKey - Clave secreta proporcionada por Mercantil
   * @returns Texto cifrado en Base64
   */
  static encrypt(text: string, secretKey: string): string {
    try {
      // Convertir la clave secreta a SHA-256 y tomar los primeros 16 bytes
      const hashedKey = CryptoJS.SHA256(secretKey);
      const key = CryptoJS.lib.WordArray.create(hashedKey.words.slice(0, 4)); // 16 bytes = 4 words
      
      // Cifrar usando AES en modo ECB
      const encrypted = CryptoJS.AES.encrypt(text, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      });
      
      // Retornar en Base64
      return encrypted.toString();
    } catch (error) {
      console.error('Error al cifrar:', error);
      throw new Error('Error en el proceso de cifrado');
    }
  }

  /**
   * Descifra un texto cifrado con AES/ECB/PKCS5Padding
   * @param encryptedText - Texto cifrado en Base64
   * @param secretKey - Clave secreta proporcionada por Mercantil
   * @returns Texto descifrado
   */
  static decrypt(encryptedText: string, secretKey: string): string {
    try {
      // Convertir la clave secreta a SHA-256 y tomar los primeros 16 bytes
      const hashedKey = CryptoJS.SHA256(secretKey);
      const key = CryptoJS.lib.WordArray.create(hashedKey.words.slice(0, 4)); // 16 bytes = 4 words
      
      // Descifrar usando AES en modo ECB
      const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      });
      
      // Retornar como string UTF-8
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Error al descifrar:', error);
      throw new Error('Error en el proceso de descifrado');
    }
  }

  /**
   * Genera un hash SHA-256 de un texto
   * @param text - Texto a hashear
   * @returns Hash SHA-256 en hexadecimal
   */
  static sha256(text: string): string {
    return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
  }

  /**
   * Valida que una clave secreta tenga el formato correcto
   * @param secretKey - Clave secreta a validar
   * @returns true si la clave es válida
   */
  static validateSecretKey(secretKey: string): boolean {
    return typeof secretKey === 'string' && secretKey.length > 0;
  }
}

/**
 * Tipos para la API de Mercantil
 */
export interface MercantilCredentials {
  clientId: string;
  merchantId: string;
  secretKey: string;
  endpoint: string;
}

export interface MercantilC2PRequest {
  merchant_identify: {
    integratorId: number;
    merchantId: number;
    terminalId: string;
  };
  client_identify: {
    ipaddress: string;
    browser_agent: string;
    mobile: {
      manufacturer: string;
      model: string;
      os_version: string;
      location: {
        lat: number;
        lng: number;
      };
    };
  };
  transaction_c2p: {
    amount: number;
    currency: string;
    destination_bank_id: string;
    destination_id: string;
    origin_mobile_number: string;
    destination_mobile_number: string;
    trx_type: string;
    payment_method: string;
    invoice_number: string;
  };
}

export interface MercantilC2PResponse {
  processingDate: string;
  infoMsg: {
    guId: string;
    channel: string;
    subchannel: string;
    applId: string;
    personId: string;
    userId: string;
    token: string;
    action: string;
    tokenS?: string;
  };
  code: number;
}

// Mantener compatibilidad con nombres anteriores
export type MercantilSearchRequest = MercantilC2PRequest;
export type MercantilSearchResponse = MercantilC2PResponse;