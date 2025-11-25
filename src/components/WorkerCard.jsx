import { FileCode, ExternalLink } from 'lucide-react';
import PriorityBadge from './PriorityBadge';

function WorkerCard({ name, file, risk, description }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0">
            <FileCode size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-gray-900 truncate">{name}</h4>
              {risk && <PriorityBadge priority={risk} size="small" />}
            </div>
            <p className="text-xs text-gray-500 font-mono mt-1 truncate" title={file}>
              {file}
            </p>
            {description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkerCard;

