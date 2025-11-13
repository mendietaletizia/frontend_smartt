import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle, AlertCircle, 
  Info, ShoppingBag, Package, 
  X, Filter, Search, Clock, Eye,
  Tag, Gift
} from 'lucide-react';
import { 
  obtenerNotificaciones, 
  marcarNotificacionLeida, 
  eliminarNotificacion,
  marcarTodasLeidas 
} from '../api/notificaciones.js';
import './NotificacionesCliente.css';

export default function NotificacionesCliente() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarNotificaciones();
    // Recargar notificaciones cada 30 segundos
    const interval = setInterval(() => {
      cargarNotificaciones();
    }, 30000);
    return () => clearInterval(interval);
  }, [filtroTipo]);

  async function cargarNotificaciones() {
    try {
      setLoading(true);
      const filtros = {
        tipo: filtroTipo !== 'todas' ? filtroTipo : undefined,
        limite: 100
      };
      const data = await obtenerNotificaciones(filtros);
      if (data.success) {
        const notificacionesMapeadas = data.notificaciones.map(notif => ({
          id: notif.id,
          tipo: notif.tipo,
          titulo: notif.titulo,
          mensaje: notif.mensaje,
          fecha: new Date(notif.fecha),
          leida: notif.leida,
          prioridad: notif.prioridad,
          icono: getIconoPorTipo(notif.tipo),
          color: getColorPorTipo(notif.tipo)
        }));
        setNotificaciones(notificacionesMapeadas);
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
      setNotificaciones([]);
    } finally {
      setLoading(false);
    }
  }

  async function marcarComoLeida(id) {
    try {
      await marcarNotificacionLeida(id, true);
      setNotificaciones(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, leida: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marcando notificación como leída:', err);
      alert('Error al marcar notificación como leída');
    }
  }

  async function marcarTodasComoLeidas() {
    try {
      await marcarTodasLeidas();
      setNotificaciones(prev => 
        prev.map(notif => ({ ...notif, leida: true }))
      );
    } catch (err) {
      console.error('Error marcando todas las notificaciones:', err);
      alert('Error al marcar todas las notificaciones');
    }
  }

  async function eliminarNotificacionHandler(id) {
    try {
      await eliminarNotificacion(id);
      setNotificaciones(prev => prev.filter(notif => notif.id !== id));
    } catch (err) {
      console.error('Error eliminando notificación:', err);
      alert('Error al eliminar notificación');
    }
  }

  function getIconoPorTipo(tipo) {
    const iconos = {
      venta: ShoppingBag,
      stock: Package,
      producto: Package,
      pedido: CheckCircle,
      info: Info,
      alerta: AlertCircle,
      cupon: Gift,
      oferta: Tag
    };
    return iconos[tipo] || Info;
  }

  function getColorPorTipo(tipo) {
    const colores = {
      venta: '#10B981',
      stock: '#F59E0B',
      producto: '#0066FF',
      pedido: '#10B981',
      info: '#6B7280',
      alerta: '#EF4444',
      cupon: '#EC4899',
      oferta: '#8B5CF6'
    };
    return colores[tipo] || '#6B7280';
  }

  function formatearFecha(fecha) {
    const ahora = new Date();
    const diff = ahora - fecha;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    return fecha.toLocaleDateString('es-BO');
  }

  // Filtrar notificaciones
  const notificacionesFiltradas = notificaciones.filter(notif => {
    const coincideTipo = filtroTipo === 'todas' || notif.tipo === filtroTipo;
    const coincideBusqueda = busqueda === '' || 
      notif.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      notif.mensaje.toLowerCase().includes(busqueda.toLowerCase());
    return coincideTipo && coincideBusqueda;
  });

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="notificaciones-cliente-container">
      {/* Header */}
      <div className="notificaciones-cliente-header">
        <div>
          <h1 className="notificaciones-cliente-title">
            <Bell className="title-icon" />
            Mis Notificaciones
          </h1>
          <p className="notificaciones-cliente-subtitle">
            Revisa tus notificaciones y cupones de descuento
          </p>
        </div>
        <div className="header-acciones">
          {noLeidas > 0 && (
            <button
              onClick={marcarTodasComoLeidas}
              className="btn-secundario"
            >
              <CheckCircle size={18} /> Marcar todas como leídas ({noLeidas})
            </button>
          )}
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="notificaciones-cliente-filtros">
        <div className="filtro-busqueda">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar notificaciones..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-busqueda"
          />
        </div>
        
        <div className="filtro-tipos">
          <Filter className="filter-icon" />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="select-filtro"
          >
            <option value="todas">Todas</option>
            <option value="cupon">Cupones</option>
            <option value="oferta">Ofertas</option>
            <option value="venta">Ventas</option>
            <option value="pedido">Pedidos</option>
            <option value="info">Información</option>
            <option value="alerta">Alertas</option>
          </select>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="notificaciones-cliente-lista">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando notificaciones...</p>
          </div>
        ) : notificacionesFiltradas.length === 0 ? (
          <div className="empty-state">
            <Bell className="empty-icon" />
            <h3>No hay notificaciones</h3>
            <p>No se encontraron notificaciones con los filtros seleccionados</p>
          </div>
        ) : (
          notificacionesFiltradas.map(notif => {
            const Icono = notif.icono;
            return (
              <div
                key={notif.id}
                className={`notificacion-cliente-item ${notif.leida ? 'leida' : 'no-leida'} prioridad-${notif.prioridad}`}
              >
                <div className="notificacion-cliente-icono" style={{ backgroundColor: `${notif.color}20`, color: notif.color }}>
                  <Icono size={24} />
                </div>
                
                <div className="notificacion-cliente-contenido">
                  <div className="notificacion-cliente-header">
                    <h3 className="notificacion-cliente-titulo">{notif.titulo}</h3>
                    <div className="notificacion-cliente-badges">
                      <span className={`badge-prioridad ${notif.prioridad}`}>
                        {notif.prioridad}
                      </span>
                    </div>
                  </div>
                  <p className="notificacion-cliente-mensaje">{notif.mensaje}</p>
                  <div className="notificacion-cliente-footer">
                    <span className="notificacion-cliente-fecha">
                      <Clock size={14} /> {formatearFecha(notif.fecha)}
                    </span>
                    <div className="notificacion-cliente-acciones">
                      {!notif.leida && (
                        <button
                          onClick={() => marcarComoLeida(notif.id)}
                          className="btn-accion"
                          title="Marcar como leída"
                          type="button"
                        >
                          <Eye size={18} color="currentColor" />
                        </button>
                      )}
                      <button
                        onClick={() => eliminarNotificacionHandler(notif.id)}
                        className="btn-accion btn-eliminar"
                        title="Eliminar"
                        type="button"
                      >
                        <X size={18} color="currentColor" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

