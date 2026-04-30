import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import HeatstrokeMonitoringDemo from './HeatstrokeMonitoringDemo'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HeatstrokeMonitoringDemo />
  </StrictMode>,
)
