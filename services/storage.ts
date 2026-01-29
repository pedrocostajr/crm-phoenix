
import { Lead, User } from '../types';

const PREFIX_LEAD = 'lead:';
const PREFIX_USER = 'usuario:';

export const storageService = {
  // Leads
  getLeads: (): Lead[] => {
    const leads: Lead[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX_LEAD)) {
        const item = localStorage.getItem(key);
        if (item) leads.push(JSON.parse(item));
      }
    }
    return leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  saveLead: (lead: Lead) => {
    localStorage.setItem(`${PREFIX_LEAD}${lead.id}`, JSON.stringify(lead));
  },
  deleteLead: (id: string) => {
    localStorage.removeItem(`${PREFIX_LEAD}${id}`);
  },

  // Users
  getUsers: (): User[] => {
    const users: User[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX_USER)) {
        const item = localStorage.getItem(key);
        if (item) users.push(JSON.parse(item));
      }
    }
    return users;
  },
  saveUser: (user: User) => {
    localStorage.setItem(`${PREFIX_USER}${user.id}`, JSON.stringify(user));
  },
  deleteUser: (id: string) => {
    localStorage.removeItem(`${PREFIX_USER}${id}`);
  },

  // Export/Import
  exportData: () => {
    const data = {
      leads: storageService.getLeads(),
      users: storageService.getUsers(),
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phoenix-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  },
  importData: async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.leads) {
        data.leads.forEach((l: Lead) => storageService.saveLead(l));
      }
      if (data.users) {
        data.users.forEach((u: User) => storageService.saveUser(u));
      }
      return true;
    } catch (e) {
      console.error('Failed to import data', e);
      return false;
    }
  }
};
