import React, { useState, useEffect } from 'react';
import { obtenerEstadisticasDashboard } from '../api/dashboard.js';
import { obtenerHistorialAgregado } from '../api/historial.js';
import { 
  DollarSign, TrendingUp, TrendingDown, BarChart3, 
  PieChart, LineChart, RefreshCw, Calendar,
  ShoppingBag, Users, Package, Activity,
  Download, FileText, FileSpreadsheet
} from 'lucide-react';
import './DashboardVentas.css';

export default function DashboardVentas() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [historialAgregado, setHistorialAgregado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodo, setPeriodo] = useState('12meses'); // 12meses, 6meses, 3meses

  useEffect(() => {
    cargarDatos();
  }, [periodo]);

  async function cargarDatos() {
    try {
      setLoading(true);
      setError('');
      
      // Cargar estadísticas del dashboard
      const stats = await obtenerEstadisticasDashboard();
      setDashboardStats(stats);

      // Cargar historial agregado si está disponible (opcional)
      try {
        const historial = await obtenerHistorialAgregado({
          agrupar_por: 'mes'
        });
        if (historial && historial.success) {
          setHistorialAgregado(historial.historial || []);
        }
      } catch (err) {
        // El historial agregado es opcional, no es crítico si falla
        console.warn('Historial agregado no disponible:', err);
        setHistorialAgregado([]);
      }
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
      setError(err.message || 'Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  }

  // Filtrar datos según el período seleccionado
  const getDatosFiltrados = () => {
    if (!dashboardStats?.ventas_mensuales) return { labels: [], values: [], heights: [] };
    
    const meses = dashboardStats.ventas_mensuales.labels || [];
    const valores = dashboardStats.ventas_mensuales.values || [];
    const alturas = dashboardStats.ventas_mensuales.heights || [];
    
    let cantidad = 12;
    if (periodo === '6meses') cantidad = 6;
    if (periodo === '3meses') cantidad = 3;
    
    return {
      labels: meses.slice(-cantidad),
      values: valores.slice(-cantidad),
      heights: alturas.slice(-cantidad)
    };
  };

  const datosFiltrados = getDatosFiltrados();

  // Calcular estadísticas adicionales
  const calcularEstadisticas = () => {
    if (!dashboardStats) return null;

    const ventasMensuales = datosFiltrados.values;
    const promedioMensual = ventasMensuales.length > 0 
      ? ventasMensuales.reduce((a, b) => a + b, 0) / ventasMensuales.length 
      : 0;
    
    const mesMejor = ventasMensuales.length > 0
      ? Math.max(...ventasMensuales)
      : 0;
    
    const mesPeor = ventasMensuales.length > 0
      ? Math.min(...ventasMensuales.filter(v => v > 0))
      : 0;

    return {
      promedioMensual,
      mesMejor,
      mesPeor,
      totalPeriodo: ventasMensuales.reduce((a, b) => a + b, 0)
    };
  };

  const estadisticas = calcularEstadisticas();

  async function exportarReporte(formato) {
    try {
      const periodoNum = periodo === '3meses' ? '3' : periodo === '6meses' ? '6' : '12';
      const url = `/api/dashboard/dashboard-ventas/exportar/?formato=${formato}&periodo=${periodoNum}`;
      
      const response = await fetch(url, {
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
      a.download = `dashboard_ventas_${new Date().toISOString().slice(0, 10)}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url_blob);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exportando reporte:', err);
      alert('Error al exportar el reporte. Por favor, intenta nuevamente.');
    }
  }

  if (loading) {
    return (
      <div className="dashboard-ventas-container">
        <div className="dashboard-ventas-loading">
          <div className="dashboard-ventas-spinner"></div>
          <p>Cargando dashboard de ventas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-ventas-container">
        <div className="dashboard-ventas-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={cargarDatos} className="btn-retry">
            <RefreshCw /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-ventas-container">
      {/* Header */}
      <div className="dashboard-ventas-header">
        <div>
          <h1 className="dashboard-ventas-title">
            <BarChart3 className="dashboard-ventas-title-icon" />
            Dashboard de Ventas
          </h1>
          <p className="dashboard-ventas-subtitle">
            Visualización de métricas e indicadores de ventas históricas
          </p>
        </div>
        <div className="dashboard-ventas-controls">
          <select 
            value={periodo} 
            onChange={(e) => setPeriodo(e.target.value)}
            className="dashboard-ventas-select"
          >
            <option value="3meses">Últimos 3 meses</option>
            <option value="6meses">Últimos 6 meses</option>
            <option value="12meses">Últimos 12 meses</option>
          </select>
          <button onClick={cargarDatos} className="dashboard-ventas-refresh">
            <RefreshCw /> Actualizar
          </button>
          <div className="dashboard-ventas-export">
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
        </div>
      </div>

      {/* Métricas principales */}
      {dashboardStats?.stats && (
        <div className="dashboard-ventas-metrics">
          <div className="metric-card">
            <div className="metric-icon metric-icon-sales">
              <DollarSign />
            </div>
            <div className="metric-content">
              <p className="metric-label">Ventas del Período</p>
              <p className="metric-value">
                Bs. {estadisticas?.totalPeriodo.toLocaleString('es-BO', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                }) || '0.00'}
              </p>
              <div className="metric-change positive">
                <TrendingUp /> {dashboardStats.stats.ventas_mes?.change >= 0 ? '+' : ''}
                {dashboardStats.stats.ventas_mes?.change.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon metric-icon-orders">
              <ShoppingBag />
            </div>
            <div className="metric-content">
              <p className="metric-label">Total Pedidos</p>
              <p className="metric-value">{dashboardStats.stats.total_pedidos?.value || 0}</p>
              <div className="metric-change positive">
                <TrendingUp /> {dashboardStats.stats.total_pedidos?.change >= 0 ? '+' : ''}
                {dashboardStats.stats.total_pedidos?.change.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon metric-icon-avg">
              <Activity />
            </div>
            <div className="metric-content">
              <p className="metric-label">Promedio Mensual</p>
              <p className="metric-value">
                Bs. {estadisticas?.promedioMensual.toLocaleString('es-BO', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                }) || '0.00'}
              </p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon metric-icon-clients">
              <Users />
            </div>
            <div className="metric-content">
              <p className="metric-label">Nuevos Clientes</p>
              <p className="metric-value">{dashboardStats.stats.nuevos_clientes?.value || 0}</p>
              <div className="metric-change positive">
                <TrendingUp /> {dashboardStats.stats.nuevos_clientes?.change >= 0 ? '+' : ''}
                {dashboardStats.stats.nuevos_clientes?.change.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="dashboard-ventas-charts">
        {/* Gráfico de Barras - Ventas Mensuales */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">
                <BarChart3 className="chart-title-icon" />
                Ventas Mensuales
              </h3>
              <p className="chart-subtitle">Evolución de ventas por mes</p>
            </div>
          </div>
          <div className="chart-body">
            <div className="bar-chart-container">
              <div className="bar-chart-bars">
                {datosFiltrados.heights.map((height, index) => (
                  <div key={index} className="bar-chart-item">
                    <div 
                      className="bar-chart-bar" 
                      style={{ height: `${height}%` }}
                      title={`${datosFiltrados.labels[index]}: Bs. ${datosFiltrados.values[index]?.toLocaleString('es-BO') || '0'}`}
                    >
                      <span className="bar-value">
                        Bs. {datosFiltrados.values[index]?.toLocaleString('es-BO') || '0'}
                      </span>
                    </div>
                    <span className="bar-label">{datosFiltrados.labels[index]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Línea - Tendencia */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">
                <LineChart className="chart-title-icon" />
                Tendencia de Ventas
              </h3>
              <p className="chart-subtitle">Línea de tendencia temporal</p>
            </div>
          </div>
          <div className="chart-body">
            <div className="line-chart-container">
              <svg className="line-chart-svg" viewBox="0 0 800 300">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0066FF" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {datosFiltrados.values.length > 0 && (() => {
                  const maxValue = Math.max(...datosFiltrados.values, 1);
                  const points = datosFiltrados.values.map((value, index) => {
                    const x = (index / (datosFiltrados.values.length - 1 || 1)) * 800;
                    const y = 300 - (value / maxValue) * 250;
                    return `${x},${y}`;
                  }).join(' ');
                  
                  const areaPoints = `${points} L800,300 L0,300 Z`;
                  
                  return (
                    <>
                      <path d={`M${areaPoints}`} fill="url(#lineGradient)" />
                      <polyline
                        points={points}
                        fill="none"
                        stroke="#0066FF"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {datosFiltrados.values.map((value, index) => {
                        const x = (index / (datosFiltrados.values.length - 1 || 1)) * 800;
                        const y = 300 - (value / maxValue) * 250;
                        return (
                          <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r="6"
                            fill="#0066FF"
                            stroke="#fff"
                            strokeWidth="2"
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
              <div className="line-chart-labels">
                {datosFiltrados.labels.map((label, index) => (
                  <span key={index}>{label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Productos más vendidos */}
        {dashboardStats?.top_products && dashboardStats.top_products.length > 0 && (
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">
                  <PieChart className="chart-title-icon" />
                  Productos Más Vendidos
                </h3>
                <p className="chart-subtitle">Top productos por cantidad vendida</p>
              </div>
            </div>
            <div className="chart-body">
              <div className="top-products-list">
                {dashboardStats.top_products.map((product, index) => {
                  const maxSales = Math.max(...dashboardStats.top_products.map(p => p.sales || 0), 1);
                  const percentage = ((product.sales || 0) / maxSales) * 100;
                  
                  return (
                    <div key={index} className="top-product-item">
                      <div className="top-product-info">
                        <span className="top-product-rank">#{index + 1}</span>
                        <div className="top-product-details">
                          <p className="top-product-name">{product.name}</p>
                          <p className="top-product-sales">
                            {product.sales} unidades vendidas
                          </p>
                        </div>
                      </div>
                      <div className="top-product-bar-container">
                        <div 
                          className="top-product-bar" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                        <span className="top-product-revenue">
                          Bs. {product.revenue?.toLocaleString('es-BO', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          }) || '0.00'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas adicionales */}
        {estadisticas && (
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">
                  <Activity className="chart-title-icon" />
                  Análisis del Período
                </h3>
                <p className="chart-subtitle">Métricas comparativas</p>
              </div>
            </div>
            <div className="chart-body">
              <div className="analysis-grid">
                <div className="analysis-item">
                  <p className="analysis-label">Mejor Mes</p>
                  <p className="analysis-value">
                    Bs. {estadisticas.mesMejor.toLocaleString('es-BO', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                </div>
                <div className="analysis-item">
                  <p className="analysis-label">Peor Mes</p>
                  <p className="analysis-value">
                    Bs. {estadisticas.mesPeor.toLocaleString('es-BO', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                </div>
                <div className="analysis-item">
                  <p className="analysis-label">Diferencia</p>
                  <p className="analysis-value">
                    Bs. {(estadisticas.mesMejor - estadisticas.mesPeor).toLocaleString('es-BO', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

