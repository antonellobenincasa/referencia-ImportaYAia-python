import PortalNavbar from '../components/PortalNavbar';
import QuoteRequest from './QuoteRequest';

export default function LeadQuoteRequest() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNavbar />

      <main className="py-8">
        <QuoteRequest />
      </main>
    </div>
  );
}
