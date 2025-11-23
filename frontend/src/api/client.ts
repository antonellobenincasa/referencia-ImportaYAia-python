import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getLeads: () => apiClient.get('/api/sales/leads/'),
  getOpportunities: () => apiClient.get('/api/sales/opportunities/'),
  getQuotes: () => apiClient.get('/api/sales/quotes/'),
  
  submitLandingPage: (data: any) => apiClient.post('/api/marketing/landing-submissions/', data),
  
  getMessages: () => apiClient.get('/api/comms/messages/'),
  
  getSalesReports: (params: { type: string; format?: string }) => 
    apiClient.get('/api/sales/reports/', { params }),
    
  getInlandTransportRates: () => apiClient.get('/api/marketing/inland-transport-rates/'),
};
