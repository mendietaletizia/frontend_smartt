import { useState, useEffect, useRef } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { createPaymentIntent, verifyPaymentIntent } from '../api/stripe.js'
import './StripePaymentForm.css'

// Variable global para almacenar la instancia de Stripe
let stripeInstance = null
let stripeLoading = false

// Función para obtener la clave pública de Stripe desde el backend
async function getStripePublishableKey() {
  try {
    const res = await fetch('/api/ventas/stripe/publishable-key/', {
      credentials: 'include'
    })
    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`)
    }
    const data = await res.json()
    if (!data.success || !data.publishable_key) {
      throw new Error('No se recibió la clave pública de Stripe')
    }
    return data.publishable_key
  } catch (err) {
    console.error('Error al obtener clave pública de Stripe:', err)
    throw err
  }
}

// Función para inicializar Stripe
async function initializeStripe() {
  if (stripeInstance) {
    return stripeInstance
  }
  
  if (stripeLoading) {
    // Esperar a que termine la carga
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (stripeInstance) {
          clearInterval(checkInterval)
          resolve(stripeInstance)
        } else if (!stripeLoading) {
          clearInterval(checkInterval)
          reject(new Error('Error al cargar Stripe'))
        }
      }, 100)
      
      setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error('Timeout al cargar Stripe'))
      }, 10000)
    })
  }
  
  stripeLoading = true
  try {
    const publishableKey = await getStripePublishableKey()
    if (!publishableKey || publishableKey.trim() === '') {
      throw new Error('La clave pública de Stripe está vacía')
    }
    stripeInstance = await loadStripe(publishableKey)
    stripeLoading = false
    return stripeInstance
  } catch (err) {
    stripeLoading = false
    stripeInstance = null
    throw err
  }
}

export default function StripePaymentForm({ direccionEntrega, notas, total, onSuccess, onError, onCancel }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clientSecret, setClientSecret] = useState(null)
  const [paymentIntentId, setPaymentIntentId] = useState(null)
  const [stripeReady, setStripeReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const elementsRef = useRef(null)
  const stripeRef = useRef(null)
  const paymentElementRef = useRef(null)
  const containerRef = useRef(null)
  const mountedRef = useRef(false)
  const mountingRef = useRef(false)

  // Inicializar Stripe y crear Payment Intent
  useEffect(() => {
    let isMounted = true
    let cancelled = false
    
    async function setup() {
      try {
        setLoading(true)
        setError('')
        
        // Validar dirección
        if (!direccionEntrega || !direccionEntrega.trim()) {
          if (isMounted && !cancelled) {
            setError('La dirección de entrega es requerida')
            setLoading(false)
          }
          return
        }
        
        // Inicializar Stripe
        const stripe = await initializeStripe()
        if (cancelled || !isMounted) return
        
        stripeRef.current = stripe
        
        // Crear Payment Intent
        const result = await createPaymentIntent({
          direccion_entrega: direccionEntrega,
          notas: notas || ''
        })
        
        if (cancelled || !isMounted) return
        
        if (result && result.client_secret) {
          setClientSecret(result.client_secret)
          setPaymentIntentId(result.payment_intent_id)
          
          // Crear Elements con el clientSecret
          const elements = stripe.elements({
            clientSecret: result.client_secret,
            appearance: {
              theme: 'stripe',
            },
          })
          
          elementsRef.current = elements
          
          // Crear PaymentElement solo con tarjetas (sin Amazon Pay, Link, Cash App Pay)
          const paymentElement = elements.create('payment', {
            wallets: {
              applePay: 'never',
              googlePay: 'never',
            },
            paymentMethodTypes: ['card'],  // Solo tarjetas de crédito/débito
          })
          paymentElementRef.current = paymentElement
          
          // No establecer loading en false todavía, esperar a que se monte
        } else {
          throw new Error('No se recibió el client_secret del servidor')
        }
      } catch (err) {
        console.error('Error al inicializar Stripe:', err)
        if (isMounted && !cancelled) {
          setError(err.message || 'Error al inicializar el pago')
          setLoading(false)
          onError?.(err)
        }
      }
    }
    
    setup()
    
    return () => {
      cancelled = true
      isMounted = false
      // Limpiar elementos
      if (paymentElementRef.current) {
        try {
          paymentElementRef.current.unmount()
          paymentElementRef.current = null
        } catch (e) {
          console.error('Error al desmontar PaymentElement:', e)
        }
      }
      if (elementsRef.current) {
        elementsRef.current = null
      }
    }
  }, [direccionEntrega, notas, onError])

  // Callback ref para guardar la referencia del contenedor
  const containerCallbackRef = (node) => {
    containerRef.current = node
  }

  // Montar el PaymentElement cuando tanto el contenedor como el PaymentElement estén disponibles
  useEffect(() => {
    if (!clientSecret || !paymentElementRef.current || stripeReady || mountedRef.current || mountingRef.current) {
      return
    }

    const container = containerRef.current
    if (!container) {
      // El contenedor aún no está disponible, reintentar después de un pequeño delay
      const timeoutId = setTimeout(() => {
        if (containerRef.current && paymentElementRef.current && !mountedRef.current) {
          const containerNode = containerRef.current
          if (containerNode.isConnected) {
            mountingRef.current = true
            try {
              paymentElementRef.current.mount(containerNode)
              mountedRef.current = true
              setStripeReady(true)
              setLoading(false)
            } catch (mountError) {
              console.error('Error al montar PaymentElement:', mountError)
              setError('Error al cargar el formulario de pago: ' + mountError.message)
              setLoading(false)
              mountingRef.current = false
            }
          }
        }
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }

    // Verificar que el contenedor esté en el DOM
    if (!container.isConnected) {
      return
    }

    mountingRef.current = true
    
    try {
      paymentElementRef.current.mount(container)
      mountedRef.current = true
      setStripeReady(true)
      setLoading(false)
    } catch (mountError) {
      console.error('Error al montar PaymentElement:', mountError)
      setError('Error al cargar el formulario de pago: ' + mountError.message)
      setLoading(false)
      mountingRef.current = false
    }
  }, [clientSecret, stripeReady])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripeRef.current || !elementsRef.current || !clientSecret) {
      setError('El sistema de pago no está listo. Por favor, espera un momento.')
      return
    }

    setProcessing(true)
    setError('')

    try {
      // PASO 1: Llamar elements.submit() primero para validar el formulario
      // Esto es requerido por Stripe antes de confirmar el pago
      const { error: submitError } = await elementsRef.current.submit()
      
      if (submitError) {
        setError(submitError.message || 'Error al validar los datos del formulario')
        setProcessing(false)
        return
      }

      // PASO 2: Confirmar el pago después de que elements.submit() haya completado exitosamente
      const { error: confirmError, paymentIntent } = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        clientSecret,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required'
      })

      if (confirmError) {
        setError(confirmError.message || 'Error al procesar el pago')
        setProcessing(false)
        return
      }

      // PASO 3: Verificar el estado del pago en el backend
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const verifyResult = await verifyPaymentIntent(paymentIntent.id)
        
        if (verifyResult.success) {
          onSuccess?.(verifyResult)
        } else {
          setError(verifyResult.message || 'Error al verificar el pago')
          setProcessing(false)
        }
      } else {
        setError(`El pago está en estado: ${paymentIntent?.status || 'desconocido'}`)
        setProcessing(false)
      }
    } catch (err) {
      console.error('Error al procesar pago:', err)
      setError(err.message || 'Error al procesar el pago')
      setProcessing(false)
      onError?.(err)
    }
  }

  // Mostrar error si no se pudo inicializar
  if (error && !clientSecret) {
    return (
      <div className="stripe-error">
        <span className="error-icon">⚠️</span>
        <span>{error}</span>
        <button 
          type="button"
          onClick={() => {
            setError('')
            onCancel?.()
          }}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <div className="stripe-payment-info">
        <p className="stripe-total">Total a pagar: <strong>Bs. {total.toFixed(2)}</strong></p>
        <p className="stripe-secure">🔒 Pago seguro procesado por Stripe</p>
      </div>

      <div className="stripe-payment-element-wrapper">
        <div 
          ref={containerCallbackRef}
          id="stripe-payment-element"
          style={{ 
            minHeight: '200px',
            position: 'relative',
            zIndex: 1
          }}
        ></div>
        {(!stripeReady || loading) && (
          <div 
            className="stripe-loading-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              zIndex: 2,
              borderRadius: '8px'
            }}
          >
            <div className="spinner"></div>
            <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>
              {loading ? 'Inicializando pago seguro...' : 'Cargando formulario de pago...'}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="stripe-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="stripe-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-stripe-cancel"
          disabled={processing || loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-stripe-submit"
          disabled={processing || loading || !stripeReady}
        >
          {processing ? (
            <>
              <span className="spinner-small"></span>
              <span>Procesando pago...</span>
            </>
          ) : (
            <>
              <span>💳</span>
              <span>Pagar Bs. {total.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
