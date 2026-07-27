import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus } from '../types';
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Building2,
  Mail,
  Phone,
  Download,
  Upload
} from 'lucide-react';
import { storageService } from '../services/storage';
import { usePipeline } from '../hooks/usePipeline';

interface LeadTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => Promise<void> | void;
  onAdd: () => void;
  onInteraction: (lead: Lead) => void;
}

const LeadTable: React.FC<LeadTableProps> = ({ leads, onEdit, onDelete, onBulkDelete, onAdd, onInteraction }) => {
  const { stages } = usePipeline();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'Todos'>('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 8;

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'Todos' || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getStatusStyle = (status: string) => {
    const stage = stages.find(s => s.name === status);
    if (!stage) return { bg: 'bg-slate-100 border-slate-200', color: 'text-slate-700' };

    const baseColor = stage.color.replace('bg-', '').replace('-500', '');

    return {
      bg: `bg-${baseColor}-100 border-${baseColor}-200`,
      color: `text-${baseColor}-700`
    };
  };

  const handleExport = () => {
    storageService.exportLeadsToCSV();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const success = await storageService.importLeadsFromCSV(e.target.files[0]);
      if (success) {
        alert('Leads importados com sucesso!');
        window.location.reload();
      }
    }
  };

  const isAllPaginatedSelected = paginatedLeads.length > 0 && paginatedLeads.every(l => selectedLeadIds.includes(l.id));

  const handleSelectAll = () => {
    if (isAllPaginatedSelected) {
      setSelectedLeadIds(prev => prev.filter(id => !paginatedLeads.some(l => l.id === id)));
    } else {
      const newIds = paginatedLeads.map(l => l.id);
      setSelectedLeadIds(prev => Array.from(new Set([...prev, ...newIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    const count = selectedLeadIds.length;
    if (confirm(`Tem certeza que deseja excluir ${count} lead(s) selecionado(s)?`)) {
      setIsDeleting(true);
      try {
        if (onBulkDelete) {
          await onBulkDelete(selectedLeadIds);
        } else {
          for (const id of selectedLeadIds) {
            await onDelete(id);
          }
        }
        setSelectedLeadIds([]);
      } catch (err) {
        console.error('Erro ao excluir leads em lote:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-rose-600 border border-red-400 text-white rounded-2xl p-4 flex justify-between items-center shadow-lg shadow-red-500/20 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xs text-white">
              {selectedLeadIds.length}
            </span>
            <span className="text-sm font-bold tracking-tight">
              {selectedLeadIds.length === 1 ? '1 lead selecionado' : `${selectedLeadIds.length} leads selecionados`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedLeadIds([])}
              className="px-4 py-2 text-xs font-bold text-white/80 hover:text-white transition-colors"
            >
              Limpar Seleção
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-red-600 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Trash2 size={16} />
              {isDeleting ? 'Excluindo...' : `Excluir ${selectedLeadIds.length} ${selectedLeadIds.length === 1 ? 'Lead' : 'Leads'}`}
            </button>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, empresa ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="Todos">Todos os Status</option>
              {stages.map(stage => (
                <option key={stage.id} value={stage.name}>{stage.name}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer">
            <Upload size={18} />
            <span className="hidden sm:inline">Importar</span>
            <input
              type="file"
              accept=".csv, .xls, .xlsx"
              className="hidden"
              onChange={handleImport}
            />
          </label>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 px-4 py-2.5 rounded-xl font-medium transition-all"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button
            onClick={onAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Novo Lead</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="pl-6 pr-2 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllPaginatedSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lead / Empresa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Estimado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Responsável</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLeads.map((lead) => {
                const statusStyle = getStatusStyle(lead.status);
                const isSelected = selectedLeadIds.includes(lead.id);
                return (
                  <tr key={lead.id} className={`hover:bg-slate-50/80 transition-colors group ${isSelected ? 'bg-blue-50/40' : ''}`}>
                    <td className="pl-6 pr-2 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(lead.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{lead.name}</span>
                        <span className="text-xs text-slate-550 flex items-center gap-1 mt-0.5">
                          <Building2 size={12} /> {lead.company}
                        </span>
                        {lead.tags && lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {lead.tags.map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 bg-blue-50 text-blue-605 border border-blue-100 rounded text-[9px] font-bold">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Mail size={12} className="text-slate-400" /> {lead.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone size={12} className="text-slate-400" /> {lead.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.color}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {formatCurrency(lead.estimatedValue)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{lead.responsible}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onInteraction(lead)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Interações"
                        >
                          <MessageSquare size={18} />
                        </button>
                        <button
                          onClick={() => onEdit(lead)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => onDelete(lead.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="group-hover:hidden text-slate-300">
                        <MoreHorizontal size={20} />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {paginatedLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum lead encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Mostrando {Math.min(filteredLeads.length, itemsPerPage)} de {filteredLeads.length} leads
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-white transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-white transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadTable;
