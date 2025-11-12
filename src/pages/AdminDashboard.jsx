import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, User, Menu, X, TrendingUp, Zap, Bell, BarChart3, 
  Package, Users, FileText, Brain, Home, Settings, ChevronDown, Plus, 
  Download, Mic, DollarSign, ShoppingBag, AlertCircle, TrendingDown, 
  Edit, Trash2, Eye, Filter, Save, Upload, Calendar, CreditCard, 
  Mail, Phone, MapPin, Clock, CheckCircle, XCircle, AlertTriangle,
  UserPlus, UserMinus, Shield, Database, Activity, Target, PieChart,
  LineChart, BarChart, RefreshCw, Star, Heart, MessageSquare, 
  HelpCircle, LogOut, Lock, Key, Globe, Smartphone, Monitor, 
  Headphones, Camera, Gamepad2, Wrench
} from 'lucide-react';
import { listProducts, createProduct, updateProduct, deleteProduct, listCategorias, createCategoria, updateCategoria, deleteCategoria } from '../api/products.js';
import { listClients, getClient, getClientVentas, updateClient, deleteClient } from '../api/clients.js';
import { obtenerEstadisticasDashboard } from '../api/dashboard.js';
import ImageUpload from '../components/ImageUpload.jsx';
import HistorialVentas from '../components/HistorialVentas.jsx';
import ReportesDinamicos from '../components/ReportesDinamicos.jsx';
import './AdminDashboard.css';

