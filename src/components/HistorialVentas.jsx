import React, { useState, useEffect } from 'react'
import { obtenerHistorialVentas, obtenerOpcionesFiltros } from '../api/historial.js'
import { descargarComprobantePDF } from '../api/comprobantes.js'
import './HistorialVentas.css'

export default function HistorialVentas() {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    estado: '',
    metodo_pago: '',
    cliente_id: '',
    producto_id: '',
    producto_nombre: '',
    categoria_id: '',
    page: 1,
    page_size: 20
  })
  const [paginacion, setPaginacion] = useState(null)
  const [estadisticas, setEstadisticas] = useState(null)
  const [opcionesFiltros, setOpcionesFiltros] = useState({
    clientes: [],
    productos: [],
    categorias: [],
    metodos_pago: [],
    estados: [],
    is_admin: false
  })
  const [ventaExpandida, setVentaExpandida] = useState(null) // ID de la venta expandida

  // Cargar opciones de filtros al montar
  useEffect(() => {
    cargarOpcionesFiltros()
  }, [])

  // Cargar historial cuando cambian los filtros
  useEffect(() => {
    cargarHistorial()
  }, [filtros])

  async function cargarOpcionesFiltros() {
    try {
      const data = await obtenerOpcionesFiltros()
      setOpcionesFiltros({
        clientes: data.clientes || [],
        productos: data.productos || [],
        categorias: data.categorias || [],
        metodos_pago: data.metodos_pago || [],
        estados: data.estados || [],
        is_admin: data.is_admin || false
      })
    } catch (err) {
      console.error('Error al cargar opciones de filtros:', err)
    }
  }

  async function cargarHistorial() {
    setLoading(true)
    setError('')
    try {
      const data = await obtenerHistorialVentas(filtros)
      setVentas(data.ventas || [])
      setPaginacion(data.paginacion)
      setEstadisticas(data.estadisticas)
    } catch (err) {
      setError(err.message || 'Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }

  function handleFiltroChange(e) {
    const { name, value } = e.target
    setFiltros(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Resetear a primera página
    }))
  }

  function limpiarFiltros() {
    setFiltros({
      fecha_desde: '',
      fecha_hasta: '',
      estado: '',
      metodo_pago: '',
      cliente_id: '',
      producto_id: '',
      producto_nombre: '',
      categoria_id: '',
      page: 1,
      page_size: 20
    })
  }

  function cambiarPagina(page) {
    setFiltros(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleVentaExpandida(ventaId) {
    setVentaExpandida(ventaId === ventaExpandida ? null : ventaId)
  }

  function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO)
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getMetodoPagoLabel(metodo) {
    const metodoObj = opcionesFiltros.metodos_pago.find(m => m.value === metodo)
    return metodoObj ? metodoObj.label : metodo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="historial-container">
      <div className="historial-header">
        <h1>{opcionesFiltros.is_admin ? 'Historial de Ventas' : 'Mis Compras'}</h1>
        {opcionesFiltros.is_admin && (
          <div className="historial-badge admin-badge">👤 Administrador</div>
        )}
        {!opcionesFiltros.is_admin && (
          <div className="historial-badge cliente-badge">👤 Cliente</div>
        )}
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="historial-stats">
          <div className="stat-card">
            <div className="stat-label">Total {opcionesFiltros.is_admin ? 'Ventas' : 'Compras'}</div>
            <div className="stat-value">{estadisticas.total_ventas}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Monto Total</div>
            <div className="stat-value">Bs. {estadisticas.total_monto.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completadas</div>
            <div className="stat-value">{estadisticas.ventas_completadas}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pendientes</div>
            <div className="stat-value">{estadisticas.ventas_pendientes}</div>
          </div>
          {opcionesFiltros.is_admin && estadisticas.ventas_canceladas > 0 && (
            <div className="stat-card">
              <div className="stat-label">Canceladas</div>
              <div className="stat-value">{estadisticas.ventas_canceladas}</div>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="historial-filtros">
        <div className="filtros-header">
          <h3>🔍 Filtros de Búsqueda</h3>
          <button className="btn-limpiar" onClick={limpiarFiltros}>
            🗑️ Limpiar Filtros
          </button>
        </div>
        
        <div className="filtros-grid">
          <div className="filtro-group">
            <label>Fecha Desde</label>
            <input
              type="date"
              name="fecha_desde"
              value={filtros.fecha_desde}
              onChange={handleFiltroChange}
            />
          </div>
          <div className="filtro-group">
            <label>Fecha Hasta</label>
            <input
              type="date"
              name="fecha_hasta"
              value={filtros.fecha_hasta}
              onChange={handleFiltroChange}
            />
          </div>
          <div className="filtro-group">
            <label>Estado</label>
            <select
              name="estado"
              value={filtros.estado}
              onChange={handleFiltroChange}
            >
              <option value="">Todos</option>
              {opcionesFiltros.estados.map(estado => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
          <div className="filtro-group">
            <label>Método de Pago</label>
            <select
              name="metodo_pago"
              value={filtros.metodo_pago}
              onChange={handleFiltroChange}
            >
              <option value="">Todos</option>
              {opcionesFiltros.metodos_pago.map(metodo => (
                <option key={metodo.value} value={metodo.value}>
                  {metodo.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Filtros solo para admin */}
          {opcionesFiltros.is_admin && (
            <>
              <div className="filtro-group">
                <label>Cliente</label>
                <select
                  name="cliente_id"
                  value={filtros.cliente_id}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todos los clientes</option>
                  {opcionesFiltros.clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          
          <div className="filtro-group">
            <label>Categoría</label>
            <select
              name="categoria_id"
              value={filtros.categoria_id}
              onChange={handleFiltroChange}
            >
              <option value="">Todas las categorías</option>
              {opcionesFiltros.categorias.map(categoria => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filtro-group">
            <label>Producto (Nombre)</label>
            <input
              type="text"
              name="producto_nombre"
              value={filtros.producto_nombre}
              onChange={handleFiltroChange}
              placeholder="Buscar por nombre de producto..."
            />
          </div>
          
          <div className="filtro-group">
            <label>Producto (Seleccionar)</label>
            <select
              name="producto_id"
              value={filtros.producto_id}
              onChange={handleFiltroChange}
            >
              <option value="">Todos los productos</option>
              {opcionesFiltros.productos.map(producto => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="historial-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="historial-loading">
          <div className="spinner"></div>
          <p>Cargando historial...</p>
        </div>
      )}

      {/* Tabla de Ventas */}
      {!loading && ventas.length === 0 && !error && (
        <div className="historial-empty">
          <p>📭 No se encontraron {opcionesFiltros.is_admin ? 'ventas' : 'compras'} con los filtros seleccionados.</p>
          <p className="empty-hint">Intenta ajustar los filtros o verifica que existan registros.</p>
        </div>
      )}

      {!loading && ventas.length > 0 && (
        <>
          <div className="historial-table-container">
            <table className="historial-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  {opcionesFiltros.is_admin && <th>Cliente</th>}
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Método Pago</th>
                  <th>Productos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map(venta => (
                  <React.Fragment key={venta.id}>
                    <tr 
                      className={ventaExpandida === venta.id ? 'venta-expandida' : ''}
                      onClick={() => toggleVentaExpandida(venta.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>#{venta.id}</td>
                      <td>{formatearFecha(venta.fecha)}</td>
                      {opcionesFiltros.is_admin && (
                        <td>
                          <div>
                            <div className="cliente-nombre">{venta.cliente.nombre}</div>
                            <div className="cliente-email">{venta.cliente.email}</div>
                          </div>
                        </td>
                      )}
                      <td>
                        <strong>Bs. {venta.total.toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className={`estado-badge estado-${venta.estado}`}>
                          {venta.estado}
                        </span>
                      </td>
                      <td>
                        <span className="metodo-pago">
                          {getMetodoPagoLabel(venta.metodo_pago)}
                        </span>
                      </td>
                      <td>
                        <span className="productos-count">
                          {venta.productos_count} {venta.productos_count === 1 ? 'producto' : 'productos'}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="acciones-buttons">
                          {venta.comprobante?.existe && (
                            <button
                              className="btn-descargar"
                              onClick={() => descargarComprobantePDF(venta.id)}
                              title="Descargar Comprobante"
                            >
                              📄
                            </button>
                          )}
                          {venta.pago_online?.existe && (
                            <span className="pago-badge" title={`Pago: ${venta.pago_online.estado}`}>
                              💳
                            </span>
                          )}
                          <button
                            className="btn-expandir"
                            onClick={() => toggleVentaExpandida(venta.id)}
                            title={ventaExpandida === venta.id ? 'Ocultar detalles' : 'Ver detalles'}
                          >
                            {ventaExpandida === venta.id ? '▲' : '▼'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {ventaExpandida === venta.id && (
                      <tr className="venta-detalles-row">
                        <td colSpan={opcionesFiltros.is_admin ? 8 : 7}>
                          <div className="venta-detalles">
                            <div className="detalles-section">
                              <h4>📦 Productos de la {opcionesFiltros.is_admin ? 'Venta' : 'Compra'}</h4>
                              <div className="productos-list">
                                {venta.productos.map((producto, index) => (
                                  <div key={index} className="producto-item">
                                    <div className="producto-info">
                                      <span className="producto-nombre">{producto.nombre}</span>
                                      <span className="producto-cantidad">Cantidad: {producto.cantidad}</span>
                                    </div>
                                    <div className="producto-precios">
                                      <span className="precio-unitario">Bs. {producto.precio_unitario.toFixed(2)} c/u</span>
                                      <span className="producto-subtotal">Subtotal: Bs. {producto.subtotal.toFixed(2)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {venta.direccion_entrega && (
                              <div className="detalles-section">
                                <h4>📍 Dirección de Entrega</h4>
                                <p>{venta.direccion_entrega}</p>
                              </div>
                            )}
                            {venta.comprobante?.existe && (
                              <div className="detalles-section">
                                <h4>📄 Comprobante</h4>
                                <p>
                                  <strong>Número:</strong> {venta.comprobante.numero}
                                </p>
                                <button
                                  className="btn-descargar-comprobante"
                                  onClick={() => descargarComprobantePDF(venta.id)}
                                >
                                  📥 Descargar PDF
                                </button>
                              </div>
                            )}
                            {venta.pago_online?.existe && (
                              <div className="detalles-section">
                                <h4>💳 Información de Pago</h4>
                                <p>
                                  <strong>Estado:</strong> <span className={`estado-badge estado-${venta.pago_online.estado}`}>{venta.pago_online.estado}</span>
                                </p>
                                {venta.pago_online.referencia && (
                                  <p>
                                    <strong>Referencia:</strong> {venta.pago_online.referencia}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {paginacion && paginacion.total_pages > 1 && (
            <div className="historial-paginacion">
              <button
                onClick={() => cambiarPagina(paginacion.page - 1)}
                disabled={!paginacion.has_previous}
                className="btn-pagina"
              >
                ◀ Anterior
              </button>
              <span className="paginacion-info">
                Página {paginacion.page} de {paginacion.total_pages} 
                ({paginacion.total_ventas} {paginacion.total_ventas === 1 ? 'registro' : 'registros'})
              </span>
              <button
                onClick={() => cambiarPagina(paginacion.page + 1)}
                disabled={!paginacion.has_next}
                className="btn-pagina"
              >
                Siguiente ▶
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
