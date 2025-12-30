import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function RegistroPacientes() {
  const [formData, setFormData] = useState({
    numero_identificacion: '',
    tipo_identificacion: 'CC',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    genero: '',
    tipo_sangre: '',
    direccion: '',
    telefono: '',
    celular: '',
    email: '',
    regimen_salud: '',
    eps: '',
    estrato: ''
  })

  const [pacientes, setPacientes] = useState([])
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    cargarPacientes()
  }, [])

  const cargarPacientes = async () => {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPacientes(data || [])
    } catch (error) {
      console.error('Error cargando pacientes:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMensaje({ tipo: '', texto: '' })

    try {
      const { data, error } = await supabase
        .from('pacientes')
        .insert([{
          ...formData,
          estrato: formData.estrato ? parseInt(formData.estrato) : null
        }])
        .select()

      if (error) throw error

      setMensaje({ tipo: 'success', texto: 'Paciente registrado exitosamente!' })

      // Limpiar formulario
      setFormData({
        numero_identificacion: '',
        tipo_identificacion: 'CC',
        nombres: '',
        apellidos: '',
        fecha_nacimiento: '',
        genero: '',
        tipo_sangre: '',
        direccion: '',
        telefono: '',
        celular: '',
        email: '',
        regimen_salud: '',
        eps: '',
        estrato: ''
      })

      // Recargar lista
      cargarPacientes()
    } catch (error) {
      console.error('Error:', error)
      setMensaje({ tipo: 'error', texto: error.message || 'Error al registrar paciente' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="form-container">
        <h2>Registro de Pacientes</h2>

        {mensaje.texto && (
          <div className={`alert alert-${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Identificacion */}
          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Identificacion *</label>
              <select name="tipo_identificacion" value={formData.tipo_identificacion} onChange={handleChange} required>
                <option value="CC">Cedula de Ciudadania</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="CE">Cedula de Extranjeria</option>
                <option value="RC">Registro Civil</option>
                <option value="PA">Pasaporte</option>
              </select>
            </div>

            <div className="form-group">
              <label>Numero de Identificacion *</label>
              <input
                type="text"
                name="numero_identificacion"
                value={formData.numero_identificacion}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Datos Basicos */}
          <div className="form-row">
            <div className="form-group">
              <label>Nombres *</label>
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Apellidos *</label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha de Nacimiento *</label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Genero</label>
              <select name="genero" value={formData.genero} onChange={handleChange}>
                <option value="">Seleccione...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tipo de Sangre</label>
              <select name="tipo_sangre" value={formData.tipo_sangre} onChange={handleChange}>
                <option value="">Seleccione...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          {/* Datos de Contacto */}
          <div className="form-row">
            <div className="form-group">
              <label>Direccion</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Telefono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Celular</label>
              <input
                type="tel"
                name="celular"
                value={formData.celular}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Datos Financieros */}
          <div className="form-row">
            <div className="form-group">
              <label>Regimen de Salud</label>
              <select name="regimen_salud" value={formData.regimen_salud} onChange={handleChange}>
                <option value="">Seleccione...</option>
                <option value="Contributivo">Contributivo</option>
                <option value="Subsidiado">Subsidiado</option>
              </select>
            </div>

            <div className="form-group">
              <label>EPS</label>
              <input
                type="text"
                name="eps"
                value={formData.eps}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Estrato</label>
              <select name="estrato" value={formData.estrato} onChange={handleChange}>
                <option value="">Seleccione...</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Paciente'}
          </button>
        </form>
      </div>

      {/* Lista de Pacientes */}
      <div className="card">
        <h3>Pacientes Registrados ({pacientes.length})</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Identificacion</th>
                <th>Nombre Completo</th>
                <th>Fecha Nacimiento</th>
                <th>EPS</th>
                <th>Contacto</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((paciente) => (
                <tr key={paciente.id}>
                  <td>{paciente.tipo_identificacion} {paciente.numero_identificacion}</td>
                  <td>{paciente.nombres} {paciente.apellidos}</td>
                  <td>{new Date(paciente.fecha_nacimiento).toLocaleDateString()}</td>
                  <td>{paciente.eps || 'N/A'}</td>
                  <td>{paciente.celular || paciente.telefono || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default RegistroPacientes
