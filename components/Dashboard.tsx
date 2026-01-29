
import React, { useMemo } from 'react';
import { Lead } from '../types';
import { 
  TrendingUp, 
  Users as UsersIcon, 
  CircleDollarSign, 
  CheckCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { STATUS_CONFIG } from '../constants';

interface DashboardProps {
  leads: Lead[];
}

const Dashboard: React.FC<DashboardProps> = ({ leads }) => {
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter(l => l.status === 'Ganho');
    const totalValue = wonLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
    const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
    
    // Status distribution for chart
    const statusCounts = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    return { totalLeads, wonLeadsCount: wonLeads.length, totalValue, conversionRate, statusData };
  }, [leads]);

  const cards = [
    { label: 'Total de Leads', value: stats.totalLeads, icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Vendas Ganhas', value: stats.wonLeadsCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Valor Total (Ganhos)', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalValue), icon: CircleDollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Taxa de Conversão', value: `${stats.conversionRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${card.bg} ${card.color} transition-colors group-hover:scale-110 duration-300`}>
                <card.icon size={24} />
              </div>
              <ArrowUpRight size={16} className="text-slate-300" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">{card.label}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-blue-500" />
            Leads por Status
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_CONFIG[entry.name as keyof typeof STATUS_CONFIG]?.bg.split(' ')[1].replace('bg-', '#') || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <TrendingUp size={20} className="text-indigo-500" />
             Distribuição Pipeline
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={STATUS_CONFIG[entry.name as keyof typeof STATUS_CONFIG]?.bg.split(' ')[1].replace('bg-', '#') || '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
             {stats.statusData.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_CONFIG[item.name as keyof typeof STATUS_CONFIG]?.bg.split(' ')[1].replace('bg-', '#') }}></div>
                   {item.name}
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
