// API para estadísticas del dashboard

export async function obtenerEstadisticasDashboard() {
  const res = await fetch('/api/ventas/dashboard/stats/', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Error ${res.status}: ${errorText || 'Error al obtener estadísticas'}`)
  }
  
  const data = await res.json()
  
  if (!data || !data.success) {
    throw new Error(data.message || 'Error al obtener estadísticas')
  }
  
  return data
}

