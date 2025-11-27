import { ArrowDownLeft, Database, AlertTriangle, Users, Globe, Tag } from 'lucide-react';
import FlowDiagram from '../components/FlowDiagram';
import MetricCard from '../components/MetricCard';
import PriorityBadge from '../components/PriorityBadge';
import WorkerCard from '../components/WorkerCard';
import { hubspotPullFlowDiagram, hubspotPullFlowData } from '../data/flows/hubspot';

function HubspotPullFlow() {
  const { workers, webhookEndpoints, eventTypes, propertiesSynced, tables, validationGaps, businessImpact } = hubspotPullFlowData;
  
  const totalGaps = validationGaps.p0.length + validationGaps.p1.length + validationGaps.p2.length;
  const totalProperties = Object.values(propertiesSynced).flat().length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyan-100 text-cyan-600">
              <ArrowDownLeft size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{hubspotPullFlowData.title}</h1>
          </div>
          <p className="text-gray-600 max-w-2xl">{hubspotPullFlowData.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-cyan-100 text-cyan-700 text-sm font-medium">
            {hubspotPullFlowData.category}
          </span>
          <span className="text-sm text-gray-500">
            Created: {hubspotPullFlowData.createdDate}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Workers"
          value={workers.length}
          icon={Users}
          color="cyan"
          size="compact"
        />
        <MetricCard
          label="Webhook Endpoints"
          value={webhookEndpoints.length}
          icon={Globe}
          color="blue"
          size="compact"
        />
        <MetricCard
          label="Properties Synced"
          value={totalProperties}
          icon={Tag}
          color="purple"
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
      <FlowDiagram diagram={hubspotPullFlowDiagram} title="HubSpot Pull Flow Diagram" />

      {/* Workers Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pull Workers</h2>
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

      {/* Webhook Endpoints */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe size={20} className="text-blue-500" />
          Webhook Endpoints
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {webhookEndpoints.map((ep, idx) => (
            <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="font-mono text-sm text-blue-700 mb-2">{ep.endpoint}</div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">{ep.type}</span>
              <p className="text-xs text-gray-600 mt-2">{ep.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Event Types */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Webhook Event Types</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Source</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Event Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {eventTypes.map((event, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700">{event.source}</td>
                  <td className="py-3 px-4 font-mono text-xs text-cyan-600">{event.event}</td>
                  <td className="py-3 px-4 text-gray-600">{event.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Properties Synced FROM HubSpot */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Tag size={20} className="text-purple-500" />
          Properties Synced FROM HubSpot
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(propertiesSynced).map(([group, fields]) => (
            <div key={group} className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3 capitalize">
                {group.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <div className="space-y-1">
                {fields.map((field) => (
                  <div key={field} className="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    {field}
                  </div>
                ))}
              </div>
            </div>
          ))}
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
                className="px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-lg text-sm font-mono"
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
            <div key={idx} className="p-4 bg-cyan-50 rounded-lg border border-cyan-100">
              <h3 className="font-semibold text-cyan-800 mb-2">{impact.area}</h3>
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

export default HubspotPullFlow;

