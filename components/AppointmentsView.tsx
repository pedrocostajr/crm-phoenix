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
  ChevronLeft,
  AlertCircle,
  List,
  Grid,
  X
} from 'lucide-react';
import { Lead } from '../types';
import { storageService } from '../services/storage';

import { collection, query, onSnapshot } from 'firebase/firestore';
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
  dateKey?: string;
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar'); // Default to visual calendar preview!
  const [calendarMonthDate, setCalendarMonthDate] = useState<Date>(new Date());
  const [selectedDayDetail, setSelectedDayDetail] = useState<{ dayNum: number; dateText: string; apps: AppointmentItem[] } | null>(null);

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
              dateKey: slot.dateKey || '',
              timeStr: slot.time || '',
              fullDateText: slot.date || slot.time || '',
              status: slot.status || 'Agendado',
              createdAt: slot.createdAt || new Date().toISOString()
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

  // Filtered List for Table View
  const filtered = appointments.filter(app => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      safeLower(app.leadName).includes(q) ||
      safeLower(app.leadEmail).includes(q) ||
      safeStr(app.leadPhone).includes(q) ||
      safeLower(app.fullDateText).includes(q);

    const matchesStatus = statusFilter === 'todos' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = appointments.length;
  const pendingCount = appointments.filter(a => a.status === 'Agendado').length;
  const completedCount = appointments.filter(a => a.status === 'Concluído').length;

  // Calendar calculations
  const year = calendarMonthDate.getFullYear();
  const month = calendarMonthDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const handlePrevMonth = () => setCalendarMonthDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCalendarMonthDate(new Date(year, month + 1, 1));

  // Helper to find appointments for a given calendar day
  const getAppointmentsForDay = (dayNum: number) => {
    const paddedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const paddedMonth = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
    const targetIsoKey = `${year}-${paddedMonth}-${paddedDay}`;
    const slashFormat = `${paddedDay}/${paddedMonth}/${year}`;
    const targetMonthName = monthNames[month].toLowerCase();

    return appointments.filter(app => {
      // 1. Check exact dateKey if present
      if (app.dateKey && app.dateKey === targetIsoKey) return true;

      // 2. Check fullDateText for date strings
      const txt = safeLower(app.fullDateText);
      if (txt.includes(targetIsoKey)) return true;
      if (txt.includes(slashFormat)) return true;
      
      const matchPtDay = txt.includes(`${dayNum} de ${targetMonthName}`) || txt.includes(`${paddedDay} de ${targetMonthName}`);
      return matchPtDay;
    });
  };

  const today = new Date();
  const isToday = (dayNum: number) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === dayNum;
  };

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
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Painel de Agendamentos</h1>
              <p className="text-xs text-slate-500 font-medium">
                Visualize os dias e horários de reuniões agendadas pelos leads em formato de lista ou calendário
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid size={14} />
            <span>Calendário</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List size={14} />
            <span>Lista</span>
          </button>
        </div>
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

      {/* MODE 1: VISUAL CALENDAR PREVIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-slate-800">
                {monthNames[month]} {year}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                {appointments.length} agendamentos registrados
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors border border-slate-200 flex items-center gap-1 text-xs font-bold"
              >
                <ChevronLeft size={16} /> Mês anterior
              </button>
              <button
                onClick={() => setCalendarMonthDate(new Date())}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Hoje
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors border border-slate-200 flex items-center gap-1 text-xs font-bold"
              >
                Próximo mês <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 text-center text-xs font-black text-slate-400 uppercase tracking-wider">
            <span className="py-2 text-red-500/80">DOM</span>
            <span className="py-2">SEG</span>
            <span className="py-2">TER</span>
            <span className="py-2">QUA</span>
            <span className="py-2">QUI</span>
            <span className="py-2">SEX</span>
            <span className="py-2 text-slate-400">SÁB</span>
          </div>

          {/* 35/42 Grid Days */}
          <div className="grid grid-cols-7 gap-2">
            {daysArray.map((dayNum, idx) => {
              if (dayNum === null) {
                return <div key={`empty_${idx}`} className="h-32 bg-slate-50/40 rounded-2xl border border-dashed border-slate-100"></div>;
              }

              const dayApps = getAppointmentsForDay(dayNum);
              const hasApps = dayApps.length > 0;
              const itIsToday = isToday(dayNum);

              return (
                <div
                  key={`day_${dayNum}`}
                  onClick={() => {
                    if (hasApps) {
                      setSelectedDayDetail({
                        dayNum,
                        dateText: `${dayNum} de ${monthNames[month]} de ${year}`,
                        apps: dayApps
                      });
                    }
                  }}
                  className={`
                    h-32 p-2 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden
                    ${hasApps 
                      ? 'bg-gradient-to-b from-orange-50/60 to-amber-50/30 border-orange-200/90 hover:border-orange-400 hover:shadow-md cursor-pointer' 
                      : 'bg-white border-slate-150 hover:bg-slate-50/60'
                    }
                    ${itIsToday ? 'ring-2 ring-orange-500 border-orange-500 font-bold' : ''}
                  `}
                >
                  {/* Top Bar inside cell: Day number + count badge */}
                  <div className="flex items-center justify-between shrink-0">
                    <span className={`
                      text-xs w-6 h-6 rounded-full flex items-center justify-center font-black
                      ${itIsToday ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-700'}
                    `}>
                      {dayNum}
                    </span>

                    {hasApps && (
                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-orange-500 text-white shadow-xs">
                        {dayApps.length} {dayApps.length === 1 ? 'reunião' : 'reuniões'}
                      </span>
                    )}
                  </div>

                  {/* Appointments list preview inside cell */}
                  <div className="space-y-1 my-1 overflow-y-auto flex-1 pr-0.5">
                    {dayApps.slice(0, 2).map((app) => {
                      const isCompleted = app.status === 'Concluído';
                      return (
                        <div
                          key={app.id}
                          className={`
                            p-1 rounded-lg text-[10px] font-bold leading-tight truncate flex items-center gap-1 shadow-2xs transition-all
                            ${isCompleted 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-orange-500 text-white shadow-orange-500/20'
                            }
                          `}
                          title={`${app.leadName} (${app.fullDateText})`}
                        >
                          <Clock size={10} className="shrink-0" />
                          <span className="truncate">{app.leadName}</span>
                        </div>
                      );
                    })}

                    {dayApps.length > 2 && (
                      <div className="text-[9px] font-bold text-orange-600 text-center hover:underline">
                        + {dayApps.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: TABLE LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4">
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

            {/* Status Pills */}
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

          {/* List Table Container */}
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

                      {/* Right: Actions */}
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
      )}

      {/* POPUP / MODAL DETALHADO DO DIA SELECIONADO NO CALENDÁRIO */}
      {selectedDayDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-500 text-white rounded-xl">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">{selectedDayDetail.dateText}</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {selectedDayDetail.apps.length} {selectedDayDetail.apps.length === 1 ? 'reunião agendada' : 'reuniões agendadas'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDayDetail(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* List of Meetings for that Day */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {selectedDayDetail.apps.map((app) => {
                const cleanPhone = app.leadPhone.replace(/\D/g, '');
                const waNum = cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
                const isCompleted = app.status === 'Concluído';

                return (
                  <div key={app.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">{app.leadName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-medium space-y-1">
                      <p className="flex items-center gap-1">
                        <Clock size={12} className="text-orange-500" />
                        <span className="font-bold text-slate-800">{app.fullDateText}</span>
                      </p>
                      {app.leadEmail && app.leadEmail !== 'N/A' && (
                        <p className="flex items-center gap-1">
                          <Mail size={12} className="text-slate-400" />
                          {app.leadEmail}
                        </p>
                      )}
                      {app.leadPhone && (
                        <p className="flex items-center gap-1 font-mono">
                          <Phone size={12} className="text-slate-400" />
                          {app.leadPhone}
                        </p>
                      )}
                    </div>

                    {/* Action buttons inside modal */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${waNum}?text=${encodeURIComponent(`Olá ${app.leadName}! Confirmo nossa reunião para ${app.fullDateText}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        >
                          <MessageCircle size={14} />
                          <span>Chamar no WhatsApp</span>
                        </a>
                      )}

                      <button
                        onClick={() => toggleStatus(app)}
                        className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                          isCompleted 
                            ? 'bg-slate-200 text-slate-700 border-slate-300'
                            : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        {isCompleted ? 'Desmarcar' : '✓ Concluir'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Close modal */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsView;
