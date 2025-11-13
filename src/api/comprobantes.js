// CU12: API para comprobantes

import { getApiUrl } from '../config/api.js'

export async function generarComprobante(ventaId, tipo = 'factura') {
  const res = await fetch(getApiUrl('/api/ventas/comprobantes/generar/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ venta_id: ventaId, tipo })
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'Error al generar comprobante')
  return data.comprobante
}

export async function obtenerComprobante(ventaId) {
  const res = await fetch(getApiUrl(`/api/ventas/comprobantes/${ventaId}/`), {
    credentials: 'include'
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'Error al obtener comprobante')
  return data.comprobante
}

export function descargarComprobantePDF(ventaId) {
  window.open(getApiUrl(`/api/ventas/comprobantes/${ventaId}/pdf/`), '_blank')
}


