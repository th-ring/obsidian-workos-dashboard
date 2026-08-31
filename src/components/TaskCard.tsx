import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { App } from 'obsidian';
import { TaskItem } from '../types';
import { openFileInObsidian, updateTaskStatus } from '../mutator';
import {
  Calendar,
  Check,
  FolderGit2,
  Bot,
  AlertCircle,
  GripVertical,
} from 'lucide-react';

interface TaskCardProps {
  task: TaskItem;
  app: App;
  onRefresh: () => void;
}

const PRIORITY_DOTS: Record<string, { color: string; label: string }> = {
  urgent: { color: 'bg-rose-500', label: 'Urgent' },
  high: { color: 'bg-orange-500', label: 'High' },
  medium: { color: 'bg-amber-400', label: 'Medium' },
  low: { color: 'bg-blue-400', label: 'Low' },
};

function formatCompactDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const monthIdx = parseInt(parts[1], 10) - 1;
    return `${parseInt(parts[2], 10)}. ${months[monthIdx] || parts[1]}`;
  }
  return dateStr;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, app, onRefresh }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag-click')) return;
    openFileInObsidian(app, task.file);
  };

  const handleToggleDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTaskStatus(app, task.file, nextStatus);
    onRefresh();
  };

  const cleanProject = task.project ? task.project.replace(/\[\[|\]\]/g, '').trim() : null;
  const priorityInfo = PRIORITY_DOTS[task.priority] || PRIORITY_DOTS.medium;
  const formattedDate = formatCompactDate(task.due);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={`workos-card group relative p-3 rounded-xl cursor-pointer select-none mb-2 ${
        isDragging ? 'workos-card-dragging' : ''
      }`}
    >
      {/* Top Row: Checkbox + Title + Priority Dot + Drag Handle */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <button
            onClick={handleToggleDone}
            className={`no-drag-click w-4 h-4 rounded-[5px] border mt-0.5 shrink-0 flex items-center justify-center transition-all cursor-pointer ${
              task.status === 'done'
                ? 'bg-[var(--workos-text-primary)] border-[var(--workos-text-primary)] text-[var(--workos-canvas)] shadow-xs'
                : 'border-[var(--workos-border)] hover:border-[var(--workos-text-primary)]/50 bg-[var(--workos-input-bg)] hover:bg-[var(--workos-col-bg)]'
            }`}
            title={task.status === 'done' ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
          >
            {task.status === 'done' && (
              <Check className="w-2.5 h-2.5 stroke-[3.5]" />
            )}
          </button>

          <h4
            className={`text-[12.5px] font-medium leading-snug line-clamp-2 tracking-tight ${
              task.status === 'done'
                ? 'line-through text-[var(--workos-text-muted)] opacity-60'
                : 'text-[var(--workos-text-primary)]'
            }`}
          >
            {task.title}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 mt-1">
          {/* Priority Micro Dot */}
          <span
            className={`w-2 h-2 rounded-full ${priorityInfo.color}`}
            title={`Priorität: ${priorityInfo.label}`}
          />

          {/* Drag Handle (Hover only) */}
          <div
            {...attributes}
            {...listeners}
            className="text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] cursor-grab active:cursor-grabbing p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Ziehen"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Meta Row: Project, Tags, People, Date, Subtasks */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--workos-text-muted)] mt-2.5 pt-2 border-t border-[var(--workos-border)]">
        {cleanProject && (
          <span
            className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] transition-colors truncate max-w-[130px]"
            title={`Projekt: ${cleanProject}`}
          >
            <FolderGit2 className="w-3 h-3 opacity-60 shrink-0" />
            <span className="truncate">{cleanProject}</span>
          </span>
        )}

        {task.department && (
          <span className="inline-flex items-center text-[10px] text-[var(--workos-text-muted)] bg-[var(--workos-col-bg)] px-1.5 py-0.5 rounded font-mono border border-[var(--workos-border)]">
            {task.department}
          </span>
        )}

        {task.people && task.people.length > 0 && (
          <div className="flex items-center gap-1">
            {task.people.map((p) => (
              <span
                key={p}
                className="inline-flex items-center text-[10px] text-[var(--workos-text-muted)] bg-[var(--workos-col-bg)] px-1.5 py-0.5 rounded font-medium border border-[var(--workos-border)]"
              >
                @{p}
              </span>
            ))}
          </div>
        )}

        {formattedDate && (
          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--workos-text-muted)] ml-auto">
            <Calendar className="w-3 h-3 opacity-60" />
            {formattedDate}
          </span>
        )}

        {task.assigned_to === 'agent' && (
          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--workos-text-muted)] bg-[var(--workos-col-bg)] px-1.5 py-0.5 rounded font-medium border border-[var(--workos-border)] ml-auto">
            <Bot className="w-3 h-3 opacity-70" />
            Agent
          </span>
        )}

        {task.review_status === 'pending' && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded font-medium">
            <AlertCircle className="w-3 h-3" /> Review
          </span>
        )}

        {task.subtasks && task.subtasks.total > 0 && (
          <div className="w-full mt-2 pt-1 flex items-center justify-between text-[10px] text-[var(--workos-text-muted)]">
            <div className="w-28 bg-[var(--workos-input-bg)] h-1 rounded-full overflow-hidden border border-[var(--workos-border)]">
              <div
                className="bg-[var(--workos-text-muted)] h-full rounded-full transition-all"
                style={{
                  width: `${(task.subtasks.completed / task.subtasks.total) * 100}%`,
                }}
              />
            </div>
            <span className="font-mono">
              {task.subtasks.completed}/{task.subtasks.total}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
