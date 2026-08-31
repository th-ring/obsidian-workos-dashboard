import React, { useState } from 'react';
import { App } from 'obsidian';
import { NoteItem, NoteCategory } from '../types';
import { openFileInObsidian } from '../mutator';
import {
  FileText,
  Search,
  Tag,
  Clock,
  ExternalLink,
  BookOpen,
  Layers,
  Sparkles,
} from 'lucide-react';

interface NotesViewProps {
  notes: NoteItem[];
  app: App;
}

const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'all', label: 'Alle Kategorien', icon: '📁' },
  { id: 'architecture', label: 'Architecture', icon: '🏗️' },
  { id: 'concept', label: 'Concept', icon: '💡' },
  { id: 'meeting', label: 'Meeting', icon: '👥' },
  { id: 'reference', label: 'Reference', icon: '📚' },
  { id: 'snippet', label: 'Snippet', icon: '✂️' },
  { id: 'general', label: 'General', icon: '📝' },
];

export const NotesView: React.FC<NotesViewProps> = ({ notes, app }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredNotes = notes.filter((n) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchTags = n.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchTags) return false;
    }

    if (selectedCategory !== 'all' && n.category !== selectedCategory) {
      return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto workos-custom-scroll space-y-4 pb-6">
      {/* Header Info */}
      <div className="flex items-center justify-between p-4 bg-obsidian-bgSecondary rounded-xl border border-obsidian-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/15 text-purple-400 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-obsidian-textNormal">
              Wissensnotizen & Dokumente
            </h2>
            <p className="text-xs text-obsidian-textMuted">
              {notes.length} Notiz(en) in <span className="font-mono">30_Notes/</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-obsidian-bgSecondary rounded-xl border border-obsidian-border">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-textMuted pointer-events-none" />
          <input
            type="text"
            placeholder="Wissensnotizen durchsuchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
            className="w-full workos-search-input pr-3 py-1.5 text-xs bg-obsidian-bgPrimary border border-obsidian-border rounded-lg text-obsidian-textNormal placeholder-obsidian-textMuted focus:outline-none focus:border-obsidian-accent"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-medium'
                  : 'bg-obsidian-bgPrimary text-obsidian-textMuted border border-obsidian-border hover:text-obsidian-textNormal'
              }`}
            >
              <span className="mr-1">{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="p-8 text-center bg-obsidian-bgSecondary/40 rounded-xl border border-dashed border-obsidian-border text-obsidian-textMuted text-xs">
          Keine Notizen gefunden.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => openFileInObsidian(app, note.file)}
              className="p-4 bg-obsidian-bgSecondary rounded-xl border border-obsidian-border hover:border-obsidian-accent/50 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {note.category}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-obsidian-textMuted" />
                </div>

                <h3 className="font-medium text-sm text-obsidian-textNormal mb-2 line-clamp-2">
                  {note.title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-obsidian-border/50 text-xs text-obsidian-textMuted">
                {note.created && (
                  <span className="inline-flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" /> {note.created}
                  </span>
                )}

                {note.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-0.5 bg-obsidian-bgSecondaryAlt px-1.5 py-0.5 rounded text-[10px]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
