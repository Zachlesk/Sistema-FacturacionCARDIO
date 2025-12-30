import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

function Facturacion() {
  const [formData, setFormData] = useState({
    paciente_id: '',
    procedimiento_id: '',
    fecha_servicio: new Date().toISOString().split('T')[0],
    cantidad: 1,
    valor_unitario: 0,
    descuento: 0,
    observaciones: '',
    estado: 'pendiente'
  })

  const [pacientes, setPacientes] = useState([])
  const [procedimientos, setProcedimientos] = useState([])
  const [servicios, setServicios] = useState([])
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      // Cargar pacientes
      const { data: pac } = await supabase
        .from('pacientes')
        .select('id, numero_identificacion, nombres, apellidos')
        .order('nombres')

      // Cargar procedimientos
      const { data: proc } = await supabase
        .from('procedimientos_cups')
        .select('id, codigo_cups, nombre, valor_base')
        .eq('activo', true)
        .order('codigo_cups')

      // Cargar servicios con join
      const { data: serv } = await supabase
        .from('vista_detalle_servicios')
        .select('*')
        .order('fecha_servicio', { ascending: false })
        .limit(50)

      setPacientes(pac || [])
      setProcedimientos(proc || [])
      setServicios(serv || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

const handleChange = (e) => {
  const { name, value } = e.target

  if (name === 'descuento') {
    const num = parseFloat(value)

    setFormData(prev => ({
      ...prev,
      descuento: isNaN(num)
        ? 0
        : Math.min(Math.max(num, 0), 100) // 👈 fuerza 0–100
    }))
    return
  }

  setFormData(prev => ({ ...prev, [name]: value }))

  if (name === 'procedimiento_id') {
    const proc = procedimientos.find(p => p.id === value)
    if (proc) {
      setFormData(prev => ({ ...prev, valor_unitario: proc.valor_base }))
    }
  }
}

  const calcularTotal = () => {
  const cantidad = Math.max(0, Number(formData.cantidad) || 0)
  const valorUnitario = Math.max(0, Number(formData.valor_unitario) || 0)

  const descuento = Math.min(
    Math.max(Number(formData.descuento) || 0, 0),
    100
  )

  const subtotal = cantidad * valorUnitario
  const valorDescuento = subtotal * (descuento / 100)

  return Math.max(subtotal - valorDescuento, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMensaje({ tipo: '', texto: '' })

    if (formData.descuento < 0 || formData.descuento > 100) {
    throw new Error('El descuento debe estar entre 0% y 100%')
}

    try {
      const { data, error } = await supabase
        .from('servicios_prestados')
        .insert([{
          ...formData,
          cantidad: parseInt(formData.cantidad),
          valor_unitario: parseFloat(formData.valor_unitario),
          descuento: Math.min(Math.max(parseFloat(formData.descuento), 0), 100)
        }])
        .select()

      if (error) throw error

      setMensaje({ tipo: 'success', texto: 'Servicio registrado exitosamente!' })

      // Limpiar formulario
      setFormData({
        paciente_id: '',
        procedimiento_id: '',
        fecha_servicio: new Date().toISOString().split('T')[0],
        cantidad: 1,
        valor_unitario: 0,
        descuento: 0,
        observaciones: '',
        estado: 'pendiente'
      })

      // Recargar servicios
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      setMensaje({ tipo: 'error', texto: error.message || 'Error al registrar servicio' })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = () => {
  const headers = [[
    'paciente_identificacion',
    'codigo_cups',
    'fecha_servicio',
    'cantidad',
    'valor_unitario',
    'descuento',
    'estado',
    'observaciones'
  ]]

  const ws = XLSX.utils.aoa_to_sheet(headers)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Facturacion')

  XLSX.writeFile(wb, 'plantilla_facturacion.xlsx')
}

const handleImportExcel = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  setLoading(true)
  setMensaje({ tipo: '', texto: '' })

  try {
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (!rows.length) throw new Error('El archivo está vacío')

    const payload = []

    for (const row of rows) {
      const { data: paciente } = await supabase
        .from('pacientes')
        .select('id')
        .eq('numero_identificacion', String(row.paciente_identificacion))
        .single()

      const { data: proc } = await supabase
        .from('procedimientos_cups')
        .select('id')
        .eq('codigo_cups', String(row.codigo_cups))
        .single()

      if (!paciente || !proc) continue

      payload.push({
        paciente_id: paciente.id,
        procedimiento_id: proc.id,
        fecha_servicio: row.fecha_servicio,
        cantidad: parseInt(row.cantidad || 1, 10),
        valor_unitario: parseFloat(row.valor_unitario || 0),
        descuento: parseFloat(row.descuento || 0),
        estado: row.estado || 'pendiente',
        observaciones: row.observaciones || ''
      })
    }

    if (!payload.length) throw new Error('No se encontraron filas válidas')

    const { error } = await supabase
      .from('servicios_prestados')
      .insert(payload)

    if (error) throw error

    setMensaje({
      tipo: 'success',
      texto: `Servicios importados correctamente (${payload.length})`
    })

    cargarDatos()
  } catch (error) {
    console.error(error)
    setMensaje({
      tipo: 'error',
      texto: error.message || 'Error al importar servicios'
    })
  } finally {
    setLoading(false)
    event.target.value = ''
  }
}

const handleExportExcel = async () => {
  setLoading(true)
  setMensaje({ tipo: '', texto: '' })

  try {
    const { data, error } = await supabase
      .from('vista_detalle_servicios')
      .select('*')
      .order('fecha_servicio', { ascending: false })

    if (error) throw error
    if (!data?.length) throw new Error('No hay datos para exportar')

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Servicios')

    XLSX.writeFile(wb, 'servicios_facturados.xlsx')
  } catch (error) {
    console.error(error)
    setMensaje({ tipo: 'error', texto: error.message })
  } finally {
    setLoading(false)
  }
}

  return (
    <div>
        <div className="form-container">
  {/* Header */}
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
      marginBottom: '1rem'
    }}
  >
    <h2 style={{ margin: 0 }}>Registro de Servicios / Facturación</h2>

    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <button type="button" className="btn" onClick={handleDownloadTemplate} disabled={loading}>
        Descargar Plantilla
      </button>

      <label className="btn" style={{ cursor: 'pointer' }}>
        Importar Excel
        <input
          type="file"
          accept=".xlsx,.xls"
          hidden
          onChange={handleImportExcel}
          disabled={loading}
        />
      </label>

      <button type="button" className="btn" onClick={handleExportExcel} disabled={loading}>
        Exportar Excel
      </button>
    </div>
  </div>
        

        {mensaje.texto && (
          <div className={`alert alert-${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Paciente *</label>
              <select name="paciente_id" value={formData.paciente_id} onChange={handleChange} required>
                <option value="">Seleccione un paciente...</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.numero_identificacion} - {p.nombres} {p.apellidos}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Procedimiento CUPS *</label>
              <select name="procedimiento_id" value={formData.procedimiento_id} onChange={handleChange} required>
                <option value="">Seleccione un procedimiento...</option>
                {procedimientos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.codigo_cups} - {p.nombre} (${p.valor_base.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha del Servicio *</label>
              <input
                type="date"
                name="fecha_servicio"
                value={formData.fecha_servicio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Cantidad *</label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Valor Unitario *</label>
              <input
                type="number"
                name="valor_unitario"
                value={formData.valor_unitario}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Descuento (%)</label>
              <input
                type="number"
                name="descuento"
                value={formData.descuento}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select name="estado" value={formData.estado} onChange={handleChange}>
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
                <option value="anulado">Anulado</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="alert alert-info">
            <strong>Total a Cobrar:</strong> ${calcularTotal().toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Servicio'}
          </button>
        </form>
      </div>

      {/* Lista de Servicios */}
      <div className="card">
        <h3>Servicios Prestados Recientes ({servicios.length})</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Procedimiento</th>
                <th>Cantidad</th>
                <th>Valor Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((servicio, idx) => (
                <tr key={idx}>
                  <td>{new Date(servicio.fecha_servicio).toLocaleDateString()}</td>
                  <td>{servicio.nombre_paciente}</td>
                  <td>{servicio.codigo_cups} - {servicio.nombre_procedimiento}</td>
                  <td>{servicio.cantidad}</td>
                  <td>${parseFloat(servicio.valor_total).toLocaleString('es-CO')}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: servicio.estado === 'pagado' ? '#d4edda' : '#fff3cd',
                      color: servicio.estado === 'pagado' ? '#155724' : '#856404'
                    }}>
                      {servicio.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Facturacion
