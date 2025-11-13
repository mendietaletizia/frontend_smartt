// API para subir imágenes a ImgBB

import { getApiUrl } from '../config/api.js'

export async function uploadImage(file) {
  const formData = new FormData()
  formData.append('image', file)
  
  const res = await fetch(getApiUrl('/api/productos/upload-image/'), {
    method: 'POST',
    credentials: 'include',
    body: formData
  })
  
  const data = await res.json().catch(() => ({ success: false }))
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Error al subir imagen')
  }
  
  return data.image_url
}

export async function validateImageFile(file) {
  // Validar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no válido. Solo se permiten: JPEG, PNG, GIF, WebP')
  }
  
  // Validar tamaño (32MB máximo)
  const maxSize = 32 * 1024 * 1024 // 32MB
  if (file.size > maxSize) {
    throw new Error('Archivo demasiado grande. Máximo 32MB')
  }
  
  return true
}
