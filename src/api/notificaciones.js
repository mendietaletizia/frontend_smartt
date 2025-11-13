import { getApiUrl } from '../config/api.js'

const API_BASE = '/api';

export async function obtenerNotificaciones(filtros = {}) {
  try {
    const params = new URLSearchParams();
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.leida !== undefined) params.append('leida', filtros.leida);
    if (filtros.prioridad) params.append('prioridad', filtros.prioridad);
    if (filtros.limite) params.append('limite', filtros.limite);
    
    const url = `${API_BASE}/notificaciones${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(getApiUrl(url), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener notificaciones');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    throw error;
  }
}

export async function crearNotificacion(datos) {
  try {
    const response = await fetch(getApiUrl(`${API_BASE}/notificaciones/`), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear notificación');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creando notificación:', error);
    throw error;
  }
}

export async function marcarNotificacionLeida(notificacionId, leida = true) {
  try {
    const response = await fetch(getApiUrl(`${API_BASE}/notificaciones/${notificacionId}/`), {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ leida })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar notificación');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    throw error;
  }
}

export async function eliminarNotificacion(notificacionId) {
  try {
    const response = await fetch(getApiUrl(`${API_BASE}/notificaciones/${notificacionId}/`), {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar notificación');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    throw error;
  }
}

export async function marcarTodasLeidas() {
  try {
    const response = await fetch(getApiUrl(`${API_BASE}/notificaciones/marcar-todas-leidas/`), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al marcar notificaciones');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error marcando todas las notificaciones:', error);
    throw error;
  }
}

