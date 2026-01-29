
export type LeadStatus = 'Novo Lead' | 'Em Contato' | 'Proposta Enviada' | 'Negociação' | 'Ganho' | 'Perdido';

export interface Interaction {
  id: string;
  type: 'Ligação' | 'Email' | 'Reunião' | 'WhatsApp' | 'Outro';
  date: string;
  description: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  estimatedValue: number;
  origin: string;
  responsible: string;
  observations: string;
  createdAt: string;
  interactions: Interaction[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  status: 'Ativo' | 'Inativo';
  isAdmin?: boolean;
  password?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
