// Server component - no interactivity needed

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  suffix?: string;
  trend?: number | null;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray';
}

const colorClasses: Record<string, string> = {
  green: 'border-l-green-500',
  yellow: 'border-l-yellow-500',
  red: 'border-l-red-500',
  blue: 'border-l-blue-500',
  purple: 'border-l-purple-500',
  gray: 'border-l-gray-500',
};

export function StatCard({ title, value, suffix = '', trend, color }: StatCardProps) {
  return (
    <div className={`card border-l-4 ${colorClasses[color]}`}>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">
        {value}
        {suffix && <span className="text-sm font-normal text-gray-500">{suffix}</span>}
      </p>
      {trend !== undefined && trend !== null && (
        <p className={`text-sm mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? '+' : ''}
          {trend.toFixed(1)}% from last week
        </p>
      )}
    </div>
  );
}

// Status Badge Component
interface StatusBadgeProps {
  status: string;
}

const statusClasses: Record<string, string> = {
  pending: 'badge bg-gray-100 text-gray-800',
  transcribing: 'badge bg-blue-100 text-blue-800',
  scoring: 'badge bg-yellow-100 text-yellow-800',
  complete: 'badge bg-green-100 text-green-800',
  completed: 'badge bg-green-100 text-green-800',
  error: 'badge bg-red-100 text-red-800',
  active: 'badge bg-blue-100 text-blue-800',
  abandoned: 'badge bg-gray-100 text-gray-800',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={statusClasses[status] || statusClasses.pending}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Status Indicator (for performance levels)
interface StatusIndicatorProps {
  score: number;
}

export function StatusIndicator({ score }: StatusIndicatorProps) {
  if (score >= 80) {
    return <span className="badge bg-green-100 text-green-800">Excellent</span>;
  }
  if (score >= 70) {
    return <span className="badge bg-yellow-100 text-yellow-800">On Track</span>;
  }
  return <span className="badge bg-red-100 text-red-800">Needs Coaching</span>;
}

// Alert Item Component
interface AlertItemProps {
  type: 'warning' | 'info' | 'neutral';
  title: string;
  description: string;
}

const alertClasses: Record<string, string> = {
  warning: 'border-l-yellow-500 bg-yellow-50',
  info: 'border-l-blue-500 bg-blue-50',
  neutral: 'border-l-gray-500 bg-gray-50',
};

export function AlertItem({ type, title, description }: AlertItemProps) {
  return (
    <div className={`p-3 border-l-4 ${alertClasses[type]}`}>
      <p className="font-medium text-gray-900">{title}</p>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
