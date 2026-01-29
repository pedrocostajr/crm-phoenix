
import React from 'react';
import {
  LayoutDashboard,
  Users,
  Table as TableIcon,
  Kanban,
  LogOut,
  Settings,
  Flame,
  Download,
  Upload
} from 'lucide-react';
import { storageService } from '../services/storage';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  userName: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout, userName }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Gestão de Leads', icon: TableIcon },
    { id: 'kanban', label: 'Pipeline (Kanban)', icon: Kanban },
    { id: 'users', label: 'Usuários', icon: Users },
  ];

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await storageService.importData(file);
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
              onClick={() => storageService.exportData()}
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
