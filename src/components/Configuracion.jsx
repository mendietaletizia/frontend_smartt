import React, { useState } from 'react';
import { 
  Settings, Save, Info, Bell, Globe, 
  Mail, Phone, Building, 
  CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import './Configuracion.css';

export default function Configuracion({ user }) {
  // Cargar configuración desde localStorage si existe
  const getInitialConfig = () => {
    try {
      const saved = localStorage.getItem('configuracion_tienda');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          nombre_tienda: parsed.nombre_tienda || 'SmartSales365',
          descripcion: parsed.descripcion || 'Sistema de gestión de ventas inteligente',
          email_contacto: parsed.email_contacto || user?.email || '',
          telefono: parsed.telefono || '',
          ciudad: parsed.ciudad || 'La Paz',
          pais: parsed.pais || 'Bolivia',
          moneda: parsed.moneda || 'BOB',
          zona_horaria: parsed.zona_horaria || 'America/La_Paz',
          notificaciones_sistema: parsed.notificaciones_sistema !== undefined ? parsed.notificaciones_sistema : true,
          actualizacion_automatica: parsed.actualizacion_automatica !== undefined ? parsed.actualizacion_automatica : true
        };
      }
    } catch (e) {
      console.error('Error cargando configuración:', e);
    }
    return {
      nombre_tienda: 'SmartSales365',
      descripcion: 'Sistema de gestión de ventas inteligente',
      email_contacto: user?.email || '',
      telefono: '',
      ciudad: 'La Paz',
      pais: 'Bolivia',
      moneda: 'BOB',
      zona_horaria: 'America/La_Paz',
      notificaciones_sistema: true,
      actualizacion_automatica: true
    };
  };

  const [config, setConfig] = useState(getInitialConfig());

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function guardarConfiguracion() {
    setGuardando(true);
    setMensaje('');
    
    // Guardar en localStorage para que el footer pueda leerlo
    try {
      localStorage.setItem('configuracion_tienda', JSON.stringify(config));
    } catch (e) {
      console.error('Error guardando configuración en localStorage:', e);
    }
    
    // Simular guardado (en producción esto iría al backend)
    setTimeout(() => {
      setGuardando(false);
      setMensaje('Configuración guardada exitosamente');
      setTipoMensaje('success');
      setTimeout(() => setMensaje(''), 3000);
    }, 1000);
  }

  return (
    <div className="configuracion-container">
      <div className="configuracion-header">
        <div>
          <h1 className="configuracion-title">
            <Settings className="title-icon" />
            Configuración del Sistema
          </h1>
          <p className="configuracion-subtitle">
            Gestiona la configuración general de tu tienda y preferencias del sistema
          </p>
        </div>
      </div>

      {mensaje && (
        <div className={`configuracion-mensaje ${tipoMensaje}`}>
          {tipoMensaje === 'success' ? <CheckCircle /> : <AlertCircle />}
          {mensaje}
        </div>
      )}

      <div className="configuracion-grid">
        {/* Información de la Tienda */}
        <div className="configuracion-seccion">
          <div className="seccion-header">
            <Building className="seccion-icon" />
            <h2>Información de la Tienda</h2>
          </div>
          
          <div className="seccion-content">
            <div className="form-group">
              <label>
                <Info className="label-icon" />
                Nombre de la Tienda
              </label>
              <input
                type="text"
                name="nombre_tienda"
                value={config.nombre_tienda}
                onChange={handleChange}
                className="form-input"
                placeholder="Nombre de tu tienda"
              />
            </div>

            <div className="form-group">
              <label>
                <Info className="label-icon" />
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={config.descripcion}
                onChange={handleChange}
                className="form-textarea"
                rows="3"
                placeholder="Descripción de tu tienda"
              />
            </div>

            <div className="form-group">
              <label>
                <Mail className="label-icon" />
                Email de Contacto
              </label>
              <input
                type="email"
                name="email_contacto"
                value={config.email_contacto}
                onChange={handleChange}
                className="form-input"
                placeholder="contacto@tienda.com"
              />
            </div>

            <div className="form-group">
              <label>
                <Phone className="label-icon" />
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={config.telefono}
                onChange={handleChange}
                className="form-input"
                placeholder="+591 12345678"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ciudad</label>
                <input
                  type="text"
                  name="ciudad"
                  value={config.ciudad}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>País</label>
                <input
                  type="text"
                  name="pais"
                  value={config.pais}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Configuración Regional */}
        <div className="configuracion-seccion">
          <div className="seccion-header">
            <Globe className="seccion-icon" />
            <h2>Configuración Regional</h2>
          </div>
          
          <div className="seccion-content">
            <div className="form-group">
              <label>Moneda</label>
              <select
                name="moneda"
                value={config.moneda}
                onChange={handleChange}
                className="form-select"
              >
                <option value="BOB">Boliviano (BOB)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Zona Horaria</label>
              <select
                name="zona_horaria"
                value={config.zona_horaria}
                onChange={handleChange}
                className="form-select"
              >
                <option value="America/La_Paz">La Paz (GMT-4)</option>
                <option value="America/Santa_Cruz">Santa Cruz (GMT-4)</option>
                <option value="America/Cochabamba">Cochabamba (GMT-4)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="configuracion-seccion">
          <div className="seccion-header">
            <Bell className="seccion-icon" />
            <h2>Notificaciones</h2>
          </div>
          
          <div className="seccion-content">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="notificaciones_sistema"
                  checked={config.notificaciones_sistema}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                <div className="checkbox-content">
                  <strong>Notificaciones del Sistema</strong>
                  <p>Mostrar notificaciones en el panel de administración</p>
                </div>
              </label>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="actualizacion_automatica"
                  checked={config.actualizacion_automatica}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                <div className="checkbox-content">
                  <strong>Actualización Automática del Modelo IA</strong>
                  <p>El modelo de predicciones se actualizará automáticamente cada 7 días</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="configuracion-acciones">
        <button
          onClick={guardarConfiguracion}
          disabled={guardando}
          className="btn-guardar"
        >
          {guardando ? (
            <>
              <RefreshCw className="spinning" /> Guardando...
            </>
          ) : (
            <>
              <Save /> Guardar Configuración
            </>
          )}
        </button>
      </div>
    </div>
  );
}

