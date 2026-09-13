import React, { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

interface StatusDropdownProps {
  currentStatus: string;
  options: string[];
  onStatusChange: (newStatus: string) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  options,
  onStatusChange,
  disabled = false,
  className = '',
  size = 'sm'
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColorClasses = (status: string) => {
    const norm = (status || '').toLowerCase();
    if (norm === 'completed' || norm === 'approved' || norm === 'operational') {
      return 'bg-[#00D25B]/15 text-[#00D25B] border-[#00D25B]/40 hover:border-[#00D25B]/70';
    }
    if (norm === 'ongoing' || norm === 'in progress' || norm === 'scheduled' || norm === 'received' || norm === 'deployed') {
      return 'bg-[#0090FF]/15 text-[#0090FF] border-[#0090FF]/40 hover:border-[#0090FF]/70';
    }
    if (norm === 'pending' || norm === 't&c' || norm === 'standby' || norm === 'under review' || norm === 'postponed') {
      return 'bg-[#FFAB00]/15 text-[#FFAB00] border-[#FFAB00]/40 hover:border-[#FFAB00]/70';
    }
    if (norm === 'punchlist' || norm === 'delayed' || norm === 'superuser') {
      return 'bg-[#8F5FE8]/15 text-[#8F5FE8] border-[#8F5FE8]/40 hover:border-[#8F5FE8]/70';
    }
    if (norm === 'handover') {
      return 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/40 hover:border-[#00E5FF]/70';
    }
    if (norm === 'planning' || norm === 'user') {
      return 'bg-[#626875]/25 text-[#BAC2D1] border-[#3F4555] hover:border-[#626875]';
    }
    if (norm === 'cancelled' || norm === 'under maintenance' || norm === 'decommissioned' || norm === 'rejected') {
      return 'bg-[#FC424A]/15 text-[#FC424A] border-[#FC424A]/40 hover:border-[#FC424A]/70';
    }
    return 'bg-[#20232C] text-[#BAC2D1] border-[#2A2E38] hover:border-[#4B5263]';
  };

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === currentStatus || isUpdating || disabled) return;

    try {
      setIsUpdating(true);
      await onStatusChange(newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const paddingClass = size === 'sm' ? 'py-1 pl-2.5 pr-7 text-[11px]' : 'py-1.5 pl-3 pr-8 text-xs';

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={currentStatus}
        disabled={disabled || isUpdating}
        onChange={handleChange}
        title="Click to change status"
        className={`appearance-none cursor-pointer font-medium rounded-[4px] border transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-[#0090FF] disabled:opacity-60 disabled:cursor-not-allowed ${paddingClass} ${getStatusColorClasses(
          currentStatus
        )}`}
        style={{
          backgroundColor: undefined // relies on Tailwind classes
        }}
      >
        {options.map((opt) => (
          <option
            key={opt}
            value={opt}
            className="bg-[#191C24] text-white py-1 px-2 font-normal"
          >
            {opt}
          </option>
        ))}
      </select>

      {/* Trailing Icon (Spinner or Chevron) */}
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center text-current opacity-80">
        {isUpdating ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <ChevronDown className="w-3 h-3 opacity-70" />
        )}
      </div>
    </div>
  );
};
