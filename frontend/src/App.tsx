import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import QuoteRequest from './pages/QuoteRequest';
import Messages from './pages/Messages';
import Reports from './pages/Reports';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="solicitar-cotizacion" element={<QuoteRequest />} />
          <Route path="mensajes" element={<Messages />} />
          <Route path="reportes" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
