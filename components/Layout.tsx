
import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  Table as TableIcon,
  Kanban,
  LogOut,
  Settings,
  Flame,
  Download,
  Upload,
  ClipboardList,
  Bell
} from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { storageService } from '../services/storage';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenWebhookSettings?: () => void;
  userName: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout, onOpenWebhookSettings, userName }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isInitialMount = useRef(true);
  const existingLeadIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }

      const leadsRef = collection(db, 'leads');

      const unsubscribe = onSnapshot(leadsRef, (snapshot) => {
        if (isInitialMount.current) {
          isInitialMount.current = false;
          const ids = snapshot.docs.map(doc => doc.id);
          existingLeadIds.current = new Set(ids);
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const lead = change.doc.data();
            const leadId = change.doc.id;

            if (!existingLeadIds.current.has(leadId)) {
              existingLeadIds.current.add(leadId);

              try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
                audio.play();
              } catch (soundErr) {
                console.warn('Audio play blocked:', soundErr);
              }

              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('🚀 Novo Lead no CRM!', {
                  body: `${lead.name} (${lead.company || 'Individual'}) cadastrou-se via ${lead.origin || 'Formulário'}.`,
                  icon: '/favicon.ico'
                });
              }

              const leadTime = lead.created_at ? new Date(lead.created_at) : new Date();
              const newNotif = {
                id: leadId,
                title: 'Novo Lead',
                body: `${lead.name} preencheu o formulário de ${lead.origin || 'Captação'}.`,
                time: leadTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                read: false
              };

              setNotifications(prev => [newNotif, ...prev]);
              setUnreadCount(prev => prev + 1);
            }
          }
        });
      }, (error) => {
        console.error('Error listening to leads collection for notifications:', error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to setup notifications listener:', err);
    }
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Gestão de Leads', icon: TableIcon },
    { id: 'kanban', label: 'Pipeline (Kanban)', icon: Kanban },
    { id: 'forms', label: 'Formulários', icon: ClipboardList },
    { id: 'users', label: 'Usuários', icon: Users },
  ];

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await storageService.importLeadsFromCSV(file);
      if (success) {
        window.location.reload();
      } else {
        alert('Erro ao importar arquivo.');
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Flame size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">PHOENIX CRM</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => storageService.exportLeadsToCSV()}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs transition-colors"
              title="Exportar Dados"
            >
              <Download size={14} /> Exportar
            </button>
            <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs cursor-pointer transition-colors" title="Restaurar Backup (JSON)">
              <Upload size={14} /> Restaurar
              <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            </label>
          </div>

          <button
            onClick={onOpenWebhookSettings}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all duration-200"
          >
            <Settings size={20} />
            <span className="font-medium">Webhooks</span>
          </button>

          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-slate-500 truncate">Online</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4 md:hidden">
            <Flame size={24} className="text-blue-600" />
            <span className="font-bold">PHOENIX</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-800 hidden md:block">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h1>

          {/* Real-time Notifications Bell */}
          <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setUnreadCount(0);
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  }}
                  className={`p-2 hover:bg-slate-50 rounded-xl transition-all relative ${
                    unreadCount > 0 ? 'text-blue-600 animate-bounce' : 'text-slate-500'
                  }`}
                  title="Notificações"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 bg-slate-50 flex justify-between items-center border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Notificações</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => setNotifications([])}
                          className="text-[9px] font-bold text-red-500 hover:underline"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div key={n.id} className="p-3.5 hover:bg-slate-50/50 transition-colors text-left space-y-0.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-800">{n.title}</span>
                              <span className="text-[9px] font-bold text-slate-400">{n.time}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-normal font-medium">{n.body}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-400 font-medium">Nenhuma notificação nova.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-4 w-px bg-slate-200 hidden md:block"></div>

              <div className="flex items-center gap-2 hidden md:flex">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-700">{userName}</span>
              </div>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden gap-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}`}
              >
                <item.icon size={18} />
              </button>
            ))}
            <button onClick={onLogout} className="p-2 text-red-500"><LogOut size={18} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
