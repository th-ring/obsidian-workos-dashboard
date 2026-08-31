import React, { useState, useEffect, useCallback } from 'react';
import { App } from 'obsidian';
import { VaultState, DashboardTab, TaskStatus, ItemType } from '../types';
import { parseVault } from '../parser';
import { QuickCaptureModal } from './QuickCaptureModal';
import { KanbanBoard } from './KanbanBoard';
import { InboxTriage } from './InboxTriage';
import { WorkstreamsView } from './WorkstreamsView';
import { AgentHub } from './AgentHub';
import { NotesView } from './NotesView';
import { StatsWidget } from './StatsWidget';
import {
  Kanban,
  Inbox,
  FolderGit2,
  Bot,
  BookOpen,
  BarChart3,
  RefreshCw,
  Sun,
  Moon,
  Plus,
} from 'lucide-react';

interface DashboardAppProps {
  app: App;
}

export const DashboardApp: React.FC<DashboardAppProps> = ({ app }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('kanban');
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [quickCaptureType, setQuickCaptureType] = useState<ItemType>('braindump');
  const [quickCaptureStatus, setQuickCaptureStatus] = useState<TaskStatus>('todo');

  const [state, setState] = useState<VaultState>({
    tasks: [],
    braindumps: [],
    workstreams: [],
    notes: [],
    isLoading: true,
  });

  const loadData = useCallback(async () => {
    try {
      const result = await parseVault(app);
      setState(result);
    } catch (err) {
      console.error('Failed to parse vault:', err);
    }
  }, [app]);

  useEffect(() => {
    loadData();

    // Live sync on any file change
    const modifyRef = app.vault.on('modify', () => loadData());
    const deleteRef = app.vault.on('delete', () => loadData());
    const createRef = app.vault.on('create', () => loadData());
    const renameRef = app.vault.on('rename', () => loadData());

    return () => {
      app.vault.offref(modifyRef);
      app.vault.offref(deleteRef);
      app.vault.offref(createRef);
      app.vault.offref(renameRef);
    };
  }, [app, loadData]);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.body.classList.contains('theme-dark');
  });

  useEffect(() => {
    const handleCssChange = () => {
      setIsDarkMode(document.body.classList.contains('theme-dark'));
    };
    app.workspace.on('css-change', handleCssChange);
  }, [app]);

  const toggleTheme = () => {
    const nextIsDark = !isDarkMode;
    setIsDarkMode(nextIsDark);

    if (nextIsDark) {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      try {
        (app.vault as any).setConfig?.('theme', 'obsidian');
        (app as any).setDarkMode?.('dark');
      } catch (e) {}
    } else {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      try {
        (app.vault as any).setConfig?.('theme', 'moonstone');
        (app as any).setDarkMode?.('light');
      } catch (e) {}
    }
    app.workspace.trigger('css-change');
  };

  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleOpenQuickCapture = (type: ItemType = 'braindump', status: TaskStatus = 'todo') => {
    setQuickCaptureType(type);
    setQuickCaptureStatus(status);
    setIsQuickCaptureOpen(true);
  };

  const handleQuickAddTask = (status: TaskStatus) => {
    handleOpenQuickCapture('task', status);
  };

  // Global UX Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (isQuickCaptureOpen) return;

      if (e.key === 'n' || e.key === 'N' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleOpenQuickCapture('braindump');
      } else if (e.key === '1') {
        e.preventDefault();
        setActiveTab('kanban');
      } else if (e.key === '2') {
        e.preventDefault();
        setActiveTab('inbox');
      } else if (e.key === '3') {
        e.preventDefault();
        setActiveTab('workstreams');
      } else if (e.key === '4') {
        e.preventDefault();
        setActiveTab('agents');
      } else if (e.key === '5') {
        e.preventDefault();
        setActiveTab('notes');
      } else if (e.key === '6') {
        e.preventDefault();
        setActiveTab('stats');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        loadData();
        showToast('Vault-Daten aktualisiert 🔄', 'info');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isQuickCaptureOpen, loadData]);

  const activeTasksCount = state.tasks.filter((t) => t.status !== 'archived').length;
  const unprocessedCount = state.braindumps.filter((b) => b.status === 'unprocessed').length;
  const pendingReviewCount = state.tasks.filter((t) => t.review_status === 'pending').length;

  return (
    <div className="workos-dashboard-root p-3 sm:p-4 flex flex-col h-full overflow-hidden">
      {/* Consolidated Top Bar: Brand, Action Controls & Segmented Navigation in ONE line */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 mb-2.5 pb-2 border-b border-[var(--workos-border)]">
        {/* Brand & Action Controls */}
        <div className="flex items-center gap-2 h-[36px]">
          <div className="flex items-center h-full mr-1.5 select-none">
            <div className="flex items-baseline tracking-[-0.06em] leading-none font-black text-[23px] uppercase">
              <span className="text-[var(--workos-text-primary)]">Work</span>
              <span className="text-[var(--workos-text-muted)] font-extrabold ml-[1px]">OS</span>
            </div>
          </div>

          {/* "+ Neu" Quick-Capture Button (Flat Style) */}
          <button
            onClick={() => handleOpenQuickCapture('braindump')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--workos-text-primary)] text-[var(--workos-canvas)] hover:opacity-90 transition-all h-[36px] shadow-xs cursor-pointer group"
            title="Neues Item erfassen (Shortcut: N)"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Neu</span>
            <kbd className="hidden sm:inline text-[9px] font-mono opacity-60 bg-current/20 px-1 py-0.2 rounded">
              N
            </kbd>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] rounded-xl hover:bg-[var(--workos-card-bg)] transition-colors h-[36px] w-[36px] flex items-center justify-center border border-[var(--workos-border)] bg-[var(--workos-tab-bg)] cursor-pointer"
            title={isDarkMode ? 'Zu Light Mode wechseln' : 'Zu Dark Mode wechseln'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Reload Data */}
          <button
            onClick={() => {
              loadData();
              showToast('Daten aktualisiert 🔄', 'info');
            }}
            className="text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] rounded-xl hover:bg-[var(--workos-card-bg)] transition-colors h-[36px] w-[36px] flex items-center justify-center border border-[var(--workos-border)] bg-[var(--workos-tab-bg)] cursor-pointer"
            title="Daten neu laden (Shortcut: R)"
          >
            <RefreshCw className={`w-4 h-4 ${state.isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Segmented Control Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[var(--workos-tab-bg)] p-1 rounded-xl border border-[var(--workos-border)] text-xs h-[36px]">
          {/* Tab: Kanban */}
          <button
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1 font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'kanban'
                ? 'workos-tab-active font-semibold'
                : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)]'
            }`}
          >
            <Kanban className="w-3.5 h-3.5 opacity-80" />
            <span>Kanban</span>
            <span className="text-[10px] opacity-60 font-mono">({activeTasksCount})</span>
          </button>

          {/* Tab: Inbox */}
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-1.5 px-3 py-1 font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'inbox'
                ? 'workos-tab-active font-semibold'
                : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)]'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 opacity-80" />
            <span>Inbox</span>
            {unprocessedCount > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] bg-white/10 text-[var(--workos-text-primary)] rounded font-semibold font-mono border border-[var(--workos-border)]">
                {unprocessedCount}
              </span>
            )}
          </button>

          {/* Tab: Workstreams */}
          <button
            onClick={() => setActiveTab('workstreams')}
            className={`flex items-center gap-1.5 px-3 py-1 font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'workstreams'
                ? 'workos-tab-active font-semibold'
                : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)]'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 opacity-80" />
            <span>Workstreams</span>
            <span className="text-[10px] opacity-60 font-mono">({state.workstreams.length})</span>
          </button>

          {/* Tab: Agent Hub */}
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-1.5 px-3 py-1 font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'agents'
                ? 'workos-tab-active font-semibold'
                : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)]'
            }`}
          >
            <Bot className="w-3.5 h-3.5 opacity-80" />
            <span>Agent Hub</span>
            {pendingReviewCount > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] bg-white/15 text-[var(--workos-text-primary)] rounded font-semibold font-mono border border-[var(--workos-border)]">
                {pendingReviewCount}
              </span>
            )}
          </button>

          {/* Tab: Notes */}
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1 font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'workos-tab-active font-semibold'
                : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 opacity-80" />
            <span>Notizen</span>
          </button>

          {/* Tab: Stats */}
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-2.5 py-1 font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'workos-tab-active font-semibold'
                : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)]'
            }`}
            title="Statistiken & Metriken"
          >
            <BarChart3 className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>

      {/* Main Tab Content Area (Viewport-locked) */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'kanban' && (
          <KanbanBoard
            tasks={state.tasks}
            workstreams={state.workstreams}
            app={app}
            onRefresh={loadData}
            onQuickAddTask={handleQuickAddTask}
          />
        )}

        {activeTab === 'inbox' && (
          <InboxTriage
            braindumps={state.braindumps}
            workstreams={state.workstreams}
            app={app}
            onRefresh={loadData}
            onOpenQuickCapture={() => handleOpenQuickCapture('braindump')}
          />
        )}

        {activeTab === 'workstreams' && (
          <WorkstreamsView
            workstreams={state.workstreams}
            tasks={state.tasks}
            notes={state.notes}
            app={app}
            onRefresh={loadData}
            onQuickAddTask={(status, wsLink) => {
              handleOpenQuickCapture('task', status);
            }}
          />
        )}

        {activeTab === 'agents' && (
          <AgentHub
            tasks={state.tasks}
            app={app}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'notes' && (
          <NotesView
            notes={state.notes}
            app={app}
          />
        )}

        {activeTab === 'stats' && (
          <StatsWidget state={state} />
        )}
      </div>

      {/* Quick Capture Popup Modal Dialog */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        app={app}
        workstreams={state.workstreams}
        onItemCreated={() => {
          loadData();
          showToast('Neues Item erfolgreich erstellt ✨', 'success');
        }}
        initialType={quickCaptureType}
        initialStatus={quickCaptureStatus}
      />

      {/* Toast Notification Micro-Interaction */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-3.5 py-2 bg-[var(--workos-card-bg)] border border-[var(--workos-border)] rounded-xl text-xs font-medium text-[var(--workos-text-primary)] shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--workos-text-primary)]" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
