import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import QuoteRequest from './pages/QuoteRequest';
import Messages from './pages/Messages';
import Reports from './pages/Reports';
import BulkLeadImport from './pages/BulkLeadImport';
import CreateLead from './pages/CreateLead';
import LeadsHub from './pages/LeadsHub';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="solicitar-cotizacion" element={<QuoteRequest />} />
          <Route path="mensajes" element={<Messages />} />
          <Route path="reportes" element={<Reports />} />
          <Route path="leads" element={<LeadsHub />} />
          <Route path="bulk-import-leads" element={<BulkLeadImport />} />
          <Route path="crear-lead" element={<CreateLead />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
