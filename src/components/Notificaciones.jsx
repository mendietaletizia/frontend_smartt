import React, { useState, useEffect } from 'react';
import { 
  Bell, Send, Plus, CheckCircle, AlertCircle, 
  Info, ShoppingBag, Package, TrendingUp, 
  X, Filter, Search, Clock, User, Eye,
  Tag, Gift, Sparkles, Brain, Calendar
} from 'lucide-react';
import { obtenerSugerenciasIA, crearOferta, obtenerOfertas } from '../api/ofertas.js';
import { crearCupon, obtenerCupones } from '../api/ofertas.js';
import { 
  obtenerNotificaciones, 
  crearNotificacion, 
  marcarNotificacionLeida, 
  eliminarNotificacion,
  marcarTodasLeidas 
} from '../api/notificaciones.js';
import OfertasCupones from './OfertasCupones.jsx';
import './Notificaciones.css';

export default function Notificaciones({ user }) {
  const [activeTab, setActiveTab] = useState('notificaciones'); // 'notificaciones', 'ofertas', 'cupones'
  
  // Estados para notificaciones
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  
  // Estados para ofertas
  const [ofertas, setOfertas] = useState([]);
  const [sugerenciasIA, setSugerenciasIA] = useState([]);
  const [mostrarFormOferta, setMostrarFormOferta] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [formOferta, setFormOferta] = useState({
    nombre: '',
    descripcion: '',
    producto_id: null,
    categoria_id: null,
    descuento_porcentaje: 10,
    precio_oferta: null,
    fecha_inicio: new Date().toISOString().slice(0, 16),
    fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    estado: 'programada',
    basada_en_ia: false,
    razon_ia: ''
  });
  
  // Estados para cupones
  const [cupones, setCupones] = useState([]);
  const [mostrarFormCupon, setMostrarFormCupon] = useState(false);
  const [formCupon, setFormCupon] = useState({
    codigo: '',
    descripcion: '',
    tipo_descuento: 'porcentaje',
    valor_descuento: 10,
    monto_minimo: 0,
    fecha_inicio: new Date().toISOString().slice(0, 16),
    fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    usos_maximos: 100,
    aplicable_a_todos: true,
    categoria_id: null
  });
  
  // Formulario para crear notificación
  const [formNotificacion, setFormNotificacion] = useState({
    tipo: 'info',
    titulo: '',
    mensaje: '',
    destinatario: 'todos',
    usuario_id: null,
    prioridad: 'normal'
  });

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
        // Mapear notificaciones del backend al formato del frontend
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
      // En caso de error, mantener notificaciones vacías
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

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormNotificacion(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function enviarNotificacion() {
    if (!formNotificacion.titulo || !formNotificacion.mensaje) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const datos = {
        titulo: formNotificacion.titulo,
        mensaje: formNotificacion.mensaje,
        tipo: formNotificacion.tipo,
        prioridad: formNotificacion.prioridad,
        destinatario: formNotificacion.destinatario,
        usuario_id: formNotificacion.usuario_id || null
      };
      
      const resultado = await crearNotificacion(datos);
      if (resultado.success) {
        alert(resultado.message || 'Notificación enviada exitosamente');
        setMostrarFormulario(false);
        setFormNotificacion({
          tipo: 'info',
          titulo: '',
          mensaje: '',
          destinatario: 'todos',
          usuario_id: null,
          prioridad: 'normal'
        });
        // Recargar notificaciones
        await cargarNotificaciones();
      }
    } catch (err) {
      console.error('Error enviando notificación:', err);
      alert(err.message || 'Error al enviar notificación');
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
    <div className="notificaciones-container">
      {/* Tabs */}
      <div className="notificaciones-tabs">
        <button
          className={`notificaciones-tab ${activeTab === 'notificaciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('notificaciones')}
        >
          <Bell size={18} /> Notificaciones
        </button>
        <button
          className={`notificaciones-tab ${activeTab === 'ofertas' ? 'active' : ''}`}
          onClick={() => setActiveTab('ofertas')}
        >
          <Tag size={18} /> Ofertas y Cupones
        </button>
      </div>

      {activeTab === 'ofertas' ? (
        <OfertasCupones />
      ) : (
        <>
          {/* Header */}
          <div className="notificaciones-header">
        <div>
          <h1 className="notificaciones-title">
            <Bell className="title-icon" />
            Sistema de Notificaciones
          </h1>
          <p className="notificaciones-subtitle">
            Gestiona y envía notificaciones push a usuarios del sistema
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
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="btn-primario"
          >
            <Plus size={18} /> {mostrarFormulario ? 'Cancelar' : 'Nueva Notificación'}
          </button>
        </div>
      </div>

      {/* Formulario de nueva notificación */}
      {mostrarFormulario && (
        <div className="notificacion-form-card">
          <h2 className="form-title">Crear Nueva Notificación</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>
                <Bell className="label-icon" />
                Tipo de Notificación
              </label>
              <select
                name="tipo"
                value={formNotificacion.tipo}
                onChange={handleFormChange}
                className="form-select"
              >
                <option value="info">Información</option>
                <option value="venta">Nueva Venta</option>
                <option value="stock">Stock Bajo</option>
                <option value="producto">Nuevo Producto</option>
                <option value="pedido">Pedido Confirmado</option>
                <option value="cupon">Cupón de Descuento</option>
                <option value="oferta">Oferta Especial</option>
                <option value="alerta">Alerta</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <User className="label-icon" />
                Destinatario
              </label>
              <select
                name="destinatario"
                value={formNotificacion.destinatario}
                onChange={handleFormChange}
                className="form-select"
              >
                <option value="todos">Todos los Usuarios</option>
                <option value="clientes">Solo Clientes</option>
                <option value="administradores">Solo Administradores</option>
                <option value="especifico">Usuario Específico</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <AlertCircle className="label-icon" />
                Prioridad
              </label>
              <select
                name="prioridad"
                value={formNotificacion.prioridad}
                onChange={handleFormChange}
                className="form-select"
              >
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Título</label>
            <input
              type="text"
              name="titulo"
              value={formNotificacion.titulo}
              onChange={handleFormChange}
              className="form-input"
              placeholder="Ej: Nueva Venta Realizada"
              required
            />
          </div>

          <div className="form-group">
            <label>Mensaje</label>
            <textarea
              name="mensaje"
              value={formNotificacion.mensaje}
              onChange={handleFormChange}
              className="form-textarea"
              rows="4"
              placeholder="Escribe el mensaje de la notificación..."
              required
            />
          </div>

          <div className="form-acciones">
            <button
              onClick={enviarNotificacion}
              className="btn-enviar"
            >
              <Send size={18} /> Enviar Notificación
            </button>
            <button
              onClick={() => setMostrarFormulario(false)}
              className="btn-cancelar"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="notificaciones-filtros">
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
            <option value="venta">Ventas</option>
            <option value="stock">Stock</option>
            <option value="producto">Productos</option>
            <option value="pedido">Pedidos</option>
            <option value="cupon">Cupones</option>
            <option value="oferta">Ofertas</option>
            <option value="info">Información</option>
            <option value="alerta">Alertas</option>
          </select>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="notificaciones-lista">
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
                className={`notificacion-item ${notif.leida ? 'leida' : 'no-leida'} prioridad-${notif.prioridad}`}
              >
                <div className="notificacion-icono" style={{ backgroundColor: `${notif.color}20`, color: notif.color }}>
                  <Icono size={24} />
                </div>
                
                <div className="notificacion-contenido">
                  <div className="notificacion-header">
                    <h3 className="notificacion-titulo">{notif.titulo}</h3>
                    <div className="notificacion-badges">
                      <span className={`badge-prioridad ${notif.prioridad}`}>
                        {notif.prioridad}
                      </span>
                      <span className="badge-destinatario">
                        {notif.destinatario === 'todos' ? 'Todos' : 
                         notif.destinatario === 'clientes' ? 'Clientes' : 
                         notif.destinatario === 'administradores' ? 'Admins' : 'Específico'}
                      </span>
                    </div>
                  </div>
                  <p className="notificacion-mensaje">{notif.mensaje}</p>
                  <div className="notificacion-footer">
                    <span className="notificacion-fecha">
                      <Clock size={14} /> {formatearFecha(notif.fecha)}
                    </span>
                    <div className="notificacion-acciones">
                      {!notif.leida && (
                        <button
                          onClick={() => marcarComoLeida(notif.id)}
                          className="btn-accion"
                          title="Marcar como leída"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => eliminarNotificacionHandler(notif.id)}
                        className="btn-accion btn-eliminar"
                        title="Eliminar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
        </>
      )}
    </div>
  );
}

