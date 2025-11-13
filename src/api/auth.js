// Auth API (fetch + cookies de sesión)

import { getApiUrl } from '../config/api.js'

const BASE = '/api'

export async function login(email, contrasena) {
  const res = await fetch(getApiUrl(`${BASE}/login/`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, contrasena })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión')
  return data
}

export async function logout() {
  const res = await fetch(getApiUrl(`${BASE}/logout/`), { method: 'POST', credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Error al cerrar sesión')
  return data
}

export async function checkSession() {
  const res = await fetch(getApiUrl(`${BASE}/check-session/`), { credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  return data
}

export async function register(userData) {
  const res = await fetch(getApiUrl(`${BASE}/register/`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(userData)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Error al registrar cuenta')
  return data
}


