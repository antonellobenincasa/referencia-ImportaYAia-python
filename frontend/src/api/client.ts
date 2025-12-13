import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'ics_access_token';
const REFRESH_TOKEN_KEY = 'ics_refresh_token';
const USER_KEY = 'ics_user';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/accounts/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem(TOKEN_KEY, access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          
          return apiClient(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const api = {
  getLeads: () => apiClient.get('/api/sales/leads/'),
  getOpportunities: () => apiClient.get('/api/sales/opportunities/'),
  getQuotes: () => apiClient.get('/api/sales/quotes/'),
  
  submitLandingPage: (data: any) => apiClient.post('/api/marketing/landing-submissions/', data),
  submitQuoteRequest: (data: any) => apiClient.post('/api/sales/quote-submissions/', data),
  
  uploadQuoteDocument: (formData: FormData) => apiClient.post('/api/sales/quote-submission-documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  getMessages: () => apiClient.get('/api/comms/messages/'),
  
  getSalesReports: (params: { type: string; format?: string }) => 
    apiClient.get('/api/sales/reports/', { params }),
    
  getInlandTransportRates: () => apiClient.get('/api/marketing/inland-transport-rates/'),
};
