import { useState } from 'react'
import { procesarPago } from '../api/pagos.js'
import './PagoOnline.css'

export default function PagoOnline({ isOpen, onClose, venta, onPagoExitoso }) {
  const [form, setForm] = useState({
    numero_tarjeta: '',
    fecha_vencimiento: '',
    cvv: '',
    nombre_titular: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pagoData, setPagoData] = useState(null)

  if (!isOpen || !venta) return null

  function handleChange(e) {
    const { name, value } = e.target
    let formattedValue = value

    // Formatear número de tarjeta (agregar espacios cada 4 dígitos)
    if (name === 'numero_tarjeta') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
      if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19)
    }
    
    // Formatear fecha de vencimiento (MM/YY)
    if (name === 'fecha_vencimiento') {
      formattedValue = value.replace(/\D/g, '')
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4)
      }
      if (formattedValue.length > 5) formattedValue = formattedValue.slice(0, 5)
    }
    
    // CVV solo números, máximo 4 dígitos
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4)
    }

    setForm(prev => ({ ...prev, [name]: formattedValue }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validaciones
      const numeroTarjeta = form.numero_tarjeta.replace(/\s/g, '')
      if (numeroTarjeta.length < 13) {
        throw new Error('Número de tarjeta inválido')
      }

      if (!form.fecha_vencimiento || form.fecha_vencimiento.length < 5) {
        throw new Error('Fecha de vencimiento inválida')
      }

      if (!form.cvv || form.cvv.length < 3) {
        throw new Error('CVV inválido')
      }

      if (!form.nombre_titular.trim()) {
        throw new Error('Nombre del titular requerido')
      }

      const result = await procesarPago({
        venta_id: venta.id,
        numero_tarjeta: numeroTarjeta,
        fecha_vencimiento: form.fecha_vencimiento,
        cvv: form.cvv,
        nombre_titular: form.nombre_titular
      })

      setPagoData(result.pago)
      setSuccess(true)
      
      if (onPagoExitoso) {
        onPagoExitoso(result)
      }
    } catch (err) {
      setError(err.message || 'Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pago-modal-overlay" onClick={onClose}>
      <div className="pago-modal" onClick={e => e.stopPropagation()}>
        <div className="pago-modal-header">
          <h2>Pago en Línea</h2>
          <button className="pago-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="pago-modal-body">
          {success && pagoData ? (
            <div className="pago-success">
              <div className="pago-success-icon">✓</div>
              <h3>Pago Procesado Exitosamente</h3>
              <div className="pago-success-details">
                <p><strong>Referencia:</strong> {pagoData.referencia}</p>
                <p><strong>Monto:</strong> Bs. {pagoData.monto.toFixed(2)}</p>
                <p><strong>Estado:</strong> {pagoData.estado}</p>
                <p><strong>Tarjeta:</strong> **** **** **** {pagoData.ultimos_4_digitos}</p>
              </div>
              <button className="pago-success-button" onClick={onClose}>
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <div className="pago-venta-info">
                <p><strong>Venta #</strong> {venta.id}</p>
                <p><strong>Total a Pagar:</strong> Bs. {venta.total.toFixed(2)}</p>
              </div>

              {error && (
                <div className="pago-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="pago-form">
                <div className="pago-form-group">
                  <label>Número de Tarjeta</label>
                  <input
                    type="text"
                    name="numero_tarjeta"
                    value={form.numero_tarjeta}
                    onChange={handleChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    required
                  />
                </div>

                <div className="pago-form-row">
                  <div className="pago-form-group">
                    <label>Fecha de Vencimiento</label>
                    <input
                      type="text"
                      name="fecha_vencimiento"
                      value={form.fecha_vencimiento}
                      onChange={handleChange}
                      placeholder="MM/YY"
                      maxLength="5"
                      required
                    />
                  </div>

                  <div className="pago-form-group">
                    <label>CVV</label>
                    <input
                      type="text"
                      name="cvv"
                      value={form.cvv}
                      onChange={handleChange}
                      placeholder="123"
                      maxLength="4"
                      required
                    />
                  </div>
                </div>

                <div className="pago-form-group">
                  <label>Nombre del Titular</label>
                  <input
                    type="text"
                    name="nombre_titular"
                    value={form.nombre_titular}
                    onChange={handleChange}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>

                <div className="pago-form-actions">
                  <button type="button" onClick={onClose} disabled={loading}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading}>
                    {loading ? 'Procesando...' : 'Procesar Pago'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


