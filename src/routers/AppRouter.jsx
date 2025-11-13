import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AdminProducts from '../pages/AdminProducts.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'
import TiendaDashboardCSS from '../pages/TiendaDashboardCSS.jsx'
import AdminDashboard from '../pages/AdminDashboard.jsx'
import HistorialVentas from '../components/HistorialVentas.jsx'
import ReportesDinamicos from '../components/ReportesDinamicos.jsx'
import NotificacionesCliente from '../components/NotificacionesCliente.jsx'
import { obtenerHistorialVentas } from '../api/historial.js'
import { descargarComprobantePDF } from '../api/comprobantes.js'
import '../pages/TiendaDashboard.css'
import '../pages/ClienteDashboard.css'

// Componente interno que usa useNavigate
function AppRouterContent({ user, onLogin, onLogout, message, showRegister, setShowRegister, setUser }) {
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState('tienda')

  // Componente para la vista de cliente
  const ClienteDashboard = () => {
    const [ventasRecientes, setVentasRecientes] = useState([])
    const [estadisticas, setEstadisticas] = useState(null)
    const [loadingHistorial, setLoadingHistorial] = useState(true)

    // Cargar historial de compras recientes
    useEffect(() => {
      async function cargarHistorialReciente() {
        try {
          setLoadingHistorial(true)
          const data = await obtenerHistorialVentas({
            page: 1,
            page_size: 5  // Solo las 5 más recientes para mostrar en "Mi cuenta"
          })
          setVentasRecientes(data.ventas || [])
          setEstadisticas(data.estadisticas)
        } catch (err) {
          console.error('Error al cargar historial:', err)
        } finally {
          setLoadingHistorial(false)
        }
      }
      if (currentView === 'cliente') {
        cargarHistorialReciente()
      }
    }, [currentView])

    function formatearFecha(fechaISO) {
      const fecha = new Date(fechaISO)
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    function getEstadoClass(estado) {
      const estados = {
        'completada': 'cliente-history-status-completado',
        'pendiente': 'cliente-history-status-pendiente',
        'cancelada': 'cliente-history-status-pendiente'
      }
      return estados[estado] || 'cliente-history-status-pendiente'
    }

    function getEstadoLabel(estado) {
      const labels = {
        'completada': 'Completado',
        'pendiente': 'Pendiente',
        'cancelada': 'Cancelado'
      }
      return labels[estado] || estado
    }

    return (
      <div className="cliente-layout">
        <div className="cliente-header">
          <h1>Mi Cuenta</h1>
          <div className="cliente-nav">
            <button
              onClick={() => navigate('/')}
            >
              🏪 Tienda
            </button>
            <button
              className={currentView === 'cliente' ? 'active' : ''}
              onClick={() => setCurrentView('cliente')}
            >
              👤 Mi Cuenta
            </button>
            <button
              className={currentView === 'historial' ? 'active' : ''}
              onClick={() => setCurrentView('historial')}
            >
              📊 Historial
            </button>
            <button
              className={currentView === 'reportes' ? 'active' : ''}
              onClick={() => setCurrentView('reportes')}
            >
              📈 Reportes
            </button>
            <button
              className={currentView === 'notificaciones' ? 'active' : ''}
              onClick={() => setCurrentView('notificaciones')}
            >
              🔔 Notificaciones
            </button>
            <button onClick={onLogout} className="btn-logout">
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
        <div className="cliente-content">
          {currentView === 'historial' && <HistorialVentas />}
          {currentView === 'reportes' && <ReportesDinamicos user={user} />}
          {currentView === 'notificaciones' && <NotificacionesCliente />}
          {currentView === 'cliente' && (
            <>
        <h2>Panel del Cliente</h2>
        <p>Bienvenido, {user.nombre}!</p>
        <p>Aquí podrás gestionar tu perfil, ver tu historial de compras y más.</p>
        
        {/* Estadísticas del Cliente */}
        <div className="cliente-stats">
          <div className="cliente-stat-card">
            <div className="cliente-stat-icon">
              <span>🛒</span>
            </div>
            <p className="cliente-stat-title">Compras Totales</p>
            <p className="cliente-stat-value">{estadisticas?.total_ventas || 0}</p>
          </div>
          <div className="cliente-stat-card">
            <div className="cliente-stat-icon">
              <span>💰</span>
            </div>
            <p className="cliente-stat-title">Total Gastado</p>
            <p className="cliente-stat-value">Bs. {estadisticas?.total_monto?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="cliente-stat-card">
            <div className="cliente-stat-icon">
              <span>✅</span>
            </div>
            <p className="cliente-stat-title">Completadas</p>
            <p className="cliente-stat-value">{estadisticas?.ventas_completadas || 0}</p>
          </div>
          <div className="cliente-stat-card">
            <div className="cliente-stat-icon">
              <span>⏳</span>
            </div>
            <p className="cliente-stat-title">Pendientes</p>
            <p className="cliente-stat-value">{estadisticas?.ventas_pendientes || 0}</p>
          </div>
        </div>

        {/* Información del Cliente */}
        <div className="cliente-info-cards">
          <div className="cliente-info-card">
            <div className="cliente-card-header">
              <div className="cliente-card-icon">
                <span>👤</span>
              </div>
              <h3 className="cliente-card-title">Información Personal</h3>
            </div>
            <div className="cliente-card-content">
              <p><strong>Nombre:</strong> {user.nombre} {user.apellido || ''}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Teléfono:</strong> {user.telefono || 'No registrado'}</p>
              <p><strong>Estado:</strong> <span style={{ color: '#10B981', fontWeight: '600' }}>Activo</span></p>
            </div>
          </div>
        </div>

        {/* Historial de Compras */}
        <div className="cliente-purchase-history">
          <div className="cliente-history-header">
            <h3 className="cliente-history-title">Historial de Compras</h3>
            <button 
              className="cliente-history-button"
              onClick={() => setCurrentView('historial')}
            >
              <span>Ver todo</span>
              <span>→</span>
            </button>
          </div>
          <div className="cliente-table-container">
            {loadingHistorial ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                <div className="spinner" style={{
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #0066FF',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 15px'
                }}></div>
                <p>Cargando historial...</p>
              </div>
            ) : ventasRecientes.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                <p>📭 No tienes compras registradas aún.</p>
                <p style={{ fontSize: '14px', marginTop: '8px', color: '#9CA3AF' }}>
                  Realiza tu primera compra para verla aquí.
                </p>
              </div>
            ) : (
              <table className="cliente-history-table">
                <thead>
                  <tr className="cliente-history-header-row">
                    <th className="cliente-history-header-cell">Pedido</th>
                    <th className="cliente-history-header-cell">Fecha</th>
                    <th className="cliente-history-header-cell">Productos</th>
                    <th className="cliente-history-header-cell">Total</th>
                    <th className="cliente-history-header-cell">Estado</th>
                    <th className="cliente-history-header-cell">Acciones</th>
                  </tr>
                </thead>
                <tbody className="cliente-history-body">
                  {ventasRecientes.map(venta => (
                    <tr key={venta.id} className="cliente-history-row">
                      <td className="cliente-history-cell cliente-history-cell-bold">#{venta.id}</td>
                      <td className="cliente-history-cell">{formatearFecha(venta.fecha)}</td>
                      <td className="cliente-history-cell">
                        {venta.productos_count} {venta.productos_count === 1 ? 'producto' : 'productos'}
                      </td>
                      <td className="cliente-history-cell cliente-history-cell-bold">Bs. {venta.total.toFixed(2)}</td>
                      <td className="cliente-history-cell">
                        <span className={`cliente-history-status ${getEstadoClass(venta.estado)}`}>
                          {getEstadoLabel(venta.estado)}
                        </span>
                      </td>
                      <td className="cliente-history-cell">
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {venta.comprobante?.existe && (
                            <button
                              onClick={() => descargarComprobantePDF(venta.id)}
                              style={{
                                background: '#10B981',
                                color: 'white',
                                border: 'none',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.target.style.background = '#059669'}
                              onMouseOut={(e) => e.target.style.background = '#10B981'}
                              title="Descargar Comprobante"
                            >
                              📄
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
    )
  }

  return (
    <Routes>
      {/* Ruta principal - Tienda */}
      <Route 
        path="/" 
        element={
          <TiendaDashboardCSS 
            user={user}
            onShowLogin={() => {/* Mostrar modal de login */}}
            onShowRegister={() => navigate('/register')}
            onLoginSuccess={onLogin}
            onNavigateToAdmin={() => navigate('/admin')}
            onNavigateToCliente={() => navigate('/cliente')}
          />
        } 
      />
      
      {/* Ruta de registro */}
      <Route 
        path="/register" 
        element={
          <RegisterPage 
            onCancel={() => navigate('/')} 
            onSuccess={(newUser) => {
              // Auto-login realizado por backend. Reflejamos el estado en el frontend y vamos a Mi Cuenta.
              if (setUser) setUser(newUser)
              navigate('/cliente')
            }}
          />
        } 
      />
      
      {/* Ruta de administrador */}
      <Route 
        path="/admin" 
        element={
          user && user.rol === 'Administrador' ? (
            <AdminDashboard 
              user={user}
              onLogout={onLogout}
            />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      
      {/* Ruta de historial de ventas */}
      <Route 
        path="/historial" 
        element={
          user ? (
            <HistorialVentas />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      
      {/* Ruta de reportes dinámicos */}
      <Route 
        path="/reportes" 
        element={
          user ? (
            <ReportesDinamicos user={user} />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      
      {/* Ruta de cliente */}
      <Route 
        path="/cliente" 
        element={
          user && user.rol === 'Cliente' ? (
            <ClienteDashboard />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      
      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Componente principal que envuelve con BrowserRouter
export function AppRouter({ user, onLogin, onLogout, message, showRegister, setShowRegister, setUser }) {
  return (
    <BrowserRouter>
      <AppRouterContent 
        user={user} 
        onLogin={onLogin} 
        onLogout={onLogout} 
        message={message}
        showRegister={showRegister}
        setShowRegister={setShowRegister}
        setUser={setUser}
      />
    </BrowserRouter>
  )
}
