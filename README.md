# 💳 App Verificación Pago Móvil

Aplicación web moderna para verificar pagos móviles de forma segura y rápida, construida con Next.js 14 y optimizada para despliegue en Vercel.

## 🚀 Características

- ✅ Verificación en tiempo real de pagos móviles
- 🏦 Soporte para múltiples bancos venezolanos
- 📱 Interfaz responsive y moderna
- 🔒 Validación de datos segura
- ⚡ API optimizada con Next.js App Router
- 🎨 UI moderna con Tailwind CSS
- 📊 Sistema de estados de verificación
- 🛡️ Manejo de errores robusto

## 🏗️ Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel
- **API**: Next.js API Routes

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta en Vercel (para despliegue)

## 🛠️ Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd AppVerificacionPagoMovil
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   Edita `.env.local` con tus configuraciones específicas.

4. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   # o
   yarn dev
   ```

5. **Abrir en el navegador**
   Visita [http://localhost:3000](http://localhost:3000)

## 🚀 Despliegue en Vercel

### Opción 1: Despliegue Automático (Recomendado)

1. **Conectar con GitHub**
   - Sube tu código a un repositorio de GitHub
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "New Project"
   - Importa tu repositorio de GitHub

2. **Configuración automática**
   - Vercel detectará automáticamente que es un proyecto Next.js
   - Las configuraciones en `vercel.json` se aplicarán automáticamente

3. **Variables de entorno**
   - En el dashboard de Vercel, ve a Settings > Environment Variables
   - Agrega las variables necesarias basándote en `.env.example`

4. **Desplegar**
   - Haz clic en "Deploy"
   - Tu aplicación estará disponible en una URL de Vercel

### Opción 2: Despliegue Manual con Vercel CLI

1. **Instalar Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login en Vercel**
   ```bash
   vercel login
   ```

3. **Desplegar**
   ```bash
   vercel
   ```
   Sigue las instrucciones en pantalla.

4. **Despliegue a producción**
   ```bash
   vercel --prod
   ```

## 📁 Estructura del Proyecto

```
AppVerificacionPagoMovil/
├── app/
│   ├── api/
│   │   └── verify-payment/
│   │       └── route.ts          # API endpoint para verificación
│   ├── globals.css               # Estilos globales con Tailwind
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página principal
├── public/                       # Archivos estáticos
├── .env.example                  # Variables de entorno de ejemplo
├── .gitignore                    # Archivos ignorados por Git
├── next.config.js                # Configuración de Next.js
├── package.json                  # Dependencias y scripts
├── postcss.config.js             # Configuración de PostCSS
├── tailwind.config.js            # Configuración de Tailwind
├── tsconfig.json                 # Configuración de TypeScript
├── vercel.json                   # Configuración de Vercel
└── README.md                     # Este archivo
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Construye la aplicación
npm run start        # Inicia servidor de producción

# Linting
npm run lint         # Ejecuta ESLint
```

## 🏦 Bancos Soportados

- Banco de Venezuela
- Banesco
- Mercantil
- Provincial
- Bicentenario
- Banco del Tesoro
- Bancaribe
- Exterior

## 📊 API Endpoints

### POST `/api/verify-payment`
Verifica un pago móvil.

**Request Body:**
```json
{
  "phoneNumber": "04141234567",
  "amount": "100.00",
  "reference": "123456789",
  "date": "2024-01-15",
  "bank": "Banesco"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Pago verificado exitosamente",
  "details": {
    "transactionId": "TXN001",
    "verifiedAmount": "100.00",
    "verifiedDate": "2024-01-15",
    "bankResponse": "Verificado por Banesco"
  }
}
```

### GET `/api/verify-payment`
Obtiene estadísticas del sistema.

## 🔒 Seguridad

- Validación de datos en frontend y backend
- Sanitización de inputs
- Rate limiting (configurado en Vercel)
- Headers de seguridad CORS
- Manejo seguro de errores

## 🚨 Consideraciones para Producción

1. **Base de Datos**: Implementar una base de datos real (PostgreSQL, MongoDB)
2. **Autenticación**: Agregar sistema de autenticación JWT
3. **APIs Bancarias**: Integrar con APIs reales de bancos
4. **Logging**: Implementar sistema de logs robusto
5. **Monitoreo**: Configurar alertas y métricas
6. **Backup**: Implementar respaldos automáticos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

- 📧 Email: soporte@verificacionpago.com
- 📱 WhatsApp: +58 XXX-XXXXXXX
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/AppVerificacionPagoMovil/issues)

## 🎯 Roadmap

- [ ] Integración con APIs bancarias reales
- [ ] Sistema de notificaciones
- [ ] Dashboard de administración
- [ ] App móvil nativa
- [ ] Soporte para más países
- [ ] Sistema de reportes

---

**¡Gracias por usar App Verificación Pago Móvil!** 🚀