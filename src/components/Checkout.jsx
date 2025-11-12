import { useState, useEffect, useRef } from 'react'
import StripePaymentForm from './StripePaymentForm.jsx'
import { descargarComprobantePDF } from '../api/comprobantes.js'
import './Checkout.css'

export default function Checkout({ isOpen, onClose, carrito, onCompraExitosa, onCloseCarrito }) {
  const [form, setForm] = useState({
    // Campos de dirección
    avenida_calle: '',
    barrio: '',
    departamento: '',
    telefono_1: '',
    telefono_2: '',
    notas: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ventaData, setVentaData] = useState(null)
  const [carritoSnapshot, setCarritoSnapshot] = useState(null) // Guardar copia del carrito
  const successBodyRef = useRef(null) // Referencia para el body de confirmación
  const [showStripeForm, setShowStripeForm] = useState(false) // Mostrar formulario de Stripe
  const [stripeData, setStripeData] = useState(null) // Datos para Stripe (dirección, etc.)
  const [comprobanteData, setComprobanteData] = useState(null) // Datos del comprobante generado

  // Limpiar estado SOLO cuando el modal se cierra completamente
  // No limpiar cuando success está activo para mantener la vista de confirmación
  useEffect(() => {
    if (!isOpen && !success) {
      setSuccess(false)
      setVentaData(null)
      setCarritoSnapshot(null)
      setError('')
      setComprobanteData(null)
      setForm({
        avenida_calle: '',
        barrio: '',
        departamento: '',
        telefono_1: '',
        telefono_2: '',
        notas: ''
      })
      setShowStripeForm(false)
      setStripeData(null)
    }
  }, [isOpen, success])

  // Hacer scroll al inicio cuando se muestra la confirmación
  useEffect(() => {
    if (success && successBodyRef.current) {
      // Pequeño delay para asegurar que el DOM esté actualizado
      setTimeout(() => {
        if (successBodyRef.current) {
          successBodyRef.current.scrollTop = 0
          // También intentar hacer scroll del modal si es necesario
          const modal = successBodyRef.current.closest('.checkout-modal')
          if (modal) {
            modal.scrollTop = 0
          }
        }
      }, 100)
    }
  }, [success])

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validar campos requeridos de dirección
      if (!form.avenida_calle.trim() || !form.barrio.trim() || !form.departamento.trim()) {
        setError('Por favor completa todos los campos obligatorios de la dirección')
        setLoading(false)
        return
      }

      // Validar al menos un teléfono
      if (!form.telefono_1.trim() && !form.telefono_2.trim()) {
        setError('Por favor ingresa al menos un número de teléfono de referencia')
        setLoading(false)
        return
      }

      // Guardar una copia completa del carrito ANTES de realizar la compra
      // Esto asegura que podamos mostrarlo en la confirmación aunque el carrito se borre después
      const carritoBackup = carrito ? {
        ...carrito,
        items: carrito.items ? [...carrito.items] : []
      } : null
      setCarritoSnapshot(carritoBackup)

      // Construir dirección completa para enviar al backend
      const telefonos = [form.telefono_1, form.telefono_2].filter(t => t.trim()).join(', ')
      const direccionCompleta = `${form.avenida_calle}, ${form.barrio}, ${form.departamento}${telefonos ? `. Teléfonos: ${telefonos}` : ''}`
      
      // Siempre usar Stripe como método de pago
      setStripeData({
        direccion_entrega: direccionCompleta,
        notas: form.notas
      })
      setShowStripeForm(true)
      setLoading(false)

    } catch (err) {
      setError(err.message)
      setCarritoSnapshot(null) // Limpiar si hay error
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    if (success) {
      // Si ya está en éxito, cerrar y limpiar estado
      setSuccess(false)
      setVentaData(null)
      setForm({
        avenida_calle: '',
        barrio: '',
        departamento: '',
        telefono_1: '',
        telefono_2: '',
        notas: ''
      })
      setShowStripeForm(false)
      setStripeData(null)
    }
    onClose()
  }

  function handleCloseSuccess() {
    setSuccess(false)
    setVentaData(null)
    setCarritoSnapshot(null)
    setComprobanteData(null)
    setForm({
      avenida_calle: '',
      barrio: '',
      departamento: '',
      telefono_1: '',
      telefono_2: '',
      notas: ''
    })
    setShowStripeForm(false)
    setStripeData(null)
    onClose()
    // Si hay una función para cerrar el carrito también, llamarla
    if (onCloseCarrito) {
      onCloseCarrito()
    }
  }

  // Usar el snapshot del carrito si está disponible (en confirmación), sino usar el carrito actual
  const carritoParaMostrar = success ? carritoSnapshot : carrito

  // Calcular totales
  const subtotal = carritoParaMostrar ? carritoParaMostrar.total_precio : 0
  const totalItems = carritoParaMostrar && carritoParaMostrar.items ? carritoParaMostrar.items.reduce((sum, item) => sum + item.cantidad, 0) : 0

  // Obtener nombre del método de pago
  const getMetodoPagoNombre = (metodo) => {
    const metodos = {
      'efectivo': '💵 Efectivo',
      'tarjeta': '💳 Tarjeta de Crédito/Débito',
      'transferencia': '🏦 Transferencia Bancaria'
    }
    return metodos[metodo] || metodo
  }

  // Renderizar vista de confirmación cuando success es true
  if (success) {
    return (
      <div className="checkout-overlay" onClick={handleCloseSuccess}>
        <div className="checkout-modal checkout-success-modal" onClick={(e) => e.stopPropagation()}>
          <div className="checkout-header checkout-success-header">
            <div className="checkout-header-content">
              <div className="checkout-success-icon-header">
                <div className="success-checkmark-small">
                  <div className="checkmark-circle-small"></div>
                  <div className="checkmark-stem-small"></div>
                  <div className="checkmark-kick-small"></div>
                </div>
              </div>
              <h2>¡Compra Confirmada!</h2>
            </div>
            <button className="checkout-close-btn" onClick={handleCloseSuccess} aria-label="Cerrar">
              ✕
            </button>
          </div>

          <div className="checkout-body checkout-success-body" ref={successBodyRef}>
            {/* Mensaje de éxito - Destacado */}
            <div className="checkout-success-message-card">
              <div className="success-icon-large">✅</div>
              <h3 className="success-title-large">¡COMPRA CONFIRMADA EXITOSAMENTE!</h3>
              <p className="success-message-text">
                Tu compra ha sido procesada exitosamente. Recibirás un correo de confirmación con los detalles de tu pedido.
              </p>
              {ventaData && (
                <div className="venta-id">
                  <span className="venta-id-label">Número de Pedido:</span>
                  <span className="venta-id-value">#{ventaData.id_venta || ventaData.id}</span>
                </div>
              )}
              {comprobanteData && (
                <div className="comprobante-info" style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '4px' }}>
                      📄 Comprobante Generado
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {comprobanteData.tipo === 'factura' ? 'Factura' : 'Comprobante'} N° {comprobanteData.numero}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => descargarComprobantePDF(ventaData.id_venta || ventaData.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#0ea5e9',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#0284c7'}
                    onMouseOut={(e) => e.target.style.background = '#0ea5e9'}
                  >
                    <span>⬇️</span>
                    <span>Descargar PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Resumen completo de productos */}
            <div className="checkout-summary-card">
              <div className="summary-header">
                <h3>Productos Comprados</h3>
                <span className="items-count">{totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}</span>
              </div>
              
              <div className="summary-items-list">
                {carritoParaMostrar && carritoParaMostrar.items && carritoParaMostrar.items.length > 0 ? (
                  carritoParaMostrar.items.map(item => (
                    <div key={item.id} className="summary-item-row">
                      <div className="summary-item-info">
                        {item.producto_imagen && (
                          <img 
                            src={item.producto_imagen} 
                            alt={item.producto_nombre}
                            className="summary-item-image"
                          />
                        )}
                        <div className="summary-item-details">
                          <span className="summary-item-name">{item.producto_nombre}</span>
                          <span className="summary-item-price">Bs. {item.precio_unitario.toFixed(2)} c/u</span>
                        </div>
                      </div>
                      <div className="summary-item-quantity">
                        <span className="qty-label">Cantidad:</span>
                        <span className="qty-value">{item.cantidad}</span>
                      </div>
                      <div className="summary-item-subtotal">
                        Bs. {item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="summary-empty">No hay productos</div>
                )}
              </div>

              <div className="summary-totals">
                <div className="total-row">
                  <span className="total-label">Subtotal</span>
                  <span className="total-value">Bs. {subtotal.toFixed(2)}</span>
                </div>
                <div className="total-row total-row-final">
                  <span className="total-label">Total Pagado</span>
                  <span className="total-value-final">Bs. {subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Información de envío y pago */}
            <div className="checkout-confirmation-details">
              <div className="confirmation-section">
                <h3 className="confirmation-section-title">
                  <span className="section-icon">💳</span>
                  Método de Pago
                </h3>
                <div className="confirmation-section-content">
                  <p className="confirmation-text">
                    {ventaData?.metodo_pago === 'stripe' ? '💳 Pago con Tarjeta (Stripe)' : getMetodoPagoNombre(form.metodo_pago)}
                  </p>
                </div>
              </div>

              <div className="confirmation-section">
                <h3 className="confirmation-section-title">
                  <span className="section-icon">📍</span>
                  Dirección de Entrega
                </h3>
                <div className="confirmation-section-content">
                  <div className="address-display">
                    {ventaData?.metodo_pago === 'stripe' && stripeData?.direccion_entrega ? (
                      // Mostrar dirección completa cuando viene de Stripe
                      <p className="confirmation-text" style={{ whiteSpace: 'pre-line' }}>
                        {stripeData.direccion_entrega}
                      </p>
                    ) : (
                      // Mostrar campos separados cuando viene del formulario normal
                      <>
                        <div className="address-line">
                          <strong>Avenida o Calle:</strong> {form.avenida_calle}
                        </div>
                        <div className="address-line">
                          <strong>Barrio:</strong> {form.barrio}
                        </div>
                        <div className="address-line">
                          <strong>Departamento:</strong> {form.departamento}
                        </div>
                        {form.telefono_1 && (
                          <div className="address-line">
                            <strong>Teléfono 1:</strong> {form.telefono_1}
                          </div>
                        )}
                        {form.telefono_2 && (
                          <div className="address-line">
                            <strong>Teléfono 2:</strong> {form.telefono_2}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {(form.notas || stripeData?.notas) && (
                <div className="confirmation-section">
                  <h3 className="confirmation-section-title">
                    <span className="section-icon">📝</span>
                    Notas Adicionales
                  </h3>
                  <div className="confirmation-section-content">
                    <p className="confirmation-text">{stripeData?.notas || form.notas}</p>
                  </div>
                </div>
              )}
              
              {/* Sección del Comprobante */}
              {comprobanteData && (
                <div className="confirmation-section">
                  <h3 className="confirmation-section-title">
                    <span className="section-icon">📄</span>
                    Comprobante de Venta
                  </h3>
                  <div className="confirmation-section-content">
                    <div style={{
                      padding: '16px',
                      background: '#f0f9ff',
                      border: '1px solid #0ea5e9',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '4px' }}>
                          📄 {comprobanteData.tipo === 'factura' ? 'Factura' : 'Comprobante'} Generada
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          N° {comprobanteData.numero}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          Fecha: {new Date(comprobanteData.fecha).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => descargarComprobantePDF(ventaData.id_venta || ventaData.id)}
                        style={{
                          padding: '10px 18px',
                          background: '#0ea5e9',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#0284c7'}
                        onMouseOut={(e) => e.target.style.background = '#0ea5e9'}
                      >
                        <span>⬇️</span>
                        <span>Descargar PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {ventaData && (
                <div className="confirmation-section">
                  <h3 className="confirmation-section-title">
                    <span className="section-icon">📅</span>
                    Fecha de Compra
                  </h3>
                  <div className="confirmation-section-content">
                    <p className="confirmation-text">
                      {new Date(ventaData.fecha).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className="confirmation-section">
                <h3 className="confirmation-section-title">
                  <span className="section-icon">📦</span>
                  Información de Entrega
                </h3>
                <div className="confirmation-section-content">
                  <div className="delivery-info">
                    <div className="delivery-info-item">
                      <span className="delivery-icon">🚚</span>
                      <span>Los productos serán enviados a la dirección proporcionada</span>
                    </div>
                    <div className="delivery-info-item">
                      <span className="delivery-icon">📧</span>
                      <span>Recibirás un correo de confirmación con los detalles del envío</span>
                    </div>
                    <div className="delivery-info-item">
                      <span className="delivery-icon">⏰</span>
                      <span>El tiempo estimado de entrega será notificado por correo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de cerrar */}
            <div className="checkout-actions checkout-success-actions">
              {ventaData && form.metodo_pago === 'tarjeta' && (
                <button 
                  type="button" 
                  onClick={() => setShowPagoOnline(true)}
                  className="btn-checkout-secondary"
                  style={{ marginRight: '10px' }}
                >
                  <span>💳</span>
                  <span>Pagar en Línea</span>
                </button>
              )}
              <button 
                type="button" 
                onClick={handleCloseSuccess}
                className="btn-checkout-primary"
              >
                <span>✅</span>
                <span>Entendido, Cerrar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-header">
          <div className="checkout-header-content">
            <div className="checkout-icon">🛒</div>
            <h2>Finalizar Compra</h2>
          </div>
          <button className="checkout-close-btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="checkout-body">
          {/* Resumen del carrito */}
          <div className="checkout-summary-card">
            <div className="summary-header">
            <h3>Resumen de tu compra</h3>
              <span className="items-count">{totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}</span>
            </div>
            
            <div className="summary-items-list">
              {carrito && carrito.items && carrito.items.length > 0 ? (
                carrito.items.map(item => (
                  <div key={item.id} className="summary-item-row">
                    <div className="summary-item-info">
                      {item.producto_imagen && (
                        <img 
                          src={item.producto_imagen} 
                          alt={item.producto_nombre}
                          className="summary-item-image"
                        />
                      )}
                      <div className="summary-item-details">
                        <span className="summary-item-name">{item.producto_nombre}</span>
                        <span className="summary-item-price">Bs. {item.precio_unitario.toFixed(2)} c/u</span>
                      </div>
                    </div>
                    <div className="summary-item-quantity">
                      <span className="qty-label">Cantidad:</span>
                      <span className="qty-value">{item.cantidad}</span>
                    </div>
                    <div className="summary-item-subtotal">
                      Bs. {item.subtotal.toFixed(2)}
                    </div>
                </div>
                ))
              ) : (
                <div className="summary-empty">No hay productos en el carrito</div>
              )}
            </div>

            <div className="summary-totals">
              <div className="total-row">
                <span className="total-label">Subtotal</span>
                <span className="total-value">Bs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row total-row-final">
                <span className="total-label">Total a pagar</span>
                <span className="total-value-final">Bs. {subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Formulario de checkout */}
          {!showStripeForm ? (
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="checkout-section">
              <h3 className="section-title">
                <span className="section-icon">💳</span>
                Pago con Tarjeta (Stripe)
              </h3>
              <p style={{ margin: '0 0 16px 0', color: '#6B7280', fontSize: '14px' }}>
                Tu pago será procesado de forma segura mediante Stripe
              </p>
            </div>

            <div className="checkout-section">
              <h3 className="section-title">
                <span className="section-icon">📍</span>
                Dirección de Entrega
              </h3>
              
              <div className="address-form-grid">
                <div className="form-group form-group-full">
                  <label className="form-label">
                    Avenida o Calle *
                  </label>
                  <input
                    type="text"
                    value={form.avenida_calle}
                    onChange={(e) => setForm({ ...form, avenida_calle: e.target.value })}
                    placeholder="Ejemplo: Avenida Principal, Calle Los Rosales, Calle 10 de Agosto"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group form-group-full">
                  <label className="form-label">
                    Barrio *
                  </label>
                  <input
                    type="text"
                    value={form.barrio}
                    onChange={(e) => setForm({ ...form, barrio: e.target.value })}
                    placeholder="Ejemplo: Barrio Norte, Barrio Centro, Zona Sur"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group form-group-full">
                  <label className="form-label">
                    Departamento *
                  </label>
                  <select
                    value={form.departamento}
                    onChange={(e) => setForm({ ...form, departamento: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="">Selecciona un departamento</option>
                    <option value="La Paz">La Paz</option>
                    <option value="Santa Cruz">Santa Cruz</option>
                    <option value="Cochabamba">Cochabamba</option>
                    <option value="Potosí">Potosí</option>
                    <option value="Oruro">Oruro</option>
                    <option value="Chuquisaca">Chuquisaca</option>
                    <option value="Tarija">Tarija</option>
                    <option value="Pando">Pando</option>
                    <option value="Beni">Beni</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Teléfono de Referencia 1 *
                  </label>
                  <input
                    type="tel"
                    value={form.telefono_1}
                    onChange={(e) => setForm({ ...form, telefono_1: e.target.value.replace(/\D/g, '') })}
                    placeholder="Ejemplo: 70123456"
                    className="form-input"
                    maxLength="10"
                    required
                    minLength="7"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Teléfono de Referencia 2
                  </label>
                  <input
                    type="tel"
                    value={form.telefono_2}
                    onChange={(e) => setForm({ ...form, telefono_2: e.target.value.replace(/\D/g, '') })}
                    placeholder="Ejemplo: 70123456 (opcional)"
                    className="form-input"
                    maxLength="10"
                  />
                </div>
              </div>
            </div>

            <div className="checkout-section">
              <h3 className="section-title">
                <span className="section-icon">📝</span>
                Notas Adicionales
              </h3>
            <div className="form-group">
                <label className="form-label">
                  Instrucciones especiales para la entrega (opcional)
                </label>
                <textarea 
                  value={form.notas} 
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Ejemplo: Entregar en horario de oficina, llamar antes de llegar, etc."
                  className="form-textarea"
                  rows="2"
                />
              </div>
            </div>

            {error && (
              <div className="checkout-error">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{error}</span>
              </div>
            )}

            <div className="checkout-actions">
              <button 
                type="submit" 
                disabled={loading || !carrito || !carrito.items || carrito.items.length === 0}
                className="btn-checkout-primary"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>💳</span>
                    <span>Continuar con el Pago</span>
                  </>
                )}
              </button>
              
              <button 
                type="button" 
                onClick={handleCancel}
                className="btn-checkout-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
          ) : (
            /* Formulario de Stripe */
            <div className="stripe-form-container">
              <StripePaymentForm
                direccionEntrega={stripeData?.direccion_entrega || ''}
                notas={stripeData?.notas || ''}
                total={subtotal}
                onSuccess={(result) => {
                  // Pago exitoso
                  setVentaData({
                    id_venta: result.venta_id,
                    total: subtotal,
                    estado: 'completada',
                    metodo_pago: 'stripe'
                  })
                  
                  // Guardar datos del comprobante si viene en la respuesta
                  if (result.comprobante) {
                    setComprobanteData(result.comprobante)
                  }
                  
                  setSuccess(true)
                  setShowStripeForm(false)
                  if (onCompraExitosa) {
                    onCompraExitosa({
                      id_venta: result.venta_id,
                      total: subtotal,
                      estado: 'completada',
                      metodo_pago: 'stripe'
                    })
                  }
                }}
                onError={(err) => {
                  setError(err.message || 'Error al procesar el pago')
                  setShowStripeForm(false)
                }}
                onCancel={() => {
                  setShowStripeForm(false)
                  setStripeData(null)
                  setError('')
                }}
              />
            </div>
          )}
        </div>
      </div>
      
    </div>
  )
}
