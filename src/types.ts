import { TFile } from 'obsidian';

export type ItemType = 'task' | 'braindump' | 'workstream' | 'note';

export type TaskStatus = 'inbox' | 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'done' | 'archived';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Assignee = 'user' | 'agent' | 'hybrid';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | null;

export type WorkstreamStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type NoteCategory = 'architecture' | 'concept' | 'meeting' | 'reference' | 'snippet' | 'general';
export type BraindumpStatus = 'unprocessed' | 'triaged' | 'archived';

export interface BaseItem {
  id: string; // file.path
  file: TFile;
  title: string;
  type: ItemType;
  created?: string;
  tags: string[];
  rawContent?: string;
}

export interface TaskItem extends BaseItem {
  type: 'task';
  status: TaskStatus;
  priority: Priority;
  workstream?: string | null;
  due?: string | null;
  assigned_to: Assignee;
  review_status?: ReviewStatus;
  subtaskTotal: number;
  subtaskCompleted: number;
  people: string[];
  department?: string | null;
}

export interface BraindumpItem extends BaseItem {
  type: 'braindump';
  status: BraindumpStatus;
  source: string;
}

export interface WorkstreamItem extends BaseItem {
  type: 'workstream';
  status: WorkstreamStatus;
  priority: Priority;
  target_date?: string | null;
  lead: string;
  totalTasks: number;
  completedTasks: number;
  totalNotes: number;
  hasAgentsDoc: boolean;
  folderPath: string;
}

export interface NoteItem extends BaseItem {
  type: 'note';
  category: NoteCategory;
  workstream?: string | null;
  updated?: string | null;
}

export interface VaultState {
  tasks: TaskItem[];
  braindumps: BraindumpItem[];
  workstreams: WorkstreamItem[];
  notes: NoteItem[];
  isLoading: boolean;
}

export type DashboardTab = 'kanban' | 'inbox' | 'workstreams' | 'agents' | 'notes' | 'stats';
export type KanbanViewMode = 'columns' | 'swimlanes';

export interface FilterOptions {
  search: string;
  workstreams: string[];
  priorities: Priority[];
  assignees: Assignee[];
  tags: string[];
  people: string[];
  departments: string[];
}
