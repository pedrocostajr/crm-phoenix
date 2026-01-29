
import React, { useState } from 'react';
import { Lead, Interaction } from '../types';
import { 
  X, 
  Plus, 
  MessageCircle, 
  Phone, 
  Mail, 
  Users, 
  MoreHorizontal,
  Calendar,
  Clock,
  Send
} from 'lucide-react';

interface InteractionTimelineProps {
  lead: Lead;
  onClose: () => void;
  onAddInteraction: (leadId: string, interaction: Interaction) => void;
}

const InteractionTimeline: React.FC<InteractionTimelineProps> = ({ lead, onClose, onAddInteraction }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInteraction, setNewInteraction] = useState<Partial<Interaction>>({
    type: 'Ligação',
    description: '',
    date: new Date().toISOString()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const interaction: Interaction = {
      id: `int_${Date.now()}`,
      type: newInteraction.type as any,
      description: newInteraction.description || '',
      date: new Date().toISOString()
    };
    onAddInteraction(lead.id, interaction);
    setShowAddForm(false);
    setNewInteraction({ type: 'Ligação', description: '', date: new Date().toISOString() });
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Ligação': return <Phone size={14} />;
      case 'Email': return <Mail size={14} />;
      case 'Reunião': return <Users size={14} />;
      case 'WhatsApp': return <MessageCircle size={14} />;
      default: return <MoreHorizontal size={14} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Ligação': return 'bg-blue-100 text-blue-600';
      case 'Email': return 'bg-purple-100 text-purple-600';
      case 'Reunião': return 'bg-green-100 text-green-600';
      case 'WhatsApp': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden animate-in slide-in-from-right duration-300">
        <div className="bg-white border-b border-slate-100 p-6 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Interações</h2>
            <p className="text-sm text-slate-500 font-medium">{lead.name} • {lead.company}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[600px] overflow-y-auto bg-slate-50/30">
          <button
            onClick={() => setShowAddForm(true)}
            className={`w-full py-4 px-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all mb-8 ${showAddForm ? 'hidden' : 'flex'}`}
          >
            <Plus size={20} />
            <span className="font-bold text-sm uppercase tracking-wider">Nova Interação</span>
          </button>

          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-10 bg-white p-6 rounded-2xl border border-blue-200 shadow-xl shadow-blue-500/5 animate-in zoom-in-95 duration-200">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Registrar Histórico</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  {['Ligação', 'Email', 'Reunião', 'WhatsApp', 'Outro'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewInteraction({ ...newInteraction, type: type as any })}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg uppercase tracking-tighter transition-all ${newInteraction.type === type ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <textarea
                  required
                  rows={3}
                  value={newInteraction.description}
                  onChange={(e) => setNewInteraction({ ...newInteraction, description: e.target.value })}
                  placeholder="Descreva o que aconteceu nesta interação..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <Send size={16} /> Salvar
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200"></div>

            <div className="space-y-8 relative">
              {[...lead.interactions].reverse().map((interaction) => (
                <div key={interaction.id} className="flex gap-6 items-start">
                  <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-white ${getTypeColor(interaction.type)}`}>
                    {getIcon(interaction.type)}
                  </div>
                  <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{interaction.type}</span>
                      <div className="flex flex-col items-end gap-0.5">
                         <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Calendar size={10} /> {new Date(interaction.date).toLocaleDateString()}
                         </span>
                         <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock size={10} /> {new Date(interaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{interaction.description}</p>
                  </div>
                </div>
              ))}
              
              {lead.interactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle size={32} className="text-slate-300" />
                   </div>
                   <p className="text-sm font-medium text-slate-400">Nenhuma interação registrada ainda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractionTimeline;
