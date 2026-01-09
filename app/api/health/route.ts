import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Intentar leer de la tabla de prueba
    const { data, error } = await supabase
      .from('connection_test')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Error conectando con Supabase',
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Conexión con Supabase verificada correctamente',
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Internal health check error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
