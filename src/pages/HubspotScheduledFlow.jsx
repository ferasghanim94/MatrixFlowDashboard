import { Clock, Database, AlertTriangle, Users, RefreshCw, Package } from 'lucide-react';
import FlowDiagram from '../components/FlowDiagram';
import MetricCard from '../components/MetricCard';
import PriorityBadge from '../components/PriorityBadge';
import { hubspotScheduledFlowDiagram, hubspotScheduledFlowData } from '../data/flows/hubspot';

function HubspotScheduledFlow() {
  const { workers, eventSources, backfillOperations, tables, validationGaps, businessImpact } = hubspotScheduledFlowData;
  
  const totalGaps = validationGaps.p0.length + validationGaps.p1.length + validationGaps.p2.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-violet-100 text-violet-600">
              <Clock size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{hubspotScheduledFlowData.title}</h1>
          </div>
          <p className="text-gray-600 max-w-2xl">{hubspotScheduledFlowData.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
            {hubspotScheduledFlowData.category}
          </span>
          <span className="text-sm text-gray-500">
            Created: {hubspotScheduledFlowData.createdDate}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Workers/DAGs"
          value={workers.length}
          icon={Users}
          color="violet"
          size="compact"
        />
        <MetricCard
          label="Backfill Operations"
          value={backfillOperations.length}
          icon={Package}
          color="purple"
          size="compact"
        />
        <MetricCard
          label="Tables (Write)"
          value={tables.write.length}
          icon={Database}
          color="green"
          size="compact"
        />
        <MetricCard
          label="Validation Gaps"
          value={totalGaps}
          icon={AlertTriangle}
          color="orange"
          size="compact"
        />
      </div>

      {/* Flow Diagram */}
      <FlowDiagram diagram={hubspotScheduledFlowDiagram} title="HubSpot Scheduled Jobs Flow Diagram" />

      {/* Workers/DAGs Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduled Workers & DAGs</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((worker) => (
            <div key={worker.name} className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm">{worker.name}</h3>
                <PriorityBadge priority={worker.risk} size="small" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  worker.type === 'Airflow DAG' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {worker.type}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Clock size={12} />
                <span className="font-mono">{worker.schedule}</span>
              </div>
              <p className="text-sm text-gray-600">{worker.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Event Sources / Triggers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <RefreshCw size={20} className="text-gray-500" />
          Event Sources & Triggers
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Source</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Trigger</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {eventSources.map((source, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700">{source.source}</td>
                  <td className="py-3 px-4 font-mono text-xs text-violet-600">{source.trigger}</td>
                  <td className="py-3 px-4 text-gray-600">{source.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backfill Operations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package size={20} className="text-purple-500" />
          Backfill Operations (On-Demand)
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {backfillOperations.map((op, idx) => (
            <div key={idx} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <h3 className="font-semibold text-purple-800 mb-2">{op.operation}</h3>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                {op.entity}
              </span>
              <p className="text-sm text-gray-700 mt-2">{op.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">API Endpoint:</span>{' '}
            <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">POST /hubspot/sync/</code>
          </p>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tables Read</h2>
          <div className="flex flex-wrap gap-2">
            {tables.read.map((table) => (
              <span
                key={table}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-mono"
              >
                {table}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tables Written</h2>
          <div className="flex flex-wrap gap-2">
            {tables.write.map((table) => (
              <span
                key={table}
                className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-sm font-mono"
              >
                {table}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Business Impact */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Impact</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {businessImpact.map((impact, idx) => (
            <div key={idx} className="p-4 bg-violet-50 rounded-lg border border-violet-100">
              <h3 className="font-semibold text-violet-800 mb-2">{impact.area}</h3>
              <p className="text-sm text-gray-700">{impact.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Gaps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Validation Gaps</h2>
        
        <div className="space-y-6">
          {validationGaps.p0.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PriorityBadge priority="P0" />
                <span className="text-gray-500 text-sm">({validationGaps.p0.length} issues)</span>
              </div>
              <ul className="space-y-2">
                {validationGaps.p0.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validationGaps.p1.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PriorityBadge priority="P1" />
                <span className="text-gray-500 text-sm">({validationGaps.p1.length} issues)</span>
              </div>
              <ul className="space-y-2">
                {validationGaps.p1.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validationGaps.p2.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PriorityBadge priority="P2" />
                <span className="text-gray-500 text-sm">({validationGaps.p2.length} issues)</span>
              </div>
              <ul className="space-y-2">
                {validationGaps.p2.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HubspotScheduledFlow;

