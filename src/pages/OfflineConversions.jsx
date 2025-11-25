import { Send, Database, AlertTriangle, Clock, Users, Workflow } from 'lucide-react';
import FlowDiagram from '../components/FlowDiagram';
import MetricCard from '../components/MetricCard';
import PriorityBadge from '../components/PriorityBadge';
import WorkerCard from '../components/WorkerCard';
import { offlineConversionsFlowDiagram, offlineConversionsFlowData } from '../data/flows/offline';

function OfflineConversions() {
  const { workers, dags, tables, validationGaps, conversionTypes, timing } = offlineConversionsFlowData;
  
  const totalGaps = validationGaps.p0.length + validationGaps.p1.length + validationGaps.p2.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyan-100 text-cyan-600">
              <Send size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{offlineConversionsFlowData.title}</h1>
          </div>
          <p className="text-gray-600 max-w-2xl">{offlineConversionsFlowData.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            {offlineConversionsFlowData.category}
          </span>
          <span className="text-sm text-gray-500">
            Created: {offlineConversionsFlowData.createdDate}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Workers"
          value={workers.length}
          icon={Users}
          color="blue"
          size="compact"
        />
        <MetricCard
          label="Airflow DAGs"
          value={dags.length}
          icon={Workflow}
          color="green"
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
          label="Tables (Write)"
          value={tables.write.length}
          icon={Database}
          color="purple"
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
      <FlowDiagram diagram={offlineConversionsFlowDiagram} title="Offline Conversions Flow Diagram" />

      {/* Workers & DAGs */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Workers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Conversion Workers</h2>
          <div className="space-y-4">
            {workers.map((worker) => (
              <WorkerCard
                key={worker.name}
                name={worker.name}
                file={worker.file}
                risk={worker.risk}
                description={worker.description}
              />
            ))}
          </div>
        </div>

        {/* DAGs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Airflow DAGs</h2>
          <div className="space-y-4">
            {dags.map((dag) => (
              <div key={dag.name} className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <h4 className="font-semibold text-gray-900">{dag.name}</h4>
                <p className="text-xs text-gray-500 font-mono mt-1">{dag.file}</p>
                <p className="text-sm text-gray-600 mt-2">{dag.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timing */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-gray-500" />
          Processing Schedule
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(timing).map(([key, value]) => (
            <div key={key} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="font-mono text-lg font-semibold text-gray-900 mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Types by Platform */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Conversion Types by Platform</h2>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Google */}
          <div className="p-4 bg-red-50 rounded-lg border border-red-100">
            <h3 className="font-semibold text-red-800 mb-3">Google Ads</h3>
            <ul className="space-y-2">
              {conversionTypes.google.map((type, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  {type}
                </li>
              ))}
            </ul>
          </div>

          {/* Facebook */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-3">Facebook Ads</h3>
            <ul className="space-y-2">
              {conversionTypes.facebook.map((type, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  {type}
                </li>
              ))}
            </ul>
          </div>

          {/* Bing */}
          <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
            <h3 className="font-semibold text-teal-800 mb-3">Bing Ads</h3>
            <ul className="space-y-2">
              {conversionTypes.bing.map((type, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                  {type}
                </li>
              ))}
            </ul>
          </div>
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
                className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-mono"
              >
                {table}
              </span>
            ))}
          </div>
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

export default OfflineConversions;
