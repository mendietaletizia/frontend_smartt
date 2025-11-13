import { useState } from 'react'
import { register } from '../api/auth.js'
import './Register.css'

export default function Register({ onSuccess, onCancel }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    contrasena: '',
    confirmarContrasena: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    tipoUsuario: 'cliente'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    // Validaciones del frontend
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    if (!form.email.trim()) {
      setError('El email es obligatorio')
      return
    }

    if (!form.contrasena) {
      setError('La contraseña es obligatoria')
      return
    }

    if (form.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (form.contrasena !== form.confirmarContrasena) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      setLoading(true)
      
      const userData = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        contrasena: form.contrasena,
        telefono: form.telefono.trim(),
        direccion: form.tipoUsuario === 'cliente' ? form.direccion.trim() : '',
        ciudad: form.tipoUsuario === 'cliente' ? form.ciudad.trim() : '',
        rol: form.tipoUsuario
      }

      const result = await register(userData)
      
      const nuevoRol = result?.user?.rol || (form.tipoUsuario === 'administrador' ? 'Administrador' : 'Cliente')
      setMessage(
        nuevoRol.toLowerCase() === 'administrador'
          ? '✅ Cuenta de administrador creada exitosamente'
          : '✅ Cuenta de cliente creada exitosamente'
      )
      
      // Llamar callback de éxito después de un momento
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(result.user)
        }
      }, 1500)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <div className="register-form">
      <div className="form-close">
        <button type="button" aria-label="Cerrar" title="Cerrar" onClick={handleCancel}>
          ×
        </button>
      </div>
      <div className="form-header">
        <h2>📝 Crear Cuenta</h2>
        <p>Selecciona el tipo de cuenta que deseas crear y completa tus datos.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Tipo de cuenta *
            <select
              value={form.tipoUsuario}
              onChange={(e) => {
                const value = e.target.value
                setForm((prev) => ({
                  ...prev,
                  tipoUsuario: value,
                  direccion: value === 'cliente' ? prev.direccion : '',
                  ciudad: value === 'cliente' ? prev.ciudad : ''
                }))
              }}
            >
              <option value="cliente">Cliente</option>
              <option value="administrador">Administrador</option>
            </select>
          </label>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Nombre *
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Tu nombre"
                required
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              Apellido
              <input
                type="text"
                value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                placeholder="Tu apellido"
              />
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>
            Email *
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tu@email.com"
              required
            />
          </label>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Contraseña *
              <input
                type="password"
                value={form.contrasena}
                onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              Confirmar Contraseña *
              <input
                type="password"
                value={form.confirmarContrasena}
                onChange={(e) => setForm({ ...form, confirmarContrasena: e.target.value })}
                placeholder="Repite tu contraseña"
                required
              />
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>
            Teléfono
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="+1234567890"
            />
          </label>
        </div>

        {form.tipoUsuario === 'cliente' && (
          <>
            <div className="form-group">
              <label>
                Dirección
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Calle 123, #45"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                Ciudad
                <input
                  type="text"
                  value={form.ciudad}
                  onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                  placeholder="Tu ciudad"
                />
              </label>
            </div>
          </>
        )}

        {error && (
          <div className="form-error">
            ❌ {error}
          </div>
        )}

        {message && (
          <div className="form-success">
            {message}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '⏳ Creando cuenta...' : '✅ Crear Cuenta'}
          </button>
          
          <button 
            type="button" 
            onClick={handleCancel}
            className="btn-secondary"
          >
            ❌ Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
