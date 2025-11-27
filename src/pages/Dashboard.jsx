import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Send, 
  Users, 
  DollarSign, 
  AlertTriangle,
  Database,
  ArrowRight,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Clock
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import PriorityBadge from '../components/PriorityBadge';
import { attributionFlowData } from '../data/flows/attribution';
import { offlineConversionsFlowData } from '../data/flows/offline';
import { companyFunnelFlowData } from '../data/flows/company';
import { paymentsFlowData } from '../data/flows/payments';
import { hubspotPushFlowData, hubspotPullFlowData, hubspotScheduledFlowData } from '../data/flows/hubspot';

// Aggregate data from all flows
const flows = [
  {
    id: 'attribution',
    path: '/attribution',
    data: attributionFlowData,
    icon: TrendingUp,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'offline',
    path: '/offline-conversions',
    data: offlineConversionsFlowData,
    icon: Send,
    color: 'cyan',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  {
    id: 'company',
    path: '/company-funnel',
    data: companyFunnelFlowData,
    icon: Users,
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'payments',
    path: '/payments',
    data: paymentsFlowData,
    icon: DollarSign,
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'hubspot-push',
    path: '/hubspot/push',
    data: hubspotPushFlowData,
    icon: ArrowUpRight,
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    id: 'hubspot-pull',
    path: '/hubspot/pull',
    data: hubspotPullFlowData,
    icon: ArrowDownLeft,
    color: 'sky',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    id: 'hubspot-scheduled',
    path: '/hubspot/scheduled',
    data: hubspotScheduledFlowData,
    icon: Clock,
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
];

// Calculate totals
const totalWorkers = flows.reduce((sum, flow) => sum + flow.data.workers.length, 0);
const totalTablesRead = flows.reduce((sum, flow) => sum + flow.data.tables.read.length, 0);
const totalTablesWrite = flows.reduce((sum, flow) => sum + flow.data.tables.write.length, 0);

const allGaps = flows.reduce(
  (acc, flow) => ({
    p0: acc.p0 + flow.data.validationGaps.p0.length,
    p1: acc.p1 + flow.data.validationGaps.p1.length,
    p2: acc.p2 + flow.data.validationGaps.p2.length,
  }),
  { p0: 0, p1: 0, p2: 0 }
);

// Get highest risk level for each flow
const getFlowRisk = (flow) => {
  if (flow.data.validationGaps.p0.length > 0) return 'P0';
  if (flow.data.validationGaps.p1.length > 0) return 'P1';
  if (flow.data.validationGaps.p2.length > 0) return 'P2';
  return null;
};

function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Matrix Flow Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of critical data flows and data quality metrics for the Matrix project
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Flows"
          value={flows.length}
          icon={Activity}
          color="blue"
        />
        <MetricCard
          label="Total Workers"
          value={totalWorkers}
          icon={Users}
          color="purple"
        />
        <MetricCard
          label="Tables Involved"
          value={totalTablesRead + totalTablesWrite}
          icon={Database}
          color="slate"
        />
        <MetricCard
          label="Validation Gaps"
          value={allGaps.p0 + allGaps.p1 + allGaps.p2}
          icon={AlertTriangle}
          color="orange"
        />
      </div>

      {/* Flow Cards Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Flows</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {flows.map((flow) => {
            const Icon = flow.icon;
            const risk = getFlowRisk(flow);
            const gapCount = flow.data.validationGaps.p0.length + 
                            flow.data.validationGaps.p1.length + 
                            flow.data.validationGaps.p2.length;
            
            return (
              <Link
                key={flow.id}
                to={flow.path}
                className={`block p-6 rounded-xl border-2 ${flow.borderColor} ${flow.bgColor} 
                           hover:shadow-lg transition-all duration-200 group`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${flow.iconBg} ${flow.iconColor}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                        {flow.data.title}
                      </h3>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/60 text-gray-600 text-xs font-medium">
                        {flow.data.category}
                      </span>
                    </div>
                  </div>
                  {risk && <PriorityBadge priority={risk} size="small" />}
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{flow.data.workers.length}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Workers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {flow.data.tables.read.length + flow.data.tables.write.length}
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Tables</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{gapCount}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Gaps</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center text-sm text-gray-600 group-hover:text-gray-900">
                  <span>View details</span>
                  <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Data Quality Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Validation Gaps by Priority */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            Validation Gaps by Priority
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-3">
                <PriorityBadge priority="P0" />
                <span className="text-gray-700">Critical Issues</span>
              </div>
              <span className="text-2xl font-bold text-red-700">{allGaps.p0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center gap-3">
                <PriorityBadge priority="P1" />
                <span className="text-gray-700">High Priority</span>
              </div>
              <span className="text-2xl font-bold text-orange-700">{allGaps.p1}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex items-center gap-3">
                <PriorityBadge priority="P2" />
                <span className="text-gray-700">Medium Priority</span>
              </div>
              <span className="text-2xl font-bold text-yellow-700">{allGaps.p2}</span>
            </div>
          </div>
        </div>

        {/* Flow Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-500" />
            Flow Categories
          </h2>
          
          <div className="space-y-4">
            {(() => {
              const categoryConfig = {
                Marketing: { bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-500', text: 'text-blue-700' },
                CRM: { bg: 'bg-purple-50', border: 'border-purple-100', dot: 'bg-purple-500', text: 'text-purple-700' },
                Payment: { bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500', text: 'text-emerald-700' },
              };
              
              const categoryCounts = flows.reduce((acc, flow) => {
                const cat = flow.data.category;
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
              }, {});
              
              return Object.entries(categoryCounts).map(([category, count]) => {
                const config = categoryConfig[category] || { bg: 'bg-gray-50', border: 'border-gray-100', dot: 'bg-gray-500', text: 'text-gray-700' };
                return (
                  <div key={category} className={`flex items-center justify-between p-4 ${config.bg} rounded-lg border ${config.border}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${config.dot}`} />
                      <span className="text-gray-700">{category}</span>
                    </div>
                    <span className={`text-2xl font-bold ${config.text}`}>{count}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Top P0 Issues */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-500" />
          Top Critical (P0) Issues
        </h2>
        
        <div className="space-y-3">
          {flows.flatMap((flow) =>
            flow.data.validationGaps.p0.slice(0, 2).map((gap, idx) => ({
              flow: flow.data.title,
              gap,
              path: flow.path,
              key: `${flow.id}-${idx}`,
            }))
          ).slice(0, 8).map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors group"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 group-hover:text-gray-900">{item.gap}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.flow}</p>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 mt-1" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
