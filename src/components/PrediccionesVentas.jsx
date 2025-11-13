import React, { useState, useEffect } from 'react';
import { 
  Brain, TrendingUp, TrendingDown, BarChart3, 
  Calendar, RefreshCw, Filter, Download, 
  Info, AlertCircle, CheckCircle, Sparkles,
  LineChart, PieChart, Target, Zap, Activity,
  FileText, FileSpreadsheet
} from 'lucide-react';
import { generarPredicciones, listarPredicciones } from '../api/predicciones.js';
import { obtenerEstadoModelo } from '../api/modeloIA.js';
import { obtenerHistorialAgregado } from '../api/historial.js';
import { getApiUrl } from '../config/api.js';
import './PrediccionesVentas.css';

export default function PrediccionesVentas() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [predicciones, setPredicciones] = useState([]);
  const [estadoModelo, setEstadoModelo] = useState(null);
  const [historialAgregado, setHistorialAgregado] = useState([]);
  const [generando, setGenerando] = useState(false);
  
  // Parámetros de generación
  const [periodo, setPeriodo] = useState('mes');
  const [mesesFuturos, setMesesFuturos] = useState(3);
  const [categoriaId, setCategoriaId] = useState(null);
  
  // Resumen de predicciones
  const [resumen, setResumen] = useState(null);
  const [tendencias, setTendencias] = useState(null);

  useEffect(() => {
    cargarEstadoModelo();
    cargarHistorialAgregado();
    cargarPrediccionesExistentes();
  }, []);

  async function cargarEstadoModelo() {
    try {
      const data = await obtenerEstadoModelo();
      setEstadoModelo(data);
    } catch (err) {
      console.error('Error cargando estado del modelo:', err);
    }
  }

  async function cargarHistorialAgregado() {
    try {
      const data = await obtenerHistorialAgregado({ agrupar_por: 'mes', periodo: 12 });
      if (data && data.success) {
        // Normalizar los datos del historial
        const historialNormalizado = (data.historial || []).map(h => ({
          fecha: h.fecha || h.mes || h.periodo || '',
          total_ventas: parseFloat(h.total_ventas || h.ventas || h.total || 0),
          tipo: 'historico'
        }));
        setHistorialAgregado(historialNormalizado);
      }
    } catch (err) {
      console.warn('Error cargando historial agregado:', err);
      setHistorialAgregado([]);
    }
  }

  async function cargarPrediccionesExistentes() {
    try {
      const data = await listarPredicciones({ limite: 50 });
      if (data && data.success) {
        setPredicciones(data.predicciones || []);
      }
    } catch (err) {
      console.warn('Error cargando predicciones existentes:', err);
    }
  }

  async function generarNuevasPredicciones() {
    try {
      setGenerando(true);
      setError('');
      
      const data = await generarPredicciones({
        periodo,
        meses_futuros: mesesFuturos,
        categoria_id: categoriaId,
        guardar: true
      });
      
      if (data && data.success) {
        setPredicciones(data.predicciones || []);
        setResumen(data.resumen || null);
        setTendencias(data.tendencias || null);
        
        // Recargar predicciones existentes
        await cargarPrediccionesExistentes();
      }
    } catch (err) {
      console.error('Error generando predicciones:', err);
      setError(err.message || 'Error al generar predicciones');
    } finally {
      setGenerando(false);
    }
  }

  function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(valor);
  }

  function formatearFecha(fechaISO) {
    if (!fechaISO) return 'N/A';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatearMes(fechaISO) {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-BO', {
      month: 'short',
      year: 'numeric'
    });
  }

  // Preparar datos para gráficos
  const datosGrafico = React.useMemo(() => {
    const historial = historialAgregado.map(h => ({
      fecha: h.fecha || '',
      valor: parseFloat(h.total_ventas || 0),
      tipo: 'historico'
    })).filter(h => h.fecha); // Filtrar fechas vacías

    const preds = predicciones.map(p => ({
      fecha: p.fecha_prediccion,
      valor: parseFloat(p.valor_predicho || 0),
      confianza: parseFloat(p.confianza || 0),
      tipo: 'prediccion'
    }));

    const todos = [...historial, ...preds].filter(d => d.fecha).sort((a, b) => {
      try {
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        return fechaA - fechaB;
      } catch {
        return 0;
      }
    });

    return todos;
  }, [historialAgregado, predicciones]);

  async function exportarReporte(formato) {
    try {
      const url = `/api/dashboard/predicciones/exportar/?formato=${formato}`;
      
      const response = await fetch(getApiUrl(url), {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Error al generar el reporte');
      }
      
      const blob = await response.blob();
      const url_blob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url_blob;
      a.download = `predicciones_ia_${new Date().toISOString().slice(0, 10)}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url_blob);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exportando reporte:', err);
      alert('Error al exportar el reporte. Por favor, intenta nuevamente.');
    }
  }

  const modelo = estadoModelo?.modelo;
  const modeloActivo = modelo?.estado === 'activo';

  return (
    <div className="predicciones-container">
      {/* Header */}
      <div className="predicciones-header">
        <div>
          <h1 className="predicciones-title">
            <Brain className="title-icon" />
            Predicciones de Ventas
          </h1>
          <p className="predicciones-subtitle">
            Genera proyecciones de ventas futuras usando inteligencia artificial
          </p>
        </div>
        <div className="predicciones-header-actions">
          <button 
            onClick={cargarPrediccionesExistentes} 
            className="btn-refresh"
            title="Actualizar predicciones"
          >
            <RefreshCw /> Actualizar
          </button>
          {predicciones.length > 0 && (
            <div className="predicciones-export">
              <button 
                onClick={() => exportarReporte('pdf')}
                className="btn-export btn-export-pdf"
                title="Exportar a PDF"
              >
                <FileText size={18} /> PDF
              </button>
              <button 
                onClick={() => exportarReporte('excel')}
                className="btn-export btn-export-excel"
                title="Exportar a Excel"
              >
                <FileSpreadsheet size={18} /> Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Estado del Modelo */}
      {modelo && (
        <div className="predicciones-modelo-card">
          <div className="modelo-card-header">
            <Brain className="modelo-card-icon" />
            <div>
              <h3>Estado del Modelo de IA</h3>
              <p className="modelo-card-subtitle">{modelo.nombre} v{modelo.version}</p>
            </div>
            <div className={`modelo-estado-badge ${modelo.estado}`}>
              {modelo.estado === 'activo' && <CheckCircle size={16} />}
              {modelo.estado === 'entrenando' && <RefreshCw size={16} className="spinning" />}
              {modelo.estado === 'error' && <AlertCircle size={16} />}
              {modelo.estado === 'retirado' && <AlertCircle size={16} />}
              <span>{modelo.estado.toUpperCase()}</span>
            </div>
          </div>
          
          {modelo.metricas && (
            <div className="modelo-metricas-grid">
              <div className="modelo-metrica">
                <span className="metrica-label">R² Score</span>
                <span className="metrica-valor">
                  {modelo.metricas.r2_score ? modelo.metricas.r2_score.toFixed(3) : 'N/A'}
                </span>
                <span className="metrica-desc">Calidad del modelo</span>
              </div>
              <div className="modelo-metrica">
                <span className="metrica-label">Registros</span>
                <span className="metrica-valor">{modelo.registros_entrenamiento || 0}</span>
                <span className="metrica-desc">Ventas usadas</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerta si el modelo no está activo */}
      {!modeloActivo && (
        <div className="predicciones-alerta">
          <AlertCircle className="alerta-icon" />
          <div>
            <p className="alerta-titulo">Modelo no disponible</p>
            <p className="alerta-texto">
              El modelo de predicción no está activo. Debes entrenar el modelo primero en la sección "Gestión de Modelo IA" 
              para poder generar predicciones de ventas.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="predicciones-error">
          <AlertCircle /> {error}
        </div>
      )}

      {/* Información sobre cómo funciona */}
      {modeloActivo && (
        <div className="predicciones-info-card">
          <div className="info-card-header">
            <Info className="info-card-icon" />
            <h3>¿Cómo funciona el sistema de predicciones?</h3>
          </div>
          <div className="info-card-content">
            <div className="info-paso">
              <div className="paso-numero">1</div>
              <div className="paso-contenido">
                <h4>Análisis de Datos Históricos</h4>
                <p>El sistema analiza tus ventas de los últimos 3 meses para identificar patrones y tendencias.</p>
              </div>
            </div>
            <div className="info-paso">
              <div className="paso-numero">2</div>
              <div className="paso-contenido">
                <h4>Cálculo de Tendencias</h4>
                <p>Compara los últimos 30 días con los 30 días anteriores para calcular el factor de crecimiento.</p>
              </div>
            </div>
            <div className="info-paso">
              <div className="paso-numero">3</div>
              <div className="paso-contenido">
                <h4>Generación de Predicciones</h4>
                <p>Usa el modelo de IA entrenado para proyectar ventas futuras con un nivel de confianza basado en la calidad del modelo.</p>
              </div>
            </div>
            <div className="info-paso">
              <div className="paso-numero">4</div>
              <div className="paso-contenido">
                <h4>Visualización</h4>
                <p>Las predicciones se muestran en gráficos comparativos con los datos históricos para una mejor comprensión.</p>
              </div>
            </div>
          </div>
          
          {/* Ejemplos de uso */}
          <div className="ejemplos-uso">
            <h4 className="ejemplos-uso-titulo">Ejemplos de cómo pedir predicciones:</h4>
            <div className="ejemplos-lista">
              <div className="ejemplo-item">
                <div className="ejemplo-icono">
                  <Target size={20} />
                </div>
                <div className="ejemplo-descripcion">
                  <strong>Predicción mensual:</strong> Selecciona "Mensual" y el número de meses (ej: 3 meses). 
                  El sistema proyectará las ventas para cada mes futuro.
                </div>
              </div>
              <div className="ejemplo-item">
                <div className="ejemplo-icono">
                  <BarChart3 size={20} />
                </div>
                <div className="ejemplo-descripcion">
                  <strong>Predicción por categoría:</strong> Ingresa el ID de una categoría específica para 
                  obtener predicciones solo de esa categoría de productos.
                </div>
              </div>
              <div className="ejemplo-item">
                <div className="ejemplo-icono">
                  <TrendingUp size={20} />
                </div>
                <div className="ejemplo-descripcion">
                  <strong>Análisis de tendencias:</strong> El sistema muestra automáticamente el factor de crecimiento 
                  calculado y la confianza de cada predicción.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel de Generación */}
      {modeloActivo && (
        <div className="predicciones-panel-generacion">
          <div className="panel-header">
            <Sparkles className="panel-icon" />
            <h2>Generar Nuevas Predicciones</h2>
          </div>
          
          {/* Ejemplos rápidos */}
          <div className="ejemplos-rapidos">
            <p className="ejemplos-titulo">Ejemplos rápidos:</p>
            <div className="ejemplos-botones">
              <button
                onClick={() => {
                  setPeriodo('mes');
                  setMesesFuturos(3);
                  setCategoriaId(null);
                }}
                className="ejemplo-btn"
                title="Predicción para los próximos 3 meses"
              >
                <Calendar size={16} />
                <span>Próximos 3 meses</span>
              </button>
              <button
                onClick={() => {
                  setPeriodo('mes');
                  setMesesFuturos(6);
                  setCategoriaId(null);
                }}
                className="ejemplo-btn"
                title="Predicción para los próximos 6 meses"
              >
                <Calendar size={16} />
                <span>Próximos 6 meses</span>
              </button>
              <button
                onClick={() => {
                  setPeriodo('semana');
                  setMesesFuturos(4);
                  setCategoriaId(null);
                }}
                className="ejemplo-btn"
                title="Predicción para las próximas 4 semanas"
              >
                <Calendar size={16} />
                <span>Próximas 4 semanas</span>
              </button>
            </div>
          </div>
          
          <div className="panel-contenido">
            <div className="parametros-grid">
              <div className="parametro-item">
                <label className="parametro-label">
                  <Calendar className="label-icon" />
                  Período
                </label>
                <select 
                  value={periodo} 
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="parametro-select"
                >
                  <option value="mes">Mensual</option>
                  <option value="semana">Semanal</option>
                  <option value="dia">Diario</option>
                </select>
                <p className="parametro-hint">Selecciona la frecuencia de las predicciones</p>
              </div>

              <div className="parametro-item">
                <label className="parametro-label">
                  <Target className="label-icon" />
                  Períodos a Predecir
                </label>
                <input
                  type="number"
                  min="1"
                  max={periodo === 'mes' ? 12 : periodo === 'semana' ? 12 : 30}
                  value={mesesFuturos}
                  onChange={(e) => setMesesFuturos(parseInt(e.target.value) || 1)}
                  className="parametro-input"
                />
                <p className="parametro-hint">
                  {periodo === 'mes' ? 'Máximo 12 meses' : periodo === 'semana' ? 'Máximo 12 semanas' : 'Máximo 30 días'}
                </p>
              </div>

              <div className="parametro-item">
                <label className="parametro-label">
                  <Filter className="label-icon" />
                  Categoría (Opcional)
                </label>
                <input
                  type="number"
                  placeholder="ID de categoría (dejar vacío para todas)"
                  value={categoriaId || ''}
                  onChange={(e) => setCategoriaId(e.target.value ? parseInt(e.target.value) : null)}
                  className="parametro-input"
                />
                <p className="parametro-hint">Filtrar predicciones por categoría específica</p>
              </div>
            </div>

            <div className="panel-acciones">
              <button
                onClick={generarNuevasPredicciones}
                disabled={generando}
                className="btn-generar"
              >
                {generando ? (
                  <>
                    <RefreshCw className="spinning" /> Generando Predicciones...
                  </>
                ) : (
                  <>
                    <Zap /> Generar Predicciones
                  </>
                )}
              </button>
              
              {predicciones.length > 0 && (
                <div className="resumen-rapido">
                  <CheckCircle className="resumen-icon" size={20} />
                  <div>
                    <p className="resumen-texto">
                      <strong>{predicciones.length}</strong> predicciones generadas
                    </p>
                    <p className="resumen-subtexto">
                      Total: {formatearMoneda(predicciones.reduce((sum, p) => sum + (parseFloat(p.valor_predicho) || 0), 0))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resumen de Predicciones */}
      {resumen && (
        <div className="predicciones-resumen">
          <div className="resumen-header">
            <BarChart3 className="resumen-icon" />
            <h2>Resumen de Predicciones</h2>
          </div>
          
          <div className="resumen-grid">
            <div className="resumen-card">
              <div className="resumen-card-header">
                <TrendingUp className="resumen-card-icon" />
                <span className="resumen-card-label">Total Predicho</span>
              </div>
              <div className="resumen-card-value">
                {formatearMoneda(resumen.total_valor_predicho || 0)}
              </div>
              <div className="resumen-card-info">
                {resumen.total_predicciones} períodos
              </div>
            </div>

            <div className="resumen-card">
              <div className="resumen-card-header">
                <Activity className="resumen-card-icon" />
                <span className="resumen-card-label">Confianza Promedio</span>
              </div>
              <div className="resumen-card-value">
                {((resumen.confianza_promedio || 0) * 100).toFixed(1)}%
              </div>
              <div className="resumen-card-info">
                Nivel de confianza del modelo
              </div>
            </div>

            {tendencias && (
              <>
                <div className="resumen-card">
                  <div className="resumen-card-header">
                    <TrendingUp className="resumen-card-icon" />
                    <span className="resumen-card-label">Factor de Crecimiento</span>
                  </div>
                  <div className={`resumen-card-value ${tendencias.factor_crecimiento >= 0 ? 'positivo' : 'negativo'}`}>
                    {tendencias.factor_crecimiento >= 0 ? '+' : ''}{tendencias.factor_crecimiento?.toFixed(1)}%
                  </div>
                  <div className="resumen-card-info">
                    Tendencias históricas
                  </div>
                </div>

                <div className="resumen-card">
                  <div className="resumen-card-header">
                    <BarChart3 className="resumen-card-icon" />
                    <span className="resumen-card-label">Promedio Mensual</span>
                  </div>
                  <div className="resumen-card-value">
                    {formatearMoneda(tendencias.promedio_mensual_historico || 0)}
                  </div>
                  <div className="resumen-card-info">
                    Basado en últimos 3 meses
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Gráfico de Predicciones */}
      {predicciones.length > 0 && (
        <div className="predicciones-grafico-container">
          <div className="grafico-header">
            <LineChart className="grafico-icon" />
            <h2>Proyección de Ventas</h2>
            <div className="grafico-leyenda">
              <div className="leyenda-item">
                <div className="leyenda-color historico"></div>
                <span>Histórico</span>
              </div>
              <div className="leyenda-item">
                <div className="leyenda-color prediccion"></div>
                <span>Predicción</span>
              </div>
            </div>
          </div>
          
          <div className="grafico-wrapper">
            <GraficoPredicciones datos={datosGrafico} />
          </div>
        </div>
      )}

      {/* Lista de Predicciones */}
      {predicciones.length > 0 && (
        <div className="predicciones-lista-container">
          <div className="lista-header">
            <BarChart3 className="lista-icon" />
            <h2>Predicciones Generadas</h2>
            <span className="lista-count">{predicciones.length} predicciones</span>
          </div>
          
          <div className="predicciones-tabla">
            <div className="tabla-header">
              <div className="tabla-col-fecha">Fecha</div>
              <div className="tabla-col-valor">Valor Predicho</div>
              <div className="tabla-col-confianza">Confianza</div>
              <div className="tabla-col-categoria">Categoría</div>
            </div>
            
            <div className="tabla-body">
              {predicciones.map((pred, index) => (
                <div key={pred.id || index} className="tabla-fila">
                  <div className="tabla-col-fecha">
                    {formatearFecha(pred.fecha_prediccion)}
                  </div>
                  <div className="tabla-col-valor">
                    {formatearMoneda(pred.valor_predicho || 0)}
                  </div>
                  <div className="tabla-col-confianza">
                    <div className="confianza-badge" style={{
                      backgroundColor: `rgba(0, 102, 255, ${pred.confianza || 0})`
                    }}>
                      {((pred.confianza || 0) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="tabla-col-categoria">
                    {pred.categoria?.nombre || 'General'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {predicciones.length === 0 && !generando && modeloActivo && (
        <div className="predicciones-empty">
          <Brain className="empty-icon" />
          <h3>No hay predicciones generadas</h3>
          <p>Genera nuevas predicciones usando el panel de arriba para ver proyecciones de ventas futuras.</p>
        </div>
      )}
    </div>
  );
}

// Funciones auxiliares para el gráfico
function formatearMonedaGrafico(valor) {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
}

function formatearMesGrafico(fechaISO) {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-BO', {
    month: 'short',
    year: '2-digit'
  });
}

// Componente de gráfico simple
function GraficoPredicciones({ datos }) {
  if (!datos || datos.length === 0) {
    return (
      <div className="grafico-vacio">
        <p>No hay datos para mostrar</p>
      </div>
    );
  }

  const valores = datos.map(d => d.valor);
  const maxValor = Math.max(...valores, 1);
  const minValor = Math.min(...valores, 0);

  return (
    <div className="grafico-simple">
      <div className="grafico-barras">
        {datos.map((dato, index) => {
          const altura = ((dato.valor - minValor) / (maxValor - minValor || 1)) * 100;
          const esPrediccion = dato.tipo === 'prediccion';
          
          return (
            <div key={index} className="grafico-bar-wrapper">
              <div 
                className={`grafico-barra ${esPrediccion ? 'prediccion' : 'historico'}`}
                style={{ height: `${Math.max(altura, 5)}%` }}
                title={`${formatearMesGrafico(dato.fecha)}: ${formatearMonedaGrafico(dato.valor)}${esPrediccion ? ` (Confianza: ${((dato.confianza || 0) * 100).toFixed(0)}%)` : ''}`}
              >
                {esPrediccion && (
                  <div className="barra-prediccion-indicator">
                    <Sparkles size={12} />
                  </div>
                )}
              </div>
              <div className="grafico-label">
                {formatearMesGrafico(dato.fecha)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

