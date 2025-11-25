function PriorityBadge({ priority, size = 'default' }) {
  const priorityConfig = {
    P0: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      label: 'P0 - Critical',
      dot: 'bg-red-500',
    },
    P1: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200',
      label: 'P1 - High',
      dot: 'bg-orange-500',
    },
    P2: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      label: 'P2 - Medium',
      dot: 'bg-yellow-500',
    },
  };

  const config = priorityConfig[priority] || priorityConfig.P2;

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    default: 'px-2.5 py-1 text-xs',
    large: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-semibold rounded-full border
        ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default PriorityBadge;

