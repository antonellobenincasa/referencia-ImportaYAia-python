import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import QuoteRequest from './pages/QuoteRequest';
import Messages from './pages/Messages';
import Reports from './pages/Reports';
import BulkLeadImport from './pages/BulkLeadImport';
import CreateLead from './pages/CreateLead';
import LeadsHub from './pages/LeadsHub';
import SendQuoteToLead from './pages/SendQuoteToLead';
import LeadsManagement from './pages/LeadsManagement';
import Quotations from './pages/Quotations';
import Integrations from './pages/Integrations';
import CotizadorManual from './pages/CotizadorManual';
import FollowUpGestionComercial from './pages/FollowUpGestionComercial';
import AdministradorCotizaciones from './pages/AdministradorCotizaciones';
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
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="solicitar-cotizacion" element={<QuoteRequest />} />
              <Route path="enviar-al-lead" element={<SendQuoteToLead />} />
              <Route path="mensajes" element={<Messages />} />
              <Route path="reportes" element={<Reports />} />
              <Route path="leads" element={<LeadsHub />} />
              <Route path="bulk-import-leads" element={<BulkLeadImport />} />
              <Route path="crear-lead" element={<CreateLead />} />
              <Route path="editar-leads" element={<LeadsManagement />} />
              <Route path="cotizaciones" element={<Quotations />} />
              <Route path="integraciones" element={<Integrations />} />
              <Route path="cotizador-manual" element={<CotizadorManual />} />
              <Route path="follow-up" element={<FollowUpGestionComercial />} />
              <Route path="administrador-cotizaciones" element={<AdministradorCotizaciones />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
