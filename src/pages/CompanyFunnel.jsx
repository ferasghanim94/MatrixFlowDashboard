import { Users, Database, AlertTriangle, GitBranch, UserCheck } from 'lucide-react';
import FlowDiagram from '../components/FlowDiagram';
import MetricCard from '../components/MetricCard';
import PriorityBadge from '../components/PriorityBadge';
import WorkerCard from '../components/WorkerCard';
import { companyFunnelFlowDiagram, companyFunnelFlowData } from '../data/flows/company';

function CompanyFunnel() {
  const { workers, tables, validationGaps, csStages, assignmentLogic } = companyFunnelFlowData;
  
  const totalGaps = validationGaps.p0.length + validationGaps.p1.length + validationGaps.p2.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <Users size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{companyFunnelFlowData.title}</h1>
          </div>
          <p className="text-gray-600 max-w-2xl">{companyFunnelFlowData.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
            {companyFunnelFlowData.category}
          </span>
          <span className="text-sm text-gray-500">
            Created: {companyFunnelFlowData.createdDate}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Workers"
          value={workers.length}
          icon={Users}
          color="purple"
          size="compact"
        />
        <MetricCard
          label="CS Stages"
          value={csStages.length}
          icon={GitBranch}
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
      <FlowDiagram diagram={companyFunnelFlowDiagram} title="Company Funnel Flow Diagram" />

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

      {/* CS Stages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <GitBranch size={20} className="text-gray-500" />
          CS Stage Determination (Priority Order)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Stage</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Description</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ARR Range / Condition</th>
              </tr>
            </thead>
            <tbody>
              {csStages.map((stage, idx) => (
                <tr key={stage.stage} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {stage.stage}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{stage.description}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{stage.arrRange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Logic */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserCheck size={20} className="text-gray-500" />
          CS Manager Assignment Logic
        </h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Assignment Steps</h3>
            <ol className="space-y-2">
              {assignmentLogic.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm">{step.replace(/^\d+\.\s*/, '')}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Bucket Filters</h3>
            <ul className="space-y-2">
              {assignmentLogic.bucketFilters.map((filter, idx) => (
                <li key={idx} className="flex items-center gap-2 text-gray-700 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <code className="bg-gray-100 px-2 py-0.5 rounded">{filter}</code>
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

export default CompanyFunnel;
