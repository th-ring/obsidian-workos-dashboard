import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { App } from 'obsidian';
import { TaskItem, TaskStatus, FilterOptions, WorkstreamItem, Priority, Assignee, KanbanViewMode } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { MultiSelectFilterDropdown, FilterOptionItem } from './MultiSelectFilterDropdown';
import { updateTaskStatus, openFileInObsidian } from '../mutator';
import {
  Search,
  RotateCcw,
  Columns,
  Rows,
  FolderGit2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Bot,
} from 'lucide-react';

interface KanbanBoardProps {
  tasks: TaskItem[];
  workstreams: WorkstreamItem[];
  app: App;
  onRefresh: () => void;
  onQuickAddTask: (status: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'bg-zinc-400' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-400' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-amber-400' },
  { id: 'blocked', title: 'Blocked', color: 'bg-rose-500' },
  { id: 'done', title: 'Done', color: 'bg-emerald-400' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  workstreams,
  app,
  onRefresh,
  onQuickAddTask,
}) => {
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [viewMode, setViewMode] = useState<KanbanViewMode>('columns');
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Record<string, boolean>>({});

  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    workstreams: [],
    priorities: [],
    assignees: [],
    tags: [],
    people: [],
    departments: [],
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Extract all unique tags, people, and departments
  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags)));
  const allPeople = Array.from(new Set(tasks.flatMap((t) => t.people || [])));
  const allDepartments = Array.from(
    new Set(
      tasks
        .map((t) => t.department)
        .filter((d): d is string => typeof d === 'string' && d.length > 0)
    )
  );

  // Filter tasks (Multi-select)
  const filteredTasks = tasks.filter((task) => {
    if (task.status === 'archived') return false;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchTags = task.tags.some((t) => t.toLowerCase().includes(q));
      const matchPeople = task.people?.some((p) => p.toLowerCase().includes(q));
      if (!matchTitle && !matchTags && !matchPeople) return false;
    }

    if (filters.workstreams.length > 0) {
      const cleanWs = task.workstream ? task.workstream.replace(/\[\[|\]\]/g, '').trim() : '';
      if (!filters.workstreams.some(w => cleanWs === w || cleanWs.startsWith(w + '/') || task.file.path.includes(`/20_Workstreams/${w}/`))) {
        return false;
      }
    }

    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
      return false;
    }

    if (filters.assignees.length > 0 && !filters.assignees.includes(task.assigned_to)) {
      return false;
    }

    if (filters.tags.length > 0 && !task.tags.some((t) => filters.tags.includes(t))) {
      return false;
    }

    if (filters.people.length > 0 && !task.people?.some((p) => filters.people.includes(p))) {
      return false;
    }

    if (filters.departments.length > 0 && (!task.department || !filters.departments.includes(task.department))) {
      return false;
    }

    return true;
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const draggedTask = tasks.find((t) => t.id === activeTaskId);
    if (!draggedTask) return;

    let targetStatus: TaskStatus | null = null;

    const overData = over.data?.current;
    if (overData && overData.type === 'column') {
      targetStatus = overData.status as TaskStatus;
    } else if (overData && overData.type === 'task') {
      targetStatus = overData.task.status as TaskStatus;
    } else {
      const foundCol = COLUMNS.find((c) => c.id === over.id || String(over.id).endsWith(`-${c.id}`));
      if (foundCol) targetStatus = foundCol.id;
    }

    if (targetStatus && targetStatus !== draggedTask.status) {
      await updateTaskStatus(app, draggedTask.file, targetStatus);
      onRefresh();
    }
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.workstreams.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assignees.length > 0 ||
    filters.tags.length > 0 ||
    filters.people.length > 0 ||
    filters.departments.length > 0;

  const clearAllFilters = () => {
    setFilters({
      search: '',
      workstreams: [],
      priorities: [],
      assignees: [],
      tags: [],
      people: [],
      departments: [],
    });
  };

  const toggleSwimlane = (key: string) => {
    setCollapsedSwimlanes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Option Lists for MultiSelectDropdowns
  const workstreamOptions: FilterOptionItem<string>[] = workstreams.map((ws) => {
    const wsSlug = ws.file.parent && ws.file.parent.name ? ws.file.parent.name : ws.file.basename;
    const count = tasks.filter((t) => {
      const cw = t.workstream ? t.workstream.replace(/\[\[|\]\]/g, '').trim() : '';
      return cw === wsSlug || cw === ws.title || t.file.path.startsWith(ws.folderPath + '/');
    }).length;
    return {
      value: wsSlug,
      label: ws.title,
      count,
    };
  });

  const priorityOptions: FilterOptionItem<Priority>[] = [
    {
      value: 'urgent',
      label: 'Urgent',
      icon: <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />,
      count: tasks.filter((t) => t.priority === 'urgent').length,
    },
    {
      value: 'high',
      label: 'High',
      icon: <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />,
      count: tasks.filter((t) => t.priority === 'high').length,
    },
    {
      value: 'medium',
      label: 'Medium',
      icon: <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />,
      count: tasks.filter((t) => t.priority === 'medium').length,
    },
    {
      value: 'low',
      label: 'Low',
      icon: <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />,
      count: tasks.filter((t) => t.priority === 'low').length,
    },
  ];

  const assigneeOptions: FilterOptionItem<Assignee>[] = [
    {
      value: 'user',
      label: 'User',
      count: tasks.filter((t) => t.assigned_to === 'user').length,
    },
    {
      value: 'agent',
      label: 'Agent',
      count: tasks.filter((t) => t.assigned_to === 'agent').length,
    },
    {
      value: 'hybrid',
      label: 'Hybrid',
      count: tasks.filter((t) => t.assigned_to === 'hybrid').length,
    },
  ];

  const peopleOptions: FilterOptionItem<string>[] = allPeople.map((person) => ({
    value: person,
    label: `@${person}`,
    count: tasks.filter((t) => t.people?.includes(person)).length,
  }));

  const departmentOptions: FilterOptionItem<string>[] = allDepartments.map((dept) => ({
    value: dept,
    label: dept,
    count: tasks.filter((t) => t.department === dept).length,
  }));

  const tagOptions: FilterOptionItem<string>[] = allTags.map((tag) => ({
    value: tag,
    label: `#${tag}`,
    count: tasks.filter((t) => t.tags.includes(tag)).length,
  }));

  // Helper to match tasks with workstreams for swimlane grouping
  const getTasksForWorkstream = (ws: WorkstreamItem) => {
    const wsSlug = ws.file.parent && ws.file.parent.name ? ws.file.parent.name : ws.file.basename;
    return filteredTasks.filter((t) => {
      if (t.file.path.startsWith(ws.folderPath + '/')) return true;
      if (!t.workstream) return false;
      const clean = t.workstream.replace(/\[\[|\]\]/g, '').trim();
      return clean === wsSlug || clean === ws.title || clean === `${wsSlug}/README`;
    });
  };

  const adHocTasks = filteredTasks.filter((t) => {
    if (!t.workstream) return true;
    const clean = t.workstream.replace(/\[\[|\]\]/g, '').trim();
    const matched = workstreams.some((ws) => {
      const wsSlug = ws.file.parent && ws.file.parent.name ? ws.file.parent.name : ws.file.basename;
      return clean === wsSlug || clean === ws.title || t.file.path.startsWith(ws.folderPath + '/');
    });
    return !matched;
  });

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Compact Minimal Filter Bar with Multi-Select Popovers & View Toggle */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 p-1.5 px-2 mb-2 bg-[var(--workos-col-bg)] rounded-xl border border-[var(--workos-border)]">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--workos-text-muted)] pointer-events-none opacity-60" />
          <input
            type="text"
            placeholder="Tasks filtern... (Esc)"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setFilters({ ...filters, search: '' });
            }}
            style={{ paddingLeft: '2rem' }}
            className="w-full workos-search-input pr-2.5 py-1 text-xs bg-[var(--workos-input-bg)] border border-[var(--workos-border)] rounded-lg text-[var(--workos-text-primary)] placeholder-[var(--workos-text-muted)]/60 focus:outline-none focus:border-[var(--workos-text-primary)]/40"
          />
        </div>

        {/* Multi-Select Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Workstreams Multi-Select */}
          {workstreams.length > 0 && (
            <MultiSelectFilterDropdown
              label="Workstreams"
              selected={filters.workstreams}
              options={workstreamOptions}
              onChange={(selected) => setFilters({ ...filters, workstreams: selected })}
            />
          )}

          {/* Priority Multi-Select */}
          <MultiSelectFilterDropdown
            label="Priorität"
            selected={filters.priorities}
            options={priorityOptions}
            onChange={(selected) => setFilters({ ...filters, priorities: selected })}
          />

          {/* Assignee Multi-Select */}
          <MultiSelectFilterDropdown
            label="Zuständig"
            selected={filters.assignees}
            options={assigneeOptions}
            onChange={(selected) => setFilters({ ...filters, assignees: selected })}
          />

          {/* People Multi-Select */}
          {allPeople.length > 0 && (
            <MultiSelectFilterDropdown
              label="Personen"
              selected={filters.people}
              options={peopleOptions}
              onChange={(selected) => setFilters({ ...filters, people: selected })}
            />
          )}

          {/* Department Multi-Select */}
          {allDepartments.length > 0 && (
            <MultiSelectFilterDropdown
              label="Abteilungen"
              selected={filters.departments}
              options={departmentOptions}
              onChange={(selected) => setFilters({ ...filters, departments: selected })}
            />
          )}

          {/* Tags Multi-Select */}
          {allTags.length > 0 && (
            <MultiSelectFilterDropdown
              label="Tags"
              selected={filters.tags}
              options={tagOptions}
              onChange={(selected) => setFilters({ ...filters, tags: selected })}
            />
          )}

          {/* Reset All Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] hover:bg-[var(--workos-card-bg)] rounded-lg border border-[var(--workos-border)] transition-colors cursor-pointer"
              title="Alle Filter zurücksetzen"
            >
              <RotateCcw className="w-3 h-3 opacity-70" />
              <span>Zurücksetzen</span>
            </button>
          )}

          {/* View Mode Toggle: Standard Columns vs Swimlanes */}
          <div className="flex items-center bg-[var(--workos-input-bg)] border border-[var(--workos-border)] rounded-lg p-0.5 ml-1">
            <button
              onClick={() => setViewMode('columns')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                viewMode === 'columns'
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                  : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)]'
              }`}
              title="Klassische Spaltenansicht"
            >
              <Columns className="w-3.5 h-3.5" /> Spalten
            </button>
            <button
              onClick={() => setViewMode('swimlanes')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                viewMode === 'swimlanes'
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                  : 'text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)]'
              }`}
              title="Nach Workstreams gruppieren (Swimlanes)"
            >
              <Rows className="w-3.5 h-3.5" /> Swimlanes
            </button>
          </div>
        </div>
      </div>

      {/* Main Board Area */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {viewMode === 'columns' ? (
          /* Standard Columns Mode */
          <div className="flex-1 min-h-0 flex gap-2.5 overflow-x-auto pb-1 workos-custom-scroll">
            {COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);
              return (
                <KanbanColumn
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  color={col.color}
                  tasks={colTasks}
                  app={app}
                  onRefresh={onRefresh}
                  onQuickAddTask={onQuickAddTask}
                />
              );
            })}
          </div>
        ) : (
          /* Swimlanes Mode: Grouped by Workstream */
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-4 workos-custom-scroll pr-1">
            {workstreams.map((ws) => {
              const wsTasks = getTasksForWorkstream(ws);
              if (filters.workstreams.length > 0 && wsTasks.length === 0) return null;
              const isCollapsed = Boolean(collapsedSwimlanes[ws.id]);
              const completedCount = wsTasks.filter((t) => t.status === 'done').length;
              const totalCount = wsTasks.length;
              const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div
                  key={ws.id}
                  className="bg-[var(--workos-col-bg)] rounded-xl border border-[var(--workos-border)] overflow-hidden shadow-sm"
                >
                  {/* Swimlane Header */}
                  <div className="flex items-center justify-between p-2.5 px-3 bg-[var(--workos-col-header-bg)] border-b border-[var(--workos-border)]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSwimlane(ws.id)}
                        className="text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)]"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <FolderGit2 className="w-4 h-4 text-emerald-400" />
                      <span
                        onClick={() => openFileInObsidian(app, ws.file)}
                        className="font-semibold text-xs text-[var(--workos-text-primary)] hover:underline cursor-pointer"
                      >
                        {ws.title}
                      </span>

                      {ws.hasAgentsDoc && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-purple-500/15 text-purple-300">
                          <Bot className="w-2.5 h-2.5" /> AGENTS.md
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--workos-text-muted)]">
                      <span className="font-mono text-[11px] text-emerald-400">
                        {percent}% ({completedCount}/{totalCount} Tasks)
                      </span>
                      <button
                        onClick={() => openFileInObsidian(app, ws.file)}
                        className="p-1 hover:text-[var(--workos-text-primary)]"
                        title="Workstream öffnen"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Swimlane Columns Content */}
                  {!isCollapsed && (
                    <div className="p-2.5 grid grid-cols-1 md:grid-cols-5 gap-2.5">
                      {COLUMNS.map((col) => {
                        const colTasks = wsTasks.filter((t) => t.status === col.id);
                        return (
                          <KanbanColumn
                            key={`${ws.id}-${col.id}`}
                            id={col.id}
                            title={col.title}
                            color={col.color}
                            tasks={colTasks}
                            app={app}
                            onRefresh={onRefresh}
                            onQuickAddTask={onQuickAddTask}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ad-hoc / Global Tasks Swimlane */}
            {adHocTasks.length > 0 && (
              <div className="bg-[var(--workos-col-bg)] rounded-xl border border-[var(--workos-border)] overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-2.5 px-3 bg-[var(--workos-col-header-bg)] border-b border-[var(--workos-border)]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSwimlane('adhoc')}
                      className="text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)]"
                    >
                      {collapsedSwimlanes['adhoc'] ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <span className="font-semibold text-xs text-[var(--workos-text-primary)]">
                      🌐 Globale & Ad-hoc Aufgaben ({adHocTasks.length})
                    </span>
                  </div>
                </div>

                {!collapsedSwimlanes['adhoc'] && (
                  <div className="p-2.5 grid grid-cols-1 md:grid-cols-5 gap-2.5">
                    {COLUMNS.map((col) => {
                      const colTasks = adHocTasks.filter((t) => t.status === col.id);
                      return (
                        <KanbanColumn
                          key={`adhoc-${col.id}`}
                          id={col.id}
                          title={col.title}
                          color={col.color}
                          tasks={colTasks}
                          app={app}
                          onRefresh={onRefresh}
                          onQuickAddTask={onQuickAddTask}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DragOverlay>
          {activeTask ? (
            <div className="w-[280px] shadow-2xl opacity-90 rotate-1">
              <TaskCard task={activeTask} app={app} onRefresh={onRefresh} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
