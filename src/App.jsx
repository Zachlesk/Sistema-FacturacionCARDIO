import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import RegistroPacientes from './pages/RegistroPacientes'
import Facturacion from './pages/Facturacion'
import Reportes from './pages/Reportes'
import Home from './pages/Home'

function App() {
  return (
    <HashRouter>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
              <img src="/LogoCardio.png" alt="Logo" className="nav-logo" />
            <h1>Sistema Facturacion Medica</h1>
          </div>
          <div className="nav-links">
            <Link to="/">Inicio</Link>
            <Link to="/pacientes">Registro Pacientes</Link>
            <Link to="/facturacion">Facturacion</Link>
            <Link to="/reportes">Reportes</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pacientes" element={<RegistroPacientes />} />
            <Route path="/facturacion" element={<Facturacion />} />
            <Route path="/reportes" element={<Reportes />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>Sistema de Facturacion Medica con Codigos CUPS - 2025</p>
          <p>Desarrollado por Zharick Rojas Ardila </p>
          <img src="/Corazon.png" alt="Logo" className="nav-logo" />
        </footer>
      </div>
    </HashRouter>
  )
}

export default App