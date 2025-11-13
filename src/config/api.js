// Configuración centralizada de la API
// Obtiene la URL del backend desde la variable de entorno
// Si no está definida, usa una ruta relativa como fallback
const API_URL = import.meta.env.VITE_API_URL || '';

// Función helper para construir URLs completas
export function getApiUrl(path) {
  // Si path ya comienza con http, devolverlo tal cual
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Si API_URL está definida, usarla como base
  if (API_URL) {
    // Asegurar que API_URL no termine con / y path no comience con /
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }
  
  // Fallback: usar ruta relativa
  return path.startsWith('/') ? path : `/${path}`;
}

export default API_URL;

