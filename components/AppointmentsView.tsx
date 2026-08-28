import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Search, 
  Filter, 
  MessageCircle, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Lead } from '../types';
import { storageService } from '../services/storage';

import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AppointmentsViewProps {
  leads: Lead[];
}

interface AppointmentItem {
  id: string;
  formId?: string;
  leadId?: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  meetingTitle: string;
  dateStr: string;
  timeStr: string;
  fullDateText: string;
  status: 'Agendado' | 'Concluído' | 'Cancelado';
  createdAt: string;
}

const safeStr = (val: any) => String(val || '').trim();
const safeLower = (val: any) => String(val || '').trim().toLowerCase();

const AppointmentsView: React.FC<AppointmentsViewProps> = ({ leads }) => {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'Agendado' | 'Concluído' | 'Cancelado'>('todos');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming'>('all');

  useEffect(() => {
    setLoading(true);
    try {
      const q = query(collection(db, 'booked_slots'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const slotsDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const items: AppointmentItem[] = [];

          slotsDocs.forEach((slot: any) => {
            const slotEmail = safeLower(slot.leadEmail);
            const slotName = safeLower(slot.leadName);
            const slotPhone = safeStr(slot.leadPhone).replace(/\D/g, '');

            const matchingLead = (leads || []).find(l => {
              if (!l) return false;
              const lEmail = safeLower(l.email);
              if (slotEmail && lEmail && slotEmail === lEmail) return true;
              const lName = safeLower(l.name);
              if (slotName && lName && (slotName === lName || slotName.includes(lName) || lName.includes(slotName))) return true;
              const lPhone = safeStr(l.phone).replace(/\D/g, '');
              if (slotPhone && lPhone && slotPhone === lPhone) return true;
              return false;
            });

            let displayName = safeStr(slot.leadName);
            if (!displayName || displayName === 'Lead sem nome' || displayName === 'Lead s/ Nome') {
              displayName = matchingLead?.name || (slotEmail ? slotEmail.split('@')[0] : 'Lead sem nome');
            }

            items.push({
              id: slot.id,
              formId: slot.formId || '',
              leadId: matchingLead?.id || '',
              leadName: displayName,
              leadEmail: slot.leadEmail || matchingLead?.email || 'N/A',
              leadPhone: slot.leadPhone || matchingLead?.phone || '',
              meetingTitle: 'Reunião 60 min',
              dateStr: slot.date || '',
              timeStr: slot.time || '',
              fullDateText: slot.date || slot.time || '',
              status: slot.status || 'Agendado',
              createdAt: slot.createdAt || new Date().toISOString()
            });
          });

          // Also check leads' interactions for meetings
          (leads || []).forEach(lead => {
            if (!lead) return;
            const meetingInteractions = (lead.interactions || []).filter(i => i && i.type === 'Reunião');
            meetingInteractions.forEach(mi => {
              const exists = items.some(it => 
                (it.leadId && it.leadId === lead.id) || 
                (safeLower(it.leadEmail) && safeLower(it.leadEmail) === safeLower(lead.email))
              );
              if (!exists) {
                items.push({
                  id: mi.id,
                  leadId: lead.id,
                  leadName: lead.name || 'Lead sem nome',
                  leadEmail: lead.email || 'N/A',
                  leadPhone: lead.phone || '',
                  meetingTitle: 'Reunião Agendada',
                  dateStr: mi.date || '',
                  timeStr: '',
                  fullDateText: mi.description || 'Reunião agendada',
                  status: 'Agendado',
                  createdAt: mi.date || new Date().toISOString()
                });
              }
            });
          });

          items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setAppointments(items);
        } catch (innerErr) {
          console.error('Error processing booked_slots snapshot:', innerErr);
        } finally {
          setLoading(false);
        }
      }, (err) => {
        console.error('Error listening to booked_slots:', err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to setup booked_slots listener:', err);
      setLoading(false);
    }
  }, [leads]);

  const toggleStatus = async (item: AppointmentItem) => {
    const nextStatus = item.status === 'Agendado' ? 'Concluído' : 'Agendado';
    setAppointments(prev => prev.map(a => a.id === item.id ? { ...a, status: nextStatus } : a));
    // Persist status change in booked_slots
    await storageService.saveBookedSlot({
      formId: item.formId || '',
      date: item.dateStr,
      time: item.timeStr,
      leadName: item.leadName,
      leadEmail: item.leadEmail,
      status: nextStatus
    } as any);
  };

  // Filtered List
  const filtered = appointments.filter(app => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      safeLower(app.leadName).includes(q) ||
      safeLower(app.leadEmail).includes(q) ||
      safeStr(app.leadPhone).includes(q) ||
      safeLower(app.fullDateText).includes(q);

    const matchesStatus = statusFilter === 'todos' || app.status === statusFilter;

    let matchesDate = true;
    if (dateFilter === 'today') {
      const todayStr = new Date().toLocaleDateString('pt-BR');
      matchesDate = app.fullDateText.includes(todayStr);
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalCount = appointments.length;
  const pendingCount = appointments.filter(a => a.status === 'Agendado').length;
  const completedCount = appointments.filter(a => a.status === 'Concluído').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-orange-500 text-white rounded-xl shadow-md shadow-orange-500/20">
              <CalendarIcon size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Agendamentos de Reuniões</h1>
              <p className="text-xs text-slate-500 font-medium">
                Gerencie todas as videochamadas e reuniões agendadas pelos leads no formulário
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={fetchAppointments}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all self-start md:self-auto"
        >
          🔄 Atualizar Lista
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarIcon size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Agendados</p>
            <p className="text-2xl font-black text-slate-800">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pendentes</p>
            <p className="text-2xl font-black text-slate-800">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Concluídos</p>
            <p className="text-2xl font-black text-slate-800">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por lead, e-mail ou data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-slate-800"
          />
        </div>

        {/* Status & Date Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'todos' 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({totalCount})
          </button>

          <button
            onClick={() => setStatusFilter('Agendado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'Agendado' 
                ? 'bg-orange-500 text-white' 
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            Pendentes ({pendingCount})
          </button>

          <button
            onClick={() => setStatusFilter('Concluído')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'Concluído' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Concluídos ({completedCount})
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium text-sm">
            Carregando agendamentos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CalendarIcon size={24} />
            </div>
            <p className="text-sm font-bold text-slate-700">Nenhum agendamento encontrado</p>
            <p className="text-xs text-slate-400">
              Quando os visitantes agendarem um horário no formulário, a lista aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const cleanPhone = item.leadPhone.replace(/\D/g, '');
              const waNum = cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
              const isCompleted = item.status === 'Concluído';

              return (
                <div 
                  key={item.id}
                  className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors ${
                    isCompleted ? 'opacity-70 bg-slate-50/40' : ''
                  }`}
                >
                  {/* Left: Lead Info */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-base">{item.leadName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      {item.leadEmail && item.leadEmail !== 'N/A' && (
                        <span className="flex items-center gap-1">
                          <Mail size={12} className="text-slate-400" />
                          {item.leadEmail}
                        </span>
                      )}
                      {item.leadPhone && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone size={12} className="text-slate-400" />
                          {item.leadPhone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Meeting Date & Time */}
                  <div className="bg-orange-50/70 border border-orange-200/80 px-4 py-2.5 rounded-xl flex items-center gap-3 shrink-0">
                    <div className="p-2 bg-orange-500 text-white rounded-lg">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 capitalize">
                        {item.fullDateText}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {item.meetingTitle} • 60 minutos
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions (WhatsApp & Complete) */}
                  <div className="flex items-center gap-2 shrink-0">
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${waNum}?text=${encodeURIComponent(`Olá ${item.leadName}! Confirmo nossa reunião agendada para: ${item.fullDateText}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <MessageCircle size={14} />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    <button
                      onClick={() => toggleStatus(item)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                        isCompleted 
                          ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {isCompleted ? 'Desmarcar Concluído' : '✓ Marcar Concluído'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsView;
