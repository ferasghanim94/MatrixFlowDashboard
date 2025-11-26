import { TrendingUp, Database, AlertTriangle, Clock, Users } from 'lucide-react';
import FlowDiagram from '../components/FlowDiagram';
import MetricCard from '../components/MetricCard';
import PriorityBadge from '../components/PriorityBadge';
import WorkerCard from '../components/WorkerCard';
import { attributionFlowDiagram, attributionFlowData } from '../data/flows/attribution';

function AttributionFlow() {
  const { workers, tables, validationGaps, topics, keyMetrics } = attributionFlowData;
  
  const totalGaps = validationGaps.p0.length + validationGaps.p1.length + validationGaps.p2.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <TrendingUp size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{attributionFlowData.title}</h1>
          </div>
          <p className="text-gray-600 max-w-2xl">{attributionFlowData.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            {attributionFlowData.category}
          </span>
          <span className="text-sm text-gray-500">
            Created: {attributionFlowData.createdDate}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Workers"
          value={workers.length}
          icon={Users}
          color="blue"
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
      <FlowDiagram diagram={attributionFlowDiagram} title="Attribution Flow Diagram" />

      {/* Workers Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Workers</h2>
        <div className="grid md:grid-cols-2 gap-4">
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

      {/* Timing & Attribution Models */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-gray-500" />
            Processing Timing
          </h2>
          <div className="space-y-3">
            {Object.entries(keyMetrics.timing).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Attribution Models</h2>
          <div className="space-y-3">
            {keyMetrics.attributionModels.map((model, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-gray-700">{model}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delay Constants */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-amber-500" />
          Delayed Attribution Constants
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-sm text-amber-600 font-medium mb-1">DELAY_IN_MINUTES</div>
            <div className="text-2xl font-bold text-amber-700">{keyMetrics.delayConstants.DELAY_IN_MINUTES} min</div>
            <div className="text-xs text-amber-600 mt-1">Standard delay for re-calculation</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-green-600 font-medium mb-1">SHORT_DELAY_IN_MINUTES</div>
            <div className="text-2xl font-bold text-green-700">{keyMetrics.delayConstants.SHORT_DELAY_IN_MINUTES} min</div>
            <div className="text-xs text-green-600 mt-1">For: {keyMetrics.delayConstants.shortDelayTriggers.join(', ')}</div>
          </div>
        </div>
      </div>

      {/* Topics Subscriptions by Worker */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Topic Subscriptions by Worker</h2>
        <div className="grid lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-3">VisitsRunner</h3>
            <ul className="space-y-2">
              {topics.subscribes.visitsRunner.map((topic, idx) => (
                <li key={idx} className="text-sm font-mono text-blue-700 bg-blue-100 px-2 py-1 rounded break-all">
                  {topic}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h3 className="font-semibold text-indigo-800 mb-3">ClientAttributionRunner</h3>
            <ul className="space-y-2">
              {topics.subscribes.clientAttributionRunner.map((topic, idx) => (
                <li key={idx} className="text-sm font-mono text-indigo-700 bg-indigo-100 px-2 py-1 rounded break-all">
                  {topic}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
            <h3 className="font-semibold text-violet-800 mb-3">ContactAttributionRunner</h3>
            <ul className="space-y-2">
              {topics.subscribes.contactAttributionRunner.map((topic, idx) => (
                <li key={idx} className="text-sm font-mono text-violet-700 bg-violet-100 px-2 py-1 rounded break-all">
                  {topic}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h3 className="font-semibold text-amber-800 mb-3">DelayedAttributionRunner</h3>
            <ul className="space-y-2">
              {topics.subscribes.delayedAttributionRunner.map((topic, idx) => (
                <li key={idx} className="text-sm font-mono text-amber-700 bg-amber-100 px-2 py-1 rounded break-all">
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Topics Published by Worker */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Topics Published by Worker</h2>
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <h3 className="font-semibold text-emerald-800 mb-3">LeadsRunner</h3>
            <ul className="space-y-2">
              {topics.publishes.leadsRunner.map((topic, idx) => (
                <li key={idx} className="text-sm font-mono text-emerald-700 bg-emerald-100 px-2 py-1 rounded break-all">
                  {topic}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
            <h3 className="font-semibold text-teal-800 mb-3">MarketingSiteForms</h3>
            <ul className="space-y-2">
              {topics.publishes.marketingSiteFormsRunner.map((topic, idx) => (
                <li key={idx} className="text-sm font-mono text-teal-700 bg-teal-100 px-2 py-1 rounded break-all">
                  {topic}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
            <h3 className="font-semibold text-cyan-800 mb-3">MobileSignupsWorker</h3>
            <ul className="space-y-2">
              {topics.publishes.mobileSignupsWorker.map((topic, idx) => (
                <li key={idx} className="text-sm font-mono text-cyan-700 bg-cyan-100 px-2 py-1 rounded break-all">
                  {topic}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h3 className="font-semibold text-indigo-800 mb-3">ClientAttribution</h3>
            <ul className="space-y-2">
              {topics.publishes.clientAttributionRunner.map((topic, idx) => (
                <li key={idx} className="text-sm font-mono text-indigo-700 bg-indigo-100 px-2 py-1 rounded break-all">
                  {topic}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
            <h3 className="font-semibold text-violet-800 mb-3">ContactAttribution</h3>
            <ul className="space-y-2">
              {topics.publishes.contactAttributionRunner.map((topic, idx) => (
                <li key={idx} className="text-sm font-mono text-violet-700 bg-violet-100 px-2 py-1 rounded break-all">
                  {topic}
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
          {/* P0 Issues */}
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

          {/* P1 Issues */}
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

          {/* P2 Issues */}
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

export default AttributionFlow;
