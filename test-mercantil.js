// Script de prueba para la integración con Mercantil Banco
// Ejecutar con: node test-mercantil.js

const https = require('https');
const crypto = require('crypto');

// Credenciales proporcionadas
const credentials = {
  clientId: '81188330-c768-46fe-a378-ff3ac9e88824',
  merchantId: '200284',
  secretKey: 'A11103402525120190822HB01',
  endpoint: 'https://apimbu.mercantilbanco.com/mercantil-banco/sandbox/v1/payment/c2p'
};

// Datos de prueba proporcionados
const testData = {
  mobile: '584142591177',
  destinationMobile: '584241513063',
  destinationId: 'V18367443',
  purchaseKey: '00001111'
};

// Función para cifrar con AES/ECB/PKCS5Padding
function encrypt(text, secretKey) {
  try {
    // Crear hash SHA-256 de la clave secreta
    const hashedKey = crypto.createHash('sha256').update(secretKey).digest();
    // Tomar los primeros 16 bytes (128 bits)
    const key = hashedKey.slice(0, 16);
    
    // Cifrar usando AES-128-ECB
    const cipher = crypto.createCipher('aes-128-ecb', key);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return encrypted;
  } catch (error) {
    console.error('Error al cifrar:', error);
    throw error;
  }
}

// Construir el request con la estructura correcta de C2P según documentación oficial
const requestData = {
  merchant_identify: {
    integratorId: 1,
    merchantId: parseInt(credentials.merchantId),
    terminalId: "1"
  },
  client_identify: {
    ipaddress: "192.168.1.1",
    browser_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    mobile: {
      manufacturer: "Samsung",
      model: "Galaxy",
      os_version: "Android 12",
      location: {
        lat: 10.4806,
        lng: -66.9036
      }
    }
  },
  transaction_c2p: {
     amount: 1.0,
     currency: "ves",
     destination_bank_id: "0105",
     destination_id: encrypt(testData.destinationId, credentials.secretKey),
     origin_mobile_number: encrypt(testData.mobile, credentials.secretKey),
     destination_mobile_number: encrypt(testData.destinationMobile, credentials.secretKey),
     trx_type: "compra",
     payment_method: "c2p",
     invoice_number: "TEST" + Date.now()
   }
};

console.log('🔍 Probando integración con Mercantil Banco...');
console.log('📋 Datos de prueba:', {
  endpoint: credentials.endpoint,
  merchantId: credentials.merchantId,
  clientId: credentials.clientId,
  mobileDestination: testData.mobileDestination
});

try {
  // Convertir a JSON y cifrar
  const jsonRequest = JSON.stringify(requestData);
  console.log('📤 Request JSON:', jsonRequest);
  
  const encryptedRequest = encrypt(jsonRequest, credentials.secretKey);
  console.log('🔐 Request cifrado:', encryptedRequest.substring(0, 50) + '...');
  
  // Preparar datos para envío
  const postData = JSON.stringify({
    data: encryptedRequest
  });
  
  const url = new URL(credentials.endpoint);
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-IBM-Client-Id': credentials.clientId,
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Connection': 'keep-alive',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  console.log('🚀 Enviando request a Mercantil...');
  
  const req = https.request(options, (res) => {
    console.log('📡 Status Code:', res.statusCode);
    console.log('📋 Headers:', res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📥 Respuesta recibida:');
      try {
        const response = JSON.parse(data);
        console.log(JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('Respuesta no es JSON válido:', data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Error en la petición:', error);
  });
  
  req.write(postData);
  req.end();
  
} catch (error) {
  console.error('❌ Error general:', error);
}