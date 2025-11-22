export interface Lead {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  company_name?: string;
  status: string;
  created_at: string;
}

export interface Opportunity {
  id: number;
  lead: number;
  stage: string;
  estimated_value: string;
  created_at: string;
}

export interface Quote {
  id: number;
  quote_number: string;
  opportunity: number;
  freight_cost: string;
  total_amount: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface LandingPageSubmission {
  landing_page: number;
  full_name: string;
  email: string;
  phone: string;
  company_name?: string;
  ruc?: string;
  transport_type: 'air' | 'ocean_lcl' | 'ocean_fcl';
  origin_country: string;
  destination_port: string;
  container_type?: string;
  cargo_type: 'general' | 'dg';
  estimated_weight_kg: number;
  incoterm: string;
  servicio_integral_customs?: boolean;
  servicio_integral_insurance?: boolean;
  servicio_integral_insurance_cif_value?: number;
  servicio_integral_transport?: boolean;
  servicio_integral_transport_city?: string;
  servicio_integral_transport_address?: string;
}

export interface InlandTransportRate {
  city: string;
  container_type: string;
  rate_usd: string;
}
