import { useEffect, useState } from 'react'
import { getCarrito, updateItemCarrito, removeFromCarrito, clearCarrito, saveForLater, applyDiscount } from '../api/carrito.js'
import Checkout from './Checkout.jsx'
import './Carrito.css'

export default function Carrito({ isOpen, onClose, onCartUpdate }) {
  const [carrito, setCarrito] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDiscountForm, setShowDiscountForm] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  
  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])
  
  // Determinar si necesita scroll (más de 2 productos)
  const needsScroll = carrito && carrito.items && carrito.items.length > 2

  async function loadCarrito() {
    try {
      setLoading(true)
      setError('')
      const data = await getCarrito()
      setCarrito(data)
      // Notificar actualización del carrito al componente padre
      if (onCartUpdate) {
        onCartUpdate()
      }
    } catch (e) {
      setError('Error al cargar carrito: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadCarrito()
    }
  }, [isOpen])

  async function handleUpdateQuantity(itemId, newQuantity) {
    try {
      setLoading(true)
      await updateItemCarrito(itemId, newQuantity)
      await loadCarrito()
    } catch (e) {
      setError('Error al actualizar cantidad: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveItem(itemId) {
    try {
      setLoading(true)
      await removeFromCarrito(itemId)
      await loadCarrito()
    } catch (e) {
      setError('Error al eliminar producto: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // CU9: Funciones de gestión avanzada
  async function handleClearCarrito() {
    if (!confirm('¿Estás seguro de que quieres limpiar todo el carrito?')) return
    
    try {
      setLoading(true)
      await clearCarrito()
      await loadCarrito()
    } catch (e) {
      setError('Error al limpiar carrito: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveForLater(itemId) {
    try {
      setLoading(true)
      await saveForLater(itemId)
      await loadCarrito()
    } catch (e) {
      setError('Error al guardar para más tarde: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleApplyDiscount() {
    if (!discountCode.trim()) {
      setError('Por favor ingresa un código de descuento')
      return
    }
    
    try {
      setLoading(true)
      const totalCarrito = carrito?.total_precio || 0
      await applyDiscount(discountCode.trim().toUpperCase(), totalCarrito)
      setDiscountCode('')
      setShowDiscountForm(false)
      await loadCarrito()
    } catch (e) {
      setError('Error al aplicar descuento: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div 
        className="carrito-overlay animate-fade-in" 
        onClick={onClose}
      >
        <div 
          className="carrito-panel animate-scale-in" 
          onClick={e => e.stopPropagation()}
        >
        <div className="carrito-header">
          <h2>Mi Carrito</h2>
          <button onClick={onClose} className="close-btn" aria-label="Cerrar carrito">✕</button>
        </div>

        {loading && <div className="loading">Cargando carrito...</div>}
        {error && (
          <div className="error-container">
            <div className="error">{error}</div>
          </div>
        )}

        {carrito && (
          <>
            <div className="carrito-summary">
              <div className="summary-item">
                <span>Total de productos</span>
                <span className="total-items">{carrito.total_items} {carrito.total_items === 1 ? 'item' : 'items'}</span>
              </div>
              <div className="summary-item">
                <span>Total a pagar</span>
                <span className="total-price">Bs. {carrito.total_precio.toFixed(2)}</span>
              </div>
            </div>

            <div className={`carrito-items ${!needsScroll ? 'no-scroll' : ''}`}>
              {carrito.items.length === 0 ? (
                <div className="empty-cart">
                  <p>Tu carrito está vacío</p>
                  <p>¡Agrega algunos productos!</p>
                </div>
              ) : (
                carrito.items.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="cart-item animate-slide-in-right"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="item-image">
                      {item.producto_imagen ? (
                        <img src={item.producto_imagen} alt={item.producto_nombre} />
                      ) : (
                        <div className="placeholder-image">📦</div>
                      )}
                    </div>
                    
                    <div className="item-details">
                      <h4>{item.producto_nombre}</h4>
                      <p className="item-price">Bs. {item.precio_unitario.toFixed(2)} c/u</p>
                    </div>
                    
                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                          disabled={loading || item.cantidad <= 1}
                          className="qty-btn hover-lift"
                          aria-label="Reducir cantidad"
                        >
                          −
                        </button>
                        <span className="quantity animate-scale-in">
                          {item.cantidad}
                        </span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                          disabled={loading}
                          className="qty-btn hover-lift"
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <div className="item-subtotal">
                      Bs. {item.subtotal.toFixed(2)}
                    </div>
                    
                    <div className="item-actions">
                      <button 
                        onClick={() => handleSaveForLater(item.id)}
                        disabled={loading}
                        className="save-btn hover-lift"
                        title="Guardar para más tarde"
                        aria-label="Guardar para más tarde"
                      >
                        💾
                      </button>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={loading}
                        className="remove-btn hover-lift"
                        title="Eliminar del carrito"
                        aria-label="Eliminar del carrito"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {carrito.items.length > 0 && (
              <>
                {/* CU9: Sección de gestión avanzada */}
                <div className="carrito-management">
                  <h4>Opciones del Carrito</h4>
                  
                  <div className="management-actions">
                    <button 
                      onClick={() => setShowDiscountForm(!showDiscountForm)}
                      className="btn-secondary"
                    >
                      <span>🎟️</span>
                      <span>Aplicar Descuento</span>
                    </button>
                    
                    <button 
                      onClick={handleClearCarrito}
                      disabled={loading}
                      className="btn-danger"
                    >
                      <span>🗑️</span>
                      <span>Limpiar Carrito</span>
                    </button>
                  </div>

                  {showDiscountForm && (
                    <div className="discount-form">
                      <div className="form-group">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          placeholder="Código de descuento (ej: DESCUENTO10)"
                          className="form-input"
                        />
                        <button 
                          onClick={handleApplyDiscount}
                          disabled={loading}
                          className="btn-primary"
                        >
                          Aplicar
                        </button>
                      </div>
                      <p className="discount-info">
                        Ingresa el código del cupón que recibiste por notificación
                      </p>
                    </div>
                  )}
                </div>

                <div className="carrito-footer animate-slide-up">
                  <button 
                    className="btn-primary btn-large hover-lift"
                    onClick={() => setShowCheckout(true)}
                  >
                    <span>🛒</span>
                    <span>Proceder al Checkout</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}
        </div>
      </div>

      {/* Modal de Checkout */}
      <Checkout 
        isOpen={showCheckout}
        onClose={() => {
          setShowCheckout(false)
          // Recargar carrito cuando se cierra el checkout (por si se completó una compra)
          if (isOpen) {
            loadCarrito()
          }
        }}
        carrito={carrito}
        onCompraExitosa={(ventaData) => {
          // Recargar el carrito después de una compra exitosa
          // El checkout se encargará de mostrar la confirmación y cerrarse cuando el usuario lo desee
          loadCarrito()
        }}
        onCloseCarrito={() => {
          // Cerrar también el carrito cuando se cierra la confirmación de compra
          setShowCheckout(false)
          onClose()
        }}
      />
    </>
  )
}
