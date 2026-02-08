import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import DashboardPage from '@/pages/dashboard'
import ContractsPage from '@/pages/contracts'
import ShipmentsPage from '@/pages/shipments'
import PriceCurvesPage from '@/pages/price-curves'
import PricingFormulasPage from '@/pages/pricing-formulas'
import AssaysPage from '@/pages/assays'
import MtmPage from '@/pages/mtm'
import MatchingPage from '@/pages/matching'
import PnlPage from '@/pages/pnl'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/shipments" element={<ShipmentsPage />} />
        <Route path="/price-curves" element={<PriceCurvesPage />} />
        <Route path="/pricing-formulas" element={<PricingFormulasPage />} />
        <Route path="/assays" element={<AssaysPage />} />
        <Route path="/mtm" element={<MtmPage />} />
        <Route path="/matching" element={<MatchingPage />} />
        <Route path="/pnl" element={<PnlPage />} />
      </Route>
    </Routes>
  )
}

export default App
