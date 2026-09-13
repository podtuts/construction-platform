import React, { useState, useEffect } from 'react';
import { History, Search, Download } from 'lucide-react';
import { ActivityLog } from '../../types';
import { api } from '../../services/api';
import { downloadCSV } from '../../services/export';

export const ActivityLogsView: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadActivities = async () => {
    try {
      const res = await api.getActivities();
      setActivities(res.activities || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const filteredActivities = activities.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.action.toLowerCase().includes(q) ||
      a.details.toLowerCase().includes(q) ||
      a.userName.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  });

  const handleDownloadCSV = () => {
    downloadCSV(
      'activity-logs-' + new Date().toISOString().split('T')[0] + '.csv',
      ['Date', 'Activity', 'Details', 'Attended By'],
      filteredActivities.map((a) => [
        new Date(a.timestamp).toLocaleString([], {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        a.action,
        a.details,
        a.userName
      ])
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-medium text-white tracking-tight">Activity Logs</h2>
          <p className="text-[13px] text-[#8D93A1] mt-0.5">
            Latest {activities.length} record{activities.length === 1 ? '' : 's'} (display capped at 50 most recent)
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="inline-flex items-center px-3.5 py-2 bg-[#20232C] hover:bg-[#2A2E38] border border-[#2A2E38] text-[#BAC2D1] hover:text-white text-xs font-medium rounded-[5px] transition-colors"
        >
          <Download className="w-4 h-4 mr-1.5" />
          <span>Download CSV</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-[#8D93A1]">
            {filteredActivities.length} of {activities.length} records
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#626875] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity or attendee..."
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#0090FF] placeholder-[#626875]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171A21] text-[#8D93A1] uppercase text-[10px] tracking-wider border-b border-[#2A2E38]">
              <tr>
                <th className="py-3 px-4 font-semibold w-44">Date</th>
                <th className="py-3 px-4 font-semibold">Activity</th>
                <th className="py-3 px-4 font-semibold">Attended By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E38]/60 text-white">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[#626875]">
                    No activity records found for this query.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((a) => (
                  <tr key={a.id} className="hover:bg-[#20232C]/40 transition-colors">
                    <td className="py-3.5 px-4 text-[#8D93A1] text-[11px] align-top">
                      {new Date(a.timestamp).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-start space-x-2">
                        <History className="w-3.5 h-3.5 text-[#0090FF] mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold text-white">{a.action}</div>
                          <div className="text-[11px] text-[#8D93A1] mt-0.5">{a.details}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#0090FF] align-top">{a.userName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
