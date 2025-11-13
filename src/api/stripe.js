// API para integración con Stripe Payment Intents (pago en la misma página)

import { getApiUrl } from '../config/api.js'

/**
 * Crear un PaymentIntent de Stripe
 * @param {Object} data - Datos del pago
 * @param {string} data.direccion_entrega - Dirección de entrega
 * @param {string} data.notas - Notas adicionales (opcional)
 * @returns {Promise<Object>} - Datos del PaymentIntent con client_secret
 */
export async function createPaymentIntent(data) {
  try {
    const res = await fetch(getApiUrl('/api/ventas/stripe/create-payment-intent/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `Error HTTP: ${res.status}`)
    }
    
    const result = await res.json()
    
    if (!result.success) {
      throw new Error(result.message || 'Error al crear sesión de pago')
    }
    
    if (!result.client_secret) {
      throw new Error('No se recibió client_secret del servidor')
    }
    
    return result
  } catch (err) {
    console.error('Error en createPaymentIntent:', err)
    throw err
  }
}

/**
 * Verificar el estado de un PaymentIntent
 * @param {string} paymentIntentId - ID del PaymentIntent de Stripe
 * @returns {Promise<Object>} - Estado del pago
 */
export async function verifyPaymentIntent(paymentIntentId) {
  const res = await fetch(getApiUrl('/api/ventas/stripe/verify-payment-intent/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ payment_intent_id: paymentIntentId })
  })
  const result = await res.json().catch(() => ({ success: false }))
  if (!res.ok) {
    throw new Error(result.message || 'Error al verificar el pago')
  }
  return result
}
