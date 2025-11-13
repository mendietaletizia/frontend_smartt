import React, { useState, useEffect } from 'react';
import { 
  Tag, Gift, Plus, Brain, Sparkles, 
  Calendar, Package, X,
  Clock, Save, TrendingDown
} from 'lucide-react';
import { obtenerSugerenciasIA, crearOferta, obtenerOfertas } from '../api/ofertas.js';
import { crearCupon, obtenerCupones } from '../api/ofertas.js';
import './OfertasCupones.css';

export default function OfertasCupones() {
  const [activeTab, setActiveTab] = useState('ofertas'); // 'ofertas', 'cupones'
  
  // Estados para ofertas
  const [ofertas, setOfertas] = useState([]);
  const [sugerenciasIA, setSugerenciasIA] = useState([]);
  const [ofertasTemporada, setOfertasTemporada] = useState([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (activeTab === 'ofertas') {
      cargarOfertas();
    } else {
      cargarCupones();
    }
  }, [activeTab]);

  async function cargarOfertas() {
    try {
      setLoading(true);
      // Cargar todas las ofertas, no solo las activas, para que se vean todas
      const data = await obtenerOfertas();
      setOfertas(data.ofertas || []);
    } catch (err) {
      console.error('Error cargando ofertas:', err);
    } finally {
      setLoading(false);
    }
  }

  async function cargarSugerenciasIA() {
    try {
      setLoading(true);
      const data = await obtenerSugerenciasIA();
      setSugerenciasIA(data.sugerencias_productos || []);
      setOfertasTemporada(data.ofertas_temporada || []);
      setMostrarSugerencias(true);
    } catch (err) {
      console.error('Error cargando sugerencias:', err);
      alert('Error al cargar sugerencias de IA');
    } finally {
      setLoading(false);
    }
  }

  async function cargarCupones() {
    try {
      setLoading(true);
      const data = await obtenerCupones({ activos: 'true' });
      setCupones(data.cupones || []);
    } catch (err) {
      console.error('Error cargando cupones:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOfertaChange(e) {
    const { name, value, type, checked } = e.target;
    setFormOferta(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function handleCuponChange(e) {
    const { name, value, type, checked } = e.target;
    setFormCupon(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function usarSugerencia(sugerencia) {
    setFormOferta({
      nombre: `Oferta ${sugerencia.producto.nombre}`,
      descripcion: sugerencia.razon,
      producto_id: sugerencia.producto.id,
      categoria_id: sugerencia.categoria?.id || null,
      descuento_porcentaje: sugerencia.descuento_sugerido,
      precio_oferta: null,
      fecha_inicio: new Date().toISOString().slice(0, 16),
      fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      estado: 'programada',
      basada_en_ia: true,
      razon_ia: sugerencia.razon
    });
    setMostrarSugerencias(false);
    setMostrarFormOferta(true);
  }

  async function guardarOferta() {
    try {
      if (!formOferta.nombre || !formOferta.descuento_porcentaje) {
        alert('Por favor completa todos los campos requeridos');
        return;
      }

      const datos = {
        ...formOferta,
        fecha_inicio: new Date(formOferta.fecha_inicio).toISOString(),
        fecha_fin: new Date(formOferta.fecha_fin).toISOString(),
        descuento_porcentaje: parseFloat(formOferta.descuento_porcentaje),
        precio_oferta: formOferta.precio_oferta ? parseFloat(formOferta.precio_oferta) : null,
        producto_id: formOferta.producto_id || null,
        categoria_id: formOferta.categoria_id || null
      };

      const resultado = await crearOferta(datos);
      alert(resultado.message || 'Oferta creada exitosamente');
      setMostrarFormOferta(false);
      setFormOferta({
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
      // Recargar ofertas para mostrar la nueva
      await cargarOfertas();
    } catch (err) {
      console.error('Error guardando oferta:', err);
      alert(err.message || 'Error al crear oferta');
    }
  }

  function generarCodigoCupon() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 8; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    setFormCupon(prev => ({ ...prev, codigo }));
  }

  async function guardarCupon() {
    try {
      if (!formCupon.codigo || !formCupon.valor_descuento) {
        alert('Por favor completa todos los campos requeridos');
        return;
      }

      const datos = {
        ...formCupon,
        fecha_inicio: new Date(formCupon.fecha_inicio).toISOString(),
        fecha_fin: new Date(formCupon.fecha_fin).toISOString(),
        valor_descuento: parseFloat(formCupon.valor_descuento),
        monto_minimo: parseFloat(formCupon.monto_minimo || 0),
        usos_maximos: parseInt(formCupon.usos_maximos || 100),
        categoria_id: formCupon.categoria_id || null
      };

      const resultado = await crearCupon(datos);
      alert(resultado.message || 'Cupón creado exitosamente');
      setMostrarFormCupon(false);
      setFormCupon({
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
      // Recargar cupones para mostrar el nuevo
      await cargarCupones();
    } catch (err) {
      console.error('Error guardando cupón:', err);
      alert(err.message || 'Error al crear cupón');
    }
  }

  function formatearFecha(fechaISO) {
    if (!fechaISO) return 'N/A';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="ofertas-cupones-container">
      {/* Header */}
      <div className="oc-header">
        <div>
          <h1 className="oc-title">
            <Tag className="title-icon" />
            Ofertas y Cupones
          </h1>
          <p className="oc-subtitle">
            Gestiona ofertas inteligentes y cupones de descuento para tus clientes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="oc-tabs">
        <button
          className={`oc-tab ${activeTab === 'ofertas' ? 'active' : ''}`}
          onClick={() => setActiveTab('ofertas')}
        >
          <Tag size={18} /> Ofertas
        </button>
        <button
          className={`oc-tab ${activeTab === 'cupones' ? 'active' : ''}`}
          onClick={() => setActiveTab('cupones')}
        >
          <Gift size={18} /> Cupones
        </button>
      </div>

      {/* Contenido de Ofertas */}
      {activeTab === 'ofertas' && (
        <div className="oc-content">
          {/* Botones de acción */}
          <div className="oc-acciones">
            <button
              onClick={cargarSugerenciasIA}
              className="btn-ia"
              disabled={loading}
            >
              <Brain size={18} /> Sugerencias de IA
            </button>
            <button
              onClick={() => setMostrarFormOferta(true)}
              className="btn-primario"
            >
              <Plus size={18} /> Nueva Oferta
            </button>
          </div>

          {/* Sugerencias de IA */}
          {mostrarSugerencias && (
            <div className="sugerencias-panel">
              <div className="sugerencias-header">
                <Brain className="sugerencias-icon" />
                <h2>Sugerencias de Inteligencia Artificial</h2>
                <button
                  onClick={() => setMostrarSugerencias(false)}
                  className="btn-cerrar"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Ofertas de temporada */}
              {ofertasTemporada.length > 0 && (
                <div className="sugerencias-seccion">
                  <h3>Ofertas de Temporada</h3>
                  <div className="sugerencias-grid">
                    {ofertasTemporada.map((oferta, idx) => (
                      <div key={idx} className="sugerencia-card temporada">
                        <Calendar className="card-icon" />
                        <h4>{oferta.nombre}</h4>
                        <p>{oferta.descripcion}</p>
                        <div className="sugerencia-info">
                          <span className="descuento">{oferta.descuento_sugerido}% OFF</span>
                          <span className="fecha">
                            {formatearFecha(oferta.fecha_sugerida_inicio)} - {formatearFecha(oferta.fecha_sugerida_fin)}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setFormOferta({
                              nombre: oferta.nombre,
                              descripcion: oferta.descripcion,
                              producto_id: null,
                              categoria_id: null,
                              descuento_porcentaje: oferta.descuento_sugerido,
                              precio_oferta: null,
                              fecha_inicio: oferta.fecha_sugerida_inicio.slice(0, 16),
                              fecha_fin: oferta.fecha_sugerida_fin.slice(0, 16),
                              estado: 'programada',
                              basada_en_ia: true,
                              razon_ia: 'Oferta sugerida por temporada del año'
                            });
                            setMostrarSugerencias(false);
                            setMostrarFormOferta(true);
                          }}
                          className="btn-usar"
                        >
                          Usar Sugerencia
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Productos sugeridos */}
              {sugerenciasIA.length > 0 && (
                <div className="sugerencias-seccion">
                  <h3>Productos Sugeridos para Oferta</h3>
                  <div className="sugerencias-grid">
                    {sugerenciasIA.map((sug, idx) => (
                      <div key={idx} className="sugerencia-card producto">
                        <Package className="card-icon" />
                        <h4>{sug.producto.nombre}</h4>
                        <p className="razon">{sug.razon}</p>
                        <div className="sugerencia-info">
                          <span className="precio">Bs. {sug.producto.precio.toFixed(2)}</span>
                          <span className="stock">Stock: {sug.producto.stock}</span>
                          <span className={`prioridad ${sug.prioridad}`}>{sug.prioridad}</span>
                        </div>
                        <div className="descuento-sugerido">
                          Descuento sugerido: <strong>{sug.descuento_sugerido}%</strong>
                        </div>
                        <button
                          onClick={() => usarSugerencia(sug)}
                          className="btn-usar"
                        >
                          Usar Sugerencia
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sugerenciasIA.length === 0 && ofertasTemporada.length === 0 && (
                <div className="sin-sugerencias">
                  <Brain className="empty-icon" />
                  <p>No hay sugerencias disponibles en este momento</p>
                </div>
              )}
            </div>
          )}

          {/* Formulario de oferta */}
          {mostrarFormOferta && (
            <div className="form-card">
              <div className="form-header">
                <h2>{formOferta.basada_en_ia ? 'Crear Oferta (Sugerida por IA)' : 'Nueva Oferta'}</h2>
                <button onClick={() => setMostrarFormOferta(false)} className="btn-cerrar">
                  <X size={20} />
                </button>
              </div>

              {formOferta.basada_en_ia && (
                <div className="ia-badge">
                  <Brain size={16} /> Sugerencia de IA: {formOferta.razon_ia}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre de la Oferta *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formOferta.nombre}
                    onChange={handleOfertaChange}
                    className="form-input"
                    placeholder="Ej: Oferta de Navidad"
                  />
                </div>

                <div className="form-group">
                  <label>Descuento (%) *</label>
                  <input
                    type="number"
                    name="descuento_porcentaje"
                    value={formOferta.descuento_porcentaje}
                    onChange={handleOfertaChange}
                    className="form-input"
                    min="1"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de Inicio *</label>
                  <input
                    type="datetime-local"
                    name="fecha_inicio"
                    value={formOferta.fecha_inicio}
                    onChange={handleOfertaChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de Fin *</label>
                  <input
                    type="datetime-local"
                    name="fecha_fin"
                    value={formOferta.fecha_fin}
                    onChange={handleOfertaChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={formOferta.descripcion}
                  onChange={handleOfertaChange}
                  className="form-textarea"
                  rows="3"
                  placeholder="Descripción de la oferta..."
                />
              </div>

              <div className="form-acciones">
                <button onClick={guardarOferta} className="btn-guardar">
                  <Save size={18} /> Guardar Oferta
                </button>
                <button onClick={() => setMostrarFormOferta(false)} className="btn-cancelar">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de ofertas */}
          <div className="lista-ofertas">
            <div className="lista-header">
              <h2>Todas las Ofertas</h2>
              <button onClick={cargarOfertas} className="btn-refresh" title="Actualizar lista">
                <Clock size={16} /> Actualizar
              </button>
            </div>
            {loading ? (
              <div className="loading">Cargando...</div>
            ) : ofertas.length === 0 ? (
              <div className="empty-state">
                <Tag className="empty-icon" />
                <p>No hay ofertas creadas</p>
                <p className="empty-hint">Crea una nueva oferta usando el botón de arriba</p>
              </div>
            ) : (
              <div className="ofertas-grid">
                {ofertas.map(oferta => (
                  <div key={oferta.id} className="oferta-card">
                    {oferta.basada_en_ia && (
                      <div className="ia-indicator">
                        <Brain size={14} /> IA
                      </div>
                    )}
                    <h3>{oferta.nombre}</h3>
                    <p>{oferta.descripcion || 'Sin descripción'}</p>
                    {oferta.producto && (
                      <div className="oferta-producto">
                        <Package size={14} />
                        <span>{oferta.producto.nombre}</span>
                      </div>
                    )}
                    <div className="oferta-descuento">
                      {oferta.descuento_porcentaje}% OFF
                    </div>
                    {oferta.precio_oferta && (
                      <div className="oferta-precio">
                        Precio: Bs. {oferta.precio_oferta.toFixed(2)}
                      </div>
                    )}
                    <div className="oferta-fechas">
                      <Clock size={14} />
                      <div>
                        <div><strong>Inicio:</strong> {formatearFecha(oferta.fecha_inicio)}</div>
                        <div><strong>Fin:</strong> {formatearFecha(oferta.fecha_fin)}</div>
                      </div>
                    </div>
                    <div className={`estado-badge ${oferta.estado} ${oferta.esta_activa ? 'activa-ahora' : ''}`}>
                      {oferta.esta_activa ? '✓ Activa Ahora' : oferta.estado}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenido de Cupones */}
      {activeTab === 'cupones' && (
        <div className="oc-content">
          <div className="oc-acciones">
            <button
              onClick={() => setMostrarFormCupon(true)}
              className="btn-primario"
            >
              <Plus size={18} /> Nuevo Cupón
            </button>
          </div>

          {/* Formulario de cupón */}
          {mostrarFormCupon && (
            <div className="form-card">
              <div className="form-header">
                <h2>Nuevo Cupón de Descuento</h2>
                <button onClick={() => setMostrarFormCupon(false)} className="btn-cerrar">
                  <X size={20} />
                </button>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Código del Cupón *</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      name="codigo"
                      value={formCupon.codigo}
                      onChange={handleCuponChange}
                      className="form-input"
                      placeholder="Ej: DESCUENTO20"
                      style={{ textTransform: 'uppercase' }}
                    />
                    <button onClick={generarCodigoCupon} className="btn-generar">
                      <Sparkles size={16} /> Generar
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Tipo de Descuento *</label>
                  <select
                    name="tipo_descuento"
                    value={formCupon.tipo_descuento}
                    onChange={handleCuponChange}
                    className="form-select"
                  >
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="fijo">Monto Fijo (Bs.)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Valor del Descuento *</label>
                  <input
                    type="number"
                    name="valor_descuento"
                    value={formCupon.valor_descuento}
                    onChange={handleCuponChange}
                    className="form-input"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Monto Mínimo de Compra</label>
                  <input
                    type="number"
                    name="monto_minimo"
                    value={formCupon.monto_minimo}
                    onChange={handleCuponChange}
                    className="form-input"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de Inicio *</label>
                  <input
                    type="datetime-local"
                    name="fecha_inicio"
                    value={formCupon.fecha_inicio}
                    onChange={handleCuponChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de Fin *</label>
                  <input
                    type="datetime-local"
                    name="fecha_fin"
                    value={formCupon.fecha_fin}
                    onChange={handleCuponChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Usos Máximos</label>
                  <input
                    type="number"
                    name="usos_maximos"
                    value={formCupon.usos_maximos}
                    onChange={handleCuponChange}
                    className="form-input"
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={formCupon.descripcion}
                  onChange={handleCuponChange}
                  className="form-textarea"
                  rows="3"
                  placeholder="Descripción del cupón..."
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="aplicable_a_todos"
                    checked={formCupon.aplicable_a_todos}
                    onChange={handleCuponChange}
                  />
                  <span>Aplicable a todos los productos</span>
                </label>
              </div>

              <div className="form-acciones">
                <button onClick={guardarCupon} className="btn-guardar">
                  <Save size={18} /> Guardar Cupón
                </button>
                <button onClick={() => setMostrarFormCupon(false)} className="btn-cancelar">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de cupones */}
          <div className="lista-cupones">
            <div className="lista-header">
              <h2>Todos los Cupones</h2>
              <button onClick={cargarCupones} className="btn-refresh" title="Actualizar lista">
                <Clock size={16} /> Actualizar
              </button>
            </div>
            {loading ? (
              <div className="loading">Cargando...</div>
            ) : cupones.length === 0 ? (
              <div className="empty-state">
                <Gift className="empty-icon" />
                <p>No hay cupones creados</p>
                <p className="empty-hint">Crea un nuevo cupón usando el botón de arriba</p>
              </div>
            ) : (
              <div className="cupones-grid">
                {cupones.map(cupon => (
                  <div key={cupon.id} className="cupon-card">
                    <div className="cupon-codigo">{cupon.codigo}</div>
                    <div className="cupon-descuento">
                      {cupon.tipo_descuento === 'porcentaje' 
                        ? `${cupon.valor_descuento}% OFF`
                        : `Bs. ${cupon.valor_descuento} OFF`}
                    </div>
                    <p>{cupon.descripcion || 'Sin descripción'}</p>
                    {cupon.monto_minimo > 0 && (
                      <div className="cupon-minimo">
                        Compra mínima: Bs. {cupon.monto_minimo.toFixed(2)}
                      </div>
                    )}
                    <div className="cupon-info">
                      <div>
                        <strong>Usos:</strong> {cupon.usos_actuales} / {cupon.usos_maximos}
                      </div>
                      <div>
                        <Clock size={14} />
                        <span>Válido hasta: {formatearFecha(cupon.fecha_fin)}</span>
                      </div>
                    </div>
                    <div className={`estado-badge ${cupon.estado} ${cupon.esta_activo ? 'activo-ahora' : ''}`}>
                      {cupon.esta_activo ? '✓ Activo Ahora' : cupon.estado}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

