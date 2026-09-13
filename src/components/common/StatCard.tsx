import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  icon: LucideIcon;
  iconColor?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  subtitle,
  value,
  trend,
  icon: Icon,
  iconColor = 'blue'
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-[#0090FF]/10',
      text: 'text-[#0090FF]',
      border: 'border-[#0090FF]/20'
    },
    green: {
      bg: 'bg-[#00D25B]/10',
      text: 'text-[#00D25B]',
      border: 'border-[#00D25B]/20'
    },
    yellow: {
      bg: 'bg-[#FFAB00]/10',
      text: 'text-[#FFAB00]',
      border: 'border-[#FFAB00]/20'
    },
    red: {
      bg: 'bg-[#FC424A]/10',
      text: 'text-[#FC424A]',
      border: 'border-[#FC424A]/20'
    },
    purple: {
      bg: 'bg-[#8F5FE8]/10',
      text: 'text-[#8F5FE8]',
      border: 'border-[#8F5FE8]/20'
    }
  };

  const currentTheme = colorMap[iconColor] || colorMap.blue;

  return (
    <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-5 relative overflow-hidden transition-all duration-200 hover:border-[#3A4050]">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-[13px] font-medium text-[#8D93A1] uppercase tracking-wider">{title}</h4>
          {subtitle && <p className="text-[11px] text-[#626875] mt-0.5">{subtitle}</p>}
          <div className="text-[26px] font-bold text-white mt-2 leading-none">{value}</div>
        </div>
        <div className={`w-11 h-11 rounded-[6px] flex items-center justify-center border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="flex items-center text-[12px] mt-3.5 pt-3 border-t border-[#2A2E38]/60">
          <span
            className={`inline-flex items-center font-medium mr-1.5 ${
              trend.isPositive ? 'text-[#00D25B]' : 'text-[#FC424A]'
            }`}
          >
            {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
            {trend.value}
          </span>
          {trend.label && <span className="text-[#8D93A1]">{trend.label}</span>}
        </div>
      )}
    </div>
  );
};
