import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  X,
  FileSpreadsheet,
  Tag,
  Briefcase,
  User,
  ArrowUpDown,
  Smartphone,
  Monitor,
  Webhook
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { storageService } from '../services/storage';
import { Form, FormResponse, User as CrmUser, PipelineStage } from '../types';
import { usePipeline } from '../hooks/usePipeline';

interface FormResponsesViewProps {
  formId: string;
  onBack: () => void;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const FormResponsesView: React.FC<FormResponsesViewProps> = ({ formId, onBack }) => {
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedResponseIds, setSelectedResponseIds] = useState<string[]>([]);
  const [activeResponseDetails, setActiveResponseDetails] = useState<FormResponse | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [crmUsers, setCrmUsers] = useState<CrmUser[]>([]);
  const { stages: crmStages } = usePipeline();
  
  // Bulk action states
  const [bulkTag, setBulkTag] = useState('');
  const [bulkStage, setBulkStage] = useState('');
  const [bulkResponsible, setBulkResponsible] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [formData, responseData, usersData] = await Promise.all([
        storageService.getForm(formId),
        storageService.getResponses(formId),
        storageService.getUsers()
      ]);
      if (formData) setForm(formData);
      setResponses(responseData);
      setCrmUsers(usersData);
    } catch (error) {
      console.error('Error fetching responses data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [formId]);

  // Analytics Computations
  const stats = useMemo(() => {
    const totalViews = form?.viewsCount || 0;
    const totalStarts = form?.startsCount || 0;
    const totalCompletions = form?.completionsCount || 0;
    
    // Count partial responses
    const totalPartials = responses.filter(r => r.status === 'partial').length;
    const totalAbandoned = responses.filter(r => r.status === 'abandoned' || r.status === 'started').length;

    const conversionRate = totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0;
    const abandonmentRate = totalStarts > 0 ? ((totalStarts - totalCompletions) / totalStarts) * 100 : 0;

    // Average time spent
    const completedResponses = responses.filter(r => r.status === 'completed' && r.timeSpent);
    const avgTime = completedResponses.length > 0
      ? Math.round(completedResponses.reduce((acc, r) => acc + (r.timeSpent || 0), 0) / completedResponses.length)
      : 0;

    // Device distribution
    const devices = responses.reduce((acc, r) => {
      if (r.device?.deviceType) {
        acc[r.device.deviceType] = (acc[r.device.deviceType] || 0) + 1;
      } else {
        acc['unknown'] = (acc['unknown'] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const deviceChartData = Object.entries(devices).map(([name, value]) => ({ name, value }));

    // UTM Source distribution
    const utmSources = responses.reduce((acc, r) => {
      const source = r.utm?.source || 'Direto / Orgânico';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const utmChartData = Object.entries(utmSources)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Questions with highest abandonment (where currentQuestionId is set in partials)
    const abandonmentQuestions: Record<string, number> = {};
    responses.filter(r => r.status === 'partial' && r.currentQuestionId).forEach(r => {
      const q = form?.blocks.find(b => b.id === r.currentQuestionId);
      if (q) {
        abandonmentQuestions[q.title] = (abandonmentQuestions[q.title] || 0) + 1;
      }
    });

    const dropoffChartData = Object.entries(abandonmentQuestions)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalViews,
      totalStarts,
      totalCompletions,
      totalPartials,
      conversionRate,
      abandonmentRate,
      avgTime,
      deviceChartData,
      utmChartData,
      dropoffChartData
    };
  }, [form, responses]);

  // Filters and Searching
  const filteredResponses = useMemo(() => {
    return responses
      .filter(r => {
        // Status filter
        const matchStatus = statusFilter === 'all' || r.status === statusFilter;
        
        // Search filter (searches through respondent answers, email, or device)
        const valStr = JSON.stringify(r.answers).toLowerCase() + 
                       (r.device?.browser || '').toLowerCase() + 
                       (r.utm?.source || '').toLowerCase();
        const matchSearch = searchTerm === '' || valStr.includes(searchTerm.toLowerCase());
        
        return matchStatus && matchSearch;
      });
  }, [responses, statusFilter, searchTerm]);

  // Select all handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedResponseIds(filteredResponses.map(r => r.id));
    } else {
      setSelectedResponseIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedResponseIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedResponseIds.length === 0) return;
    if (!confirm(`Deseja realmente excluir ${selectedResponseIds.length} resposta(s)?`)) return;

    setLoading(true);
    for (const id of selectedResponseIds) {
      await storageService.deleteResponse(id);
    }
    setSelectedResponseIds([]);
    await fetchData();
  };

  const handleBulkUpdateLeads = async () => {
    if (selectedResponseIds.length === 0) return;
    setLoading(true);
    
    // For each selected response, find the related lead and update it in Firestore
    for (const respId of selectedResponseIds) {
      const resp = responses.find(r => r.id === respId);
      if (resp && resp.leadId) {
        try {
          const leadSnap = await storageService.getLeads();
          const lead = leadSnap.find(l => l.id === resp.leadId);
          if (lead) {
            const updatedLead = { ...lead };
            if (bulkStage) updatedLead.status = bulkStage;
            if (bulkResponsible) updatedLead.responsible = bulkResponsible;
            
            // Re-save lead
            await storageService.saveLead(updatedLead);
          }
        } catch (err) {
          console.error('Failed to bulk update lead:', err);
        }
      }
    }
    
    // Reset bulk form
    setBulkStage('');
    setBulkResponsible('');
    setShowBulkActions(false);
    setSelectedResponseIds([]);
    await fetchData();
  };

  const handleDeleteResponse = async (id: string) => {
    if (!confirm('Excluir esta resposta permanentemente?')) return;
    const res = await storageService.deleteResponse(id);
    if (res.success) {
      fetchData();
      setActiveResponseDetails(null);
    } else {
      alert('Erro ao excluir: ' + res.error);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (responses.length === 0 || !form) return;

    // Headers: Date, Status, Device, UTM Source, and all Question blocks
    const questionBlocks = form.blocks.filter(b => b.type !== 'welcome' && b.type !== 'thank_you');
    const headers = [
      'Data',
      'Status',
      'Dispositivo',
      'UTM Origem',
      ...questionBlocks.map(q => q.title)
    ];

    const csvRows = [
      headers.join(','),
      ...responses.map(r => {
        const row = [
          new Date(r.createdAt).toLocaleString('pt-BR'),
          r.status === 'completed' ? 'Completo' : r.status === 'partial' ? 'Parcial' : 'Iniciado',
          r.device?.deviceType || 'Desconhecido',
          r.utm?.source || 'Direto',
          ...questionBlocks.map(q => {
            const ans = r.answers[q.id];
            if (!ans) return '';
            const val = ans.value;
            // Format arrays or objects
            if (Array.isArray(val)) return `"${val.join(', ')}"`;
            if (typeof val === 'object' && val !== null) return `"${val.fileName || JSON.stringify(val)}"`;
            return `"${String(val || '').replace(/"/g, '""')}"`;
          })
        ];
        return row.join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respostas-${form.settings.slug}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Respostas e Análises</h2>
            <p className="text-xs text-slate-500 font-medium">{form?.settings.internalName}</p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={responses.length === 0}
          className="flex items-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-40"
        >
          <FileSpreadsheet size={14} /> Exportar CSV
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center p-20 bg-white border rounded-3xl shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* ANALYTICS METRICS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Users size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Visualizações</p>
                <p className="text-2xl font-black text-slate-700">{stats.totalViews}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                <CheckCircle size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Envios Completos</p>
                <p className="text-2xl font-black text-slate-700">{stats.totalCompletions}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Conversão geral</p>
                <p className="text-2xl font-black text-slate-700">{stats.conversionRate.toFixed(1)}%</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">T. Médio Preenchimento</p>
                <p className="text-2xl font-black text-slate-700">{stats.avgTime}s</p>
              </div>
            </div>
          </div>

          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Devices */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Dispositivos</h3>
              <div className="h-48">
                {stats.deviceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.deviceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.deviceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">Sem dados de dispositivos.</div>
                )}
              </div>
              <div className="flex gap-4 justify-center text-[10px] font-bold uppercase text-slate-500 mt-4">
                {stats.deviceChartData.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </div>

            {/* Chart 2: UTM Sources */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Origem dos acessos (UTM)</h3>
              <div className="h-48">
                {stats.utmChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.utmChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                        {stats.utmChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">Sem dados de origens.</div>
                )}
              </div>
            </div>

            {/* Chart 3: Abandonment questions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1">
                Perguntas com maior abandono <AlertTriangle size={12} className="text-orange-500" />
              </h3>
              <div className="h-48">
                {stats.dropoffChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dropoffChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickFormatter={(v) => v.substring(0, 10) + '...'} style={{ fontSize: '9px', fontWeight: 'bold' }} />
                      <YAxis allowDecimals={false} style={{ fontSize: '9px' }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">Sem registros de desistência no meio do fluxo.</div>
                )}
              </div>
            </div>
          </div>

          {/* RESPONDENTS DATA TABLE */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            
            {/* Table Search & Bulk controls */}
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative w-full md:w-80">
                  <Search size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar respostas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                  />
                </div>

                {/* Status select */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
                  <Filter size={12} className="text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent outline-none font-medium cursor-pointer"
                  >
                    <option value="all">Status</option>
                    <option value="completed">Completos</option>
                    <option value="partial">Parciais</option>
                  </select>
                </div>
              </div>

              {/* Bulk actions trigger */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {selectedResponseIds.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-bold">{selectedResponseIds.length} selecionados</span>
                    <button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Briefcase size={12} /> Ações em Lote
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Excluir
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Selecione linhas para ações em lote</span>
                )}
              </div>
            </div>

            {/* Bulk actions drawer */}
            {showBulkActions && selectedResponseIds.length > 0 && (
              <div className="p-4 border-b bg-blue-50/30 border-blue-100 flex flex-wrap gap-4 items-end text-xs">
                {/* Pipeline Stage */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Etapa Funil CRM</label>
                  <select
                    value={bulkStage}
                    onChange={(e) => setBulkStage(e.target.value)}
                    className="bg-white border p-1.5 rounded-lg text-xs outline-none"
                  >
                    <option value="">Selecione...</option>
                    {crmStages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                {/* Owner */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Responsável CRM</label>
                  <select
                    value={bulkResponsible}
                    onChange={(e) => setBulkResponsible(e.target.value)}
                    className="bg-white border p-1.5 rounded-lg text-xs outline-none"
                  >
                    <option value="">Selecione...</option>
                    {crmUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleBulkUpdateLeads}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                  >
                    Aplicar no CRM
                  </button>
                  <button
                    onClick={() => setShowBulkActions(false)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Data Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-slate-700 text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b">
                    <th className="p-4 w-10">
                      <input 
                        type="checkbox"
                        checked={selectedResponseIds.length === filteredResponses.length && filteredResponses.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-4">Respondente</th>
                    <th className="p-4">Data e Horário</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">UTMs / Origem</th>
                    <th className="p-4">T. Preenchimento</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResponses.map((r) => {
                    // Try to resolve a name or email from answers dictionary
                    let name = 'Respondente Anônimo';
                    let email = '';
                    Object.values(r.answers).forEach((ans: any) => {
                      if (ans.crmField === 'name' && ans.value) name = String(ans.value);
                      if (ans.crmField === 'email' && ans.value) email = String(ans.value);
                    });

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <input 
                            type="checkbox"
                            checked={selectedResponseIds.includes(r.id)}
                            onChange={() => handleSelectRow(r.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{name}</p>
                          {email && <p className="text-[10px] text-slate-400 font-medium">{email}</p>}
                        </td>
                        <td className="p-4 font-medium text-slate-500">
                          {new Date(r.createdAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                            {r.status === 'completed' ? 'Completo' : 'Parcial'}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-600">
                          {r.utm?.source || 'Direto'} 
                          {r.utm?.medium && <span className="text-[10px] text-slate-400 font-medium ml-1">({r.utm.medium})</span>}
                        </td>
                        <td className="p-4 font-medium text-slate-500">
                          {r.timeSpent ? `${r.timeSpent}s` : '-'}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => setActiveResponseDetails(r)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                              title="Ver Detalhes"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteResponse(r.id)}
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredResponses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">Nenhum respondente localizado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* DETAIL MODAL: VIEW SINGLE RESPONSE */}
      {activeResponseDetails && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveResponseDetails(null)}></div>
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Detalhes da Resposta</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">ID: {activeResponseDetails.id}</p>
              </div>
              <button 
                onClick={() => setActiveResponseDetails(null)} 
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Respondent Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border rounded-2xl text-xs font-semibold text-slate-600">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Status</p>
                  <p className={`mt-0.5 font-bold ${activeResponseDetails.status === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                    {activeResponseDetails.status === 'completed' ? 'Completo' : 'Parcial'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Data de Envio</p>
                  <p className="mt-0.5">{new Date(activeResponseDetails.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tempo Gasto</p>
                  <p className="mt-0.5">{activeResponseDetails.timeSpent ? `${activeResponseDetails.timeSpent}s` : 'Desconhecido'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Origem / UTM</p>
                  <p className="mt-0.5 truncate" title={activeResponseDetails.utm?.source || 'Direto'}>
                    {activeResponseDetails.utm?.source || 'Direto'}
                  </p>
                </div>
              </div>

              {/* Answers content block */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Questionário Respondido</h4>
                <div className="divide-y border rounded-2xl bg-white overflow-hidden shadow-sm">
                  {form.blocks
                    .filter(b => b.type !== 'welcome' && b.type !== 'thank_you')
                    .map((block, idx) => {
                      const ans = activeResponseDetails.answers[block.id];
                      return (
                        <div key={block.id} className="p-4 text-xs flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center hover:bg-slate-50/30">
                          <div className="space-y-0.5 pr-4">
                            <p className="font-bold text-slate-800">
                              <span className="text-slate-400 mr-1.5">{idx + 1}.</span>
                              {block.title}
                            </p>
                            {block.crmField && (
                              <span className="text-[9px] font-bold text-blue-500 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 inline-block">
                                Mapeado: {block.crmField}
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100 max-w-sm sm:max-w-md w-full sm:w-auto text-right break-words">
                            {ans ? (
                              Array.isArray(ans.value) ? (
                                ans.value.join(', ')
                              ) : typeof ans.value === 'object' && ans.value !== null ? (
                                ans.value.dataUrl ? (
                                  <a 
                                    href={ans.value.dataUrl} 
                                    download={ans.value.fileName}
                                    className="text-blue-600 hover:underline flex items-center justify-end gap-1 font-bold"
                                  >
                                    <Download size={12} /> {ans.value.fileName}
                                  </a>
                                ) : ans.value.fileName || JSON.stringify(ans.value)
                              ) : (
                                String(ans.value)
                              )
                            ) : (
                              <span className="text-slate-350 italic">Sem resposta / Condicional pulada</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Technical / Device and Webhooks Log metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Device Details */}
                <div className="p-4 border rounded-2xl bg-slate-50/50 space-y-2">
                  <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Monitor size={12} /> Dados do Dispositivo
                  </h5>
                  <div className="text-xs space-y-1 text-slate-600 font-medium">
                    <p>Browser: <span className="font-bold text-slate-800">{activeResponseDetails.device?.browser || 'N/A'}</span></p>
                    <p>S.O.: <span className="font-bold text-slate-800">{activeResponseDetails.device?.os || 'N/A'}</span></p>
                    <p>Tipo: <span className="font-bold text-slate-800">{activeResponseDetails.device?.deviceType || 'N/A'}</span></p>
                    {activeResponseDetails.referrerUrl && (
                      <p className="truncate">Origem URL: <span className="font-mono text-xxs text-slate-400">{activeResponseDetails.referrerUrl}</span></p>
                    )}
                  </div>
                </div>

                {/* Webhook logs */}
                <div className="p-4 border rounded-2xl bg-slate-50/50 space-y-2">
                  <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Webhook size={12} /> Histórico de Webhooks
                  </h5>
                  <div className="text-xs space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {activeResponseDetails.webhookStatus && Array.isArray(activeResponseDetails.webhookStatus) ? (
                      activeResponseDetails.webhookStatus.map((wh: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-[10px] font-medium border-b border-slate-100 pb-1">
                          <span className="truncate pr-2 font-mono" title={wh.url}>{wh.url}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${wh.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {wh.success ? 'Enviado' : `Falha (${wh.statusCode || 'Timeout'})`}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xxs text-slate-450 italic">Sem registros de envio de webhook para este respondente.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center">
              {activeResponseDetails.leadId ? (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-150 px-2 py-1 rounded-xl">
                  Lead Mapeado no CRM: {activeResponseDetails.leadId}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400">Sem lead associado</span>
              )}
              <button
                onClick={() => handleDeleteResponse(activeResponseDetails.id)}
                className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              >
                <Trash2 size={12} /> Excluir Resposta
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default FormResponsesView;
