import React from 'react';
import { Project } from '../../types';

interface ProjectGanttChartProps {
  projects: Project[];
}

const STATUS_COLORS: Record<string, string> = {
  Active: '#0090FF',
  'Under Review': '#FFAB00',
  Completed: '#00D25B'
};

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDate = (iso: string | undefined): number => {
  if (!iso) return NaN;
  const t = Date.parse(iso);
  return isNaN(t) ? NaN : t;
};

const formatShort = (t: number): string =>
  new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({ projects }) => {
  // "Current date" anchor for the chart (zeroed to midnight)
  const todayAnchor = new Date();
  todayAnchor.setHours(0, 0, 0, 0);
  const today = todayAnchor.getTime();

  interface Row {
    project: Project;
    start: number;
    end: number;
    color: string;
  }

  const rows: Row[] = projects
    .filter((p) => Boolean(p.targetCompletionDate))
    .map((p) => {
      const end = parseDate(p.targetCompletionDate);
      if (isNaN(end)) return null;
      // Legacy/blank start date falls back to 11 months before target
      let start = parseDate(p.startDate);
      if (isNaN(start)) start = end - 330 * DAY_MS;
      return {
        project: p,
        start,
        end,
        color: STATUS_COLORS[p.status] || '#0090FF'
      };
    })
    .filter((r) => r !== null)
    .sort((a, b) => a.start - b.start);

  if (rows.length === 0) {
    return null;
  }

  const minTime = Math.min(...rows.map((r) => r.start), today);
  const maxTime = Math.max(...rows.map((r) => r.end), today);
  const span = Math.max(maxTime - minTime, DAY_MS);
  const pct = (t: number): number => clamp(((t - minTime) / span) * 100, 0, 100);

  const todayPct = pct(today);
  const gridLines = [0, 25, 50, 75, 100];

  return (
    <div className="bg-[#1B1E27] border border-[#2A2E38] rounded-[10px] overflow-hidden">
      {/* Chart Header + Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#171A21] border-b border-[#2A2E38]">
        <div>
          <h3 className="text-[15px] font-semibold text-white tracking-tight">Site Project Timeline — Gantt</h3>
          <p className="text-[11px] text-[#8D93A1] mt-0.5">
            Construction window of every site project from start date through today to target completion
          </p>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-[#8D93A1]">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0090FF]" />
            <span>Start</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FFAB00]" />
            <span>Current date</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full border-2 border-[#00D25B]" />
            <span>Target completion</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[880px] flex">
          {/* Fixed label column */}
          <div className="w-44 shrink-0 border-r border-[#2A2E38] bg-[#1B1E27]">
            <div className="h-10 flex items-center px-3 text-[10px] font-bold uppercase tracking-wider text-[#626875]">
              Site Project
            </div>
            {rows.map((r) => (
              <div key={r.project.id} className="h-11 flex items-center px-3 border-b border-[#2A2E38]/40">
                <div className="flex-1 min-w-0 truncate text-[12px] text-white">{r.project.name}</div>
                <div className="text-[9px] font-mono text-[#626875] whitespace-nowrap">
                  {new Date(r.start).toLocaleDateString([], { month: 'short', year: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
      {/* Timeline column */}
          <div className="flex-1 relative">
            {/* Header date chips */}
            <div className="relative h-10 border-b border-[#2A2E38] bg-[#171A21]">
              <span
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[10px] font-mono text-[#8D93A1] whitespace-nowrap"
                style={{ left: `${pct(minTime)}%` }}
              >
                ◀ {formatShort(minTime)}
              </span>
              <span
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[10px] font-mono text-[#FFAB00] whitespace-nowrap bg-[#FFAB00]/10 px-1.5 py-0.5 rounded-[3px]"
                style={{ left: `${todayPct}%` }}
              >
                ● Today · {formatShort(today)}
              </span>
              <span
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[10px] font-mono text-[#8D93A1] whitespace-nowrap"
                style={{ left: `${pct(maxTime)}%` }}
              >
                {formatShort(maxTime)} ▶
              </span>
            </div>

            {/* Grid + "today" vertical lines */}
            <div className="absolute top-10 bottom-0 left-0 right-0 pointer-events-none">
              {gridLines.map((g) => (
                <div key={g} className="absolute top-0 bottom-0 w-[1px] bg-[#2A2E38]/70" style={{ left: `${g}%` }} />
              ))}
              <div
                className="absolute top-0 bottom-0 w-[1px] bg-[#FFAB00]"
                style={{ left: `${todayPct}%` }}
              />
            </div>

            {/* Project bars */}
            {rows.map((r) => {
              const left = pct(r.start);
              const right = pct(r.end);
              const width = Math.max(right - left, 0.8);
              const elapsed = clamp(Math.round(((today - r.start) / (r.end - r.start)) * 100), 0, 100);
              const isComplete = today >= r.end;
              const notStarted = today < r.start;
              const barOpacity = notStarted ? 0.4 : 1;
              const elapsedWidth = isComplete
                ? width
                : notStarted
                  ? 0
                  : Math.max(pct(today) - left, 0);

              return (
                <div key={r.project.id} className="relative h-11 border-b border-[#2A2E38]/40">
                  <div className="absolute top-1 bottom-1 inset-x-0 bg-[#20232C] rounded-[4px]" />
                  <div
                    className="absolute top-1 bottom-1 rounded-[4px] overflow-hidden"
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${r.project.name}\n${formatShort(r.start)} → ${formatShort(r.end)}\n${elapsed}% elapsed`}
                  >
                    {elapsedWidth > 0 && (
                      <div
                        className="absolute top-0 bottom-0"
                        style={{ left: '0%', width: `${elapsedWidth}%`, backgroundColor: r.color, opacity: barOpacity }}
                      />
                    )}
                    <div
                      className="absolute top-0 bottom-0"
                      style={{
                        left: `${elapsedWidth}%`,
                        width: `${Math.max(width - elapsedWidth, 0)}%`,
                        backgroundColor: r.color,
                        opacity: barOpacity * 0.4
                      }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-white/80"
                      style={{ left: '0%', backgroundColor: r.color }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border-2 border-white/80"
                      style={{ right: '-1px', backgroundColor: r.color }}
                    />
                    {width > 14 && (
                      <span className="absolute top-1/2 -translate-y-1/2 left-3 text-[9px] font-mono text-white whitespace-nowrap">
                        {elapsed}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};