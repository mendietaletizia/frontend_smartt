import { getApiUrl } from '../config/api.js'

function buildQuery(params) {
  const q = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) q.append(k, v)
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export async function listProducts(params = {}) {
  const query = buildQuery(params)
  const url = query ? `/api/productos/${query}` : '/api/productos/'
  const res = await fetch(getApiUrl(url), { credentials: 'include' })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) {
    const errorMsg = data.message || 'No se pudo obtener productos'
    throw new Error(errorMsg)
  }
  return data
}

export async function createProduct(body) {
  const res = await fetch(getApiUrl('/api/productos/admin/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo crear')
  return data
}

export async function updateProduct(body) {
  const res = await fetch(getApiUrl('/api/productos/admin/'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo actualizar')
  return data
}

export async function deleteProduct(id) {
  const res = await fetch(getApiUrl(`/api/productos/admin/?id=${encodeURIComponent(id)}`), {
    method: 'DELETE',
    credentials: 'include'
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo eliminar')
  return data
}

export async function listCategorias() {
  const res = await fetch(getApiUrl('/api/productos/categorias/'), { credentials: 'include' })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error('No se pudieron obtener las categorías')
  return data
}

export async function createCategoria(body) {
  const res = await fetch(getApiUrl('/api/productos/categorias/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo crear la categoría')
  return data
}

export async function updateCategoria(body) {
  const res = await fetch(getApiUrl('/api/productos/categorias/'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo actualizar la categoría')
  return data
}

export async function deleteCategoria(id) {
  const res = await fetch(getApiUrl(`/api/productos/categorias/?id=${encodeURIComponent(id)}`), {
    method: 'DELETE',
    credentials: 'include'
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo eliminar la categoría')
  return data
}


