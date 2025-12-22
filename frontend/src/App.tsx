import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LandingPage from './pages/LandingPage';
import Nosotros from './pages/Nosotros';
import DescargarApp from './pages/DescargarApp';
import Contacto from './pages/Contacto';
import LeadDashboard from './pages/LeadDashboard';
import LeadQuoteRequest from './pages/LeadQuoteRequest';
import LeadMisCotizaciones from './pages/LeadMisCotizaciones';
import LeadTracking from './pages/LeadTracking';
import LeadServicios from './pages/LeadServicios';
import LeadPreLiquidacionSENAE from './pages/LeadPreLiquidacionSENAE';
import LeadMiCuenta from './pages/LeadMiCuenta';
import CargoTrackingList from './pages/CargoTrackingList';
import CargoTrackingDetail from './pages/CargoTrackingDetail';
import AduanaExpertoIA from './pages/AduanaExpertoIA';
import MasterAdminLogin from './pages/MasterAdminLogin';
import MasterAdminDashboard from './pages/MasterAdminDashboard';
import AIAssistant from './components/AIAssistant';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/nosotros" element={<Nosotros />} />
            <Route path="/descargar-app" element={<DescargarApp />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* LEAD Portal - Step-by-Step Flow */}
            <Route path="/portal" element={
              <ProtectedRoute>
                <LeadDashboard />
              </ProtectedRoute>
            } />
            <Route path="/portal/cotizar" element={
              <ProtectedRoute>
                <LeadQuoteRequest />
              </ProtectedRoute>
            } />
            <Route path="/portal/mis-cotizaciones" element={
              <ProtectedRoute>
                <LeadMisCotizaciones />
              </ProtectedRoute>
            } />
            <Route path="/portal/tracking" element={
              <ProtectedRoute>
                <LeadTracking />
              </ProtectedRoute>
            } />
            <Route path="/portal/cargo-tracking" element={
              <ProtectedRoute>
                <CargoTrackingList />
              </ProtectedRoute>
            } />
            <Route path="/portal/cargo-tracking/:id" element={
              <ProtectedRoute>
                <CargoTrackingDetail />
              </ProtectedRoute>
            } />
            <Route path="/portal/servicios" element={
              <ProtectedRoute>
                <LeadServicios />
              </ProtectedRoute>
            } />
            <Route path="/portal/pre-liquidacion-senae" element={
              <ProtectedRoute>
                <LeadPreLiquidacionSENAE />
              </ProtectedRoute>
            } />
            <Route path="/portal/mi-cuenta" element={
              <ProtectedRoute>
                <LeadMiCuenta />
              </ProtectedRoute>
            } />
            <Route path="/portal/aduana-experto-ia" element={
              <ProtectedRoute>
                <AduanaExpertoIA />
              </ProtectedRoute>
            } />
            
            {/* Redirect old lead routes */}
            <Route path="/lead" element={
              <ProtectedRoute>
                <LeadDashboard />
              </ProtectedRoute>
            } />
            <Route path="/lead/solicitar-cotizacion" element={
              <ProtectedRoute>
                <LeadQuoteRequest />
              </ProtectedRoute>
            } />
            <Route path="/lead/mis-cotizaciones" element={
              <ProtectedRoute>
                <LeadMisCotizaciones />
              </ProtectedRoute>
            } />
            
            {/* MASTER ADMIN - Hidden Routes */}
            <Route path="/xm7k9p2v4q8n" element={<MasterAdminLogin />} />
            <Route path="/xm7k9p2v4q8n/dashboard" element={<MasterAdminDashboard />} />
          </Routes>
          <AIAssistant />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
