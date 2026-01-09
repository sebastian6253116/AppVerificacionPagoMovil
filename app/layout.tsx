import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Verificación de Pago Móvil',
  description: 'Aplicación para verificar pagos móviles de forma segura y rápida',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    💳 Verificación Pago Móvil
                  </h1>
                </div>
                <div className="text-sm text-gray-500">
                  Seguro y confiable
                </div>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
          <footer className="bg-white border-t mt-12">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                © 2024 App Verificación Pago Móvil. Todos los derechos reservados.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}