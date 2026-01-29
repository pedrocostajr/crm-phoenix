
import React, { useState, useEffect, useCallback } from 'react';
import { AuthState, Lead, User, LeadStatus, Interaction } from './types';
import { storageService } from './services/storage';
import { INITIAL_ADMINS, DEFAULT_PASSWORD } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LeadTable from './components/LeadTable';
import LeadKanban from './components/LeadKanban';
import UserManagement from './components/UserManagement';
import LeadModal from './components/LeadModal';
import InteractionTimeline from './components/InteractionTimeline';
import { Lock, Flame, Mail, Key } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const savedAuth = localStorage.getItem('phoenix_auth');
      console.log('🔄 Checking saved auth:', savedAuth);
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        console.log('✅ Auth restored:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('❌ Failed to parse auth:', error);
      localStorage.removeItem('phoenix_auth');
    }
    return { user: null, isAuthenticated: false };
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('phoenix_active_tab') || 'dashboard';
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('phoenix_active_tab', activeTab);
  }, [activeTab]);

  // Modals
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isInteractionOpen, setIsInteractionOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // Initialize Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [storedLeads, storedUsers] = await Promise.all([
        storageService.getLeads(),
        storageService.getUsers()
      ]);

      setLeads(storedLeads);

      if (storedUsers.length === 0) {
        // If no users in DB, seed initial admins
        // In Supabase, we should probably do this once manually or check carefully
        // But keeping logic similar for now
        // Wait, saving requires await
        await Promise.all(INITIAL_ADMINS.map(u => storageService.saveUser(u)));
        setUsers(INITIAL_ADMINS);
      } else {
        setUsers(storedUsers);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auth Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());

    // Check for hardcoded admins first or existing users with default password
    const isAdmin = INITIAL_ADMINS.some(a => a.email.toLowerCase() === loginEmail.toLowerCase());

    if ((isAdmin || foundUser) && loginPass === DEFAULT_PASSWORD) {
      const authUser = foundUser || INITIAL_ADMINS.find(a => a.email.toLowerCase() === loginEmail.toLowerCase())!;
      const newAuth = { user: authUser, isAuthenticated: true };
      setAuth(newAuth);
      console.log('💾 Saving auth to localStorage:', newAuth);
      localStorage.setItem('phoenix_auth', JSON.stringify(newAuth));
      setLoginError('');
    } else {
      setLoginError('E-mail ou senha incorretos.');
    }
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem('phoenix_auth');
    setLoginEmail('');
    setLoginPass('');
  };

  // Lead Handlers
  const handleSaveLead = async (leadData: Lead) => {
    const result = await storageService.saveLead(leadData);
    if (!result.success) {
      alert(`Erro ao salvar: ${result.error}`);
      return;
    }
    await fetchData(); // Refresh data
    setIsLeadModalOpen(false);
    setEditingLead(null);
  };

  const handleDeleteLead = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      await storageService.deleteLead(id);
      await fetchData();
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: LeadStatus) => {
    const lead = leads.find(l => l.id === id);
    if (lead) {
      const updatedLead = { ...lead, status: newStatus };
      const result = await storageService.saveLead(updatedLead);
      if (!result.success) {
        alert(`Erro ao atualizar status: ${result.error}`);
        return;
      }
      await fetchData();
    }
  };

  const handleAddInteraction = async (leadId: string, interaction: Interaction) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      const updatedLead = {
        ...lead,
        interactions: [...lead.interactions, interaction]
      };
      const result = await storageService.saveLead(updatedLead);
      if (!result.success) {
        alert(`Erro ao salvar interação: ${result.error}`);
        return;
      }
      await fetchData();
      setActiveLead(updatedLead); // Update active lead
    }
  };

  // User Handlers
  const handleAddUser = async (user: User) => {
    await storageService.saveUser(user);
    await fetchData();
  };

  const handleUpdateUser = async (user: User) => {
    await storageService.saveUser(user);
    await fetchData();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Deseja realmente remover este usuário?')) {
      await storageService.deleteUser(id);
      await fetchData();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-10 space-y-4">
            <div className="p-4 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-500/20 rotate-3">
              <Flame size={48} className="text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-white tracking-tight">PHOENIX CRM</h1>
              <p className="text-slate-400 font-medium">Gestão de Leads de Alta Performance</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Lock size={20} className="text-slate-400" /> Acesse sua conta
            </h2>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <Mail size={14} className="text-blue-500" /> E-mail
                </label>
                <input
                  required
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="exemplo@phoenix.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <Key size={14} className="text-blue-500" /> Senha
                </label>
                <input
                  required
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              {loginError && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg flex items-center gap-2">⚠️ {loginError}</p>}

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                Entrar no Sistema
              </button>
            </form>

            <p className="text-center text-slate-400 text-xs mt-8">
              © 2024 Phoenix Agency CRM. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
      userName={auth.user?.name || 'User'}
    >
      {activeTab === 'dashboard' && <Dashboard leads={leads} />}

      {activeTab === 'leads' && (
        <LeadTable
          leads={leads}
          onAdd={() => {
            setEditingLead(null);
            setIsLeadModalOpen(true);
          }}
          onEdit={(lead) => {
            setEditingLead(lead);
            setIsLeadModalOpen(true);
          }}
          onDelete={handleDeleteLead}
          onInteraction={(lead) => {
            setActiveLead(lead);
            setIsInteractionOpen(true);
          }}
        />
      )}

      {activeTab === 'kanban' && (
        <LeadKanban
          leads={leads}
          onUpdateStatus={handleUpdateStatus}
          onEditLead={(lead) => {
            setEditingLead(lead);
            setIsLeadModalOpen(true);
          }}
        />
      )}

      {activeTab === 'users' && (
        <UserManagement
          users={users}
          onAdd={handleAddUser}
          onUpdate={handleUpdateUser}
          onDelete={handleDeleteUser}
        />
      )}

      {isLeadModalOpen && (
        <LeadModal
          lead={editingLead}
          users={users}
          onClose={() => {
            setIsLeadModalOpen(false);
            setEditingLead(null);
          }}
          onSave={handleSaveLead}
        />
      )}

      {isInteractionOpen && activeLead && (
        <InteractionTimeline
          lead={activeLead}
          onClose={() => {
            setIsInteractionOpen(false);
            setActiveLead(null);
          }}
          onAddInteraction={handleAddInteraction}
        />
      )}
    </Layout>
  );
};

export default App;
