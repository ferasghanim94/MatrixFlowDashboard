import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ArrowRight,
  Database,
  Users,
  TrendingUp,
  Send,
  DollarSign,
  Filter
} from 'lucide-react';
import { useState } from 'react';
import MetricCard from '../components/MetricCard';
import PriorityBadge from '../components/PriorityBadge';
import { attributionFlowData } from '../data/flows/attribution';
import { offlineConversionsFlowData } from '../data/flows/offline';
import { companyFunnelFlowData } from '../data/flows/company';
import { paymentsFlowData } from '../data/flows/payments';

// Aggregate all flows
const flows = [
  {
    id: 'attribution',
    path: '/attribution',
    data: attributionFlowData,
    icon: TrendingUp,
    color: 'blue',
  },
  {
    id: 'offline',
    path: '/offline-conversions',
    data: offlineConversionsFlowData,
    icon: Send,
    color: 'cyan',
  },
  {
    id: 'company',
    path: '/company-funnel',
    data: companyFunnelFlowData,
    icon: Users,
    color: 'purple',
  },
  {
    id: 'payments',
    path: '/payments',
    data: paymentsFlowData,
    icon: DollarSign,
    color: 'emerald',
  },
];

// Aggregate all gaps
const allGaps = flows.flatMap((flow) => [
  ...flow.data.validationGaps.p0.map((gap) => ({
    gap,
    priority: 'P0',
    flow: flow.data.title,
    flowId: flow.id,
    path: flow.path,
    category: flow.data.category,
    icon: flow.icon,
    color: flow.color,
  })),
  ...flow.data.validationGaps.p1.map((gap) => ({
    gap,
    priority: 'P1',
    flow: flow.data.title,
    flowId: flow.id,
    path: flow.path,
    category: flow.data.category,
    icon: flow.icon,
    color: flow.color,
  })),
  ...flow.data.validationGaps.p2.map((gap) => ({
    gap,
    priority: 'P2',
    flow: flow.data.title,
    flowId: flow.id,
    path: flow.path,
    category: flow.data.category,
    icon: flow.icon,
    color: flow.color,
  })),
]);

// Calculate totals
const totalsByPriority = {
  P0: allGaps.filter((g) => g.priority === 'P0').length,
  P1: allGaps.filter((g) => g.priority === 'P1').length,
  P2: allGaps.filter((g) => g.priority === 'P2').length,
};

const totalsByFlow = flows.map((flow) => ({
  ...flow,
  p0: flow.data.validationGaps.p0.length,
  p1: flow.data.validationGaps.p1.length,
  p2: flow.data.validationGaps.p2.length,
  total:
    flow.data.validationGaps.p0.length +
    flow.data.validationGaps.p1.length +
    flow.data.validationGaps.p2.length,
}));

