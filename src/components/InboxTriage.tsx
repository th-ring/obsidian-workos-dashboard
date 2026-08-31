import React, { useState } from 'react';
import { App } from 'obsidian';
import { BraindumpItem, WorkstreamItem, Priority } from '../types';
import {
  convertBraindumpToTask,
  convertBraindumpToNote,
  archiveItem,
  openFileInObsidian,
} from '../mutator';
import {
  Inbox,
  CheckSquare,
  FileText,
  Archive,
  ExternalLink,
  Tag,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface InboxTriageProps {
  braindumps: BraindumpItem[];
  workstreams: WorkstreamItem[];
  app: App;
  onRefresh: () => void;
  onOpenQuickCapture?: () => void;
}

export const InboxTriage: React.FC<InboxTriageProps> = ({
  braindumps,
  workstreams,
  app,
  onRefresh,
  onOpenQuickCapture,
}) => {
  const [selectedItem, setSelectedItem] = useState<BraindumpItem | null>(null);
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskWorkstream, setTaskWorkstream] = useState<string>('');
  const [taskDue, setTaskDue] = useState<string>('');
  const [noteCategory, setNoteCategory] = useState<string>('general');
  const [isProcessing, setIsProcessing] = useState(false);

  const unprocessedItems = braindumps.filter((b) => b.status === 'unprocessed');

  const handleConvertToTask = async (item: BraindumpItem) => {
    setIsProcessing(true);
    try {
      await convertBraindumpToTask(app, item.file, {
        priority: taskPriority,
        workstream: taskWorkstream ? `[[${taskWorkstream}]]` : null,
        due: taskDue || null,
      });
      setSelectedItem(null);
      onRefresh();
    } catch (e) {
      console.error('Error converting to task:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertToNote = async (item: BraindumpItem) => {
    setIsProcessing(true);
    try {
      await convertBraindumpToNote(app, item.file, {
        category: noteCategory,
        workstream: taskWorkstream ? `[[${taskWorkstream}]]` : null,
      });
      setSelectedItem(null);
      onRefresh();
    } catch (e) {
      console.error('Error converting to note:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async (item: BraindumpItem) => {
    setIsProcessing(true);
    try {
      await archiveItem(app, item.file);
      setSelectedItem(null);
      onRefresh();
    } catch (e) {
      console.error('Error archiving item:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Info */}
      <div className="shrink-0 flex items-center justify-between p-3.5 mb-3 bg-[var(--workos-col-bg)] rounded-xl border border-[var(--workos-border)]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--workos-card-bg)] text-[var(--workos-text-primary)] rounded-lg border border-[var(--workos-border)]">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--workos-text-primary)]">
              Inbox Triage Desk
            </h2>
            <p className="text-[11px] text-[var(--workos-text-muted)]">
              {unprocessedItems.length} unverarbeitete(r) Braindump(s) in <span className="font-mono">00_Inbox/</span>
            </p>
          </div>
        </div>

        {onOpenQuickCapture && (
          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--workos-card-bg)] hover:bg-[var(--workos-card-hover)] text-[var(--workos-text-primary)] border border-[var(--workos-border)] transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Neuer Gedanke</span>
          </button>
        )}
      </div>

      {unprocessedItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--workos-col-bg)] rounded-2xl border border-dashed border-[var(--workos-border)]">
          <div className="w-12 h-12 rounded-2xl bg-[var(--workos-card-bg)] flex items-center justify-center text-[var(--workos-text-primary)] mb-3 border border-[var(--workos-border)]">
            <Sparkles className="w-5 h-5 opacity-70" />
          </div>
          <h3 className="text-base font-bold text-[var(--workos-text-primary)] mb-1">
            Inbox Zero erreicht! 🎉
          </h3>
          <p className="text-xs text-[var(--workos-text-muted)] max-w-sm mb-4">
            Alle Braindumps und Notizen wurden triagiert oder erledigt. Dein System ist aufgeräumt.
          </p>
          {onOpenQuickCapture && (
            <button
              onClick={onOpenQuickCapture}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--workos-text-primary)] text-[var(--workos-canvas)] hover:opacity-90 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Gedanken erfassen (N)</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0 overflow-y-auto workos-custom-scroll pb-2">
          {/* List of Inbox Items */}
          <div className="flex flex-col gap-2 overflow-y-auto workos-custom-scroll pr-1">
            {unprocessedItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`workos-card p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[var(--workos-text-primary)] ring-1 ring-[var(--workos-text-primary)]/20 shadow-md bg-[var(--workos-card-bg)]'
                      : 'border-[var(--workos-border)] hover:border-[var(--workos-border-hover)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="font-medium text-[13px] text-[var(--workos-text-primary)] leading-snug">
                      {item.title}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openFileInObsidian(app, item.file);
                      }}
                      className="text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] p-1 rounded hover:bg-[var(--workos-col-bg)]"
                      title="In Obsidian öffnen"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--workos-text-muted)]">
                    {item.created && (
                      <span className="inline-flex items-center gap-1 opacity-70">
                        <Clock className="w-3 h-3" /> {item.created}
                      </span>
                    )}
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 bg-[var(--workos-col-bg)] px-1.5 py-0.5 rounded text-[10px] font-mono border border-[var(--workos-border)]"
                      >
                        <Tag className="w-2.5 h-2.5 opacity-60" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action / Triage Panel */}
          <div className="sticky top-0 bg-[var(--workos-card-bg)] p-4 rounded-xl border border-[var(--workos-border)] flex flex-col justify-between h-fit shadow-xs">
            {selectedItem ? (
              <div className="space-y-3.5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--workos-text-muted)]">
                    Ausgewähltes Item
                  </span>
                  <h3 className="text-sm font-bold text-[var(--workos-text-primary)] mt-0.5">
                    {selectedItem.title}
                  </h3>
                </div>

                {/* Primary Action: Convert to Task */}
                <div className="p-3 bg-[var(--workos-col-bg)] rounded-xl border border-[var(--workos-border)] space-y-2.5">
                  <span className="text-xs font-semibold text-[var(--workos-text-primary)] flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 opacity-80" /> Als Task einplanen
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-[var(--workos-text-muted)] mb-1">
                        Priorität
                      </label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as Priority)}
                        className="w-full px-2 py-1 bg-[var(--workos-input-bg)] border border-[var(--workos-border)] rounded-lg text-xs text-[var(--workos-text-primary)] focus:outline-none cursor-pointer"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[var(--workos-text-muted)] mb-1">
                        Workstream
                      </label>
                      <select
                        value={taskWorkstream}
                        onChange={(e) => setTaskWorkstream(e.target.value)}
                        className="w-full px-2 py-1 bg-[var(--workos-input-bg)] border border-[var(--workos-border)] rounded-lg text-xs text-[var(--workos-text-primary)] focus:outline-none cursor-pointer"
                      >
                        <option value="">Kein Workstream</option>
                        {workstreams.map((ws) => {
                          const wsSlug = ws.file.parent && ws.file.parent.name ? ws.file.parent.name : ws.file.basename;
                          return (
                            <option key={ws.id} value={wsSlug}>
                              {ws.title}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleConvertToTask(selectedItem)}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[var(--workos-text-primary)] text-[var(--workos-canvas)] hover:opacity-90 rounded-lg font-semibold text-xs transition-opacity shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <span>In Task umwandeln</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </div>

                {/* Secondary Action: Convert to Note */}
                <div className="p-3 bg-[var(--workos-col-bg)] rounded-xl border border-[var(--workos-border)] space-y-2">
                  <span className="text-xs font-semibold text-[var(--workos-text-primary)] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 opacity-80" /> Als Wissensnotiz ablegen
                  </span>

                  <button
                    onClick={() => handleConvertToNote(selectedItem)}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[var(--workos-input-bg)] hover:bg-[var(--workos-card-hover)] border border-[var(--workos-border)] text-[var(--workos-text-primary)] rounded-lg font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <span>In Notiz umwandeln</span>
                  </button>
                </div>

                {/* Tertiary: Archive */}
                <button
                  onClick={() => handleArchive(selectedItem)}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] hover:bg-[var(--workos-col-bg)] rounded-lg font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5 opacity-70" />
                  <span>Archivieren (Verwerfen)</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-[var(--workos-text-muted)]">
                <ArrowRight className="w-6 h-6 mb-2 opacity-40 rotate-180 md:rotate-0" />
                <p className="text-xs font-medium">Wähle links ein Item aus, um es zu triagieren.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
