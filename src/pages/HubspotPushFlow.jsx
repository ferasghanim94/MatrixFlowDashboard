import { ArrowUpRight, Database, AlertTriangle, Users, Layers, Workflow } from 'lucide-react';
import FlowDiagram from '../components/FlowDiagram';
import MetricCard from '../components/MetricCard';
import PriorityBadge from '../components/PriorityBadge';
import WorkerCard from '../components/WorkerCard';
import { hubspotPushFlowDiagram, hubspotPushFlowData } from '../data/flows/hubspot';

function HubspotPushFlow() {
  const { workers, propertyManagers, eventSources, tables, validationGaps, businessImpact } = hubspotPushFlowData;
  
  const totalGaps = validationGaps.p0.length + validationGaps.p1.length + validationGaps.p2.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
              <ArrowUpRight size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{hubspotPushFlowData.title}</h1>
          </div>
          <p className="text-gray-600 max-w-2xl">{hubspotPushFlowData.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
            {hubspotPushFlowData.category}
          </span>
          <span className="text-sm text-gray-500">
            Created: {hubspotPushFlowData.createdDate}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Workers"
          value={workers.length}
          icon={Users}
          color="orange"
          size="compact"
        />
        <MetricCard
          label="Property Managers"
          value={propertyManagers.length}
          icon={Layers}
          color="purple"
          size="compact"
        />
        <MetricCard
          label="Tables (Read)"
          value={tables.read.length}
          icon={Database}
          color="slate"
          size="compact"
        />
        <MetricCard
          label="Validation Gaps"
          value={totalGaps}
          icon={AlertTriangle}
          color="red"
          size="compact"
        />
      </div>

      {/* Flow Diagram */}
      <FlowDiagram diagram={hubspotPushFlowDiagram} title="HubSpot Push Flow Diagram" />

      {/* Workers Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Push Workers</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {workers.map((worker) => (
            <WorkerCard
              key={worker.name}
              name={worker.name}
              file={worker.queue}
              risk={worker.risk}
              description={worker.description}
            />
          ))}
        </div>
      </div>

      {/* Property Managers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Layers size={20} className="text-purple-500" />
          Property Managers ({propertyManagers.length} Total)
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {propertyManagers.map((pm) => (
            <div key={pm.name} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
              <h3 className="font-medium text-purple-800 text-sm truncate" title={pm.name}>
                {pm.name.replace('HubspotPropertyManager', '')}
              </h3>
              <p className="text-xs text-purple-600 mt-1">{pm.data}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Event Sources */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Workflow size={20} className="text-gray-500" />
          Event Sources
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Topic</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Publisher</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {eventSources.map((source, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs text-blue-600">{source.topic}</td>
                  <td className="py-3 px-4 text-gray-700">{source.publisher}</td>
                  <td className="py-3 px-4 text-gray-600">{source.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Output Destination</h2>
          <div className="flex flex-wrap gap-2">
            {tables.write.map((table) => (
              <span
                key={table}
                className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-mono"
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
            <div key={idx} className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <h3 className="font-semibold text-amber-800 mb-2">{impact.area}</h3>
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

export default HubspotPushFlow;

