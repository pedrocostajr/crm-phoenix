
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, User, Interaction } from '../types';
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
  const [activeTab, setActiveTab] = useState<'details' | 'interactions'>('details');
  const [newInteraction, setNewInteraction] = useState<Partial<Interaction>>({
    type: 'Ligação',
    description: '',
    date: new Date().toISOString()
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
      interactions: formData.interactions || [],
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

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Detalhes
          </button>
          <button
            onClick={() => setActiveTab('interactions')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'interactions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Interações ({formData.interactions?.length || 0})
          </button>
        </div>

        {/* Body */}
        {activeTab === 'details' ? (
          <form onSubmit={handleSubmit} className="p-8 h-[600px] overflow-y-auto">
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
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                <Save size={20} />
                {lead ? 'Salvar Alterações' : 'Criar Lead'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 h-[600px] overflow-y-auto bg-slate-50/50">
            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm mb-8">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={14} className="text-blue-500" />
                Nova Interação
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                {['Ligação', 'Email', 'Reunião', 'WhatsApp', 'Outro'].map((type) => {
                  const icons = {
                    'Ligação': Phone,
                    'Email': Mail,
                    'Reunião': UserIcon,
                    'WhatsApp': FileText, // Using FileText as generic, better would be MessageCircle if available
                    'Outro': Tag
                  };
                  const Icon = icons[type as keyof typeof icons] || Tag;

                  return (
                    <button
                      key={type}
                      onClick={() => setNewInteraction({ ...newInteraction, type: type as any })}
                      className={`
                          flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all
                          ${newInteraction.type === type
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-blue-300 hover:text-blue-500'}
                        `}
                    >
                      <Icon size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{type}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInteraction.description}
                  onChange={(e) => setNewInteraction({ ...newInteraction, description: e.target.value })}
                  placeholder="Descreva a interação..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newInteraction.description) {
                        const interaction: Interaction = {
                          id: `int_${Date.now()}`,
                          type: newInteraction.type as any,
                          description: newInteraction.description,
                          date: new Date().toISOString()
                        };
                        setFormData({
                          ...formData,
                          interactions: [...(formData.interactions || []), interaction]
                        });
                        setNewInteraction({ ...newInteraction, description: '' });
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newInteraction.description) {
                      const interaction: Interaction = {
                        id: `int_${Date.now()}`,
                        type: newInteraction.type as any,
                        description: newInteraction.description,
                        date: new Date().toISOString()
                      };
                      setFormData({
                        ...formData,
                        interactions: [...(formData.interactions || []), interaction]
                      });
                      setNewInteraction({ ...newInteraction, description: '' });
                    }
                  }}
                  disabled={!newInteraction.description}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  <Save size={20} />
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6 relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200"></div>

              {[...(formData.interactions || [])].reverse().map((interaction) => (
                <div key={interaction.id} className="flex gap-6 items-start animate-in slide-in-from-right-4 duration-500">
                  <div className={`
                    relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border-2 border-white
                    ${interaction.type === 'Ligação' ? 'bg-blue-100 text-blue-600' : ''}
                    ${interaction.type === 'Email' ? 'bg-purple-100 text-purple-600' : ''}
                    ${interaction.type === 'Reunião' ? 'bg-green-100 text-green-600' : ''}
                    ${interaction.type === 'WhatsApp' ? 'bg-emerald-100 text-emerald-600' : ''}
                    ${interaction.type === 'Outro' ? 'bg-slate-100 text-slate-600' : ''}
                  `}>
                    {interaction.type === 'Ligação' && <Phone size={18} />}
                    {interaction.type === 'Email' && <Mail size={18} />}
                    {interaction.type === 'Reunião' && <UserIcon size={18} />}
                    {interaction.type === 'WhatsApp' && <FileText size={18} />}
                    {interaction.type === 'Outro' && <Tag size={18} />}
                  </div>
                  <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{interaction.type}</span>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-full">
                        {new Date(interaction.date).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{interaction.description}</p>
                  </div>
                </div>
              ))}

              {(!formData.interactions || formData.interactions.length === 0) && (
                <div className="text-center py-12 opacity-40">
                  <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="font-bold text-slate-400">Nenhuma interação registrada</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                <Save size={20} />
                Salvar Tudo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadModal;
