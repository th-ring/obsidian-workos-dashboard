import React from 'react';
import { App } from 'obsidian';
import { WorkstreamItem, TaskItem, NoteItem } from '../types';
import { openFileInObsidian } from '../mutator';
import {
  FolderGit2,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  ExternalLink,
  Bot,
  BookOpen,
  Layers,
  Sparkles,
  FileCode,
} from 'lucide-react';

interface WorkstreamsViewProps {
  workstreams: WorkstreamItem[];
  tasks: TaskItem[];
  notes: NoteItem[];
  app: App;
  onRefresh: () => void;
  onQuickAddTask: (status: 'todo', workstreamWikilink: string) => void;
}

export const WorkstreamsView: React.FC<WorkstreamsViewProps> = ({
  workstreams,
  tasks,
  notes,
  app,
  onRefresh,
  onQuickAddTask,
}) => {
  const handleOpenAgentsDoc = async (ws: WorkstreamItem) => {
    const agentsPath = `${ws.folderPath}/AGENTS.md`;
    const file = app.vault.getAbstractFileByPath(agentsPath);
    if (file) {
      await openFileInObsidian(app, file as any);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto workos-custom-scroll space-y-4 pb-6">
      {/* Header Info */}
      <div className="flex items-center justify-between p-4 bg-obsidian-bgSecondary rounded-xl border border-obsidian-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-lg">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-obsidian-textNormal">
              Aktive Workstreams & Initiativen
            </h2>
            <p className="text-xs text-obsidian-textMuted">
              {workstreams.length} gekapselte(r) Workstream(s) in <span className="font-mono">20_Workstreams/</span>
            </p>
          </div>
        </div>
      </div>

      {workstreams.length === 0 ? (
        <div className="p-8 text-center bg-obsidian-bgSecondary/40 rounded-xl border border-dashed border-obsidian-border text-obsidian-textMuted text-xs">
          Noch keine Workstreams angelegt. Nutze die Omnibar oben, um einen neuen Workstream zu starten.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workstreams.map((ws) => {
            const wsSlug = ws.file.parent && ws.file.parent.name ? ws.file.parent.name : ws.file.basename;
            const wsTitle = ws.title;
            const wsPath = ws.file.path;

            const matchesWs = (ref?: string | null, filePath?: string) => {
              if (filePath && filePath.startsWith(ws.folderPath + '/')) return true;
              if (!ref) return false;
              const clean = ref.replace(/\[\[|\]\]/g, '').trim();
              return (
                clean === wsSlug ||
                clean === wsTitle ||
                clean === wsPath ||
                clean === `${wsSlug}/README` ||
                clean.toLowerCase() === wsSlug.toLowerCase()
              );
            };

            const wsTasks = tasks.filter((t) => matchesWs(t.workstream, t.file.path));
            const wsNotes = notes.filter((n) => matchesWs(n.workstream, n.file.path));

            const total = wsTasks.length;
            const completed = wsTasks.filter((t) => t.status === 'done').length;
            const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
            const priorityClass = `priority-badge-${ws.priority}`;

            return (
              <div
                key={ws.id}
                className="bg-obsidian-bgSecondary rounded-xl border border-obsidian-border p-4 flex flex-col justify-between shadow-sm hover:border-obsidian-accent/40 transition-colors"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          onClick={() => openFileInObsidian(app, ws.file)}
                          className="font-semibold text-base text-obsidian-textNormal hover:text-obsidian-accent cursor-pointer transition-colors"
                        >
                          {ws.title}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-obsidian-textMuted">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${priorityClass}`}
                        >
                          {ws.priority}
                        </span>

                        {ws.target_date && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Ziel: {ws.target_date}
                          </span>
                        )}

                        <span className="bg-obsidian-bgSecondaryAlt px-1.5 py-0.5 rounded text-[10px] uppercase font-medium">
                          {ws.status}
                        </span>

                        {/* Agents.md Badge */}
                        {ws.hasAgentsDoc ? (
                          <button
                            onClick={() => handleOpenAgentsDoc(ws)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/20 transition-colors"
                            title="AGENTS.md Richtlinien öffnen"
                          >
                            <Bot className="w-3 h-3 text-purple-400" /> AGENTS.md aktiv
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-zinc-500/10 text-zinc-400">
                            Keine AGENTS.md
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => openFileInObsidian(app, ws.file)}
                      className="text-obsidian-textMuted hover:text-obsidian-textNormal p-1"
                      title="Workstream README öffnen"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="my-3 p-3 bg-obsidian-bgPrimary rounded-lg border border-obsidian-border">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-medium text-obsidian-textMuted">Task-Fortschritt</span>
                      <span className="font-mono font-semibold text-emerald-400">
                        {progressPercent}% ({completed}/{total} Tasks)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-obsidian-bgSecondaryAlt rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-obsidian-textMuted mb-1">
                      <span>Zugehörige Aufgaben ({total})</span>
                      <button
                        onClick={() => onQuickAddTask('todo', `[[${wsSlug}]]`)}
                        className="inline-flex items-center gap-1 text-[11px] text-obsidian-accent hover:underline"
                      >
                        <Plus className="w-3 h-3" /> Task anlegen
                      </button>
                    </div>

                    {wsTasks.length === 0 ? (
                      <div className="text-xs text-obsidian-textMuted/60 italic py-1">
                        Noch keine Tasks mit diesem Workstream verknüpft.
                      </div>
                    ) : (
                      wsTasks.slice(0, 4).map((task) => (
                        <div
                          key={task.id}
                          onClick={() => openFileInObsidian(app, task.file)}
                          className="flex items-center justify-between p-2 rounded bg-obsidian-bgPrimary/60 hover:bg-obsidian-bgPrimary border border-obsidian-border/50 text-xs cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {task.status === 'done' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                            <span
                              className={`truncate ${
                                task.status === 'done'
                                  ? 'line-through text-obsidian-textMuted'
                                  : 'text-obsidian-textNormal'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-obsidian-textMuted shrink-0 ml-2">
                            {task.status}
                          </span>
                        </div>
                      ))
                    )}
                    {wsTasks.length > 4 && (
                      <div className="text-[11px] text-obsidian-textMuted text-right pt-0.5">
                        + {wsTasks.length - 4} weitere Tasks im Kanban Board
                      </div>
                    )}
                  </div>

                  {/* Notes & Context Section */}
                  {wsNotes.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-obsidian-border/60">
                      <span className="text-xs font-semibold text-obsidian-textMuted mb-1.5 block">
                        Kontext & Wissensnotizen ({wsNotes.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {wsNotes.slice(0, 3).map((n) => (
                          <span
                            key={n.id}
                            onClick={() => openFileInObsidian(app, n.file)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-obsidian-bgPrimary hover:bg-obsidian-hover border border-obsidian-border rounded text-[11px] text-obsidian-textNormal cursor-pointer truncate max-w-[200px]"
                            title={n.title}
                          >
                            <BookOpen className="w-3 h-3 text-purple-400 shrink-0" />
                            <span className="truncate">{n.title}</span>
                          </span>
                        ))}
                        {wsNotes.length > 3 && (
                          <span className="text-[10px] text-obsidian-textMuted self-center px-1">
                            +{wsNotes.length - 3} weitere
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