function DataQuality() {
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterFlow, setFilterFlow] = useState('all');

  const filteredGaps = allGaps.filter((gap) => {
    if (filterPriority !== 'all' && gap.priority !== filterPriority) return false;
    if (filterFlow !== 'all' && gap.flowId !== filterFlow) return false;
    return true;
  });

  // Group filtered gaps by priority
  const groupedGaps = {
    P0: filteredGaps.filter((g) => g.priority === 'P0'),
    P1: filteredGaps.filter((g) => g.priority === 'P1'),
    P2: filteredGaps.filter((g) => g.priority === 'P2'),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
            <AlertTriangle size={24} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Data Quality Audit</h1>
        </div>
        <p className="text-gray-600">
          Overview of validation gaps, priorities, and remediation status across all Matrix flows
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Gaps"
          value={allGaps.length}
          icon={AlertTriangle}
          color="orange"
        />
        <MetricCard
          label="Critical (P0)"
          value={totalsByPriority.P0}
          icon={XCircle}
          color="red"
        />
        <MetricCard
          label="High (P1)"
          value={totalsByPriority.P1}
          icon={AlertCircle}
          color="orange"
        />
        <MetricCard
          label="Medium (P2)"
          value={totalsByPriority.P2}
          icon={CheckCircle2}
          color="slate"
        />
      </div>

      {/* Priority Distribution Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h2>
        <div className="h-8 rounded-full overflow-hidden flex bg-gray-100">
          {totalsByPriority.P0 > 0 && (
            <div
              className="bg-red-500 flex items-center justify-center text-white text-xs font-medium transition-all"
              style={{ width: `${(totalsByPriority.P0 / allGaps.length) * 100}%` }}
            >
              {totalsByPriority.P0 > 2 && `P0: ${totalsByPriority.P0}`}
            </div>
          )}
          {totalsByPriority.P1 > 0 && (
            <div
              className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium transition-all"
              style={{ width: `${(totalsByPriority.P1 / allGaps.length) * 100}%` }}
            >
              {totalsByPriority.P1 > 2 && `P1: ${totalsByPriority.P1}`}
            </div>
          )}
          {totalsByPriority.P2 > 0 && (
            <div
              className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium transition-all"
              style={{ width: `${(totalsByPriority.P2 / allGaps.length) * 100}%` }}
            >
              {totalsByPriority.P2 > 2 && `P2: ${totalsByPriority.P2}`}
            </div>
          )}
        </div>
        <div className="flex justify-between mt-3 text-sm text-gray-500">
          <span>Critical Priority</span>
          <span>Lower Priority</span>
        </div>
      </div>

      {/* Gaps by Flow */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Validation Gaps by Flow</h2>
        <div className="space-y-4">
          {totalsByFlow.map((flow) => {
            const Icon = flow.icon;
            const percentage = (flow.total / allGaps.length) * 100;
            
            return (
              <Link
                key={flow.id}
                to={flow.path}
                className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${flow.color}-100 text-${flow.color}-600`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-gray-700">
                        {flow.data.title}
                      </h3>
                      <span className="text-xs text-gray-500">{flow.data.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {flow.p0 > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                          {flow.p0} P0
                        </span>
                      )}
                      {flow.p1 > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                          {flow.p1} P1
                        </span>
                      )}
                      {flow.p2 > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                          {flow.p2} P2
                        </span>
                      )}
                    </div>
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600" />
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden flex bg-gray-100">
                  {flow.p0 > 0 && (
                    <div
                      className="bg-red-500"
                      style={{ width: `${(flow.p0 / flow.total) * 100}%` }}
                    />
                  )}
                  {flow.p1 > 0 && (
                    <div
                      className="bg-orange-500"
                      style={{ width: `${(flow.p1 / flow.total) * 100}%` }}
                    />
                  )}
                  {flow.p2 > 0 && (
                    <div
                      className="bg-yellow-500"
                      style={{ width: `${(flow.p2 / flow.total) * 100}%` }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            All Validation Gaps
          </h2>
          <div className="flex flex-wrap gap-3">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="P0">P0 - Critical</option>
              <option value="P1">P1 - High</option>
              <option value="P2">P2 - Medium</option>
            </select>
            <select
              value={filterFlow}
              onChange={(e) => setFilterFlow(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Flows</option>
              {flows.map((flow) => (
                <option key={flow.id} value={flow.id}>
                  {flow.data.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Showing {filteredGaps.length} of {allGaps.length} validation gaps
        </p>

        {/* Grouped Gaps List */}
        <div className="space-y-8">
          {/* P0 Issues */}
          {groupedGaps.P0.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PriorityBadge priority="P0" />
                <span className="text-gray-600 text-sm">
                  {groupedGaps.P0.length} critical issues requiring immediate attention
                </span>
              </div>
              <div className="space-y-2">
                {groupedGaps.P0.map((item, idx) => (
                  <Link
                    key={`p0-${idx}`}
                    to={item.path}
                    className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100 hover:bg-red-100 transition-colors group"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{item.gap}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.flow}</p>
                    </div>
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 mt-1 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* P1 Issues */}
          {groupedGaps.P1.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PriorityBadge priority="P1" />
                <span className="text-gray-600 text-sm">
                  {groupedGaps.P1.length} high priority issues
                </span>
              </div>
              <div className="space-y-2">
                {groupedGaps.P1.map((item, idx) => (
                  <Link
                    key={`p1-${idx}`}
                    to={item.path}
                    className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{item.gap}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.flow}</p>
                    </div>
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 mt-1 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* P2 Issues */}
          {groupedGaps.P2.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PriorityBadge priority="P2" />
                <span className="text-gray-600 text-sm">
                  {groupedGaps.P2.length} medium priority issues
                </span>
              </div>
              <div className="space-y-2">
                {groupedGaps.P2.map((item, idx) => (
                  <Link
                    key={`p2-${idx}`}
                    to={item.path}
                    className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100 hover:bg-yellow-100 transition-colors group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{item.gap}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.flow}</p>
                    </div>
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 mt-1 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {filteredGaps.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No validation gaps match your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Remediation Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Remediation Recommendations</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-red-50 border border-red-100">
            <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
              <XCircle size={18} />
              P0 - Immediate Action
            </h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Add NOT NULL constraints to critical fields</li>
              <li>• Implement pre-validation in workers</li>
              <li>• Add database-level CHECK constraints</li>
              <li>• Set up monitoring alerts</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
            <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <AlertCircle size={18} />
              P1 - This Sprint
            </h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Add enum validation for status fields</li>
              <li>• Implement webhook signature verification</li>
              <li>• Add rate reasonableness checks</li>
              <li>• Create validation helper functions</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-100">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              <CheckCircle2 size={18} />
              P2 - Backlog
            </h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Add comprehensive unit tests</li>
              <li>• Build monitoring dashboards</li>
              <li>• Set up automated alerts</li>
              <li>• Document validation rules</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataQuality;
