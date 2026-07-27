
import { Lead, User, LeadStatus, Form, FormResponse } from '../types';
import * as XLSX from 'xlsx';
import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  query,
  orderBy,
  updateDoc,
  where,
  addDoc,
  getDoc,
  increment
} from 'firebase/firestore';

export const storageService = {
  // Leads
  getLeads: async (): Promise<Lead[]> => {
    try {
      const leadsRef = collection(db, 'leads');
      const q = query(leadsRef, orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          company: data.company,
          email: data.email,
          phone: data.phone,
          status: data.status,
          estimatedValue: Number(data.estimated_value),
          origin: data.origin,
          responsible: data.responsible,
          observations: data.observations,
          createdAt: data.created_at,
          interactions: data.interactions || [],
          tags: data.tags || []
        } as Lead;
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  },

  saveLead: async (lead: Lead): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbLead = {
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        estimated_value: lead.estimatedValue,
        origin: lead.origin,
        responsible: lead.responsible,
        observations: lead.observations,
        created_at: lead.createdAt || new Date().toISOString(),
        interactions: lead.interactions,
        tags: lead.tags || []
      };

      await setDoc(doc(db, 'leads', lead.id), dbLead);
      return { success: true };
    } catch (error: any) {
      console.error('Error saving lead:', error);
      return { success: false, error: error.message };
    }
  },

  deleteLead: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'leads', id));
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone,
          status: data.status,
          isAdmin: data.is_admin,
          password: data.password
        } as User;
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  saveUser: async (user: User): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbUser = {
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
        is_admin: user.isAdmin,
        password: user.password
      };

      await setDoc(doc(db, 'users', user.id), dbUser);
      return { success: true };
    } catch (error: any) {
      console.error('Error saving user:', error);
      return { success: false, error: error.message };
    }
  },

  deleteUser: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  },

  // Export/Import (Excel & CSV) remains similar but using storageService.getLeads
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
        'Etiquetas': lead.tags?.join(', ') || '',
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
      let jsonData: any[] = [];

      // Fallback CSV text parser if SheetJS binary read fails
      const parseCSVText = (text: string): any[] => {
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) return [];

        const firstLine = lines[0];
        const separator = firstLine.includes(';') ? ';' : ',';

        const splitLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === separator && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = splitLine(lines[0]);
        const rows: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = splitLine(lines[i]);
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] !== undefined ? values[index] : '';
          });
          rows.push(row);
        }
        return rows;
      };

      try {
        const data = await file.arrayBuffer();
        // @ts-ignore
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet);
      } catch (xlsxError) {
        console.warn('XLSX binary parser failed, trying text/csv fallback:', xlsxError);
        const text = await file.text();
        jsonData = parseCSVText(text);
      }

      const newLeads: any[] = [];

      const parseDate = (dateStr: any): string => {
        try {
          if (!dateStr) return new Date().toISOString();
          if (dateStr instanceof Date && !isNaN(dateStr.getTime())) return dateStr.toISOString();
          if (typeof dateStr === 'number') {
            const date = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
            return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
          }
          const str = String(dateStr).trim();
          
          // Try direct parsing (handles ISO dates and most text formats)
          const parsed = new Date(str);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString();
          }

          // Handles DD/MM/YYYY format with optional time
          const dateMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
          if (dateMatch) {
            const [, day, month, year] = dateMatch;
            const date = new Date(`${year}-${month}-${day}`);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
          }
        } catch (err) {
          console.error('Failed to parse date:', dateStr, err);
        }
        return new Date().toISOString();
      };

      const parseCurrency = (val: any): number => {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;
        let str = String(val).replace(/[R$\s]/g, '').trim();
        if (str.includes('.') && str.includes(',')) {
          if (str.indexOf('.') < str.indexOf(',')) {
            str = str.replace(/\./g, '').replace(',', '.');
          } else {
            str = str.replace(/,/g, '');
          }
        } else if (str.includes(',')) {
          str = str.replace(',', '.');
        }
        return parseFloat(str) || 0;
      };

      // Helper to dynamically match column headers case-insensitively and space-insensitively
      const getRowValue = (row: any, searchKeys: string[]): any => {
        const rowKeys = Object.keys(row);
        for (const searchKey of searchKeys) {
          const cleanSearch = searchKey.toLowerCase().replace(/[^a-z0-9]/g, '');
          const match = rowKeys.find(rk => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSearch);
          if (match) return row[match];
        }
        for (const searchKey of searchKeys) {
          const cleanSearch = searchKey.toLowerCase().replace(/[^a-z0-9]/g, '');
          const match = rowKeys.find(rk => rk.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanSearch));
          if (match) return row[match];
        }
        return undefined;
      };

      jsonData.forEach((row: any) => {
        const name = getRowValue(row, ['nome', 'name', 'cliente', 'lead', 'contato']);
        const email = getRowValue(row, ['email', 'mail', 'e-mail']);
        const phone = getRowValue(row, ['telefone', 'phone', 'celular', 'whatsapp', 'tel']);
        const company = getRowValue(row, ['empresa', 'company', 'organizacao', 'corporacao']) || '';
        const value = getRowValue(row, ['valor', 'value', 'preco', 'budget', 'estimado']);
        const origin = getRowValue(row, ['origem', 'origin', 'canal', 'source']) || 'Importação';
        const responsible = getRowValue(row, ['responsavel', 'responsible', 'dono', 'owner']) || 'Sistema';
        const observations = getRowValue(row, ['observacoes', 'notes', 'comentarios', 'detalhes', 'obs']) || '';
        const createdAt = getRowValue(row, ['datacriacao', 'createdat', 'data', 'date']);
        const tagsStr = getRowValue(row, ['tags', 'etiquetas', 'marcadores']) || '';

        if (!name) return;

        let rawStatus = String(getRowValue(row, ['status', 'estagio', 'etapa']) || '').toLowerCase().trim();
        let status: LeadStatus = 'Novo Lead';
        const statusMap: Record<string, LeadStatus> = {
          'novo_lead': 'Novo Lead', 'novo lead': 'Novo Lead',
          'em_contato': 'Em Contato', 'em contato': 'Em Contato',
          'proposta_enviada': 'Proposta Enviada', 'proposta enviada': 'Proposta Enviada',
          'negociacao': 'Negociação', 'negociação': 'Negociação',
          'ganho': 'Ganho', 'perdido': 'Perdido'
        };

        if (statusMap[rawStatus]) {
          status = statusMap[rawStatus];
        } else {
          const originalParams = String(getRowValue(row, ['status', 'estagio', 'etapa']) || '');
          if (['Novo Lead', 'Em Contato', 'Proposta Enviada', 'Negociação', 'Ganho', 'Perdido'].includes(originalParams)) {
            status = originalParams as LeadStatus;
          }
        }

        const tagsArray = typeof tagsStr === 'string' && tagsStr
          ? tagsStr.split(',').map(t => t.trim()).filter(Boolean)
          : Array.isArray(tagsStr) ? tagsStr : [];

        const lead: Lead = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
          name: String(name),
          company: String(company),
          email: String(email || ''),
          phone: String(phone || ''),
          status: status,
          estimatedValue: parseCurrency(value),
          origin: String(origin),
          responsible: String(responsible),
          observations: String(observations),
          createdAt: parseDate(createdAt),
          interactions: [],
          tags: tagsArray
        };
        newLeads.push(lead);
      });

      if (newLeads.length > 0) {
        let lastError = "";
        const results = await Promise.all(newLeads.map(async lead => {
          const result = await storageService.saveLead(lead);
          if (!result.success) lastError = result.error || "Unknown";
          return result.success;
        }));

        const failures = results.filter(ok => !ok).length;
        if (failures > 0) {
          if (failures === newLeads.length) {
            throw new Error(`Erro ao salvar leads: ${lastError}`);
          }
          alert(`Atenção: ${failures} leads falharam.`);
        }
        return true;
      }
      return false;
    } catch (e: any) {
      console.error('Failed to import', e);
      alert('Erro ao processar arquivo: ' + (e.message || e));
      return false;
    }
  },

  // Pipeline Stages
  getPipelineStages: async () => {
    try {
      const stagesRef = collection(db, 'pipeline_stages');
      const q = query(stagesRef, orderBy('position', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching pipeline stages:', error);
      return [];
    }
  },

  savePipelineStage: async (stage: any) => {
    try {
      const { id, ...data } = stage;
      if (id) {
        await setDoc(doc(db, 'pipeline_stages', id), data, { merge: true });
      } else {
        await addDoc(collection(db, 'pipeline_stages'), data);
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  deletePipelineStage: async (id: string) => {
    await deleteDoc(doc(db, 'pipeline_stages', id));
  },

  // Projects, Boards, Tasks (Simplified for Migration)
  getProjects: async () => {
    const querySnapshot = await getDocs(collection(db, 'projects'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  getProject: async (id: string) => {
    const docSnap = await getDoc(doc(db, 'projects', id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  getBoards: async (projectId: string) => {
    const q = query(collection(db, 'boards'), where('project_id', '==', projectId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  getBoardColumns: async (boardId: string) => {
    const q = query(collection(db, 'board_columns'), where('board_id', '==', boardId), orderBy('position', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  getTasks: async (columnIds: string[]) => {
    if (columnIds.length === 0) return [];
    const q = query(collection(db, 'tasks'), where('column_id', 'in', columnIds), orderBy('position', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Webhook Settings
  getWebhookSettings: async (profile: string = 'default') => {
    try {
      const docSnap = await getDoc(doc(db, 'settings', `webhook_${profile}`));
      return docSnap.exists() ? docSnap.data() : { mappings: {}, lastPayload: null };
    } catch (error) {
      console.error(`Error fetching webhook settings for ${profile}:`, error);
      return { mappings: {}, lastPayload: null };
    }
  },

  saveWebhookSettings: async (settings: any, profile: string = 'default') => {
    try {
      await setDoc(doc(db, 'settings', `webhook_${profile}`), settings, { merge: true });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  clearWebhookPayload: async (profile: string = 'default') => {
    try {
      await updateDoc(doc(db, 'settings', `webhook_${profile}`), {
        lastPayload: null,
        lastReceived: null
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getWebhookProfiles: async () => {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'webhook_profiles'));
      return docSnap.exists() ? docSnap.data().list || ['default'] : ['default'];
    } catch (error) {
      return ['default'];
    }
  },

  saveWebhookProfile: async (profileName: string) => {
    try {
      const profiles = await storageService.getWebhookProfiles();
      if (!profiles.includes(profileName)) {
        profiles.push(profileName);
        await setDoc(doc(db, 'settings', 'webhook_profiles'), { list: profiles });
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Forms
  getForms: async (workspaceId?: string): Promise<Form[]> => {
    try {
      const formsRef = collection(db, 'forms');
      let q = query(formsRef, orderBy('createdAt', 'desc'));
      if (workspaceId) {
        q = query(formsRef, where('workspaceId', '==', workspaceId), orderBy('createdAt', 'desc'));
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data } as Form;
      });
    } catch (error) {
      console.error('Error fetching forms:', error);
      return [];
    }
  },

  getForm: async (id: string): Promise<Form | null> => {
    try {
      const docSnap = await getDoc(doc(db, 'forms', id));
      return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Form) : null;
    } catch (error) {
      console.error('Error fetching form:', error);
      return null;
    }
  },

  getFormBySlug: async (slug: string): Promise<Form | null> => {
    try {
      const q = query(collection(db, 'forms'), where('settings.slug', '==', slug));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Form;
    } catch (error) {
      console.error('Error fetching form by slug:', error);
      return null;
    }
  },

  saveForm: async (form: Form): Promise<{ success: boolean; error?: string }> => {
    try {
      const { id, ...data } = form;
      const cleanData = JSON.parse(JSON.stringify(data)); // strip any undefined properties for Firestore
      await setDoc(doc(db, 'forms', id), cleanData);
      return { success: true };
    } catch (error: any) {
      console.error('Error saving form:', error);
      return { success: false, error: error.message };
    }
  },

  deleteForm: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteDoc(doc(db, 'forms', id));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting form:', error);
      return { success: false, error: error.message };
    }
  },

  // Form Responses
  getResponses: async (formId: string): Promise<FormResponse[]> => {
    try {
      const responsesRef = collection(db, 'form_responses');
      const q = query(responsesRef, where('formId', '==', formId));
      const querySnapshot = await getDocs(q);
      const responses = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data } as FormResponse;
      });
      // Sort in-memory to prevent requiring composite index in Firestore
      return responses.sort((a, b) => {
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        return dateB.localeCompare(dateA);
      });
    } catch (error) {
      console.error('Error fetching responses:', error);
      return [];
    }
  },

  saveResponse: async (response: FormResponse): Promise<{ success: boolean; error?: string }> => {
    try {
      const { id, ...data } = response;
      const cleanData = JSON.parse(JSON.stringify(data)); // strip any undefined properties for Firestore
      await setDoc(doc(db, 'form_responses', id), cleanData);
      return { success: true };
    } catch (error: any) {
      console.error('Error saving response:', error);
      return { success: false, error: error.message };
    }
  },

  deleteResponse: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteDoc(doc(db, 'form_responses', id));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting response:', error);
      return { success: false, error: error.message };
    }
  },

  incrementFormMetric: async (formId: string, metric: 'viewsCount' | 'startsCount' | 'completionsCount' | 'partialsCount'): Promise<void> => {
    try {
      await updateDoc(doc(db, 'forms', formId), {
        [metric]: increment(1),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error incrementing ${metric}:`, error);
    }
  },

  recoverOrphanedResponses: async (): Promise<number> => {
    try {
      const responsesRef = collection(db, 'form_responses');
      const querySnapshot = await getDocs(responsesRef);
      const responses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      const timeThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const orphaned = responses.filter(r => 
        (r.createdAt && r.createdAt > timeThreshold) && 
        !r.leadId && 
        r.answers && 
        Object.keys(r.answers).length > 0
      );

      if (orphaned.length === 0) return 0;

      const leadsRef = collection(db, 'leads');
      const leadsSnapshot = await getDocs(leadsRef);
      const leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      let count = 0;
      for (const resp of orphaned) {
        const formRef = doc(db, 'forms', resp.formId);
        const formSnap = await getDoc(formRef);
        let form: any = null;
        if (formSnap.exists()) {
          form = formSnap.data();
        }

        let leadName = '';
        let leadEmail = '';
        let leadPhone = '';
        let leadCompany = '';
        let leadEstimatedValue = 0;
        let leadObservations = `Submissão do formulário: "${form?.settings?.publicTitle || 'Formulário'}" (Recuperado)\n\nRespostas:\n`;

        Object.values(resp.answers).forEach((ans: any) => {
          leadObservations += `- **${ans.questionTitle}**: ${Array.isArray(ans.value) ? ans.value.join(', ') : ans.value}\n`;

          if (ans.crmField === 'name' && ans.value) leadName = String(ans.value);
          if (ans.crmField === 'email' && ans.value) leadEmail = String(ans.value).trim().toLowerCase();
          if (ans.crmField === 'phone' && ans.value) leadPhone = String(ans.value).trim();
          if (ans.crmField === 'company' && ans.value) leadCompany = String(ans.value);
          if (ans.crmField === 'estimatedValue' && ans.value) leadEstimatedValue = Number(ans.value) || 0;
        });

        if (!leadName) {
          leadName = leadEmail ? leadEmail.split('@')[0] : 'Lead s/ Nome';
        }

        let existingLead: any = null;
        let existingLeadId: string | null = null;

        if (leadEmail) {
          const match = leads.find((l: any) => l.email?.trim().toLowerCase() === leadEmail);
          if (match) {
            existingLead = match;
            existingLeadId = match.id;
          }
        }
        if (!existingLeadId && leadPhone) {
          const match = leads.find((l: any) => l.phone?.trim() === leadPhone);
          if (match) {
            existingLead = match;
            existingLeadId = match.id;
          }
        }

        const stage = form?.automations?.pipelineStage || 'Novo Lead';
        const responsible = form?.automations?.responsibleUser || 'Sistema';
        const baseTags = form?.automations?.addTags || [];
        const formTag = `form:${form?.settings?.slug || resp.formId}`;
        const allTags = Array.from(new Set([...baseTags, formTag]));

        const randId = typeof crypto !== 'undefined' && (crypto as any).randomUUID 
          ? (crypto as any).randomUUID() 
          : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const newInteraction = {
          id: randId,
          type: 'Outro' as const,
          date: new Date().toISOString(),
          description: `Submeteu o formulário: ${form?.settings?.publicTitle || 'Formulário'} (Recuperado)\n${leadObservations}`
        };

        let finalLeadId = '';
        if (existingLeadId && existingLead) {
          const updatedLead: Lead = {
            ...existingLead,
            name: existingLead.name || leadName,
            company: existingLead.company || leadCompany,
            email: existingLead.email || leadEmail,
            phone: existingLead.phone || leadPhone,
            estimatedValue: existingLead.estimatedValue || leadEstimatedValue,
            responsible: existingLead.responsible || responsible,
            tags: Array.from(new Set([...(existingLead.tags || []), ...allTags])),
            observations: (existingLead.observations || '') + `\n\n[Recuperado via Formulário] ${new Date().toLocaleDateString('pt-BR')}:\n` + leadObservations,
            interactions: [...(existingLead.interactions || []), newInteraction]
          };
          await storageService.saveLead(updatedLead);
          finalLeadId = existingLeadId;
        } else {
          const newLeadId = typeof crypto !== 'undefined' && (crypto as any).randomUUID
            ? (crypto as any).randomUUID()
            : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

          const newLead: Lead = {
            id: newLeadId,
            name: leadName,
            company: leadCompany,
            email: leadEmail,
            phone: leadPhone,
            status: stage,
            estimatedValue: leadEstimatedValue,
            origin: form?.settings?.publicTitle || 'Formulário',
            responsible: responsible,
            tags: allTags,
            observations: leadObservations,
            createdAt: new Date().toISOString(),
            interactions: [newInteraction]
          };
          await storageService.saveLead(newLead);
          finalLeadId = newLeadId;
        }

        const responseRef = doc(db, 'form_responses', resp.id);
        await updateDoc(responseRef, {
          leadId: finalLeadId,
          status: 'completed',
          updatedAt: new Date().toISOString()
        });

        count++;
      }
      return count;
    } catch (error) {
      console.error('Error recovering orphaned responses:', error);
      return 0;
    }
  }
};
