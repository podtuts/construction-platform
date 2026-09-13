import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'sm' }) => {
  const norm = status.toLowerCase();

  let colorClasses = 'bg-[#20232C] text-[#8D93A1] border border-[#2A2E38]';

  // Construction progress, todo, and schedule statuses
  if (norm === 'completed' || norm === 'approved' || norm === 'operational') {
    colorClasses = 'bg-[#00D25B]/10 text-[#00D25B] border border-[#00D25B]/30';
  } else if (norm === 'ongoing' || norm === 'in progress' || norm === 'scheduled' || norm === 'deployed' || norm === 'received') {
    colorClasses = 'bg-[#0090FF]/10 text-[#0090FF] border border-[#0090FF]/30';
  } else if (norm === 'pending' || norm === 't&c' || norm === 'standby' || norm === 'under review' || norm === 'postponed') {
    colorClasses = 'bg-[#FFAB00]/10 text-[#FFAB00] border border-[#FFAB00]/30';
  } else if (norm === 'punchlist' || norm === 'delayed' || norm === 'superuser') {
    colorClasses = 'bg-[#8F5FE8]/10 text-[#8F5FE8] border border-[#8F5FE8]/30';
  } else if (norm === 'handover') {
    colorClasses = 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30';
  } else if (norm === 'planning' || norm === 'user') {
    colorClasses = 'bg-[#626875]/20 text-[#8D93A1] border border-[#2A2E38]';
  } else if (norm === 'cancelled' || norm === 'under maintenance' || norm === 'decommissioned' || norm === 'rejected') {
    colorClasses = 'bg-[#FC424A]/10 text-[#FC424A] border border-[#FC424A]/30';
  } else if (norm === 'admin') {
    colorClasses = 'bg-[#0090FF]/15 text-[#0090FF] border border-[#0090FF]/40';
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-[4px] tracking-wide whitespace-nowrap ${paddingClass} ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status}
    </span>
  );
};
