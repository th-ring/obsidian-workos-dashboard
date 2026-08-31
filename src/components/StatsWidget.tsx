import React from 'react';
import { VaultState } from '../types';
import {
  BarChart3,
  CheckCircle2,
  Inbox,
  FolderGit2,
  BookOpen,
  Bot,
  Zap,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface StatsWidgetProps {
  state: VaultState;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ state }) => {
  const { tasks, braindumps, workstreams, notes } = state;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const blockedTasks = tasks.filter((t) => t.status === 'blocked').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;
  const backlogTasks = tasks.filter((t) => t.status === 'backlog').length;

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const unprocessedInbox = braindumps.filter((b) => b.status === 'unprocessed').length;

  const agentTasks = tasks.filter((t) => t.assigned_to === 'agent').length;
  const hybridTasks = tasks.filter((t) => t.assigned_to === 'hybrid').length;
  const userTasks = tasks.filter((t) => t.assigned_to === 'user').length;

  const urgentCount = tasks.filter((t) => t.priority === 'urgent').length;
  const highCount = tasks.filter((t) => t.priority === 'high').length;
  const mediumCount = tasks.filter((t) => t.priority === 'medium').length;
  const lowCount = tasks.filter((t) => t.priority === 'low').length;

  return (
    <div className="flex flex-col h-full overflow-y-auto workos-custom-scroll space-y-4 pb-6">
      {/* Header Info */}
      <div className="flex items-center justify-between p-4 bg-obsidian-bgSecondary rounded-xl border border-obsidian-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/15 text-blue-400 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-obsidian-textNormal">
              WorkOS Metriken & Statistiken
            </h2>
            <p className="text-xs text-obsidian-textMuted">
              Gesamtübersicht über Aufgaben, Durchsatz, Workstreams und Wissensstand.
            </p>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1 */}
        <div className="p-4 bg-obsidian-bgSecondary rounded-xl border border-obsidian-border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-obsidian-textMuted uppercase tracking-wider">
              Completion Rate
            </span>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {completionRate}%
            </div>
            <span className="text-[10px] text-obsidian-textMuted">
              {doneTasks} von {totalTasks} Tasks erledigt
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 bg-obsidian-bgSecondary rounded-xl border border-obsidian-border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-obsidian-textMuted uppercase tracking-wider">
              Offene Inbox
            </span>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
              {unprocessedInbox}
            </div>
            <span className="text-[10px] text-obsidian-textMuted">
              Braindumps zu triagieren
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 bg-obsidian-bgSecondary rounded-xl border border-obsidian-border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-obsidian-textMuted uppercase tracking-wider">
              Aktive Workstreams
            </span>
            <div className="text-2xl font-bold text-sky-400 font-mono mt-1">
              {workstreams.filter((ws) => ws.status === 'active').length}
            </div>
            <span className="text-[10px] text-obsidian-textMuted">
              von {workstreams.length} Workstreams gesamt
            </span>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <FolderGit2 className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 bg-obsidian-bgSecondary rounded-xl border border-obsidian-border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-obsidian-textMuted uppercase tracking-wider">
              Wissensnotizen
            </span>
            <div className="text-2xl font-bold text-purple-400 font-mono mt-1">
              {notes.length}
            </div>
            <span className="text-[10px] text-obsidian-textMuted">
              im permanenten Speicher
            </span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Status Distribution + Priority Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <div className="bg-obsidian-bgSecondary rounded-xl border border-obsidian-border p-4">
          <h3 className="text-sm font-semibold text-obsidian-textNormal mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Task Status Verteilung
          </h3>

          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between text-obsidian-textMuted mb-1">
                <span>In Progress</span>
                <span className="font-mono font-semibold text-amber-400">{inProgressTasks}</span>
              </div>
              <div className="h-2 bg-obsidian-bgPrimary rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${totalTasks ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-obsidian-textMuted mb-1">
                <span>To Do</span>
                <span className="font-mono font-semibold text-blue-400">{todoTasks}</span>
              </div>
              <div className="h-2 bg-obsidian-bgPrimary rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full"
                  style={{ width: `${totalTasks ? (todoTasks / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-obsidian-textMuted mb-1">
                <span>Backlog</span>
                <span className="font-mono font-semibold text-zinc-400">{backlogTasks}</span>
              </div>
              <div className="h-2 bg-obsidian-bgPrimary rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-400 rounded-full"
                  style={{ width: `${totalTasks ? (backlogTasks / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-obsidian-textMuted mb-1">
                <span>Blocked</span>
                <span className="font-mono font-semibold text-rose-400">{blockedTasks}</span>
              </div>
              <div className="h-2 bg-obsidian-bgPrimary rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${totalTasks ? (blockedTasks / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-obsidian-textMuted mb-1">
                <span>Done</span>
                <span className="font-mono font-semibold text-emerald-400">{doneTasks}</span>
              </div>
              <div className="h-2 bg-obsidian-bgPrimary rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${totalTasks ? (doneTasks / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Priority & Assignee Breakdown */}
        <div className="bg-obsidian-bgSecondary rounded-xl border border-obsidian-border p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-obsidian-textNormal mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              Prioritäten-Aufteilung
            </h3>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-rose-500/10 rounded-lg border border-rose-500/20">
                <div className="text-[10px] uppercase font-semibold text-rose-400">Urgent</div>
                <div className="text-base font-bold font-mono text-rose-300 mt-0.5">{urgentCount}</div>
              </div>
              <div className="p-2.5 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <div className="text-[10px] uppercase font-semibold text-orange-400">High</div>
                <div className="text-base font-bold font-mono text-orange-300 mt-0.5">{highCount}</div>
              </div>
              <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="text-[10px] uppercase font-semibold text-amber-400">Medium</div>
                <div className="text-base font-bold font-mono text-amber-300 mt-0.5">{mediumCount}</div>
              </div>
              <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-[10px] uppercase font-semibold text-blue-400">Low</div>
                <div className="text-base font-bold font-mono text-blue-300 mt-0.5">{lowCount}</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-obsidian-border">
            <h4 className="text-xs font-semibold text-obsidian-textNormal mb-2 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              Zuständigkeiten (Agent vs Human)
            </h4>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-purple-400">
                <Bot className="w-3.5 h-3.5" /> Agent: <strong>{agentTasks}</strong>
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <Zap className="w-3.5 h-3.5" /> Hybrid: <strong>{hybridTasks}</strong>
              </span>
              <span className="flex items-center gap-1 text-obsidian-textMuted">
                👤 User: <strong>{userTasks}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
