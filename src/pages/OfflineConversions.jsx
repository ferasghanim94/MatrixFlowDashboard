import { Send, Database, AlertTriangle, Clock, Users, Workflow, Zap, Link, Globe, CheckCircle, Cloud } from 'lucide-react';
import FlowDiagram from '../components/FlowDiagram';
import MetricCard from '../components/MetricCard';
import PriorityBadge from '../components/PriorityBadge';
import WorkerCard from '../components/WorkerCard';
import { offlineConversionsFlowDiagram, offlineConversionsFlowData } from '../data/flows/offline';

function OfflineConversions() {
  const { workers, dags, tables, validationGaps, conversionTypes, timing, syncTasks, clickTracking, apiDetails, recommendations } = offlineConversionsFlowData;
  
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
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
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
          label="Sync Tasks"
          value={syncTasks?.length || 0}
          icon={Zap}
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
          label="BigQuery Tables"
          value={tables.bigquery?.length || 0}
          icon={Cloud}
          color="indigo"
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

      {/* External DAGs & Sync Tasks */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* DAGs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Workflow size={20} className="text-emerald-600" />
            Airflow DAGs
          </h2>
          <div className="space-y-4">
            {dags.map((dag) => (
              <div key={dag.name} className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <h4 className="font-semibold text-gray-900">{dag.name}</h4>
                <p className="text-xs text-gray-500 font-mono mt-1">{dag.file}</p>
                {dag.output && (
                  <p className="text-xs text-emerald-600 font-mono mt-1">→ {dag.output}</p>
                )}
                {dag.schedule && (
                  <p className="text-xs text-blue-600 mt-1">{dag.schedule}</p>
                )}
                <p className="text-sm text-gray-600 mt-2">{dag.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Tasks */}
        {syncTasks && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap size={20} className="text-purple-600" />
              Sync Tasks
            </h2>
            <div className="space-y-3">
              {syncTasks.map((task) => (
                <div key={task.name} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{task.name}</h4>
                      <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-800 rounded mt-1 inline-block">
                        {task.type}
                      </span>
                    </div>
                  </div>
                  {task.waitsFor && (
                    <p className="text-xs text-gray-600 mt-2">Waits for: <span className="font-mono text-purple-700">{task.waitsFor}</span></p>
                  )}
                  {task.source && (
                    <p className="text-xs text-gray-600 mt-1">Source: <span className="font-mono text-blue-600">{task.source}</span></p>
                  )}
                  {task.target && (
                    <p className="text-xs text-gray-600 mt-1">Target: <span className="font-mono text-green-600">{task.target}</span></p>
                  )}
                  {task.description && (
                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conversion Workers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={20} className="text-blue-600" />
          Conversion Workers
        </h2>
        <div className="grid lg:grid-cols-3 gap-4">
          {workers.map((worker) => (
            <WorkerCard
              key={worker.name}
              name={worker.name}
              file={worker.file}
              risk={worker.risk}
              description={`${worker.description} (${worker.interval})`}
            />
          ))}
        </div>
      </div>

      {/* Click Tracking & API Details */}
      {clickTracking && apiDetails && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Click Tracking */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Link size={20} className="text-indigo-600" />
              Click ID Tracking
            </h2>
            <div className="space-y-4">
              {Object.entries(clickTracking).map(([platform, data]) => (
                <div key={platform} className={`p-4 rounded-lg border ${
                  platform === 'google' ? 'bg-red-50 border-red-100' :
                  platform === 'facebook' ? 'bg-blue-50 border-blue-100' :
                  'bg-teal-50 border-teal-100'
                }`}>
                  <h4 className="font-semibold capitalize mb-2">{platform}</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-gray-500">Channels:</span> <span className="font-mono">{data.channels.join(', ')}</span></p>
                    <p><span className="text-gray-500">Click IDs:</span> <span className="font-mono">{data.clickIds.join(', ')}</span></p>
                    <p><span className="text-gray-500">Date Range:</span> {data.dateRange}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Globe size={20} className="text-orange-600" />
              API Configuration
            </h2>
            <div className="space-y-4">
              {Object.entries(apiDetails).map(([platform, data]) => (
                <div key={platform} className={`p-4 rounded-lg border ${
                  platform === 'google' ? 'bg-red-50 border-red-100' :
                  platform === 'facebook' ? 'bg-blue-50 border-blue-100' :
                  'bg-teal-50 border-teal-100'
                }`}>
                  <h4 className="font-semibold capitalize mb-2">{platform}</h4>
                  <div className="text-sm space-y-1">
                    {data.endpoint && <p><span className="text-gray-500">Endpoint:</span> <span className="font-mono text-xs">{data.endpoint}</span></p>}
                    {data.apiVersion && <p><span className="text-gray-500">API Version:</span> {data.apiVersion}</p>}
                    {data.pixelId && <p><span className="text-gray-500">Pixel ID:</span> <span className="font-mono">{data.pixelId}</span></p>}
                    <p><span className="text-gray-500">Batch Size:</span> {data.batchSize}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
        <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

          {/* Google Enhanced */}
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
            <h3 className="font-semibold text-orange-800 mb-3">Google Ads Enhanced</h3>
            <ul className="space-y-2">
              {conversionTypes.googleEnhanced.map((type, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  {type}
                </li>
              ))}
            </ul>
          </div>

          {/* Facebook */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 max-h-96 overflow-y-auto">
            <h3 className="font-semibold text-blue-800 mb-3 sticky top-0 bg-blue-50">Facebook Ads</h3>
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

          {/* YouTube */}
          <div className="p-4 bg-rose-50 rounded-lg border border-rose-100">
            <h3 className="font-semibold text-rose-800 mb-3">YouTube Ads</h3>
            <ul className="space-y-2">
              {conversionTypes.youtube.map((type, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                  {type}
                </li>
              ))}
            </ul>
          </div>

          {/* TikTok */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">TikTok Ads</h3>
            <ul className="space-y-2">
              {conversionTypes.tiktok.map((type, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 flex-shrink-0" />
                  {type}
                </li>
              ))}
            </ul>
          </div>

          {/* LinkedIn */}
          <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
            <h3 className="font-semibold text-sky-800 mb-3">LinkedIn Ads</h3>
            <ul className="space-y-2">
              {conversionTypes.linkedin.map((type, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 flex-shrink-0" />
                  {type}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tables Read (MySQL)</h2>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tables Written (MySQL)</h2>
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

        {tables.bigquery && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">BigQuery Sources</h2>
            <div className="flex flex-wrap gap-2">
              {tables.bigquery.map((table) => (
                <span
                  key={table}
                  className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-mono"
                >
                  {table}
                </span>
              ))}
            </div>
          </div>
        )}
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

      {/* Recommendations */}
      {recommendations && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            Remediation Recommendations
          </h2>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {recommendations.p0 && recommendations.p0.length > 0 && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-2 mb-3">
                  <PriorityBadge priority="P0" />
                  <span className="text-sm text-gray-600">Critical (1 week)</span>
                </div>
                <ul className="space-y-2">
                  {recommendations.p0.map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <CheckCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recommendations.p1 && recommendations.p1.length > 0 && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center gap-2 mb-3">
                  <PriorityBadge priority="P1" />
                  <span className="text-sm text-gray-600">High (2 weeks)</span>
                </div>
                <ul className="space-y-2">
                  {recommendations.p1.map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <CheckCircle size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recommendations.p2 && recommendations.p2.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="flex items-center gap-2 mb-3">
                  <PriorityBadge priority="P2" />
                  <span className="text-sm text-gray-600">Medium (2 weeks)</span>
                </div>
                <ul className="space-y-2">
                  {recommendations.p2.map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <CheckCircle size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OfflineConversions;
