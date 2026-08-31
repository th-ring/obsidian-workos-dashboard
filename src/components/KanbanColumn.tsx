import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { App } from 'obsidian';
import { TaskItem, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: TaskItem[];
  color: string;
  icon?: React.ReactNode;
  app: App;
  onRefresh: () => void;
  onQuickAddTask: (status: TaskStatus) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  color,
  icon,
  app,
  onRefresh,
  onQuickAddTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: {
      type: 'column',
      status: id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full min-h-0 flex-1 min-w-[240px] bg-[var(--workos-col-bg)] rounded-2xl border transition-all duration-150 ${
        isOver
          ? 'border-[var(--workos-text-primary)]/40 bg-[var(--workos-col-bg)]'
          : 'border-[var(--workos-border)]'
      }`}
    >
      {/* Column Header (Pinned) */}
      <div className="shrink-0 flex items-center justify-between p-3 px-3.5 border-b border-[var(--workos-border)]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`} />
          <h3 className="font-semibold text-xs text-[var(--workos-text-primary)] tracking-tight">
            {title}
          </h3>
          <span className="text-[10px] text-[var(--workos-text-muted)] font-mono opacity-70">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onQuickAddTask(id)}
          className="p-1 rounded-md text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] hover:bg-[var(--workos-card-bg)] transition-colors"
          title={`Task zu ${title} hinzufügen`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Column Cards Container (Independently scrollable) */}
      <div className="flex-1 min-h-0 p-2 overflow-y-auto workos-custom-scroll">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <button
              onClick={() => onQuickAddTask(id)}
              className="w-full h-20 border border-dashed border-[var(--workos-border)] hover:border-[var(--workos-text-primary)]/40 hover:bg-[var(--workos-card-bg)] rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] transition-all group cursor-pointer"
              title={`Klicke hier, um einen Task in "${title}" zu erstellen`}
            >
              <Plus className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all text-[var(--workos-text-primary)]" />
              <span className="font-medium text-[11px]">Task hinzufügen</span>
            </button>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                app={app}
                onRefresh={onRefresh}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};
