
import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { KANBAN_COLUMNS, STATUS_CONFIG } from '../constants';
import { 
  Building2, 
  CircleDollarSign, 
  User, 
  MoreVertical 
} from 'lucide-react';

interface LeadKanbanProps {
  leads: Lead[];
  onUpdateStatus: (id: string, newStatus: LeadStatus) => void;
  onEditLead: (lead: Lead) => void;
}

const LeadKanban: React.FC<LeadKanbanProps> = ({ leads, onUpdateStatus, onEditLead }) => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

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
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {KANBAN_COLUMNS.map((column) => {
        const columnLeads = getLeadsByStatus(column);
        const columnValue = columnLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

        return (
          <div
            key={column}
            className="flex-shrink-0 w-80 flex flex-col gap-4 bg-slate-100/50 rounded-2xl p-4 border border-slate-200/60"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG[column].bg.split(' ')[1]}`}></div>
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs">{column}</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 border border-slate-200">
                  {columnLeads.length}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">{formatCurrency(columnValue)}</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, lead.id)}
                  onClick={() => onEditLead(lead)}
                  className={`
                    bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all group
                    ${draggedLeadId === lead.id ? 'opacity-40 grayscale scale-95' : 'opacity-100'}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{lead.name}</h4>
                    <button className="text-slate-300 hover:text-slate-500">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Building2 size={12} className="text-slate-400" />
                      <span className="truncate">{lead.company}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 font-bold text-blue-600 text-xs">
                        <CircleDollarSign size={12} />
                        {formatCurrency(lead.estimatedValue)}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <User size={10} />
                        {lead.responsible.split(' ')[0]}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {columnLeads.length === 0 && (
                <div className="h-32 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                   <p className="text-slate-300 text-xs uppercase font-bold tracking-widest">Vazio</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeadKanban;
