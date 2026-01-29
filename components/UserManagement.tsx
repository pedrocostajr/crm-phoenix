
import React, { useState } from 'react';
import { User, Lead } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  Shield,
  Phone,
  Mail,
  MoreVertical,
  Circle
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAdd: (user: User) => Promise<boolean | void>;
  onUpdate: (user: User) => Promise<boolean | void>;
  onDelete: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAdd, onUpdate, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: '',
    phone: '',
    status: 'Ativo',
    password: ''
  });

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setEditingUser(user);
      setFormData({ ...user, password: '' });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', role: '', phone: '', status: 'Ativo', password: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userData = {
      ...formData,
      id: editingUser?.id || crypto.randomUUID(),
    } as User;

    if (editingUser && !formData.password) {
      userData.password = editingUser.password;
    }

    let success: boolean | void = true;
    if (editingUser) success = await onUpdate(userData);
    else success = await onAdd(userData);

    if (success !== false) setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Equipe</h2>
          <p className="text-sm text-slate-500">Gerencie quem tem acesso ao Phoenix CRM</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
        >
          <Plus size={20} />
          Convidar Usuário
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative group">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white ${user.isAdmin ? 'bg-indigo-600' : 'bg-blue-500'}`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-800 truncate">{user.name}</h3>
                  {user.isAdmin && <Shield size={14} className="text-indigo-500" title="Administrador" />}
                </div>
                <p className="text-xs text-slate-500 font-medium">{user.role}</p>
              </div>
              <div className="absolute top-6 right-6 flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${user.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{user.status}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-300" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone size={16} className="text-slate-300" />
                <span>{user.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 flex gap-2">
              <button
                onClick={() => openModal(user)}
                className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors"
              >
                Editar Perfil
              </button>
              {!user.isAdmin && (
                <button
                  onClick={() => onDelete(user.id)}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="Nome do colaborador"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail Corporativo</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="colaborador@phoenix.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {editingUser ? 'Nova Senha (Opcional)' : 'Senha de Acesso'}
                </label>
                <input
                  required={!editingUser}
                  type="text"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder={editingUser ? "Deixe em branco para manter" : "Crie uma senha de acesso"}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo</label>
                  <input
                    required
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="Ex: Comercial"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone (Opcional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
