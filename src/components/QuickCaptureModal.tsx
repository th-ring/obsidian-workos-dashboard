import React, { useState, useEffect, useRef } from 'react';
import { App } from 'obsidian';
import { ItemType, Priority, Assignee, WorkstreamItem, TaskStatus } from '../types';
import { createItem } from '../mutator';
import {
  X,
  Plus,
  Lightbulb,
  CheckSquare,
  FolderGit2,
  FileText,
  CornerDownLeft,
  Calendar,
  User,
  Tag,
} from 'lucide-react';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: App;
  workstreams: WorkstreamItem[];
  onItemCreated: () => void;
  initialType?: ItemType;
  initialStatus?: TaskStatus;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  app,
  workstreams,
  onItemCreated,
  initialType = 'braindump',
  initialStatus = 'todo',
}) => {
  const [type, setType] = useState<ItemType>(initialType);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [workstream, setWorkstream] = useState<string>('');
  const [assignee, setAssignee] = useState<Assignee>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setTitle('');
      setPriority('medium');
      setWorkstream('');
      setAssignee('user');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const tagMatches = title.match(/#([a-zA-Z0-9äöüÄÖÜß_/-]+)/g) || [];
      const cleanTags = tagMatches.map((t) => t.substring(1));

      const mentionMatches = title.match(/@([a-zA-Z0-9äöüÄÖÜß_-]+)/g) || [];
      mentionMatches.forEach((m) => {
        const name = m.substring(1);
        cleanTags.push(`person/${name.toLowerCase()}`);
      });

      const cleanTitle = title.replace(/#([a-zA-Z0-9äöüÄÖÜß_/-]+)/g, '').trim();

      await createItem(app, type, {
        title: cleanTitle || title.trim(),
        priority,
        workstream: workstream ? `[[${workstream}]]` : null,
        tags: Array.from(new Set(cleanTags)),
        assigned_to: assignee,
      });

      setTitle('');
      onItemCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create item via modal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'braindump':
        return 'Gedanken oder Idee erfassen... (z. B. Sprachmemos transkribieren #ai)';
      case 'task':
        return 'Aufgabe erfassen... (z. B. Budget mit @Stefan abstimmen #finance)';
      case 'workstream':
        return 'Neuen Workstream anlegen... (z. B. Cloud-Migration-2026)';
      case 'note':
        return 'Wissensnotiz erfassen... (z. B. API Best Practices #docs)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Modal Dialog Box */}
      <div
        className="w-full max-w-lg bg-[var(--workos-card-bg)] border border-[var(--workos-border)] rounded-2xl shadow-2xl overflow-hidden transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Type Pills & Close */}
        <div className="flex items-center justify-between p-3.5 px-4 border-b border-[var(--workos-border)] bg-[var(--workos-col-bg)]">
          {/* Segmented Type Selector (Monochrome Flat) */}
          <div className="flex items-center gap-1 bg-[var(--workos-input-bg)] p-1 rounded-xl border border-[var(--workos-border)] text-xs">
            <button
              type="button"
              onClick={() => setType('braindump')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg text-xs transition-all ${
                type === 'braindump'
                  ? 'bg-[var(--workos-text-primary)] text-[var(--workos-canvas)] shadow-xs'
                  : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] hover:bg-[var(--workos-card-bg)]'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 opacity-80" />
              <span>Inbox</span>
            </button>

            <button
              type="button"
              onClick={() => setType('task')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg text-xs transition-all ${
                type === 'task'
                  ? 'bg-[var(--workos-text-primary)] text-[var(--workos-canvas)] shadow-xs'
                  : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] hover:bg-[var(--workos-card-bg)]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 opacity-80" />
              <span>Task</span>
            </button>

            <button
              type="button"
              onClick={() => setType('workstream')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg text-xs transition-all ${
                type === 'workstream'
                  ? 'bg-[var(--workos-text-primary)] text-[var(--workos-canvas)] shadow-xs'
                  : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] hover:bg-[var(--workos-card-bg)]'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5 opacity-80" />
              <span>Workstream</span>
            </button>

            <button
              type="button"
              onClick={() => setType('note')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg text-xs transition-all ${
                type === 'note'
                  ? 'bg-[var(--workos-text-primary)] text-[var(--workos-canvas)] shadow-xs'
                  : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] hover:bg-[var(--workos-card-bg)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 opacity-80" />
              <span>Notiz</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] rounded-lg hover:bg-[var(--workos-card-hover)] transition-colors cursor-pointer"
            title="Schließen (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* Main Title Input */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full px-3.5 py-2.5 text-sm bg-[var(--workos-input-bg)] border border-[var(--workos-border)] rounded-xl text-[var(--workos-text-primary)] placeholder-[var(--workos-text-muted)]/60 focus:outline-none focus:border-[var(--workos-text-primary)]/40 font-medium"
            />
          </div>

          {/* Contextual Options for Tasks */}
          {type === 'task' && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {/* Priority Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--workos-text-muted)] font-medium">Priorität:</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="px-2.5 py-1.5 bg-[var(--workos-input-bg)] border border-[var(--workos-border)] rounded-lg text-[var(--workos-text-primary)] focus:outline-none cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Workstream Select */}
              {workstreams.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[var(--workos-text-muted)] font-medium">Workstream:</span>
                  <select
                    value={workstream}
                    onChange={(e) => setWorkstream(e.target.value)}
                    className="px-2.5 py-1.5 bg-[var(--workos-input-bg)] border border-[var(--workos-border)] rounded-lg text-[var(--workos-text-primary)] focus:outline-none max-w-[150px] truncate cursor-pointer"
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
              )}

              {/* Assignee Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--workos-text-muted)] font-medium">Zuständig:</span>
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value as Assignee)}
                  className="px-2.5 py-1.5 bg-[var(--workos-input-bg)] border border-[var(--workos-border)] rounded-lg text-[var(--workos-text-primary)] focus:outline-none cursor-pointer"
                >
                  <option value="user">User</option>
                  <option value="agent">Agent</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          )}

          {/* Contextual Options for Workstreams */}
          {type === 'workstream' && (
            <div className="p-2.5 rounded-xl bg-[var(--workos-col-bg)] border border-[var(--workos-border)] text-xs text-[var(--workos-text-muted)]">
              🚀 Erstellt automatisch den Ordner <span className="font-mono text-[var(--workos-text-primary)]">20_Workstreams/&lt;Titel&gt;/</span> inklusive <span className="font-mono text-purple-300">README.md</span>, <span className="font-mono text-purple-300">AGENTS.md</span>, <span className="font-mono">Tasks/</span> und <span className="font-mono">Notes/</span>.
            </div>
          )}

          {/* Footer with Shortcuts and Create Button */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--workos-border)]">
            <div className="flex items-center gap-2 text-[11px] text-[var(--workos-text-muted)]">
              <span>Tipp: <span className="font-mono text-[10px] bg-[var(--workos-input-bg)] px-1.5 py-0.5 rounded border border-[var(--workos-border)]">#tags</span> und <span className="font-mono text-[10px] bg-[var(--workos-input-bg)] px-1.5 py-0.5 rounded border border-[var(--workos-border)]">@person</span> im Titel</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] rounded-lg transition-colors cursor-pointer"
              >
                Abbrechen (Esc)
              </button>

              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--workos-text-primary)] text-[var(--workos-canvas)] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
              >
                <span>Erstellen</span>
                <CornerDownLeft className="w-3 h-3 opacity-80" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
