
import { LeadStatus } from './types';

export const STATUS_CONFIG: Record<LeadStatus, { color: string; bg: string }> = {
  'Novo Lead': { color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200' },
  'Em Contato': { color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-200' },
  'Proposta Enviada': { color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200' },
  'Negociação': { color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200' },
  'Ganho': { color: 'text-green-700', bg: 'bg-green-100 border-green-200' },
  'Perdido': { color: 'text-red-700', bg: 'bg-red-100 border-red-200' },
};

export const KANBAN_COLUMNS: LeadStatus[] = [
  'Novo Lead',
  'Em Contato',
  'Proposta Enviada',
  'Negociação',
  'Ganho'
];

export const INITIAL_ADMINS = [
  {
    id: 'e28153f3-07c8-47fb-b935-430349896799',
    name: 'Administrador Leadsign',
    email: 'contato@leadsign.com.br',
    role: 'CEO',
    phone: '',
    status: 'Ativo' as const,
    isAdmin: true
  },
  {
    id: '983c317f-1358-450f-a316-2e8f12349888',
    name: 'Moisés Rodrigues',
    email: 'contatomoisesrodrigues@gmail.com',
    role: 'Manager',
    phone: '',
    status: 'Ativo' as const,
    isAdmin: true
  }
];

export const DEFAULT_PASSWORD = 'Phoenix120126#';
