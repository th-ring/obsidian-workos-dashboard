import React, { useState } from 'react';
import { App } from 'obsidian';
import { ItemType, Priority, Assignee, WorkstreamItem } from '../types';
import { createItem } from '../mutator';
import {
  Plus,
  CornerDownLeft,
} from 'lucide-react';

interface OmnibarProps {
  app: App;
  workstreams: WorkstreamItem[];
  onItemCreated: () => void;
  defaultType?: ItemType;
}

export const Omnibar: React.FC<OmnibarProps> = ({
  app,
  workstreams,
  onItemCreated,
  defaultType = 'braindump',
}) => {
  const [type, setType] = useState<ItemType>(defaultType);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [workstream, setWorkstream] = useState<string>('');
  const [assignee, setAssignee] = useState<Assignee>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch (err) {
      console.error('Failed to create item:', err);
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
    <div className="bg-[var(--workos-card-bg)] border border-[var(--workos-border)] rounded-2xl p-2 px-3 shadow-sm mb-3 transition-all focus-within:border-[#10a37e]/60 focus-within:ring-1 focus-within:ring-[#10a37e]/20">
      <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
        {/* Leading Quick-Add Icon */}
        <Plus className="w-3.5 h-3.5 text-[var(--workos-text-muted)] shrink-0 opacity-60" />

        {/* Input Field */}
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={getPlaceholder()}
            className="w-full py-1 text-xs bg-transparent border-0 text-[var(--workos-text-primary)] placeholder-[var(--workos-text-muted)]/60 focus:outline-none"
          />
        </div>

        {/* Type Selector (Pills) */}
        <div className="flex items-center gap-0.5 bg-[var(--workos-input-bg)] p-0.5 rounded-xl border border-[var(--workos-border)] shrink-0">
          <button
            type="button"
            onClick={() => setType('braindump')}
            className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${
              type === 'braindump'
                ? 'bg-[var(--workos-tab-active)] text-amber-400 font-semibold shadow-xs'
                : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)]'
            }`}
          >
            Inbox
          </button>

          <button
            type="button"
            onClick={() => setType('task')}
            className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${
              type === 'task'
                ? 'bg-[var(--workos-tab-active)] text-blue-400 font-semibold shadow-xs'
                : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)]'
            }`}
          >
            Task
          </button>

          <button
            type="button"
            onClick={() => setType('workstream')}
            className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${
              type === 'workstream'
                ? 'bg-[var(--workos-tab-active)] text-emerald-400 font-semibold shadow-xs'
                : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)]'
            }`}
          >
            Workstream
          </button>

          <button
            type="button"
            onClick={() => setType('note')}
            className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${
              type === 'note'
                ? 'bg-[var(--workos-tab-active)] text-purple-400 font-semibold shadow-xs'
                : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)]'
            }`}
          >
            Notiz
          </button>
        </div>

        {/* Inline Task Options */}
        {type === 'task' && (
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {/* Priority Mini Select */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="px-2 py-1 text-[11px] bg-[var(--workos-input-bg)] border border-[var(--workos-border)] rounded-lg text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Med</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            {/* Workstream Mini Select */}
            {workstreams.length > 0 && (
              <select
                value={workstream}
                onChange={(e) => setWorkstream(e.target.value)}
                className="px-2 py-1 text-[11px] bg-[var(--workos-input-bg)] border border-[var(--workos-border)] rounded-lg text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] focus:outline-none max-w-[110px] truncate cursor-pointer"
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
            )}
          </div>
        )}

        {/* Submit Enter Indicator */}
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#10a37e] text-white hover:bg-[#0e8e6d] disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 shadow-xs cursor-pointer"
          title="Erstellen (Enter ↵)"
        >
          <Plus className="w-3.5 h-3.5" />
          <CornerDownLeft className="w-3 h-3 opacity-80 hidden sm:inline" />
        </button>
      </form>
    </div>
  );
};