export default function AdminDashboard({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(5);
  const [isListening, setIsListening] = useState(false);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productViewOpen, setProductViewOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    nombre: '', descripcion: '', precio: '', imagen: '', categoria: '', marca: '', proveedor: '', stock: ''
  });
  const [uiMessage, setUiMessage] = useState('');
  const [uiError, setUiError] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [imageMode, setImageMode] = useState('file'); // 'file' | 'url'
  const [categorias, setCategorias] = useState([]);
  const [categoriaModalOpen, setCategoriaModalOpen] = useState(false);
  const [editingCategoriaId, setEditingCategoriaId] = useState(null);
  const [categoriaForm, setCategoriaForm] = useState({ nombre: '', descripcion: '' });
  
  // Estados para gestión de clientes
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [clienteViewOpen, setClienteViewOpen] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState(null);
  const [viewCliente, setViewCliente] = useState(null);
  const [clienteForm, setClienteForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '', direccion: '', ciudad: '', estado: 'Activo'
  });

  // Usuario administrador
  const admin = {
    name: user?.nombre || 'Administrador',
    role: 'Administrador',
    avatar: user?.nombre?.charAt(0) || 'A'
  };

  // Datos del dashboard con colores azules - ahora desde API
  const stats = dashboardStats?.stats ? [
    {
      title: 'Ventas del Mes',
      value: `Bs. ${(dashboardStats.stats.ventas_mes?.value || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${(dashboardStats.stats.ventas_mes?.change || 0) >= 0 ? '+' : ''}${(dashboardStats.stats.ventas_mes?.change || 0).toFixed(1)}%`,
      trend: dashboardStats.stats.ventas_mes?.trend || 'up',
      icon: DollarSign,
      color: 'blue'
    },
    {
      title: 'Total Pedidos',
      value: (dashboardStats.stats.total_pedidos?.value || 0).toString(),
      change: `${(dashboardStats.stats.total_pedidos?.change || 0) >= 0 ? '+' : ''}${(dashboardStats.stats.total_pedidos?.change || 0).toFixed(1)}%`,
      trend: dashboardStats.stats.total_pedidos?.trend || 'up',
      icon: ShoppingBag,
      color: 'blue'
    },
    {
      title: 'Nuevos Clientes',
      value: (dashboardStats.stats.nuevos_clientes?.value || 0).toString(),
      change: `${(dashboardStats.stats.nuevos_clientes?.change || 0) >= 0 ? '+' : ''}${(dashboardStats.stats.nuevos_clientes?.change || 0).toFixed(1)}%`,
      trend: dashboardStats.stats.nuevos_clientes?.trend || 'up',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Productos Activos',
      value: (dashboardStats.stats.productos_activos?.value || productos.length || 0).toString(),
      change: `${(dashboardStats.stats.productos_activos?.change || 0) >= 0 ? '+' : ''}${(dashboardStats.stats.productos_activos?.change || 0).toFixed(1)}%`,
      trend: dashboardStats.stats.productos_activos?.trend || 'up',
      icon: Package,
      color: 'blue'
    }
  ] : [
    {
      title: 'Ventas del Mes',
      value: 'Bs. 0.00',
      change: '0%',
      trend: 'up',
      icon: DollarSign,
      color: 'blue'
    },
    {
      title: 'Total Pedidos',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: ShoppingBag,
      color: 'blue'
    },
    {
      title: 'Nuevos Clientes',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Productos Activos',
      value: productos.length.toString(),
      change: '0%',
      trend: 'up',
      icon: Package,
      color: 'blue'
    }
  ];

  const recentSales = dashboardStats?.ventas_recientes || [];
  const topProducts = dashboardStats?.top_products || [];

  const aiPredictions = {
    nextMonth: 142300,
    growth: 11.6,
    confidence: 87,
    topCategory: 'Tecnología'
  };

  // Menú del administrador con colores azules
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'Vista general del negocio' },
    { id: 'productos', label: 'Gestión de Productos', icon: Package, description: 'CRUD completo de productos' },
    { id: 'categorias', label: 'Categorías', icon: Filter, description: 'Gestionar categorías de productos' },
    { id: 'inventario', label: 'Inventario', icon: Database, description: 'Control de stock y almacén' },
    { id: 'clientes', label: 'Gestión de Clientes', icon: Users, description: 'Administrar usuarios y clientes' },
    { id: 'ventas', label: 'Ventas', icon: ShoppingCart, description: 'Historial y gestión de ventas' },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag, description: 'Seguimiento de pedidos' },
    { id: 'pagos', label: 'Pagos', icon: CreditCard, description: 'Gestión de pagos y facturación' },
    { id: 'reportes', label: 'Reportes', icon: FileText, description: 'Generar reportes dinámicos' },
    { id: 'analytics', label: 'Analytics', icon: BarChart, description: 'Análisis de datos y métricas' },
    { id: 'predicciones', label: 'Predicciones IA', icon: Brain, description: 'Análisis predictivo con IA' },
    { id: 'marketing', label: 'Marketing', icon: Target, description: 'Campañas y promociones' },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell, description: 'Sistema de alertas' },
    { id: 'configuracion', label: 'Configuración', icon: Settings, description: 'Configuración del sistema' }
  ];

  useEffect(() => {
    loadData();
    loadCategorias();
    loadDashboardStats();
  }, []);

  async function loadDashboardStats() {
    try {
      setLoadingStats(true);
      setUiError('');
      const data = await obtenerEstadisticasDashboard();
      if (data && data.success && data.stats) {
        setDashboardStats(data);
        setUiError('');
      } else {
        setDashboardStats(null);
        const errorMsg = data?.message || 'Los datos del dashboard están incompletos. Por favor, intente actualizar.';
        setUiError(errorMsg);
      }
    } catch (error) {
      console.error('Error cargando estadísticas del dashboard:', error);
      setDashboardStats(null);
      const errorMessage = error.message || 'No se pudieron cargar las estadísticas del dashboard. Por favor, intente nuevamente.';
      setUiError(errorMessage);
    } finally {
      setLoadingStats(false);
    }
  }

  // Cargar clientes cuando se entra a la sección
  useEffect(() => {
    if (activeSection === 'clientes') {
      loadClientes();
    }
  }, [activeSection]);

  async function loadData() {
    try {
      setLoading(true);
      const { items } = await listProducts();
      setProductos(items);
      
      // Cargar clientes desde la API
      try {
        const { clientes } = await listClients();
        setClientes(clientes || []);
      } catch (error) {
        console.error('Error cargando clientes:', error);
        setClientes([]);
      }
      
      setVentas(recentSales);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Estados para búsqueda y filtros de clientes
  const [clientesSearch, setClientesSearch] = useState('');
  const [clientesEstadoFilter, setClientesEstadoFilter] = useState('');
  const [clientesCiudadFilter, setClientesCiudadFilter] = useState('');
  const [clientesSortBy, setClientesSortBy] = useState('id');
  const [clientesSortOrder, setClientesSortOrder] = useState('asc');
  
  // Estados para historial de compras
  const [clienteVentas, setClienteVentas] = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(false);

  async function loadClientes() {
    try {
      setLoading(true);
      const params = {
        search: clientesSearch || undefined,
        estado: clientesEstadoFilter || undefined,
        ciudad: clientesCiudadFilter || undefined,
        sort_by: clientesSortBy,
        sort_order: clientesSortOrder
      };
      const { clientes } = await listClients(params);
      setClientes(clientes || []);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setUiError('Error al cargar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadClienteVentas(clienteId) {
    try {
      setLoadingVentas(true);
      const { ventas } = await getClientVentas(clienteId, { limit: 50 });
      setClienteVentas(ventas || []);
    } catch (error) {
      console.error('Error cargando ventas:', error);
      setClienteVentas([]);
    } finally {
      setLoadingVentas(false);
    }
  }

  async function loadCategorias() {
    try {
      const { categorias } = await listCategorias();
      setCategorias(categorias || []);
    } catch (e) {
      console.error('Error al cargar categorías:', e);
    }
  }

  // ---- Categorías CRUD Handlers ----
  function openNewCategoria() {
    setEditingCategoriaId(null);
    setCategoriaForm({ nombre: '', descripcion: '' });
    setCategoriaModalOpen(true);
    setUiMessage('');
    setUiError('');
  }

  function openEditCategoria(cat) {
    setEditingCategoriaId(cat.id);
    setCategoriaForm({ nombre: cat.nombre, descripcion: cat.descripcion || '' });
    setCategoriaModalOpen(true);
    setUiMessage('');
    setUiError('');
  }

  async function submitCategoriaForm(e) {
    e.preventDefault();
    setUiMessage('');
    setUiError('');
    
    if (!categoriaForm.nombre.trim()) {
      setUiError('El nombre es obligatorio');
      return;
    }
    
    try {
      setLoading(true);
      
      if (editingCategoriaId) {
        await updateCategoria({ id: editingCategoriaId, ...categoriaForm });
        setUiMessage('✅ Categoría actualizada correctamente');
      } else {
        await createCategoria(categoriaForm);
        setUiMessage('✅ Categoría creada correctamente');
      }
      
      await loadCategorias();
      // Cerrar modal después de 1 segundo
      setTimeout(() => {
        setCategoriaModalOpen(false);
        setEditingCategoriaId(null);
        setCategoriaForm({ nombre: '', descripcion: '' });
        setUiMessage('');
      }, 1500);
    } catch (e) {
      setUiError('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCategoria(id) {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    
    try {
      setLoading(true);
      await deleteCategoria(id);
      setUiMessage('✅ Categoría eliminada correctamente');
      await loadCategorias();
    } catch (e) {
      setUiError('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // ---- Clientes CRUD Handlers ----
  function openEditCliente(cliente) {
    setEditingClienteId(cliente.id);
    // Separar nombre completo si viene junto
    let nombre = cliente.nombre || '';
    let apellido = cliente.apellido || '';
    
    // Si no hay apellido separado, intentar extraerlo del nombre completo
    if (!apellido && nombre.includes(' ')) {
      const partes = nombre.split(' ');
      nombre = partes[0];
      apellido = partes.slice(1).join(' ');
    }
    
    setClienteForm({
      nombre: nombre,
      apellido: apellido,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      estado: cliente.estado || 'Activo'
    });
    setClienteModalOpen(true);
    setUiMessage('');
    setUiError('');
  }

  async function openViewCliente(cliente) {
    setViewCliente(cliente);
    setClienteViewOpen(true);
    // Cargar datos completos del cliente con estadísticas
    try {
      const { cliente: clienteCompleto } = await getClient(cliente.id);
      setViewCliente(clienteCompleto);
      // Cargar historial de compras
      await loadClienteVentas(cliente.id);
    } catch (error) {
      console.error('Error cargando detalles del cliente:', error);
      // Cargar ventas de todas formas
      await loadClienteVentas(cliente.id);
    }
  }

  async function submitClienteForm(e) {
    e.preventDefault();
    setUiMessage('');
    setUiError('');
    
    if (!clienteForm.nombre.trim() || !clienteForm.email.trim()) {
      setUiError('Nombre y email son obligatorios');
      return;
    }
    
    try {
      setLoading(true);
      
      const clienteData = {
        id: editingClienteId,
        nombre: clienteForm.nombre.trim(),
        apellido: clienteForm.apellido.trim(),
        email: clienteForm.email.trim(),
        telefono: clienteForm.telefono.trim(),
        direccion: clienteForm.direccion.trim(),
        ciudad: clienteForm.ciudad.trim(),
        estado: clienteForm.estado
      };
      
      await updateClient(clienteData);
      setUiMessage('✅ Cliente actualizado correctamente');
      await loadClientes();
      
      setTimeout(() => {
        setClienteModalOpen(false);
        setEditingClienteId(null);
        setClienteForm({ nombre: '', apellido: '', email: '', telefono: '', direccion: '', ciudad: '', estado: 'Activo' });
        setUiMessage('');
      }, 1500);
    } catch (e) {
      setUiError('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCliente(id) {
    if (!confirm('¿Estás seguro de desactivar este cliente?')) return;
    
    try {
      setLoading(true);
      await deleteClient(id);
      setUiMessage('✅ Cliente desactivado correctamente');
      await loadClientes();
    } catch (e) {
      setUiError('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // ---- Productos CRUD Handlers ----
  function openNewProduct() {
    setEditingProductId(null);
    setProductForm({ nombre:'', descripcion:'', precio:'', imagen:'', categoria:'', marca:'', proveedor:'', stock:'' });
    setUiMessage(''); setUiError('');
    setProductModalOpen(true);
  }

  function openEditProduct(p) {
    setEditingProductId(p.id);
    setProductForm({
      nombre: p.nombre || '', descripcion: p.descripcion || '', precio: String(p.precio || ''), imagen: p.imagen || '',
      categoria: p.categoria || '', marca: p.marca || '', proveedor: p.proveedor || '', stock: String(p.stock || '')
    });
    setUiMessage(''); setUiError('');
    setProductModalOpen(true);
  }

  async function submitProductForm(e) {
    e.preventDefault();
    setUiMessage(''); setUiError('');
    if (!productForm.nombre.trim() || !productForm.precio) { setUiError('Nombre y precio son obligatorios'); return; }
    try {
      const body = { ...productForm, precio: Number(productForm.precio), stock: Number(productForm.stock) || 0 };
      if (editingProductId) {
        await updateProduct({ id: editingProductId, ...body });
        setUiMessage('Producto actualizado correctamente');
      } else {
        await createProduct(body);
        setUiMessage('Producto creado correctamente');
      }
      setProductModalOpen(false);
      await loadData();
    } catch (err) {
      setUiError(err.message || 'Error');
    }
  }

  async function onDeleteProduct(id) {
    if (!window.confirm('¿Eliminar este producto?')) return;
    setUiError(''); setUiMessage('');
    try {
      await deleteProduct(id);
      setUiMessage('Producto eliminado');
      await loadData();
    } catch (err) {
      setUiError(err.message || 'Error al eliminar');
    }
  }

  const toggleVoiceCommand = () => {
    setIsListening(!isListening);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const renderDashboard = () => (
    <main className="admin-main">
      {/* Botón de actualizar estadísticas */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={loadDashboardStats}
          disabled={loadingStats}
          className="admin-content-button admin-content-button-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw className={`admin-content-button-icon ${loadingStats ? 'spinning' : ''}`} style={{ animation: loadingStats ? 'spin 1s linear infinite' : 'none' }} />
          <span>Actualizar Estadísticas</span>
        </button>
      </div>

      {/* Mensaje de error si existe */}
      {uiError && (
        <div className="error" style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', backgroundColor: '#fee', border: '1px solid #fcc' }}>
          {uiError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="admin-stat-card">
              <div className="admin-stat-header">
                <div className="admin-stat-icon">
                  <Icon className="admin-stat-icon-svg" />
                </div>
                <span className={`admin-stat-change ${stat.trend === 'up' ? 'admin-stat-up' : 'admin-stat-down'}`}>
                  {stat.change}
                </span>
              </div>
              <p className="admin-stat-title">{stat.title}</p>
              <p className="admin-stat-value">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="admin-charts-grid">
        {/* Ventas Chart */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <h3 className="admin-chart-title">Ventas Mensuales</h3>
            <button className="admin-chart-button">Ver detalles</button>
          </div>
          <div className="admin-chart-content">
            {dashboardStats?.ventas_mensuales?.heights ? (
              dashboardStats.ventas_mensuales.heights.map((height, index) => (
                <div key={index} className="admin-chart-bar" style={{height: `${height}%`}}></div>
              ))
            ) : (
              [65, 78, 85, 72, 90, 88, 95, 82, 75, 92, 88, 85].map((height, index) => (
                <div key={index} className="admin-chart-bar" style={{height: `${height}%`}}></div>
              ))
            )}
          </div>
          <div className="admin-chart-labels">
            {dashboardStats?.ventas_mensuales?.labels ? (
              dashboardStats.ventas_mensuales.labels.map((label, index) => (
                <span key={index}>{label}</span>
              ))
            ) : (
              <>
                <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span>
                <span>Jul</span><span>Ago</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dic</span>
              </>
            )}
          </div>
        </div>

        {/* AI Predictions */}
        <div className="admin-ai-card">
          <div className="admin-ai-header">
            <Brain className="admin-ai-icon" />
            <h3 className="admin-ai-title">Predicciones IA</h3>
          </div>
          <div className="admin-ai-content">
            <div className="admin-ai-section">
              <p className="admin-ai-label">Ventas Próximo Mes</p>
              <p className="admin-ai-value">Bs. {aiPredictions.nextMonth.toLocaleString()}</p>
              <div className="admin-ai-trend">
                <TrendingUp className="admin-ai-trend-icon" />
                <span className="admin-ai-trend-text">+{aiPredictions.growth}% proyectado</span>
              </div>
            </div>
            <div className="admin-ai-divider"></div>
            <div className="admin-ai-section">
              <p className="admin-ai-label">Nivel de Confianza</p>
              <div className="admin-ai-progress">
                <div className="admin-ai-progress-bar">
                  <div className="admin-ai-progress-fill" style={{width: `${aiPredictions.confidence}%`}}></div>
                </div>
                <span className="admin-ai-progress-text">{aiPredictions.confidence}%</span>
              </div>
            </div>
            <div className="admin-ai-divider"></div>
            <div className="admin-ai-section">
              <p className="admin-ai-label">Categoría Top</p>
              <p className="admin-ai-category">{aiPredictions.topCategory}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="admin-tables-grid">
        {/* Recent Sales */}
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h3 className="admin-table-title">Ventas Recientes</h3>
            <button className="admin-table-button">
              <span>Exportar</span>
              <Download className="admin-table-icon" />
            </button>
          </div>
          <div className="admin-table-content">
            <table className="admin-table">
              <thead>
                <tr className="admin-table-header-row">
                  <th className="admin-table-header-cell">ID</th>
                  <th className="admin-table-header-cell">Cliente</th>
                  <th className="admin-table-header-cell">Monto</th>
                  <th className="admin-table-header-cell">Estado</th>
                </tr>
              </thead>
              <tbody className="admin-table-body">
                {loadingStats ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                      <div className="admin-spinner" style={{ margin: '0 auto' }}></div>
                      <p style={{ marginTop: '8px', color: '#6b7280' }}>Cargando ventas...</p>
                    </td>
                  </tr>
                ) : recentSales.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                      No hay ventas recientes
                    </td>
                  </tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale.id} className="admin-table-row">
                      <td className="admin-table-cell">{sale.id}</td>
                      <td className="admin-table-cell admin-table-cell-bold">{sale.client}</td>
                      <td className="admin-table-cell admin-table-cell-bold">Bs. {sale.amount.toFixed(2)}</td>
                      <td className="admin-table-cell">
                        <span className={`admin-table-status admin-table-status-${sale.status.toLowerCase().replace(' ', '-')}`}>
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h3 className="admin-table-title">Productos Top</h3>
            <button className="admin-table-button">Ver todos</button>
          </div>
          <div className="admin-table-content">
            {loadingStats ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div className="admin-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '8px', color: '#6b7280' }}>Cargando productos...</p>
              </div>
            ) : topProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                No hay productos vendidos aún
              </div>
            ) : (
              <div className="admin-products-list">
                {topProducts.map((product, index) => {
                  const maxSales = Math.max(...topProducts.map(p => p.sales), 1);
                  return (
                    <div key={index} className="admin-product-item">
                      <div className="admin-product-info">
                        <p className="admin-product-name">{product.name}</p>
                        <p className="admin-product-sales">{product.sales} ventas</p>
                      </div>
                      <div className="admin-product-stats">
                        <p className="admin-product-revenue">Bs. {product.revenue.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <div className="admin-product-bar">
                          <div className="admin-product-bar-fill" style={{width: `${(product.sales / maxSales) * 100}%`}}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-actions-grid">
        <button 
          onClick={() => setActiveSection('productos')}
          className="admin-action-button admin-action-primary"
        >
          <Plus className="admin-action-icon" />
          <span className="admin-action-text">Nuevo Producto</span>
        </button>
        <button 
          onClick={() => setActiveSection('reportes')}
          className="admin-action-button admin-action-secondary"
        >
          <FileText className="admin-action-icon" />
          <span className="admin-action-text">Generar Reporte</span>
        </button>
        <button 
          onClick={() => setActiveSection('predicciones')}
          className="admin-action-button admin-action-tertiary"
        >
          <Brain className="admin-action-icon" />
          <span className="admin-action-text">Ver Predicciones</span>
        </button>
      </div>
    </main>
  );

  const renderProductos = () => (
    <main className="admin-main">
      <div className="admin-content-card">
        <div className="admin-content-header">
          <div className="admin-content-title-section">
            <h3 className="admin-content-title">Gestión de Productos</h3>
            <p className="admin-content-subtitle">Administra el catálogo de productos</p>
          </div>
          <div className="admin-content-actions">
            <button 
              onClick={openNewProduct}
              className="admin-content-button admin-content-button-primary"
            >
              <Plus className="admin-content-button-icon" />
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner"></div>
            <p className="admin-loading-text">Cargando productos...</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table admin-table-full">
              <thead>
                <tr className="admin-table-header-row">
                  <th className="admin-table-header-cell">Imagen</th>
                  <th className="admin-table-header-cell">Nombre</th>
                  <th className="admin-table-header-cell">Categoría</th>
                  <th className="admin-table-header-cell">Precio</th>
                  <th className="admin-table-header-cell">Stock</th>
                  <th className="admin-table-header-cell">Estado</th>
                  <th className="admin-table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody className="admin-table-body">
                {productos.map((producto) => (
                  <tr key={producto.id} className="admin-table-row">
                    <td className="admin-table-cell">
                      {producto.imagen ? (
                        <img src={producto.imagen} alt={producto.nombre} className="admin-product-image" />
                      ) : (
                        <div className="admin-product-placeholder">
                          <Package className="admin-product-placeholder-icon" />
                        </div>
                      )}
                    </td>
                    <td className="admin-table-cell admin-table-cell-bold">{producto.nombre}</td>
                    <td className="admin-table-cell">{producto.categoria || 'General'}</td>
                    <td className="admin-table-cell admin-table-cell-bold">Bs. {producto.precio.toFixed(2)}</td>
                    <td className="admin-table-cell">
                      <span className={`admin-stock-badge admin-stock-badge-${producto.stock > 10 ? 'high' : producto.stock > 5 ? 'medium' : 'low'}`}>
                        {producto.stock}
                      </span>
                    </td>
                    <td className="admin-table-cell">
                      <span className="admin-status-badge admin-status-active">
                        Activo
                      </span>
                    </td>
                    <td className="admin-table-cell">
                      <div className="admin-action-buttons">
                        <button className="admin-action-button-small admin-action-view" title="Ver detalles" onClick={()=>{ setViewItem(producto); setProductViewOpen(true); }}>
                          <Eye className="admin-action-icon-small" />
                        </button>
                        <button className="admin-action-button-small admin-action-edit" title="Editar" onClick={()=>openEditProduct(producto)}>
                          <Edit className="admin-action-icon-small" />
                        </button>
                        <button className="admin-action-button-small admin-action-delete" title="Eliminar" onClick={()=>onDeleteProduct(producto.id)}>
                          <Trash2 className="admin-action-icon-small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mensajes de operación */}
      {(uiMessage || uiError) && (
        <div style={{ marginTop: 12 }}>
          {uiMessage && <div className="success">{uiMessage}</div>}
          {uiError && <div className="error">{uiError}</div>}
        </div>
      )}

      {/* Modal Crear / Editar Producto */}
      {productModalOpen && (
        <div className="admin-product-modal" onClick={()=>setProductModalOpen(false)}>
          <div className="admin-product-modal-content" onClick={(e)=>e.stopPropagation()}>
            <button className="admin-product-modal-close" onClick={()=>setProductModalOpen(false)} title="Cerrar">×</button>
            <div className="admin-product-modal-header">
              <h3 className="admin-product-modal-title">{editingProductId ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h3>
            </div>
            <div className="admin-product-modal-body">
              <form onSubmit={submitProductForm}>
                <div className="admin-product-form-grid">
                  <label className="admin-product-form-label">
                    Nombre*
                    <input 
                      className="admin-product-form-input" 
                      value={productForm.nombre} 
                      onChange={e=>setProductForm({ ...productForm, nombre:e.target.value })} 
                      placeholder="Ej: Laptop Gaming"
                      required 
                    />
                  </label>
                  <label className="admin-product-form-label">
                    Precio*
                    <input 
                      className="admin-product-form-input" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={productForm.precio} 
                      onChange={e=>setProductForm({ ...productForm, precio:e.target.value })} 
                      placeholder="199.99"
                      required 
                    />
                  </label>
                  <label className="admin-product-form-label">
                    Stock
                    <input 
                      className="admin-product-form-input" 
                      type="number" 
                      min="0" 
                      value={productForm.stock} 
                      onChange={e=>setProductForm({ ...productForm, stock:e.target.value })} 
                      placeholder="10"
                    />
                  </label>
                  <label className="admin-product-form-label">
                    Categoría
                    <select 
                      className="admin-product-form-input" 
                      value={productForm.categoria} 
                      onChange={e=>setProductForm({ ...productForm, categoria:e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#fff' }}
                    >
                      <option value="">Seleccione una categoría</option>
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.nombre}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-product-form-label">
                    Marca
                    <input 
                      className="admin-product-form-input" 
                      value={productForm.marca} 
                      onChange={e=>setProductForm({ ...productForm, marca:e.target.value })} 
                      placeholder="Ej: Apple"
                    />
                  </label>
                  <label className="admin-product-form-label">
                    Proveedor
                    <input 
                      className="admin-product-form-input" 
                      value={productForm.proveedor} 
                      onChange={e=>setProductForm({ ...productForm, proveedor:e.target.value })} 
                      placeholder="Ej: TechSupply Corp"
                    />
                  </label>
                  <label className="admin-product-form-label admin-product-form-full">
                    Descripción
                    <textarea 
                      className="admin-product-form-textarea" 
                      value={productForm.descripcion} 
                      onChange={e=>setProductForm({ ...productForm, descripcion:e.target.value })} 
                      placeholder="Descripción detallada del producto..."
                    />
                  </label>
                  <div className="admin-product-form-full">
                    <div className="admin-product-form-label" style={{ gap: 12 }}>
                      Imagen del producto
                      <div className="admin-tabs">
                        <button type="button" className={`admin-tab ${imageMode==='file' ? 'admin-tab-active' : ''}`} onClick={()=>setImageMode('file')}>Desde archivo</button>
                        <button type="button" className={`admin-tab ${imageMode==='url' ? 'admin-tab-active' : ''}`} onClick={()=>setImageMode('url')}>Desde URL</button>
                      </div>
                      {imageMode === 'file' ? (
                        <ImageUpload 
                          currentImage={productForm.imagen}
                          onImageUploaded={(url)=> setProductForm({ ...productForm, imagen: url })}
                        />
                      ) : (
                        <input 
                          className="admin-product-form-input" 
                          type="url" 
                          value={productForm.imagen} 
                          onChange={e=>setProductForm({ ...productForm, imagen:e.target.value })} 
                          placeholder="https://ejemplo.com/imagen.jpg"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="admin-product-form-actions">
                  <button type="submit" className="admin-content-button admin-content-button-primary">{editingProductId ? '💾 Guardar' : '➕ Crear'}</button>
                  <button type="button" className="admin-content-button admin-content-button-secondary" onClick={()=>setProductModalOpen(false)}>Cancelar</button>
                </div>
                {uiError && <div className="error" style={{ marginTop:16 }}>{uiError}</div>}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalle */}
      {productViewOpen && viewItem && (
        <div className="admin-product-modal" onClick={()=>setProductViewOpen(false)}>
          <div className="admin-product-modal-content" onClick={(e)=>e.stopPropagation()}>
            <button className="admin-product-modal-close" onClick={()=>setProductViewOpen(false)} title="Cerrar">×</button>
            <div className="admin-product-modal-header">
              <h3 className="admin-product-modal-title">👁️ Detalle de Producto</h3>
            </div>
            <div className="admin-product-modal-body">
              <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:16 }}>
                <div>
                  {viewItem.imagen ? (
                    <img src={viewItem.imagen} alt={viewItem.nombre} style={{ width:'100%', height:140, objectFit:'cover', borderRadius:8 }} />
                  ) : (
                    <div style={{ width:'100%', height:140, background:'#f3f4f6', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af' }}>Sin imagen</div>
                  )}
                </div>
                <div className="admin-product-form-grid">
                  <div className="admin-product-form-label">
                    Nombre
                    <div className="admin-product-form-input" style={{ pointerEvents:'none' }}>{viewItem.nombre}</div>
                  </div>
                  <div className="admin-product-form-label">
                    Precio
                    <div className="admin-product-form-input" style={{ pointerEvents:'none' }}>Bs. {viewItem.precio}</div>
                  </div>
                  <div className="admin-product-form-label">
                    Stock
                    <div className="admin-product-form-input" style={{ pointerEvents:'none' }}>{viewItem.stock}</div>
                  </div>
                  <div className="admin-product-form-label">
                    Categoría
                    <div className="admin-product-form-input" style={{ pointerEvents:'none' }}>{viewItem.categoria || '-'}</div>
                  </div>
                  <div className="admin-product-form-label">
                    Marca
                    <div className="admin-product-form-input" style={{ pointerEvents:'none' }}>{viewItem.marca || '-'}</div>
                  </div>
                  <div className="admin-product-form-label">
                    Proveedor
                    <div className="admin-product-form-input" style={{ pointerEvents:'none' }}>{viewItem.proveedor || '-'}</div>
                  </div>
                  {viewItem.descripcion && (
                    <div className="admin-product-form-label admin-product-form-full">
                      Descripción
                      <div className="admin-product-form-textarea" style={{ pointerEvents:'none' }}>{viewItem.descripcion}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );

  const renderClientes = () => (
    <main className="admin-main">
      <div className="admin-content-card">
        <div className="admin-content-header">
          <div className="admin-content-title-section">
            <h3 className="admin-content-title">Gestión de Clientes</h3>
            <p className="admin-content-subtitle">Administra usuarios y clientes del sistema</p>
          </div>
          <div className="admin-content-actions">
            <button 
              onClick={loadClientes}
              className="admin-content-button admin-content-button-secondary"
              title="Recargar clientes"
            >
              <RefreshCw className="admin-content-button-icon" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Búsqueda y Filtros */}
        <div style={{ 
          padding: '16px', 
          background: '#f9fafb', 
          borderRadius: '8px', 
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              🔍 Búsqueda
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre, email, teléfono..."
              value={clientesSearch}
              onChange={(e) => setClientesSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadClientes()}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Estado
            </label>
            <select
              value={clientesEstadoFilter}
              onChange={(e) => setClientesEstadoFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
            >
              <option value="">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Ciudad
            </label>
            <input
              type="text"
              placeholder="Filtrar por ciudad..."
              value={clientesCiudadFilter}
              onChange={(e) => setClientesCiudadFilter(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadClientes()}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Ordenar por
            </label>
            <select
              value={clientesSortBy}
              onChange={(e) => setClientesSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
            >
              <option value="id">ID</option>
              <option value="nombre">Nombre</option>
              <option value="monto_total">Monto Total</option>
              <option value="total_compras">Total Compras</option>
            </select>
          </div>

          <div style={{ minWidth: '120px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Orden
            </label>
            <select
              value={clientesSortOrder}
              onChange={(e) => setClientesSortOrder(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </div>

          <button
            onClick={loadClientes}
            style={{
              padding: '8px 16px',
              background: 'var(--admin-header-bg)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            🔄 Aplicar
          </button>

          {(clientesSearch || clientesEstadoFilter || clientesCiudadFilter) && (
            <button
              onClick={() => {
                setClientesSearch('');
                setClientesEstadoFilter('');
                setClientesCiudadFilter('');
                setClientesSortBy('id');
                setClientesSortOrder('asc');
                setTimeout(() => loadClientes(), 100);
              }}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}
            >
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Mensajes de operación */}
        {(uiMessage || uiError) && (
          <div style={{ marginTop: 12, marginBottom: 12 }}>
            {uiMessage && <div className="success">{uiMessage}</div>}
            {uiError && <div className="error">{uiError}</div>}
          </div>
        )}

        {loading && clientes.length === 0 ? (
          <div className="admin-loading">
            <div className="admin-spinner"></div>
            <p className="admin-loading-text">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '80px 40px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'var(--admin-header-bg)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Users style={{ width: '32px', height: '32px', color: 'var(--admin-text-secondary)' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--admin-text-primary)', margin: '0 0 8px 0' }}>
              No hay clientes registrados
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', margin: '0 0 24px 0' }}>
              Los clientes registrados aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table admin-table-full">
              <thead>
                <tr className="admin-table-header-row">
                  <th className="admin-table-header-cell">ID</th>
                  <th className="admin-table-header-cell">Nombre</th>
                  <th className="admin-table-header-cell">Email</th>
                  <th className="admin-table-header-cell">Teléfono</th>
                  <th className="admin-table-header-cell">Ciudad</th>
                  <th className="admin-table-header-cell">Compras</th>
                  <th className="admin-table-header-cell">Monto Total</th>
                  <th className="admin-table-header-cell">Última Compra</th>
                  <th className="admin-table-header-cell">Estado</th>
                  <th className="admin-table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody className="admin-table-body">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="admin-table-row">
                    <td className="admin-table-cell">#{cliente.id}</td>
                    <td className="admin-table-cell admin-table-cell-bold">{cliente.nombre}</td>
                    <td className="admin-table-cell">{cliente.email}</td>
                    <td className="admin-table-cell">{cliente.telefono || '-'}</td>
                    <td className="admin-table-cell">{cliente.ciudad || '-'}</td>
                    <td className="admin-table-cell">
                      <span style={{ fontWeight: '600', color: 'var(--admin-header-bg)' }}>
                        {cliente.total_compras || 0}
                      </span>
                    </td>
                    <td className="admin-table-cell admin-table-cell-bold">
                      Bs. {cliente.monto_total ? cliente.monto_total.toFixed(2) : '0.00'}
                    </td>
                    <td className="admin-table-cell" style={{ fontSize: '12px', color: '#6b7280' }}>
                      {cliente.ultima_compra ? new Date(cliente.ultima_compra).toLocaleDateString('es-ES') : 'Nunca'}
                    </td>
                    <td className="admin-table-cell">
                      <span className={`admin-status-badge admin-status-${cliente.estado.toLowerCase()}`}>
                        {cliente.estado}
                      </span>
                    </td>
                    <td className="admin-table-cell">
                      <div className="admin-action-buttons">
                        <button 
                          className="admin-action-button-small admin-action-view" 
                          title="Ver perfil"
                          onClick={() => openViewCliente(cliente)}
                        >
                          <Eye className="admin-action-icon-small" />
                        </button>
                        <button 
                          className="admin-action-button-small admin-action-edit" 
                          title="Editar"
                          onClick={() => openEditCliente(cliente)}
                        >
                          <Edit className="admin-action-icon-small" />
                        </button>
                        <button 
                          className="admin-action-button-small admin-action-delete" 
                          title="Desactivar"
                          onClick={() => handleDeleteCliente(cliente.id)}
                          disabled={loading}
                        >
                          <UserMinus className="admin-action-icon-small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ver Cliente */}
      {clienteViewOpen && viewCliente && (
        <div className="admin-product-modal" onClick={() => { setClienteViewOpen(false); setClienteVentas([]); }} style={{ overflowY: 'auto', maxHeight: '100vh' }}>
          <div className="admin-product-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="admin-product-modal-close" onClick={() => { setClienteViewOpen(false); setClienteVentas([]); }} title="Cerrar">×</button>
            <div className="admin-product-modal-header">
              <h3 className="admin-product-modal-title">👁️ Detalle de Cliente: {viewCliente.nombre || 'Cargando...'}</h3>
            </div>
            <div className="admin-product-modal-body">
              {/* Información Básica */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>📋 Información Personal</h4>
                <div className="admin-product-form-grid">
                  <div className="admin-product-form-label">
                    ID
                    <div className="admin-product-form-input" style={{ pointerEvents: 'none' }}>#{viewCliente.id}</div>
                  </div>
                  <div className="admin-product-form-label">
                    Estado
                    <div className="admin-product-form-input" style={{ pointerEvents: 'none' }}>
                      <span className={`admin-status-badge admin-status-${(viewCliente.estado || 'Activo').toLowerCase()}`}>
                        {viewCliente.estado || 'Activo'}
                      </span>
                    </div>
                  </div>
                  <div className="admin-product-form-label">
                    Nombre
                    <div className="admin-product-form-input" style={{ pointerEvents: 'none' }}>{viewCliente.nombre || '-'}</div>
                  </div>
                  <div className="admin-product-form-label">
                    Email
                    <div className="admin-product-form-input" style={{ pointerEvents: 'none' }}>{viewCliente.email || '-'}</div>
                  </div>
                  <div className="admin-product-form-label">
                    Teléfono
                    <div className="admin-product-form-input" style={{ pointerEvents: 'none' }}>{viewCliente.telefono || '-'}</div>
                  </div>
                  <div className="admin-product-form-label">
                    Ciudad
                    <div className="admin-product-form-input" style={{ pointerEvents: 'none' }}>{viewCliente.ciudad || '-'}</div>
                  </div>
                  <div className="admin-product-form-label admin-product-form-full">
                    Dirección
                    <div className="admin-product-form-input" style={{ pointerEvents: 'none' }}>{viewCliente.direccion || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              {viewCliente.estadisticas && (
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>📊 Estadísticas de Compras</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    <div style={{ padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Compras</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--admin-header-bg)' }}>
                        {viewCliente.estadisticas.total_compras || 0}
                      </div>
                    </div>
                    <div style={{ padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Monto Total</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                        Bs. {(viewCliente.estadisticas.monto_total || 0).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Promedio por Compra</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                        Bs. {(viewCliente.estadisticas.promedio_compra || 0).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Compras Este Mes</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                        {viewCliente.estadisticas.compras_mes_actual || 0}
                      </div>
                      {viewCliente.estadisticas.monto_mes_actual > 0 && (
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                          Bs. {viewCliente.estadisticas.monto_mes_actual.toFixed(2)}
                        </div>
                      )}
                    </div>
                    {viewCliente.estadisticas.ultima_compra && (
                      <div style={{ padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Última Compra</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                          {new Date(viewCliente.estadisticas.ultima_compra).toLocaleDateString('es-ES')}
                        </div>
                        {viewCliente.estadisticas.dias_desde_ultima_compra !== null && (
                          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                            Hace {viewCliente.estadisticas.dias_desde_ultima_compra} días
                          </div>
                        )}
                      </div>
                    )}
                    {viewCliente.estadisticas.primera_compra && (
                      <div style={{ padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Antigüedad</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                          {viewCliente.estadisticas.antiguedad_dias ? `${Math.floor(viewCliente.estadisticas.antiguedad_dias / 30)} meses` : '-'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                          Primera compra: {new Date(viewCliente.estadisticas.primera_compra).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Historial de Compras */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>📋 Historial de Compras</h4>
                  {loadingVentas && <span style={{ fontSize: '12px', color: '#6b7280' }}>Cargando...</span>}
                </div>
                {loadingVentas ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="admin-spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '12px', color: '#6b7280' }}>Cargando historial...</p>
                  </div>
                ) : clienteVentas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ color: '#6b7280' }}>Este cliente aún no ha realizado compras</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="admin-table" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr className="admin-table-header-row">
                          <th className="admin-table-header-cell">ID Venta</th>
                          <th className="admin-table-header-cell">Fecha</th>
                          <th className="admin-table-header-cell">Productos</th>
                          <th className="admin-table-header-cell">Total</th>
                          <th className="admin-table-header-cell">Estado</th>
                          <th className="admin-table-header-cell">Pago</th>
                        </tr>
                      </thead>
                      <tbody className="admin-table-body">
                        {clienteVentas.map((venta) => (
                          <tr key={venta.id_venta} className="admin-table-row">
                            <td className="admin-table-cell">#{venta.id_venta}</td>
                            <td className="admin-table-cell" style={{ fontSize: '11px' }}>
                              {new Date(venta.fecha_venta).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="admin-table-cell">
                              <span style={{ fontWeight: '600' }}>{venta.total_productos}</span> productos
                            </td>
                            <td className="admin-table-cell admin-table-cell-bold">
                              Bs. {venta.total.toFixed(2)}
                            </td>
                            <td className="admin-table-cell">
                              <span className={`admin-status-badge admin-status-${venta.estado.toLowerCase()}`}>
                                {venta.estado}
                              </span>
                            </td>
                            <td className="admin-table-cell" style={{ fontSize: '11px' }}>
                              {venta.metodo_pago || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Cliente */}
      {clienteModalOpen && (
        <div className="admin-product-modal" onClick={() => setClienteModalOpen(false)}>
          <div className="admin-product-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="admin-product-modal-close" onClick={() => setClienteModalOpen(false)} title="Cerrar">×</button>
            <div className="admin-product-modal-header">
              <h3 className="admin-product-modal-title">✏️ Editar Cliente</h3>
            </div>
            <div className="admin-product-modal-body">
              <form onSubmit={submitClienteForm}>
                <div className="admin-product-form-grid">
                  <label className="admin-product-form-label">
                    Nombre *
                    <input
                      className="admin-product-form-input"
                      value={clienteForm.nombre}
                      onChange={e => setClienteForm({ ...clienteForm, nombre: e.target.value })}
                      placeholder="Ej: Juan"
                      required
                    />
                  </label>
                  <label className="admin-product-form-label">
                    Apellido
                    <input
                      className="admin-product-form-input"
                      value={clienteForm.apellido}
                      onChange={e => setClienteForm({ ...clienteForm, apellido: e.target.value })}
                      placeholder="Ej: Pérez"
                    />
                  </label>
                  <label className="admin-product-form-label">
                    Email *
                    <input
                      className="admin-product-form-input"
                      type="email"
                      value={clienteForm.email}
                      onChange={e => setClienteForm({ ...clienteForm, email: e.target.value })}
                      placeholder="Ej: juan@email.com"
                      required
                    />
                  </label>
                  <label className="admin-product-form-label">
                    Teléfono
                    <input
                      className="admin-product-form-input"
                      value={clienteForm.telefono}
                      onChange={e => setClienteForm({ ...clienteForm, telefono: e.target.value })}
                      placeholder="Ej: +591 70123456"
                    />
                  </label>
                  <label className="admin-product-form-label admin-product-form-full">
                    Dirección
                    <input
                      className="admin-product-form-input"
                      value={clienteForm.direccion}
                      onChange={e => setClienteForm({ ...clienteForm, direccion: e.target.value })}
                      placeholder="Ej: Calle Principal #123"
                    />
                  </label>
                  <label className="admin-product-form-label">
                    Ciudad
                    <input
                      className="admin-product-form-input"
                      value={clienteForm.ciudad}
                      onChange={e => setClienteForm({ ...clienteForm, ciudad: e.target.value })}
                      placeholder="Ej: La Paz"
                    />
                  </label>
                  <label className="admin-product-form-label">
                    Estado
                    <select
                      className="admin-product-form-input"
                      value={clienteForm.estado}
                      onChange={e => setClienteForm({ ...clienteForm, estado: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#fff' }}
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </label>
                </div>
                <div className="admin-product-form-actions">
                  <button type="submit" className="admin-content-button admin-content-button-primary" disabled={loading}>
                    {loading ? '⏳' : '💾 Guardar'}
                  </button>
                  <button
                    type="button"
                    className="admin-content-button admin-content-button-secondary"
                    onClick={() => setClienteModalOpen(false)}
                  >
                    Cancelar
                  </button>
                </div>
                {uiError && <div className="error" style={{ marginTop: 16 }}>{uiError}</div>}
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );

  const renderVentas = () => (
    <main className="admin-main">
      <div className="admin-content-card">
        <div className="admin-content-header">
          <div className="admin-content-title-section">
            <h3 className="admin-content-title">Gestión de Ventas</h3>
            <p className="admin-content-subtitle">Historial y seguimiento de ventas</p>
          </div>
          <div className="admin-content-actions">
            <button className="admin-content-button admin-content-button-secondary">
              <Calendar className="admin-content-button-icon" />
              <span>Filtrar por fecha</span>
            </button>
            <button className="admin-content-button admin-content-button-primary">
              <Download className="admin-content-button-icon" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table admin-table-full">
            <thead>
              <tr className="admin-table-header-row">
                <th className="admin-table-header-cell">ID Venta</th>
                <th className="admin-table-header-cell">Cliente</th>
                <th className="admin-table-header-cell">Productos</th>
                <th className="admin-table-header-cell">Monto Total</th>
                <th className="admin-table-header-cell">Fecha</th>
                <th className="admin-table-header-cell">Estado</th>
                <th className="admin-table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {ventas.map((venta) => (
                <tr key={venta.id} className="admin-table-row">
                  <td className="admin-table-cell">{venta.id}</td>
                  <td className="admin-table-cell admin-table-cell-bold">{venta.client}</td>
                  <td className="admin-table-cell">3 productos</td>
                  <td className="admin-table-cell admin-table-cell-bold">Bs. {venta.amount.toFixed(2)}</td>
                  <td className="admin-table-cell">{venta.date}</td>
                  <td className="admin-table-cell">
                    <span className={`admin-table-status admin-table-status-${venta.status.toLowerCase().replace(' ', '-')}`}>
                      {venta.status}
                    </span>
                  </td>
                  <td className="admin-table-cell">
                    <div className="admin-action-buttons">
                      <button className="admin-action-button-small admin-action-view" title="Ver detalles">
                        <Eye className="admin-action-icon-small" />
                      </button>
                      <button className="admin-action-button-small admin-action-edit" title="Procesar">
                        <CheckCircle className="admin-action-icon-small" />
                      </button>
                      <button className="admin-action-button-small admin-action-delete" title="Cancelar">
                        <XCircle className="admin-action-icon-small" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );

  const renderCategorias = () => (
    <main className="admin-main">
      <div className="admin-content-card">
        <div className="admin-content-header">
          <div className="admin-content-title-section">
            <h3 className="admin-content-title">Gestión de Categorías</h3>
            <p className="admin-content-subtitle">Administra las categorías de productos</p>
          </div>
          <div className="admin-content-actions">
            <button 
              onClick={openNewCategoria}
              className="admin-content-button admin-content-button-primary"
            >
              <Plus className="admin-content-button-icon" />
              <span>Nueva Categoría</span>
            </button>
          </div>
        </div>


        {loading && categorias.length === 0 ? (
          <div className="admin-loading">
            <div className="admin-spinner"></div>
            <p className="admin-loading-text">Cargando categorías...</p>
          </div>
        ) : categorias.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '80px 40px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'var(--admin-header-bg)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Filter style={{ width: '32px', height: '32px', color: 'var(--admin-text-secondary)' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--admin-text-primary)', margin: '0 0 8px 0' }}>
              No hay categorías
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', margin: '0 0 24px 0' }}>
              Crea tu primera categoría para organizar tus productos
            </p>
            <button 
              onClick={openNewCategoria}
              className="admin-content-button admin-content-button-primary"
            >
              <Plus className="admin-content-button-icon" />
              <span>Crear Categoría</span>
            </button>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table admin-table-full">
              <thead>
                <tr className="admin-table-header-row">
                  <th className="admin-table-header-cell">ID</th>
                  <th className="admin-table-header-cell">Nombre</th>
                  <th className="admin-table-header-cell">Descripción</th>
                  <th className="admin-table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody className="admin-table-body">
                {categorias.map((cat) => (
                  <tr key={cat.id} className="admin-table-row">
                    <td className="admin-table-cell">{cat.id}</td>
                    <td className="admin-table-cell admin-table-cell-bold">{cat.nombre}</td>
                    <td className="admin-table-cell">{cat.descripcion || '-'}</td>
                    <td className="admin-table-cell">
                      <div className="admin-action-buttons">
                        <button 
                          className="admin-action-button-small admin-action-edit" 
                          title="Editar" 
                          onClick={() => openEditCategoria(cat)}
                        >
                          <Edit className="admin-action-icon-small" />
                        </button>
                        <button 
                          className="admin-action-button-small admin-action-delete" 
                          title="Eliminar" 
                          onClick={() => handleDeleteCategoria(cat.id)}
                          disabled={loading}
                        >
                          <Trash2 className="admin-action-icon-small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mensajes de operación */}
      {(uiMessage || uiError) && (
        <div style={{ marginTop: 12 }}>
          {uiMessage && <div className="success">{uiMessage}</div>}
          {uiError && <div className="error">{uiError}</div>}
        </div>
      )}

      {/* Modal Crear / Editar Categoría */}
      {categoriaModalOpen && (
        <div className="admin-product-modal" onClick={() => setCategoriaModalOpen(false)}>
          <div className="admin-product-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="admin-product-modal-close" onClick={() => setCategoriaModalOpen(false)} title="Cerrar">×</button>
            <div className="admin-product-modal-header">
              <h3 className="admin-product-modal-title">
                {editingCategoriaId ? '✏️ Editar Categoría' : '➕ Nueva Categoría'}
              </h3>
            </div>
            <div className="admin-product-modal-body">
              <form onSubmit={submitCategoriaForm}>
                <div className="admin-product-form-grid">
                  <label className="admin-product-form-label admin-product-form-full">
                    Nombre *
                    <input
                      className="admin-product-form-input"
                      value={categoriaForm.nombre}
                      onChange={e => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })}
                      placeholder="Ej: Tecnología"
                      required
                    />
                  </label>
                  <label className="admin-product-form-label admin-product-form-full">
                    Descripción
                    <textarea
                      className="admin-product-form-textarea"
                      value={categoriaForm.descripcion}
                      onChange={e => setCategoriaForm({ ...categoriaForm, descripcion: e.target.value })}
                      placeholder="Descripción de la categoría..."
                      rows={3}
                    />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
                    {loading ? '⏳' : editingCategoriaId ? '💾 Actualizar' : '➕ Crear'}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setCategoriaModalOpen(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'productos':
        return renderProductos();
      case 'clientes':
        return renderClientes();
      case 'ventas':
        return (
          <main className="admin-main" style={{ padding: '0' }}>
            <HistorialVentas />
          </main>
        );
      case 'reportes':
        return (
          <main className="admin-main" style={{ padding: '0' }}>
            <ReportesDinamicos user={user} />
          </main>
        );
      case 'categorias':
        return renderCategorias();
      default:
        return (
          <main className="admin-main">
            <div className="admin-placeholder">
              <div className="admin-placeholder-icon">
                {React.createElement(menuItems.find(item => item.id === activeSection)?.icon, {className: "admin-placeholder-icon-svg"})}
              </div>
              <h3 className="admin-placeholder-title">
                {menuItems.find(item => item.id === activeSection)?.label}
              </h3>
              <p className="admin-placeholder-description">
                {menuItems.find(item => item.id === activeSection)?.description}
              </p>
              <p className="admin-placeholder-note">Contenido en desarrollo para esta sección</p>
            </div>
          </main>
        );
    }
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar-open' : 'admin-sidebar-closed'}`}>
        {/* Logo */}
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <div className="admin-logo-icon">
              <Zap className="admin-logo-svg" />
            </div>
            {sidebarOpen && (
              <div className="admin-logo-text">
                <h1 className="admin-logo-title">SmartSales365</h1>
                <p className="admin-logo-subtitle">Panel Admin</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`admin-menu-item ${isActive ? 'admin-menu-item-active' : ''}`}
                title={sidebarOpen ? '' : item.label}
              >
                <Icon className="admin-menu-icon" />
                {sidebarOpen && (
                  <div className="admin-menu-content">
                    <span className="admin-menu-label">{item.label}</span>
                    <p className="admin-menu-description">{item.description}</p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Settings at bottom */}
        <div className="admin-sidebar-footer">
          <button className="admin-menu-item">
            <Settings className="admin-menu-icon" />
            {sidebarOpen && <span className="admin-menu-label">Configuración</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`admin-main-content ${sidebarOpen ? 'admin-main-content-open' : 'admin-main-content-closed'}`}>
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-header-content">
            <div className="admin-header-left">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="admin-header-button"
              >
                <Menu className="admin-header-icon" />
              </button>
              <div className="admin-header-title">
                <h2 className="admin-header-title-text">
                  {menuItems.find(item => item.id === activeSection)?.label}
                </h2>
                <p className="admin-header-subtitle">
                  {menuItems.find(item => item.id === activeSection)?.description}
                </p>
              </div>
            </div>

            <div className="admin-header-right">
              {/* Voice Command */}
              <button
                onClick={toggleVoiceCommand}
                className={`admin-header-button ${isListening ? 'admin-header-button-active' : ''}`}
                title="Comando de voz"
              >
                <Mic className="admin-header-icon" />
              </button>

              {/* Notifications */}
              <button className="admin-header-button admin-header-button-notification">
                <Bell className="admin-header-icon" />
                {notifications > 0 && (
                  <span className="admin-notification-badge">
                    {notifications}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="admin-user-menu">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="admin-user-button"
                >
                  <div className="admin-user-avatar">
                    {admin.avatar}
                  </div>
                  <div className="admin-user-info">
                    <p className="admin-user-name">{admin.name}</p>
                    <p className="admin-user-role">{admin.role}</p>
                  </div>
                  <ChevronDown className="admin-user-chevron" />
                </button>

                {isUserMenuOpen && (
                  <div className="admin-user-dropdown">
                    <button className="admin-user-dropdown-item">
                      <User className="admin-user-dropdown-icon" />
                      <span>Mi Perfil</span>
                    </button>
                    <button className="admin-user-dropdown-item">
                      <Settings className="admin-user-dropdown-icon" />
                      <span>Configuración</span>
                    </button>
                    <div className="admin-user-dropdown-divider"></div>
                    <button onClick={handleLogout} className="admin-user-dropdown-item admin-user-dropdown-logout">
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reportes dinámicos ahora se manejan en el componente ReportesDinamicos */}
        </header>

        {/* Dynamic Content */}
        {renderSection()}
      </div>
    </div>
  );
}