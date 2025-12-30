import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

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
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
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
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMensaje({ tipo: '', texto: '' })

    try {
      const { error } = await supabase
        .from('pacientes')
        .insert([
          {
            ...formData,
            estrato: formData.estrato ? parseInt(formData.estrato, 10) : null
          }
        ])

      if (error) throw error

      setMensaje({ tipo: 'success', texto: 'Paciente registrado exitosamente!' })
      resetForm()
      await cargarPacientes()
    } catch (error) {
      console.error('Error:', error)
      setMensaje({ tipo: 'error', texto: error.message || 'Error al registrar paciente' })
    } finally {
      setLoading(false)
    }
  }

  // Importar y Exportar Excel

  const excelDateToISO = (value) => {
    if (typeof value === 'string') {
      const s = value.trim()
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
      const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
      if (m) {
        const dd = String(m[1]).padStart(2, '0')
        const mm = String(m[2]).padStart(2, '0')
        const yyyy = m[3]
        return `${yyyy}-${mm}-${dd}`
      }
      return s 
    }
    if (typeof value === 'number') {
      const d = XLSX.SSF.parse_date_code(value)
      if (!d) return ''
      const yyyy = String(d.y).padStart(4, '0')
      const mm = String(d.m).padStart(2, '0')
      const dd = String(d.d).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }

    if (value instanceof Date && !isNaN(value)) {
      const yyyy = value.getFullYear()
      const mm = String(value.getMonth() + 1).padStart(2, '0')
      const dd = String(value.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }

    return ''
  }

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMensaje({ tipo: '', texto: '' })

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true })

      if (!rows.length) throw new Error('El archivo no tiene datos')

      const payload = rows.map((row) => ({
        tipo_identificacion: row.tipo_identificacion || 'CC',
        numero_identificacion: String(row.numero_identificacion || '').trim(),
        nombres: String(row.nombres || '').trim(),
        apellidos: String(row.apellidos || '').trim(),
        fecha_nacimiento: excelDateToISO(row.fecha_nacimiento),
        genero: row.genero || '',
        tipo_sangre: row.tipo_sangre || '',
        direccion: row.direccion || '',
        telefono: row.telefono || '',
        celular: row.celular || '',
        email: row.email || '',
        regimen_salud: row.regimen_salud || '',
        eps: row.eps || '',
        estrato: row.estrato !== '' && row.estrato != null ? parseInt(row.estrato, 10) : null
      }))

      const clean = payload.filter(
        (p) => p.numero_identificacion && p.nombres && p.apellidos && p.fecha_nacimiento
      )

      if (!clean.length) {
        throw new Error('No hay filas válidas. Revisa columnas obligatorias: numero_identificacion, nombres, apellidos, fecha_nacimiento')
      }

      const batchSize = 500
      for (let i = 0; i < clean.length; i += batchSize) {
        const batch = clean.slice(i, i + batchSize)
        const { error } = await supabase.from('pacientes').insert(batch)
        if (error) throw error
      }

      setMensaje({ tipo: 'success', texto: `Pacientes importados correctamente (${clean.length})` })
      await cargarPacientes()
    } catch (error) {
      console.error(error)
      setMensaje({ tipo: 'error', texto: error.message || 'Error al importar Excel' })
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  const handleExportExcel = async () => {
    setLoading(true)
    setMensaje({ tipo: '', texto: '' })

    try {
      const { data, error } = await supabase.from('pacientes').select('*')
      if (error) throw error
      if (!data?.length) throw new Error('No hay datos para exportar')

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pacientes')
      XLSX.writeFile(workbook, 'pacientes.xlsx')
    } catch (error) {
      console.error(error)
      setMensaje({ tipo: 'error', texto: error.message || 'Error al exportar Excel' })
    } finally {
      setLoading(false)
    }
  }

  const TEMPLATE_HEADERS = [
  "tipo_identificacion",
  "numero_identificacion",
  "nombres",
  "apellidos",
  "fecha_nacimiento",
  "genero",
  "tipo_sangre",
  "direccion",
  "telefono",
  "celular",
  "email",
  "regimen_salud",
  "eps",
  "estrato",
]

const handleDownloadTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Pacientes")

  XLSX.writeFile(wb, "plantilla_pacientes_oficial.xlsx")
}


  return (
    <div>
      <div className="form-container">
        <h2>Registro de Pacientes</h2>

        {mensaje.texto && (
          <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Identificacion */}
          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Identificacion *</label>
              <select
                name="tipo_identificacion"
                value={formData.tipo_identificacion}
                onChange={handleChange}
                required
              >
                <option value="CC">Cedula de Ciudadania</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="CE">Cedula de Extranjeria</option>
                <option value="RC">Registro Civil</option>
                <option value="PA">Pasaporte</option>
              </select>
            </div>

            <div className="form-group">
              <label>Numero de Identificación *</label>
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
              <label>Género</label>
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
              <label>Dirección</label>
              <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Celular</label>
              <input type="tel" name="celular" value={formData.celular} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
          </div>

          {/* Datos Financieros */}
          <div className="form-row">
            <div className="form-group">
              <label>Régimen de Salud</label>
              <select name="regimen_salud" value={formData.regimen_salud} onChange={handleChange}>
                <option value="">Seleccione...</option>
                <option value="Contributivo">Contributivo</option>
                <option value="Subsidiado">Subsidiado</option>
              </select>
            </div>

            <div className="form-group">
              <label>EPS</label>
              <input type="text" name="eps" value={formData.eps} onChange={handleChange} />
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

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Importar / Exportar Pacientes</h3>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="btn" style={{ cursor: 'pointer' }}>
            Importar Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={handleImportExcel}
            />
          </label>

          <button type="button" className="btn" onClick={handleExportExcel} disabled={loading}>
            Exportar Excel
          </button>

          <button type="button" className="btn" onClick={handleDownloadTemplate} disabled={loading}>
  Descargar Plantilla Oficial
</button>
        </div>
      </div>

      {/* Lista de Pacientes */}
      <div className="card">
        <h3>Pacientes Registrados ({pacientes.length})</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Identificación</th>
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
