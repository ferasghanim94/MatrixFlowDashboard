import { DollarSign, Database, AlertTriangle, Workflow, Users, Calculator } from 'lucide-react';
import FlowDiagram from '../components/FlowDiagram';
import MetricCard from '../components/MetricCard';
import PriorityBadge from '../components/PriorityBadge';
import WorkerCard from '../components/WorkerCard';
import { paymentsFlowDiagram, paymentsFlowData } from '../data/flows/payments';

function PaymentsFlow() {
  const { workers, tables, validationGaps, eventSources, mrrCalculation, businessImpact } = paymentsFlowData;
  
  const totalGaps = validationGaps.p0.length + validationGaps.p1.length + validationGaps.p2.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <DollarSign size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{paymentsFlowData.title}</h1>
          </div>
          <p className="text-gray-600 max-w-2xl">{paymentsFlowData.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
            {paymentsFlowData.category}
          </span>
          <span className="text-sm text-gray-500">
            Created: {paymentsFlowData.createdDate}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Workers"
          value={workers.length}
          icon={Users}
          color="green"
          size="compact"
        />
        <MetricCard
          label="Event Sources"
          value={eventSources.length}
          icon={Workflow}
          color="blue"
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
          color="red"
          size="compact"
        />
      </div>

      {/* Flow Diagram */}
      <FlowDiagram diagram={paymentsFlowDiagram} title="Payments Processing Flow Diagram" />

      {/* Workers Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Workers</h2>
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

      {/* Event Sources & MRR Calculation */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Event Sources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Workflow size={20} className="text-gray-500" />
            Event Sources
          </h2>
          <div className="space-y-4">
            {eventSources.map((source) => (
              <div key={source.name} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900">{source.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{source.description}</p>
                {source.events && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {source.events.slice(0, 4).map((event) => (
                      <span key={event} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                        {event}
                      </span>
                    ))}
                    {source.events.length > 4 && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                        +{source.events.length - 4} more
                      </span>
                    )}
                  </div>
                )}
                {source.handlers && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {source.handlers.map((handler) => (
                      <span key={handler} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-mono">
                        {handler}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* MRR Calculation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calculator size={20} className="text-gray-500" />
            MRR Calculation
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Components</h3>
              <ul className="space-y-2">
                {mrrCalculation.components.map((comp, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700 text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {comp}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-800 mb-2">Coupon Application Order</h3>
              <ol className="space-y-1">
                {mrrCalculation.couponOrder.map((step, idx) => (
                  <li key={idx} className="text-sm text-gray-600">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
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

      {/* Business Impact */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Impact</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-4 bg-red-50 rounded-lg border border-red-100">
            <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
              <PriorityBadge priority="P0" size="small" />
              Critical Impact
            </h3>
            <ul className="space-y-2">
              {businessImpact.p0.map((impact, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  {impact}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
            <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
              <PriorityBadge priority="P1" size="small" />
              High Impact
            </h3>
            <ul className="space-y-2">
              {businessImpact.p1.map((impact, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  {impact}
                </li>
              ))}
            </ul>
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

export default PaymentsFlow;
