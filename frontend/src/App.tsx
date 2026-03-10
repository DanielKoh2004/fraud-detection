import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import FraudSimulator from './pages/FraudSimulator'
import WhitelistReview from './pages/WhitelistReview'
import NetworkGraph from './pages/NetworkGraph'
import FraudIntel from './pages/FraudIntel'
import EthicalAI from './pages/EthicalAI'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/fraud-simulator" element={<FraudSimulator />} />
        <Route path="/whitelist-review" element={<WhitelistReview />} />
        <Route path="/network-graph" element={<NetworkGraph />} />
        <Route path="/fraud-intel" element={<FraudIntel />} />
        <Route path="/ethical-ai" element={<EthicalAI />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
