import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
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

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
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
    </ThemeProvider>
  );
}

export default App;
