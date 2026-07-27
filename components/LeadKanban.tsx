import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { usePipeline } from '../hooks/usePipeline';
import PipelineEditor from './PipelineEditor';
import {
  Building2,
  CircleDollarSign,
  User,
  MoreVertical,
  Settings,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  MessageCircle,
  Phone
} from 'lucide-react';

interface LeadKanbanProps {
  leads: Lead[];
  onUpdateStatus: (id: string, newStatus: LeadStatus) => void;
  onEditLead: (lead: Lead) => void;
  onAddLead?: (status: LeadStatus) => void;
}

const LeadKanban: React.FC<LeadKanbanProps> = ({ leads, onUpdateStatus, onEditLead, onAddLead }) => {
  const { stages, loading } = usePipeline();
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [draggedOverStageId, setDraggedOverStageId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter(l => l.status === status);
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id);
    e.dataTransfer.setData('leadId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('leadId');
    if (id) {
      onUpdateStatus(id, status);
    }
    setDraggedLeadId(null);
    setDraggedOverStageId(null);
  };

  const onDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedOverStageId !== stageId) {
      setDraggedOverStageId(stageId);
    }
  };

  const onDragLeave = () => {
    setDraggedOverStageId(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const formatLeadDate = (lead: Lead) => {
    const rawDate = lead.createdAt || lead.created_at || (lead as any).date;
    if (!rawDate) return null;
    
    let dateObj: Date;
    const str = String(rawDate).trim();
    if (str.includes('/')) {
      const parts = str.split(' ');
      const dateParts = parts[0].split('/');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);
        let hours = 0, minutes = 0;
        if (parts[1]) {
          const timeParts = parts[1].split(':');
          hours = parseInt(timeParts[0] || '0', 10);
          minutes = parseInt(timeParts[1] || '0', 10);
        }
        dateObj = new Date(year, month, day, hours, minutes);
      } else {
        dateObj = new Date(str);
      }
    } else {
      dateObj = new Date(str.replace(' ', 'T'));
    }
    
    if (isNaN(dateObj.getTime())) return null;

    const today = new Date();
    const isToday = today.toDateString() === dateObj.toDateString();
    const dateStr = isToday ? 'Hoje' : dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return { dateStr, timeStr, isToday };
  };

  const handleWhatsAppClick = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    if (!lead.phone) {
      alert('Este lead não possui número de telefone cadastrado.');
      return;
    }
    let cleanPhone = lead.phone.replace(/\D/g, '');
    if (!cleanPhone) {
      alert('Número de telefone inválido.');
      return;
    }
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = '55' + cleanPhone;
    }
    
    const message = encodeURIComponent(`Olá ${lead.name || ''}, tudo bem? Vi seu cadastro em nosso sistema e gostaria de conversar!`);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-6 h-full">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-shrink-0 w-80 h-full bg-slate-100/50 rounded-2xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  const totalValue = leads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
  const totalCount = leads.length;

  return (
    <>
      <div className="relative h-full flex flex-col space-y-4">
        
        {/* Top Summary Bar & Settings */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm -mt-2">
          <div className="flex gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <TrendingUp size={16} />
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Valor Total</p>
                <p className="text-sm font-black text-slate-700">{formatCurrency(totalValue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <User size={16} />
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Total de Leads</p>
                <p className="text-sm font-black text-slate-700">{totalCount} leads</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditorOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors shadow-sm self-end sm:self-auto"
          >
            <Settings size={14} />
            Configurar Funil
          </button>
        </div>

        {/* Kanban Board Container */}
        <div className="flex gap-6 overflow-x-auto pb-6 flex-1 items-start min-h-[60vh] select-none">
          {stages.map((stage) => {
            const columnLeads = getLeadsByStatus(stage.name);
            const columnValue = columnLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
            const colorClass = stage.color || 'bg-slate-500';
            const isHovered = draggedOverStageId === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => onDragOver(e, stage.id)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, stage.name)}
                className={`
                  flex-shrink-0 w-80 flex flex-col gap-4 rounded-2xl p-4 border transition-all duration-200
                  ${isHovered 
                    ? 'border-dashed border-blue-400 bg-blue-50/30 scale-[1.01] shadow-lg shadow-blue-500/5' 
                    : 'bg-slate-100/50 border-slate-200/60'
                  }
                `}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-1 pb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${colorClass}`}></div>
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs truncate max-w-[130px]">{stage.name}</h3>
                    <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 border border-slate-200/60 shrink-0">
                      {columnLeads.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-black text-slate-550 mr-1">{formatCurrency(columnValue)}</span>
                    {onAddLead && (
                      <button
                        onClick={() => onAddLead(stage.name)}
                        className="p-1 hover:bg-white text-slate-400 hover:text-blue-600 rounded-lg border border-transparent hover:border-slate-200/60 transition-all"
                        title={`Adicionar Lead em ${stage.name}`}
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Column Cards list */}
                <div className="flex-1 space-y-3 max-h-[68vh] overflow-y-auto pr-1 select-none">
                  {columnLeads.map((lead) => {
                    const leadDate = formatLeadDate(lead);
                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, lead.id)}
                        onClick={() => onEditLead(lead)}
                        className={`
                          bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm cursor-grab active:cursor-grabbing 
                          hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden
                          ${draggedLeadId === lead.id ? 'opacity-30 grayscale scale-95' : 'opacity-100'}
                        `}
                      >
                        {/* Visual top color bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${colorClass}`}></div>

                        <div className="flex justify-between items-start mb-2 mt-1">
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors" title={lead.name}>
                            {lead.name}
                          </h4>
                          <button className="text-slate-300 hover:text-slate-500 transition-colors opacity-0 group-hover:opacity-100">
                            <MoreVertical size={14} />
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
                              <Building2 size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{lead.company || 'Empresa não informada'}</span>
                            </div>

                            {/* Registration Date & Time Badge */}
                            {leadDate && (
                              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
                                leadDate.isToday
                                  ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                                  : 'bg-slate-50 text-slate-500 border-slate-200/60'
                              }`}>
                                <Clock size={10} className={leadDate.isToday ? 'text-amber-500' : 'text-slate-400'} />
                                <span>{leadDate.dateStr} às {leadDate.timeStr}</span>
                              </div>
                            )}
                          </div>

                          {lead.tags && lead.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {lead.tags.map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 bg-slate-50 text-slate-650 border border-slate-200/60 rounded text-[9px] font-bold">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 gap-2">
                            <div className="flex items-center gap-1 font-bold text-blue-600 text-xs shrink-0">
                              <CircleDollarSign size={12} className="text-blue-500" />
                              {formatCurrency(lead.estimatedValue)}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* WhatsApp Direct Action Button */}
                              {lead.phone && (
                                <button
                                  onClick={(e) => handleWhatsAppClick(e, lead)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded-lg shadow-sm shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
                                  title={`Chamar ${lead.name} no WhatsApp (${lead.phone})`}
                                >
                                  <MessageCircle size={12} />
                                  <span>WhatsApp</span>
                                </button>
                              )}

                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5 shrink-0">
                                <User size={10} className="text-slate-350" />
                                <span>{lead.responsible ? lead.responsible.split(' ')[0] : 'S/R'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {columnLeads.length === 0 && (
                    <div className="h-32 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 hover:bg-white/40 cursor-pointer transition-colors" onClick={() => onAddLead?.(stage.name)}>
                      <Plus size={18} className="text-slate-300" />
                      <p className="text-slate-350 text-[10px] uppercase font-bold tracking-widest">Adicionar Lead</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isEditorOpen && (
        <PipelineEditor onClose={() => setIsEditorOpen(false)} />
      )}
    </>
  );
};

export default LeadKanban;
