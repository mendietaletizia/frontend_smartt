// CU13: API para historial de ventas

import { getApiUrl } from '../config/api.js'

function buildQuery(params) {
  const q = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) q.append(k, v)
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export async function obtenerHistorialVentas(filtros = {}) {
  const query = buildQuery(filtros)
  const res = await fetch(getApiUrl(`/api/ventas/historial/${query}`), {
    credentials: 'include'
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'Error al obtener historial')
  return data
}

export async function obtenerHistorialAgregado(filtros = {}) {
  const query = buildQuery(filtros)
  const res = await fetch(getApiUrl(`/api/ventas/historial/agregado${query}`), {
    credentials: 'include'
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'Error al obtener historial agregado')
  return data
}

export async function sincronizarHistorial() {
  const res = await fetch(getApiUrl('/api/ventas/historial/sincronizar/'), {
    method: 'POST',
    credentials: 'include'
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'Error al sincronizar historial')
  return data
}

export async function obtenerOpcionesFiltros() {
  const res = await fetch(getApiUrl('/api/ventas/historial/filtros/'), {
    credentials: 'include'
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'Error al obtener opciones de filtros')
  return data
}

