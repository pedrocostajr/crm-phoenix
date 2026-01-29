
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, User } from '../types';
import { X, Save, Building, User as UserIcon, Mail, Phone, Tag, DollarSign, FileText, Globe } from 'lucide-react';

interface LeadModalProps {
  lead?: Lead | null;
  users: User[];
  onClose: () => void;
  onSave: (lead: Lead) => void;
}

const LeadModal: React.FC<LeadModalProps> = ({ lead, users, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'Novo Lead',
    estimatedValue: 0,
    origin: 'Site',
    responsible: users[0]?.name || '',
    observations: '',
    interactions: [],
    createdAt: new Date().toISOString(),
  });

  useEffect(() => {
    if (lead) setFormData(lead);
  }, [lead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData as Lead,
      id: lead?.id || crypto.randomUUID(),
      createdAt: lead?.createdAt || new Date().toISOString(),
      interactions: lead?.interactions || [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-6 flex items-center justify-between text-white">
          <div>
            <h2 className="text-xl font-bold">{lead ? 'Editar Lead' : 'Adicionar Novo Lead'}</h2>
            <p className="text-slate-400 text-sm mt-1">Preencha os dados do potencial cliente</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <UserIcon size={14} className="text-blue-500" /> Nome Completo
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="Ex: João Silva"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Building size={14} className="text-blue-500" /> Empresa
              </label>
              <input
                required
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="Nome da empresa"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Mail size={14} className="text-blue-500" /> E-mail
              </label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="email@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Phone size={14} className="text-blue-500" /> Telefone
              </label>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Tag size={14} className="text-blue-500" /> Status do Pipeline
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="Novo Lead">Novo Lead</option>
                <option value="Em Contato">Em Contato</option>
                <option value="Proposta Enviada">Proposta Enviada</option>
                <option value="Negociação">Negociação</option>
                <option value="Ganho">Ganho</option>
                <option value="Perdido">Perdido</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <DollarSign size={14} className="text-blue-500" /> Valor Estimado (R$)
              </label>
              <input
                type="number"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Globe size={14} className="text-blue-500" /> Origem
              </label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="Google, Facebook, Indicação..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <UserIcon size={14} className="text-blue-500" /> Responsável
              </label>
              <select
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
              >
                {users.filter(u => u.status === 'Ativo').map(user => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <FileText size={14} className="text-blue-500" /> Observações
            </label>
            <textarea
              rows={3}
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="Adicione detalhes relevantes sobre o lead..."
            />
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              <Save size={20} />
              {lead ? 'Salvar Alterações' : 'Criar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadModal;
