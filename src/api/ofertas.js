const API_BASE = '/api';

export async function obtenerOfertas(filtros = {}) {
  try {
    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.activas) params.append('activas', filtros.activas);
    
    const url = `${API_BASE}/productos/ofertas/${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener ofertas');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo ofertas:', error);
    throw error;
  }
}

export async function crearOferta(ofertaData) {
  try {
    const response = await fetch(`${API_BASE}/productos/ofertas/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ofertaData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear oferta');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creando oferta:', error);
    throw error;
  }
}

export async function obtenerSugerenciasIA() {
  try {
    const response = await fetch(`${API_BASE}/productos/ofertas/sugerir-ia/`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener sugerencias');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo sugerencias IA:', error);
    throw error;
  }
}

export async function obtenerCupones(filtros = {}) {
  try {
    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.activos) params.append('activos', filtros.activos);
    
    const url = `${API_BASE}/productos/cupones/${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener cupones');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo cupones:', error);
    throw error;
  }
}

export async function crearCupon(cuponData) {
  try {
    const response = await fetch(`${API_BASE}/productos/cupones/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cuponData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear cupón');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creando cupón:', error);
    throw error;
  }
}

export async function validarCupon(codigo, totalCarrito = 0) {
  try {
    const response = await fetch(`${API_BASE}/productos/cupones/validar/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codigo: codigo,
        total_carrito: totalCarrito
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al validar cupón');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error validando cupón:', error);
    throw error;
  }
}
