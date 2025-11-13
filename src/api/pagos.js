// CU11: API para pagos en línea

import { getApiUrl } from '../config/api.js'

export async function procesarPago(datosPago) {
  const res = await fetch(getApiUrl('/api/ventas/pagos-online/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(datosPago)
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'Error al procesar pago')
  return data
}

export async function obtenerEstadoPago(pagoId) {
  const res = await fetch(getApiUrl(`/api/ventas/pagos-online/${pagoId}/`), {
    credentials: 'include'
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'Error al obtener estado del pago')
  return data.pago
}


