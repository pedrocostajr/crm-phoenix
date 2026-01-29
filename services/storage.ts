
import { Lead, User, LeadStatus } from '../types';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

export const storageService = {
  // Leads
  getLeads: async (): Promise<Lead[]> => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return [];
    }

    return (data || []).map((dbLead: any) => ({
      id: dbLead.id,
      name: dbLead.name,
      company: dbLead.company,
      email: dbLead.email,
      phone: dbLead.phone,
      status: dbLead.status,
      estimatedValue: Number(dbLead.estimated_value),
      origin: dbLead.origin,
      responsible: dbLead.responsible,
      observations: dbLead.observations,
      createdAt: dbLead.created_at,
      interactions: dbLead.interactions || []
    }));
  },

  saveLead: async (lead: Lead) => {
    // Convert to snake_case for DB
    const dbLead = {
      id: lead.id,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      estimated_value: lead.estimatedValue,
      origin: lead.origin,
      responsible: lead.responsible,
      observations: lead.observations,
      created_at: lead.createdAt,
      interactions: lead.interactions
    };

    const { error } = await supabase
      .from('leads')
      .upsert(dbLead);

    if (error) {
      console.error('Error saving lead:', error);
      return false;
    }
    return true;
  },

  deleteLead: async (id: string) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lead:', error);
    }
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return (data || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      status: u.status,
      isAdmin: u.is_admin
    }));
  },

  saveUser: async (user: User) => {
    const dbUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status,
      is_admin: user.isAdmin
    };

    const { error } = await supabase
      .from('users')
      .upsert(dbUser);

    if (error) {
      console.error('Error saving user:', error);
    }
  },

  deleteUser: async (id: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
    }
  },

  // Export/Import (Excel & CSV)
  exportLeadsToCSV: async () => {
    try {
      const leads = await storageService.getLeads();

      const data = leads.map(lead => ({
        'ID': lead.id,
        'Nome': lead.name,
        'Empresa': lead.company,
        'Email': lead.email,
        'Telefone': lead.phone,
        'Status': lead.status,
        'Valor': lead.estimatedValue,
        'Origem': lead.origin,
        'Responsável': lead.responsible,
        'Observações': lead.observations,
        'Data Criação': lead.createdAt
      }));

      // @ts-ignore
      if (typeof window.XLSX !== 'undefined' || typeof require !== 'undefined') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Leads");
        XLSX.writeFile(wb, `leads-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        storageService.fallbackExportCSV(data);
      }
    } catch (e) {
      console.error("Export failed", e);
    }
  },

  fallbackExportCSV: (data: any[]) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(fieldName => `"${String(row[fieldName] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-fallback.csv`;
    a.click();
  },

  importLeadsFromCSV: async (file: File): Promise<boolean> => {
    try {
      const data = await file.arrayBuffer();
      // @ts-ignore
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const newLeads: any[] = [];

      jsonData.forEach((row: any) => {
        const name = row['Nome'] || row['Name'] || row['nome'];
        const email = row['Email'] || row['e-mail'] || row['email'];

        if (!name) return;

        // Normalização de Status
        let rawStatus = String(row['Status'] || '').toLowerCase().trim();
        let status: LeadStatus = 'Novo Lead';

        const statusMap: Record<string, LeadStatus> = {
          'novo_lead': 'Novo Lead',
          'novo lead': 'Novo Lead',
          'em_contato': 'Em Contato',
          'em contato': 'Em Contato',
          'proposta_enviada': 'Proposta Enviada',
          'proposta enviada': 'Proposta Enviada',
          'negociacao': 'Negociação',
          'negociação': 'Negociação',
          'ganho': 'Ganho',
          'perdido': 'Perdido'
        };

        if (statusMap[rawStatus]) {
          status = statusMap[rawStatus];
        } else {
          // Fallback: Tenta capitalizar se não estiver no mapa
          // Ex: "Novo Lead" já viria correto se não caísse no toLowerCase
          // Mas como fizemos toLowerCase, verificamos se o original era válido
          const originalParams = String(row['Status'] || '');
          if (['Novo Lead', 'Em Contato', 'Proposta Enviada', 'Negociação', 'Ganho', 'Perdido'].includes(originalParams)) {
            status = originalParams as LeadStatus;
          }
        }

        const lead: Lead = {
          id: crypto.randomUUID(),
          name: String(name),
          company: String(row['Empresa'] || row['Company'] || ''),
          email: String(email || ''),
          phone: String(row['Telefone'] || row['Phone'] || ''),
          status: status,
          estimatedValue: Number(row['Valor Estimado'] || row['Valor'] || row['Value'] || 0),
          origin: String(row['Origem'] || row['Origin'] || 'Importação'),
          responsible: String(row['Responsável'] || row['Responsible'] || 'Sistema'),
          observations: String(row['Observações'] || row['Notes'] || ''),
          createdAt: String(row['Data Criação'] || new Date().toISOString()),
          interactions: []
        };
        newLeads.push(lead);
      });

      if (newLeads.length > 0) {
        const results = await Promise.all(newLeads.map(lead => storageService.saveLead(lead)));
        const failures = results.filter(current => !current).length;

        if (failures > 0) {
          if (failures === newLeads.length) {
            throw new Error("Erro de Banco de Dados: Nenhum lead foi salvo. Verifique as Permissões (RLS) no Supabase ou formato dos dados.");
          }
          alert(`Atenção: ${failures} leads falharam ao salvar, mas ${newLeads.length - failures} foram importados.`);
        }
        return true;
      }
      alert('Nenhum lead encontrado na planilha. Verifique se as colunas estão corretas (Nome, Email, Telefone, etc).');
      return false;

    } catch (e: any) {
      console.error('Failed to import Excel/CSV', e);
      alert('Erro ao processar arquivo: ' + (e.message || e));
      return false;
    }
  }
};
