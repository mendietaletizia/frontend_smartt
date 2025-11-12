// CU14-CU20: API para reportes dinámicos

export async function solicitarReporte(texto, origen = null, filtros = null) {
  // origen puede ser 'voz' o null (texto)
  // filtros es un objeto con los filtros a aplicar
  const body = {
    texto: texto.trim(),
    ...(origen === 'voz' && { 
      audio: null, // El audio ya fue procesado por el navegador
      texto_transcrito: texto.trim() 
    }),
    ...(filtros && { filtros: filtros })
  }
  
  const res = await fetch('/api/reportes/solicitar/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  })
  
  const data = await res.json().catch(() => ({ success: false }))
  
  if (!res.ok) {
    // Mejorar mensajes de error
    if (res.status === 403) {
      throw new Error(data.message || 'No tienes permisos para solicitar este tipo de reporte. Solo puedes consultar tus propias compras.')
    } else if (res.status === 400) {
      throw new Error(data.message || 'Error al interpretar la solicitud. Intenta ser más específico, por ejemplo: "Mis compras del último mes"')
    } else if (res.status === 500) {
      throw new Error(data.message || 'Error al generar el reporte. Por favor, intenta nuevamente.')
    }
    throw new Error(data.message || `Error al solicitar reporte (${res.status})`)
  }
  
  if (!data.success) {
    throw new Error(data.message || 'Error al solicitar reporte')
  }
  
  return data.reporte
}

export async function obtenerFiltrosInteligentes(tipoReporte) {
  const res = await fetch('/api/reportes/filtros-inteligentes/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ tipo_reporte: tipoReporte })
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'Error al obtener filtros')
  return data.sugerencias
}

export async function listarReportes() {
  const res = await fetch('/api/reportes/listar/', {
    credentials: 'include'
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'Error al listar reportes')
  return data.reportes
}

export async function obtenerOpcionesFiltros() {
  const res = await fetch('/api/reportes/opciones-filtros/', {
    credentials: 'include'
  })
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) throw new Error(data.message || 'Error al obtener opciones de filtros')
  return data
}

export async function descargarReporte(reporteId, formato = 'pdf') {
  try {
    const res = await fetch(`/api/reportes/${reporteId}/descargar/?formato=${formato}`, {
      method: 'GET',
      credentials: 'include'
    })
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || `Error al descargar reporte (${res.status})`)
    }
    
    // Obtener el blob del archivo
    const blob = await res.blob()
    
    // Crear URL temporal y descargar
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_${reporteId}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error al descargar reporte:', error)
    throw error
  }
}


