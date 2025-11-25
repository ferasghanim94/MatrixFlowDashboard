import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function MetricCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'blue',
  size = 'default'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';

  return (
    <div className={`
      bg-white rounded-xl border border-gray-200 shadow-sm
      ${size === 'compact' ? 'p-4' : 'p-6'}
      hover:shadow-md transition-shadow duration-200
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className={`font-bold text-gray-900 mt-1 ${size === 'compact' ? 'text-2xl' : 'text-3xl'}`}>
            {value}
          </p>
          {trendValue && (
            <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
              <TrendIcon size={14} />
              <span className="text-sm font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${iconBgClasses[color]}`}>
            <Icon size={size === 'compact' ? 20 : 24} />
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;



