// API para gestión del carrito de compras

import { getApiUrl } from '../config/api.js'

function buildQuery(params) {
  const q = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) q.append(k, v)
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export async function getCarrito() {
  const res = await fetch(getApiUrl('/api/ventas/carrito/'), { 
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo obtener el carrito')
  return data.data
}

export async function addToCarrito(productoId, cantidad = 1) {
  const res = await fetch(getApiUrl('/api/ventas/carrito/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ producto_id: productoId, cantidad })
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo agregar al carrito')
  return data
}

export async function updateItemCarrito(itemId, cantidad) {
  const res = await fetch(getApiUrl('/api/ventas/carrito/'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ item_id: itemId, cantidad })
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo actualizar el carrito')
  return data
}

export async function removeFromCarrito(itemId) {
  const query = buildQuery({ item_id: itemId })
  const url = query ? `/api/ventas/carrito/${query}` : '/api/ventas/carrito/'
  const res = await fetch(getApiUrl(url), {
    method: 'DELETE',
    credentials: 'include'
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo eliminar del carrito')
  return data
}

// CU9: Funciones de gestión avanzada del carrito
export async function clearCarrito() {
  const res = await fetch(getApiUrl('/api/ventas/carrito/management/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action: 'clear' })
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo limpiar el carrito')
  return data
}

export async function mergeCarritos(carritoOrigenId) {
  const res = await fetch(getApiUrl('/api/ventas/carrito/management/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action: 'merge', carrito_origen_id: carritoOrigenId })
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo fusionar el carrito')
  return data
}

export async function saveForLater(itemId) {
  const res = await fetch(getApiUrl('/api/ventas/carrito/management/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action: 'save_for_later', item_id: itemId })
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo guardar para más tarde')
  return data
}

export async function applyDiscount(codigoDescuento, totalCarrito = 0) {
  // Primero validar el cupón
  try {
    const { validarCupon } = await import('./ofertas.js');
    const validacion = await validarCupon(codigoDescuento, totalCarrito);
    
    if (!validacion.success) {
      throw new Error(validacion.message || 'Cupón no válido');
    }
    
    // Si el cupón es válido, aplicarlo al carrito
    const res = await fetch(getApiUrl('/api/ventas/carrito/management/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'apply_discount', codigo_descuento: codigoDescuento })
    })
    const data = await res.json().catch(() => ({ success: false }))
    if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo aplicar el descuento')
    return data
  } catch (error) {
    throw error;
  }
}

// CU10: Funciones de checkout
export async function realizarCompra(datosCompra) {
  const res = await fetch(getApiUrl('/api/ventas/checkout/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(datosCompra)
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'Error al realizar compra')
  return data
}
