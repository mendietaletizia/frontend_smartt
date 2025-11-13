// API para gestión del modelo de IA

import { getApiUrl } from '../config/api.js'

export async function obtenerEstadoModelo() {
  const res = await fetch(getApiUrl('/api/dashboard/modelo/estado/'), {
    credentials: 'include'
  });
  const data = await res.json().catch(() => ({ success: false }));
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Error al obtener estado del modelo');
  }
  return data;
}

export async function entrenarModelo() {
  const res = await fetch(getApiUrl('/api/dashboard/modelo/entrenar/'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json().catch(() => ({ success: false }));
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Error al entrenar modelo');
  }
  return data;
}

export async function actualizarModelo() {
  const res = await fetch(getApiUrl('/api/dashboard/modelo/actualizar/'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json().catch(() => ({ success: false }));
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Error al actualizar modelo');
  }
  return data;
}

export async function obtenerHistorialEntrenamientos() {
  const res = await fetch(getApiUrl('/api/dashboard/modelo/historial/'), {
    credentials: 'include'
  });
  const data = await res.json().catch(() => ({ success: false }));
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Error al obtener historial');
  }
  return data;
}


