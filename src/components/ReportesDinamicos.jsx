import { useState, useEffect, useRef } from 'react'
import { solicitarReporte, listarReportes, descargarReporte, obtenerOpcionesFiltros } from '../api/reportes.js'
import { checkSession } from '../api/auth.js'
import './ReportesDinamicos.css'

export default function ReportesDinamicos({ user }) {
  // Determinar el rol del usuario
  const [sessionUser, setSessionUser] = useState(user || null)
  const userRole = (sessionUser?.rol || sessionUser?.role || sessionUser?.id_rol?.nombre || '').toLowerCase() || 'cliente'
  const isAdmin = userRole === 'administrador'
  const [texto, setTexto] = useState('')
  const [grabando, setGrabando] = useState(false)
  const [reporte, setReporte] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reportesLista, setReportesLista] = useState([])
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [modoVoz, setModoVoz] = useState(false)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    categoria: '',
    cliente: '',
    estado: '',
    metodo_pago: '',
    monto_minimo: '',
    monto_maximo: ''
  })
  const [opcionesFiltros, setOpcionesFiltros] = useState({
    clientes: [],
    categorias: [],
    estados: [],
    metodos_pago: [],
    is_admin: false
  })
  
  const recognitionRef = useRef(null)
  const textoInputRef = useRef(null)

  useEffect(() => {
    // Si no recibimos user o no trae rol, intentar obtenerlo de la sesión
    let mounted = true
    ;(async () => {
      try {
        if (!sessionUser || !sessionUser?.rol && !sessionUser?.role && !sessionUser?.id_rol?.nombre) {
          const data = await checkSession()
          if (mounted && data?.authenticated && data?.user) {
            setSessionUser(data.user)
          }
        }
      } catch (_) {}
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    // Si cambia la prop user desde arriba, mantenerla
    if (user && user !== sessionUser) setSessionUser(user)
  }, [user])

  useEffect(() => {
    // Inicializar Web Speech API si está disponible
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'es-ES'
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setTexto(prev => prev ? prev + ' ' + transcript : transcript)
        setGrabando(false)
        // Mantener modoVoz activo para que se envíe como voz
        setModoVoz(true)
      }
      
      recognitionRef.current.onend = () => {
        setGrabando(false)
        setModoVoz(false)
      }
      
      recognitionRef.current.onerror = (event) => {
        setGrabando(false)
        setModoVoz(false)
        if (event.error === 'no-speech') {
          setError('No se detectó voz. Intenta nuevamente.')
        } else if (event.error === 'not-allowed') {
          setError('Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.')
        } else {
          setError('Error al reconocer voz. Intenta nuevamente.')
        }
      }
    }
    
    cargarReportes()
    if (isAdmin) {
      cargarOpcionesFiltros()
    }
  }, [isAdmin])

  async function cargarReportes() {
    try {
      const lista = await listarReportes()
      setReportesLista(lista)
    } catch (err) {
      console.error('Error al cargar reportes:', err)
    }
  }

  async function cargarOpcionesFiltros() {
    try {
      const data = await obtenerOpcionesFiltros()
      setOpcionesFiltros({
        clientes: data.clientes || [],
        categorias: data.categorias || [],
        estados: data.estados || [],
        metodos_pago: data.metodos_pago || [],
        is_admin: data.is_admin || false
      })
    } catch (err) {
      console.error('Error al cargar opciones de filtros:', err)
    }
  }

  function handleFiltroChange(e) {
    const { name, value } = e.target
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }))
  }

  function limpiarFiltros() {
    setFiltros({
      fecha_desde: '',
      fecha_hasta: '',
      categoria: '',
      cliente: '',
      estado: '',
      metodo_pago: '',
      monto_minimo: '',
      monto_maximo: ''
    })
  }

  function obtenerFiltrosAplicables() {
    const filtrosAplicables = {}
    
    if (filtros.fecha_desde) filtrosAplicables.fecha_desde = filtros.fecha_desde
    if (filtros.fecha_hasta) filtrosAplicables.fecha_hasta = filtros.fecha_hasta
    if (filtros.categoria) filtrosAplicables.categoria = filtros.categoria
    if (filtros.cliente) filtrosAplicables.cliente = filtros.cliente
    if (filtros.estado) filtrosAplicables.estado = filtros.estado
    if (filtros.metodo_pago) filtrosAplicables.metodo_pago = filtros.metodo_pago
    if (filtros.monto_minimo) filtrosAplicables.monto_minimo = filtros.monto_minimo
    if (filtros.monto_maximo) filtrosAplicables.monto_maximo = filtros.monto_maximo
    
    return Object.keys(filtrosAplicables).length > 0 ? filtrosAplicables : null
  }

  function iniciarGrabacion() {
    if (!recognitionRef.current) {
      setError('El reconocimiento de voz no está disponible en tu navegador. Usa Chrome o Edge.')
      return
    }

    try {
      setModoVoz(true)
      setGrabando(true)
      setError('')
      setTexto('')
      recognitionRef.current.start()
    } catch (err) {
      setError('Error al iniciar grabación. Asegúrate de permitir el acceso al micrófono.')
      setGrabando(false)
      setModoVoz(false)
    }
  }

  function detenerGrabacion() {
    if (recognitionRef.current && grabando) {
      recognitionRef.current.stop()
      setGrabando(false)
      setModoVoz(false)
    }
  }

  async function handleSolicitarReporte() {
    if (!texto.trim()) {
      setError('Por favor ingresa o dicta una solicitud de reporte')
      return
    }

    setLoading(true)
    setError('')
    setReporte(null)

    try {
      // Determinar si viene de voz o texto
      const esVoz = modoVoz && texto.trim().length > 0
      const filtrosAplicables = obtenerFiltrosAplicables()
      const resultado = await solicitarReporte(texto, esVoz ? 'voz' : null, filtrosAplicables)
      setReporte(resultado)
      setModoVoz(false) // Resetear modo voz después de enviar
      cargarReportes()
    } catch (err) {
      setError(err.message || 'Error al generar reporte')
      setModoVoz(false)
    } finally {
      setLoading(false)
    }
  }

  function limpiarFormulario() {
    setTexto('')
    setError('')
    setReporte(null)
    if (grabando) {
      detenerGrabacion()
    }
  }

  function renderizarDatos(datos, tipoReporte = '') {
    if (!datos || typeof datos !== 'object') {
      return <pre className="reporte-json">{JSON.stringify(datos, null, 2)}</pre>
    }

    // Mostrar resumen solo cuando sea relevante
    const resumen = datos.resumen || datos.summary
    const esReporteConResumen = tipoReporte === 'mis_compras' || tipoReporte === 'financiero' || tipoReporte === 'ventas' || tipoReporte === 'clientes'
    const mostrarResumen = resumen && esReporteConResumen && Object.keys(resumen).length > 0

    // Si tiene array de datos
    if (datos.datos && Array.isArray(datos.datos)) {
      if (datos.datos.length === 0) {
        return (
          <div className="reporte-vacio">
            <span className="empty-icon">📭</span>
            <p>No hay datos para mostrar</p>
            {mostrarResumen && (
              <div className="reporte-resumen-card" style={{ marginTop: '24px' }}>
                <h3>📊 Resumen</h3>
                <div className="resumen-grid">
                  {Object.entries(resumen)
                    .filter(([key, value]) => {
                      const camposNoRelevantes = ['compras_mostradas', 'compras_totales', 'categorias_analizadas', 'clientes_mostrados', 'por_metodo_pago']
                      // No mostrar objetos o arrays (se muestran en la tabla)
                      if (Array.isArray(value)) {
                        return false
                      }
                      if (typeof value === 'object' && value !== null) {
                        return false
                      }
                      const esFormateado = key.includes('_formateado') || key.includes('_display')
                      const esPrincipal = !key.includes('_formateado') && !key.includes('_display') && !key.includes('_iso') && !key.includes('_numero')
                      return !camposNoRelevantes.includes(key) && (esFormateado || (esPrincipal && !resumen[key + '_formateado'] && !resumen[key + '_display']))
                    })
                    .map(([key, value]) => {
                      const keyFormateado = key + '_formateado'
                      const valorFinal = resumen[keyFormateado] !== undefined ? resumen[keyFormateado] : value
                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()).replace(' Formateado', '').replace(' Display', '')
                      
                      return (
                        <div key={key} className="resumen-item">
                          <span className="resumen-label">{label}:</span>
                          <span className="resumen-value">
                            {typeof valorFinal === 'number' && valorFinal % 1 !== 0
                              ? (key.includes('total') || key.includes('monto') || key.includes('promedio') || key.includes('compra')
                                  ? `Bs. ${valorFinal.toFixed(2)}`
                                  : valorFinal.toFixed(2))
                              : typeof valorFinal === 'number'
                              ? valorFinal.toLocaleString()
                              : String(valorFinal)}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )
      }

      // Función para formatear valores complejos
      const formatearValor = (valor, key) => {
        if (valor === null || valor === undefined) {
          return 'N/A'
        }
        
        // Formatear fechas correctamente
        if (key.includes('fecha') || key.includes('date')) {
          try {
            // Si es string que parece fecha ISO
            if (typeof valor === 'string' && (valor.includes('T') || valor.includes('-'))) {
              const fecha = new Date(valor)
              if (!isNaN(fecha.getTime())) {
                return fecha.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })
              }
            }
            // Si ya está formateado como fecha legible, usarlo
            if (typeof valor === 'string' && valor.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
              return valor
            }
          } catch (e) {
            // Si falla, devolver el valor original
          }
        }
        
        // Si es un objeto o array, mostrar de forma legible
        if (typeof valor === 'object') {
          if (Array.isArray(valor)) {
            if (valor.length === 0) return 'Ninguno'
            // Si es array de objetos (como productos), mostrar resumen
            if (valor.length > 0 && typeof valor[0] === 'object') {
              return `${valor.length} ${key === 'productos' ? 'producto(s)' : 'item(s)'}`
            }
            return valor.join(', ')
          }
          // Si es objeto, mostrar campos principales
          if (key === 'cliente' && valor.nombre) {
            return `${valor.nombre}${valor.email ? ` (${valor.email})` : ''}`
          }
          return JSON.stringify(valor, null, 2)
        }
        
        // Si es booleano, mostrar texto
        if (typeof valor === 'boolean') {
          return valor ? 'Sí' : 'No'
        }
        
        // Si es número decimal, formatear
        if (typeof valor === 'number' && valor % 1 !== 0) {
          // Si parece ser un precio, agregar símbolo
          if (key.includes('precio') || key.includes('total') || key.includes('monto') || key.includes('compra') || key === 'monto_total_vendido') {
            return `Bs. ${valor.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
          }
          return valor.toFixed(2)
        }
        
        // Si es número entero, formatear con separadores de miles
        if (typeof valor === 'number' && valor % 1 === 0) {
          // Para cantidad_vendida, veces_vendido y stock, mostrar con separadores de miles
          if (key === 'cantidad_vendida' || key === 'veces_vendido' || key === 'stock' || key === 'cantidad_ventas') {
            return valor.toLocaleString()
          }
          return valor.toLocaleString()
        }
        
        // Formatear porcentaje
        if (key === 'porcentaje' && typeof valor === 'number') {
          return `${valor.toFixed(2)}%`
        }
        
        // Para strings, asegurar que el nombre siempre se muestre completo
        if (key === 'nombre' && typeof valor === 'string') {
          return valor // Mostrar nombre completo sin truncar
        }
        
        return String(valor)
      }

      // Obtener columnas visibles - solo las necesarias
      const obtenerColumnasVisibles = (item, tipoReporteParam = tipoReporte) => {
        // Detectar si es reporte financiero (tiene metodo_pago, cantidad_ventas, total)
        const esReporteFinanciero = tipoReporteParam === 'financiero' || 
          (item.hasOwnProperty('metodo_pago') && item.hasOwnProperty('cantidad_ventas') && item.hasOwnProperty('total'))
        
        // Detectar si es reporte de clientes
        const esReporteClientes = tipoReporteParam === 'clientes' || (item.hasOwnProperty('email') && item.hasOwnProperty('telefono') && !item.hasOwnProperty('precio'))
        
        // Detectar si es reporte de productos (tiene precio, stock, categoria, marca)
        const esReporteProductos = tipoReporteParam === 'productos' || 
          (item.hasOwnProperty('precio') && (item.hasOwnProperty('stock') || item.hasOwnProperty('categoria') || item.hasOwnProperty('marca')))
        
        // Columnas a excluir (información duplicada o innecesaria)
        const excluir = [
          'cliente', // Objeto completo, usamos cliente_nombre
          'productos', // Array, se muestra en detalles
          'productos_mas_comprados', // Array complejo
          'categorias_incluidas', // Array
          'cliente_info', // Duplicado
          'fecha_iso', 'fecha_formateada', 'fecha_ultima_compra', 'fecha_primera_compra', // Usamos solo 'fecha' o 'ultima_compra'
          'id', 'id_venta', 'id_reporte', // IDs no necesarios
          'total_numero', 'monto_total', 'precio_unitario_promedio', 'precio_numero', // Valores numéricos sin formato
          'display', // Campo innecesario
          'notas', // Solo en detalles expandibles
          'direccion_entrega', // Solo en detalles expandibles
          'productos_count', // No necesario
          'total_productos_cantidad', // No necesario
          'veces_comprado', // No necesario en tabla principal
          'metodo_pago_key', // Clave técnica, no mostrar (solo metodo_pago)
        ]
        
        // Si es reporte de clientes, excluir campos adicionales y solo mostrar básicos
        if (esReporteClientes) {
          excluir.push(
            'estado', 'estado_display', // No necesario para lista básica
            'metodo_pago', 'metodo_pago_display',
            'ventas_count', 'promedio_compra', 'max_compra', 'min_compra',
            'ultima_compra_fecha', 'ultima_compra_monto', 'primera_compra_fecha',
            'total_compras_numero', 'es_cliente_frecuente', 'es_cliente_vip',
            'id'
          )
          // Para clientes, solo mostrar estas columnas básicas
          const columnasClientes = ['nombre', 'email', 'telefono', 'direccion', 'ciudad', 'total_compras', 'ultima_compra']
          return columnasClientes.filter(col => item.hasOwnProperty(col))
        }
        
        // Si es reporte financiero, mostrar columnas específicas
        if (esReporteFinanciero) {
          const columnasFinanciero = [
            'metodo_pago',
            'cantidad_ventas',
            'total_formateado',
            'total',
            'porcentaje'
          ]
          // Retornar solo las columnas que existen en el item, preferir formateado sobre original
          const columnas = columnasFinanciero.filter(col => item.hasOwnProperty(col))
          // Si hay total_formateado, excluir total
          if (columnas.includes('total_formateado') && columnas.includes('total')) {
            columnas.splice(columnas.indexOf('total'), 1)
          }
          return columnas
        }
        
        // Si es reporte de productos, mostrar solo las columnas específicas solicitadas
        if (esReporteProductos) {
          const columnasProductos = [
            'nombre',
            'precio',
            'categoria',
            'stock',
            'marca',
            'monto_total_vendido',
            'veces_vendido'
          ]
          // Retornar solo las columnas que existen en el item
          return columnasProductos.filter(col => item.hasOwnProperty(col))
        }
        
        // Si es administrador, incluir más información (pero no para reporte de clientes)
        if (!isAdmin && !esReporteClientes) {
          excluir.push('cliente_email', 'cliente_telefono', 'cliente_direccion')
          // Los clientes SÍ pueden ver estado y método de pago de sus compras
        }
        
        // Columnas prioritarias a mostrar - NOMBRE SIEMPRE PRIMERO para productos
        const prioridades = [
          'nombre', // SIEMPRE PRIMERO - Nombre del producto o cliente
          'precio', // Precio del producto
          'precio_total', 'precio_unitario', 'total', // Precios
          'cantidad', // Cantidad
          'categoria', // Categoría
          'fecha', // Fecha de compra
          'stock', // Stock disponible
          'marca', // Marca del producto
          'estado', // Estado de la compra (pendiente, completada, etc.)
          'estado_display', // Estado formateado
          'metodo_pago', // Método de pago
          'metodo_pago_display', // Método de pago formateado
          'cliente_nombre', // Nombre del cliente (solo si es reporte de ventas)
        ]
        
        // Si es administrador, agregar columnas adicionales
        if (isAdmin && !esReporteClientes) {
          prioridades.push('cliente_email', 'cliente_telefono')
        }
        
        const todasLasKeys = Object.keys(item)
        const columnasVisibles = []
        
        // SIEMPRE incluir 'nombre' si existe, como primera columna
        if (todasLasKeys.includes('nombre') && !excluir.includes('nombre')) {
          columnasVisibles.push('nombre')
        }
        
        // Luego agregar otras prioridades
        for (const key of prioridades) {
          if (key !== 'nombre' && todasLasKeys.includes(key) && !excluir.includes(key) && !columnasVisibles.includes(key)) {
            const valor = item[key]
            // Solo incluir si no es objeto/array complejo
            if (!Array.isArray(valor) && (typeof valor !== 'object' || valor === null)) {
              columnasVisibles.push(key)
            }
          }
        }
        
        // Luego agregar otras columnas simples que no estén excluidas
        for (const key of todasLasKeys) {
          if (!columnasVisibles.includes(key) && !excluir.includes(key)) {
            const valor = item[key]
            // Solo valores simples
            if (!Array.isArray(valor) && (typeof valor !== 'object' || valor === null)) {
              // Evitar duplicados (si ya tenemos _display o _formateado, no mostrar el original)
              const esDuplicado = columnasVisibles.some(c => 
                (c === key + '_display') || (key === c + '_display') ||
                (c === key + '_formateado') || (key === c + '_formateado') ||
                (c === key + '_iso') || (key === c + '_iso') ||
                (c === key + '_numero') || (key === c + '_numero')
              )
              if (!esDuplicado) {
                columnasVisibles.push(key)
              }
            }
          }
        }
        
        return columnasVisibles
      }

      // Detectar tipo de reporte para ajustar columnas
      const esReporteClientes = tipoReporte === 'clientes' || (datos.datos[0] && datos.datos[0].hasOwnProperty('email') && datos.datos[0].hasOwnProperty('telefono') && !datos.datos[0].hasOwnProperty('precio'))
      
      const columnasVisibles = obtenerColumnasVisibles(datos.datos[0], esReporteClientes ? 'clientes' : tipoReporte)
      const columnasOcultas = Object.keys(datos.datos[0]).filter(k => !columnasVisibles.includes(k))

      return (
        <div className="reporte-datos-completo">
          {/* Resumen solo cuando sea relevante y tenga datos importantes */}
          {mostrarResumen && (
            <div className="reporte-resumen-card">
              <h3>📊 Resumen</h3>
              <div className="resumen-grid">
                {Object.entries(resumen)
                  .filter(([key, value]) => {
                    // Filtrar campos que no son relevantes para mostrar
                    const camposNoRelevantes = ['compras_mostradas', 'compras_totales', 'categorias_analizadas', 'clientes_mostrados', 'por_metodo_pago']
                    // No mostrar objetos o arrays (se muestran en la tabla)
                    if (Array.isArray(value)) {
                      return false
                    }
                    if (typeof value === 'object' && value !== null) {
                      return false
                    }
                    // Solo mostrar campos formateados o campos principales, no duplicados
                    const esFormateado = key.includes('_formateado') || key.includes('_display')
                    const esPrincipal = !key.includes('_formateado') && !key.includes('_display') && !key.includes('_iso') && !key.includes('_numero')
                    return !camposNoRelevantes.includes(key) && (esFormateado || (esPrincipal && !resumen[key + '_formateado'] && !resumen[key + '_display']))
                  })
                  .map(([key, value]) => {
                    // Si hay un campo formateado, preferirlo
                    const keyFormateado = key + '_formateado'
                    const valorFinal = resumen[keyFormateado] !== undefined ? resumen[keyFormateado] : value
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()).replace(' Formateado', '').replace(' Display', '')
                    
                    return (
                      <div key={key} className="resumen-item">
                        <span className="resumen-label">{label}:</span>
                        <span className="resumen-value">
                          {typeof valorFinal === 'number' && valorFinal % 1 !== 0
                            ? (key.includes('total') || key.includes('monto') || key.includes('promedio') || key.includes('compra')
                                ? `Bs. ${valorFinal.toFixed(2)}`
                                : valorFinal.toFixed(2))
                            : typeof valorFinal === 'number'
                            ? valorFinal.toLocaleString()
                            : String(valorFinal)}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Tabla principal */}
          <div className="reporte-tabla-container">
            <table className="reporte-tabla">
              <thead>
                <tr>
                  {columnasVisibles.map(key => {
                    // Mapeo de nombres de columnas a nombres más legibles
                    const nombresColumnas = {
                      'nombre': 'Nombre',
                      'precio': 'Precio',
                      'categoria': 'Categoría',
                      'stock': 'Stock',
                      'marca': 'Marca',
                      'cantidad_vendida': 'Cantidad Vendida',
                      'monto_total_vendido': 'Monto Total Vendido',
                      'veces_vendido': 'Veces Vendido',
                      'email': 'Email',
                      'telefono': 'Teléfono',
                      'direccion': 'Dirección',
                      'ciudad': 'Ciudad',
                      'total_compras': 'Total Compras',
                      'ultima_compra': 'Última Compra',
                      'fecha': 'Fecha',
                      'total': 'Total',
                      'estado': 'Estado',
                      'metodo_pago': 'Método de Pago',
                      'cliente_nombre': 'Cliente',
                      'cantidad_ventas': 'Cantidad de Ventas',
                      'total_formateado': 'Total',
                      'porcentaje': 'Porcentaje (%)'
                    }
                    const nombreLegible = nombresColumnas[key] || key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()).replace('Formateado', '').replace('Display', '').trim()
                    return <th key={key}>{nombreLegible}</th>
                  })}
                  {columnasOcultas.length > 0 && <th>Detalles</th>}
                </tr>
              </thead>
              <tbody>
                {datos.datos.map((item, idx) => (
                  <tr key={idx}>
                    {columnasVisibles.map((key, vIdx) => (
                      <td key={vIdx}>
                        {formatearValor(item[key], key)}
                      </td>
                    ))}
                    {columnasOcultas.length > 0 && (
                      <td>
                        <details className="detalles-expandibles">
                          <summary>Ver más</summary>
                          <div className="detalles-contenido">
                            {columnasOcultas.map(key => (
                              <div key={key} className="detalle-item">
                                <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}:</strong>
                                <pre>{JSON.stringify(item[key], null, 2)}</pre>
                              </div>
                            ))}
                          </div>
                        </details>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // Datos estructurados sin array
    return (
      <div className="reporte-estructurado">
        {Object.entries(datos).map(([key, value]) => (
          <div key={key} className="reporte-campo">
            <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}:</strong>
            {typeof value === 'object' && value !== null ? (
              <pre className="reporte-json">{JSON.stringify(value, null, 2)}</pre>
            ) : (
              <span>{String(value)}</span>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Ejemplos diferentes según el rol
  const ejemplosAdmin = [
    '¿Cuánto vendí este mes?',
    'Clientes más recurrentes',
    'Productos más vendidos',
    'Productos con bajo stock',
    'Lista de todos los clientes',
    'Ventas agrupadas por categoría',
    'Top 10 productos más vendidos'
  ]

  const ejemplosCliente = [
    'Mis compras del último mes',
    'Productos que he comprado',
    'Resumen de mis gastos',
    'Cuánto he gastado',
    'Historial de mis compras'
  ]

  const ejemplos = isAdmin ? ejemplosAdmin : ejemplosCliente

  return (
    <div className="reportes-container">
      <div className="reportes-header">
        <div className="reportes-title-section">
          <h1>📊 Reportes Dinámicos</h1>
          <p className="reportes-subtitle">
            {isAdmin 
              ? 'Genera reportes personalizados de ventas, productos e inventario usando texto o voz'
              : 'Consulta reportes de tus compras y pedidos usando texto o voz'}
          </p>
          <div className="rol-badge">
            <span className={`rol-indicator ${isAdmin ? 'admin' : 'cliente'}`}>
              {isAdmin ? '👑 Administrador' : '👤 Cliente'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isAdmin && (
            <button
              className={`btn-toggle-historial ${mostrarFiltros ? 'active' : ''}`}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
            >
              {mostrarFiltros ? '🔽 Ocultar Filtros' : '🔍 Filtros Avanzados'}
            </button>
          )}
          <button
            className={`btn-toggle-historial ${mostrarHistorial ? 'active' : ''}`}
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
          >
            {mostrarHistorial ? '📋 Ocultar Historial' : '📋 Ver Historial'}
          </button>
        </div>
      </div>

      {/* Panel de Filtros Avanzados (solo para admin) */}
      {isAdmin && mostrarFiltros && (
        <div className="filtros-avanzados-card">
          <div className="filtros-header">
            <h3>🔍 Filtros Avanzados</h3>
            <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>
              🗑️ Limpiar
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
              <label>Categoría</label>
              <select
                name="categoria"
                value={filtros.categoria}
                onChange={handleFiltroChange}
              >
                <option value="">Todas las categorías</option>
                {opcionesFiltros.categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="filtro-group">
              <label>Cliente</label>
              <select
                name="cliente"
                value={filtros.cliente}
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
            <div className="filtro-group">
              <label>Estado</label>
              <select
                name="estado"
                value={filtros.estado}
                onChange={handleFiltroChange}
              >
                <option value="">Todos los estados</option>
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
                <option value="">Todos los métodos</option>
                {opcionesFiltros.metodos_pago.map(metodo => (
                  <option key={metodo.value} value={metodo.value}>
                    {metodo.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="filtro-group">
              <label>Monto Mínimo (Bs.)</label>
              <input
                type="number"
                name="monto_minimo"
                value={filtros.monto_minimo}
                onChange={handleFiltroChange}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div className="filtro-group">
              <label>Monto Máximo (Bs.)</label>
              <input
                type="number"
                name="monto_maximo"
                value={filtros.monto_maximo}
                onChange={handleFiltroChange}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <div className="filtros-info">
            <p>💡 Los filtros se aplicarán al generar el reporte. Puedes combinar múltiples filtros para refinar los resultados.</p>
          </div>
        </div>
      )}

      {/* Panel de Solicitud */}
      <div className="reportes-solicitud-card">
        <div className="solicitud-header">
          <h2>
            {modoVoz ? '🎤 Modo Voz' : '✍️ Modo Texto'}
          </h2>
          <div className="modo-indicator">
            <span className={`modo-badge ${modoVoz ? 'voz' : 'texto'}`}>
              {modoVoz ? 'Voz' : 'Text'}
            </span>
          </div>
        </div>

        <div className="solicitud-input-wrapper">
          <div className="input-container">
            <textarea
              ref={textoInputRef}
              className={`solicitud-texto ${grabando ? 'grabando' : ''}`}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={modoVoz 
                ? "🎤 Habla ahora... El texto aparecerá aquí automáticamente"
                : isAdmin
                  ? "Escribe tu solicitud aquí... Ejemplo: 'Reporte de ventas del último mes agrupado por categoría'"
                  : "Escribe tu solicitud aquí... Ejemplo: 'Mis compras del último mes'"}
              rows={4}
              disabled={grabando}
            />
            {grabando && (
              <div className="grabando-overlay">
                <div className="pulse-animation"></div>
                <span>Escuchando...</span>
              </div>
            )}
          </div>

          <div className="ejemplos-container">
            <p className="ejemplos-label">💡 Ejemplos rápidos:</p>
            <div className="ejemplos-chips">
              {ejemplos.map((ejemplo, idx) => (
                <button
                  key={idx}
                  className="ejemplo-chip"
                  onClick={() => {
                    setTexto(ejemplo)
                    setModoVoz(false)
                    textoInputRef.current?.focus()
                  }}
                  disabled={grabando}
                >
                  {ejemplo}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="solicitud-acciones">
          <div className="acciones-izquierda">
            <button
              className={`btn-voz ${grabando ? 'grabando' : ''} ${!recognitionRef.current ? 'disabled' : ''}`}
              onClick={grabando ? detenerGrabacion : iniciarGrabacion}
              disabled={!recognitionRef.current || loading}
              title={grabando ? 'Detener grabación' : 'Iniciar grabación de voz'}
            >
              {grabando ? (
                <>
                  <span className="btn-icon">⏹️</span>
                  <span>Detener</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">🎤</span>
                  <span>Usar Voz</span>
                </>
              )}
            </button>
            <button
              className="btn-limpiar"
              onClick={limpiarFormulario}
              disabled={loading || grabando}
            >
              <span className="btn-icon">🗑️</span>
              <span>Limpiar</span>
            </button>
          </div>
          <button
            className="btn-solicitar"
            onClick={handleSolicitarReporte}
            disabled={loading || !texto.trim() || grabando}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                <span>Generando...</span>
              </>
            ) : (
              <>
                <span className="btn-icon">🚀</span>
                <span>Generar Reporte</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="reporte-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Historial de Reportes */}
      {mostrarHistorial && (
        <div className="reportes-historial-card">
          <h3>📚 Historial de Reportes</h3>
          {reportesLista.length === 0 ? (
            <div className="historial-vacio">
              <span className="empty-icon">📭</span>
              <p>No hay reportes generados aún</p>
            </div>
          ) : (
            <div className="historial-lista">
              {reportesLista.map(repo => (
                <div key={repo.id} className="historial-item">
                  <div className="historial-info">
                    <div className="historial-nombre">{repo.nombre}</div>
                    <div className="historial-meta">
                      <span className="historial-tipo">{repo.tipo}</span>
                      <span className="historial-separador">•</span>
                      <span className="historial-fecha">
                        {(() => {
                          try {
                            const fecha = new Date(repo.fecha)
                            if (isNaN(fecha.getTime())) {
                              return 'Fecha no disponible'
                            }
                            return fecha.toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })
                          } catch (e) {
                            return 'Fecha no disponible'
                          }
                        })()}
                      </span>
                      {repo.origen && (
                        <>
                          <span className="historial-separador">•</span>
                          <span className="historial-origen">
                            {repo.origen === 'voz' ? '🎤 Voz' : '✍️ Texto'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="historial-acciones">
                    <button
                      className="btn-descargar btn-descargar-pdf"
                      onClick={async () => {
                        try {
                          await descargarReporte(repo.id, 'pdf')
                        } catch (err) {
                          setError(err.message || 'Error al descargar PDF')
                        }
                      }}
                      title="Descargar PDF"
                    >
                      📄 PDF
                    </button>
                    <button
                      className="btn-descargar btn-descargar-excel"
                      onClick={async () => {
                        try {
                          await descargarReporte(repo.id, 'excel')
                        } catch (err) {
                          setError(err.message || 'Error al descargar Excel')
                        }
                      }}
                      title="Descargar Excel"
                    >
                      📊 Excel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Visualización del Reporte */}
      {reporte && (
        <div className="reporte-resultado-card">
          <div className="reporte-header-card">
            <div className="reporte-title-section">
              <h2 className="reporte-titulo-principal">{reporte.nombre || 'Reporte Generado'}</h2>
              <div className="reporte-meta">
                {/* Solo mostrar tipo de reporte para administradores */}
                {isAdmin && (
                  <span className="reporte-tipo-badge">{reporte.tipo.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}</span>
                )}
                <span className="reporte-fecha">
                  {(() => {
                    try {
                      const fecha = new Date(reporte.fecha)
                      if (isNaN(fecha.getTime())) {
                        return 'Fecha no disponible'
                      }
                      return fecha.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })
                    } catch (e) {
                      return 'Fecha no disponible'
                    }
                  })()}
                </span>
              </div>
            </div>
            <div className="reporte-acciones">
              <button
                className="btn-descargar btn-descargar-pdf"
                onClick={async () => {
                  try {
                    await descargarReporte(reporte.id, 'pdf')
                  } catch (err) {
                    setError(err.message || 'Error al descargar PDF')
                  }
                }}
              >
                <span className="btn-icon">📄</span>
                <span>PDF</span>
              </button>
              <button
                className="btn-descargar btn-descargar-excel"
                onClick={async () => {
                  try {
                    await descargarReporte(reporte.id, 'excel')
                  } catch (err) {
                    setError(err.message || 'Error al descargar Excel')
                  }
                }}
              >
                <span className="btn-icon">📊</span>
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className="reporte-datos-container">
            {renderizarDatos(reporte.datos, reporte.tipo)}
          </div>
        </div>
      )}
    </div>
  )
}
