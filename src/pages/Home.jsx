import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

import Oso from '../assets/icoBear.png'

function Home() {
  const [stats, setStats] = useState({
    totalPacientes: 0,
    totalProcedimientos: 0,
    totalServicios: 0,
    loading: true
  })

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    try {
      // Contar pacientes
      const { count: pacientes } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })

      // Contar procedimientos
      const { count: procedimientos } = await supabase
        .from('procedimientos_cups')
        .select('*', { count: 'exact', head: true })

      // Contar servicios
      const { count: servicios } = await supabase
        .from('servicios_prestados')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalPacientes: pacientes || 0,
        totalProcedimientos: procedimientos || 0,
        totalServicios: servicios || 0,
        loading: false
      })
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  if (stats.loading) {
    return <div className="loading">Cargando estadísticas...</div>
  }

  return (
 <div   className="page-header">
  <h1>Sistema de Facturación Médica</h1>
  <p>
    Gestión de pacientes y facturación con códigos CUPS
  </p>


<div className="stats-wrapper">
  <img src={Oso} alt="Osito" className="stats-bear" />

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Pacientes</h3>
          <div className="stat-value">{stats.totalPacientes}</div>
        </div>

        <div className="stat-card">
          <h3>Procedimientos CUPS</h3>
          <div className="stat-value">{stats.totalProcedimientos}</div>
        </div>

        <div className="stat-card">
          <h3>Servicios Prestados</h3>
          <div className="stat-value">{stats.totalServicios}</div>
        </div>
      </div>
</div>

      <div className="card">
        <h3>Funcionalidades</h3>
        <ul style={{ textAlign: 'left', lineHeight: '2' }}>
          <li>Registro completo de pacientes con datos básicos, financieros y de contacto.</li>
          <li>Gestión de catálogo de procedimientos médicos con códigos CUPS.</li>
          <li>Facturación de servicios prestados con calculos automáticos.</li>
          <li>Reportes y estadísticas en tiempo real.</li>
          <li>Interfaz responsiva para cualquier dispositivo.</li>
          <li>Importación y exportación de datos.</li>
        </ul>
      </div>
    </div>
  )
}

export default Home
