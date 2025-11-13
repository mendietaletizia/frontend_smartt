// API para predicciones de ventas

import { getApiUrl } from '../config/api.js'

export async function generarPredicciones(params = {}) {
  const res = await fetch(getApiUrl('/api/dashboard/predicciones/generar/'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      periodo: params.periodo || 'mes',
      meses_futuros: params.meses_futuros || 3,
      categoria_id: params.categoria_id || null,
      guardar: params.guardar !== false
    })
  });
  const data = await res.json().catch(() => ({ success: false }));
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Error al generar predicciones');
  }
  return data;
}

export async function listarPredicciones(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.categoria_id) queryParams.append('categoria_id', params.categoria_id);
  if (params.fecha_desde) queryParams.append('fecha_desde', params.fecha_desde);
  if (params.fecha_hasta) queryParams.append('fecha_hasta', params.fecha_hasta);
  if (params.limite) queryParams.append('limite', params.limite);
  
  const query = queryParams.toString();
  const url = `/api/dashboard/predicciones/${query ? '?' + query : ''}`;
  
  const res = await fetch(getApiUrl(url), {
    credentials: 'include'
  });
  const data = await res.json().catch(() => ({ success: false }));
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Error al obtener predicciones');
  }
  return data;
}

