
import { LeadStatus } from './types';


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
