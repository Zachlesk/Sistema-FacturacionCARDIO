import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

ChartJS.defaults.font.family = 'Montserrat, sans-serif'
ChartJS.defaults.font.size = 13
ChartJS.defaults.color = '#2c3e50'

function Reportes() {
  const [stats, setStats] = useState({
    totalPacientes: 0,
    totalFacturado: 0,
    serviciosPendientes: 0,
    serviciosPagados: 0
  })

  const [facturacionPorCategoria, setFacturacionPorCategoria] = useState([])
  const [topProcedimientos, setTopProcedimientos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarReportes()
  }, [])

  const cargarReportes = async () => {
    try {
      // Estadisticas basicas
      const { count: pacientes } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })

      // Total facturado
      const { data: servicios } = await supabase
        .from('servicios_prestados')
        .select('valor_total, estado')

      const totalFacturado = servicios?.reduce((sum, s) => sum + parseFloat(s.valor_total || 0), 0) || 0
      const pendientes = servicios?.filter(s => s.estado === 'pendiente').length || 0
      const pagados = servicios?.filter(s => s.estado === 'pagado').length || 0

      // Facturacion por categoria
      const { data: categorias } = await supabase
        .from('vista_estadisticas_categoria')
        .select('*')
        .order('facturado_total', { ascending: false })
        .limit(5)

      // Top procedimientos
      const { data: procs } = await supabase
        .from('vista_resumen_procedimientos')
        .select('*')
        .order('ingresos_generados', { ascending: false })
        .limit(10)

      setStats({
        totalPacientes: pacientes || 0,
        totalFacturado,
        serviciosPendientes: pendientes,
        serviciosPagados: pagados
      })

      setFacturacionPorCategoria(categorias || [])
      setTopProcedimientos(procs || [])
      setLoading(false)
    } catch (error) {
      console.error('Error cargando reportes:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Cargando reportes...</div>
  }

  const dataFacturacionCategoria = {
  labels: facturacionPorCategoria.map(c =>
    c.categoria || 'Sin Categoria'
  ),
  datasets: [
    {
      label: 'Total Facturado',
      data: facturacionPorCategoria.map(c =>
        parseFloat(c.facturado_total || 0)
      ),
      backgroundColor: '#002D72'
    }
  ]
}

const optionsFacturacionCategoria = {
  responsive: true,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
    }
  },
  scales: {
    y: {
      ticks: {
        callback: value =>
          value.toLocaleString('es-CO')
      }
    }
  }
}


  return (
    <div>
      <h2  style={{ marginBottom: '2rem'}}>Reportes y Estadisticas</h2>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Pacientes</h3>
          <div className="stat-value">{stats.totalPacientes}</div>
        </div>

        <div className="stat-card">
          <h3>Total Facturado</h3>
          <div className="stat-value">
            ${stats.totalFacturado.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
          </div>
        </div>

        <div className="stat-card">
          <h3>Servicios Pendientes</h3>
          <div className="stat-value">{stats.serviciosPendientes}</div>
        </div>

        <div className="stat-card">
          <h3>Servicios Pagados</h3>
          <div className="stat-value">{stats.serviciosPagados}</div>
        </div>
      </div>

<div className="card" style={{ marginBottom: '2rem', marginTop: '2rem'}}>
  <h3>Facturación por Categoría</h3>
  <Bar
    data={dataFacturacionCategoria}
    options={optionsFacturacionCategoria}
  />
</div>

      {/* Top Procedimientos */}
      <div className="card">
        <h3>Procedimientos Mas Realizados</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Codigo CUPS</th>
                <th>Procedimiento</th>
                <th>Categoria</th>
                <th>Veces Realizado</th>
                <th>Ingresos Generados</th>
              </tr>
            </thead>
            <tbody>
              {topProcedimientos.map((proc, idx) => (
                <tr key={idx}>
                  <td><strong>{proc.codigo_cups}</strong></td>
                  <td>{proc.nombre}</td>
                  <td>{proc.categoria}</td>
                  <td>{proc.veces_realizado}</td>
                  <td>${parseFloat(proc.ingresos_generados || 0).toLocaleString('es-CO')}</td>
                </tr>
              ))}
              {topProcedimientos.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#7f8c8d' }}>
                    No hay datos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Informacion adicional */}
      <div className="alert alert-info">
        <strong>Nota:</strong> Los reportes se actualizan en tiempo real. Los datos mostrados corresponden a la informacion actual en la base de datos.
      </div>
    </div>
  )
}

export default Reportes
