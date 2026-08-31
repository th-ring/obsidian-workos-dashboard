import { App, TFile } from 'obsidian';
import { TaskItem, BraindumpItem, WorkstreamItem, NoteItem, VaultState, Priority, TaskStatus, Assignee, WorkstreamStatus } from './types';

export async function parseVault(app: App): Promise<VaultState> {
  const files = app.vault.getMarkdownFiles();
  const tasks: TaskItem[] = [];
  const braindumps: BraindumpItem[] = [];
  const rawWorkstreams: Omit<WorkstreamItem, 'totalTasks' | 'completedTasks' | 'totalNotes'>[] = [];
  const notes: NoteItem[] = [];

  for (const file of files) {
    // Ignore internal or template directories, or AGENTS.md directly
    if (
      file.path.startsWith('.') ||
      file.path.startsWith('_templates') ||
      file.path.startsWith('_schemas') ||
      file.path.startsWith('_agents') ||
      file.path.startsWith('node_modules') ||
      file.name.toUpperCase() === 'AGENTS.MD'
    ) {
      continue;
    }

    const cache = app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter || {};

    let itemType = fm.type;
    if (!itemType) {
      if (file.path.startsWith('10_Tasks/') || file.path.includes('/Tasks/')) itemType = 'task';
      else if (file.path.startsWith('00_Inbox/')) itemType = 'braindump';
      else if (file.path.startsWith('20_Workstreams/') || file.path.startsWith('20_Projects/')) {
        if (file.name === 'README.md' || file.parent?.path === '20_Workstreams' || file.parent?.path === '20_Projects') {
          itemType = 'workstream';
        }
      }
      else if (file.path.startsWith('30_Notes/') || file.path.includes('/Notes/')) itemType = 'note';
    }

    // Support legacy project type
    if (itemType === 'project') {
      itemType = 'workstream';
    }

    const title = fm.title || (file.name === 'README.md' && file.parent ? file.parent.name : file.basename);
    const tags: string[] = Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [];

    // Extract Workstream from frontmatter or parent path
    let workstreamRef: string | null = fm.workstream || fm.project || null;
    if (!workstreamRef && file.path.startsWith('20_Workstreams/')) {
      const parts = file.path.split('/');
      if (parts.length > 2) {
        workstreamRef = `[[${parts[1]}]]`;
      }
    }

    if (itemType === 'task') {
      // Extract people & department from tags, frontmatter, and content
      const peopleSet = new Set<string>();
      if (Array.isArray(fm.people)) {
        fm.people.forEach((p: string) => peopleSet.add(String(p).trim()));
      } else if (typeof fm.people === 'string') {
        peopleSet.add(fm.people.trim());
      }

      let department: string | null = fm.department || null;

      // Extract from tags (person/... and dept/...)
      tags.forEach((t) => {
        if (t.startsWith('person/')) {
          peopleSet.add(t.replace('person/', '').trim());
        } else if (t.startsWith('dept/')) {
          department = t.replace('dept/', '').trim();
        }
      });

      // Subtasks and mentions count from file content
      let subtaskTotal = 0;
      let subtaskCompleted = 0;
      try {
        const content = await app.vault.cachedRead(file);
        const matches = content.match(/^[\s]*-\s*\[([ xX])\]\s+(.+)$/gm);
        if (matches) {
          subtaskTotal = matches.length;
          subtaskCompleted = matches.filter(m => /-\s*\[[xX]\]/.test(m)).length;
        }

        // Extract @mentions from title & content
        const textToScan = `${title} ${content}`;
        const mentionMatches = textToScan.match(/@([a-zA-Z0-9äöüÄÖÜß_-]+)/g);
        if (mentionMatches) {
          mentionMatches.forEach((m) => peopleSet.add(m.substring(1).trim()));
        }

        // Extract [[Wikilinks]] as potential person mentions
        const cleanWs = workstreamRef ? workstreamRef.replace(/\[\[|\]\]/g, '').trim() : '';
        const wikilinkMatches = textToScan.match(/\[\[(.*?)\]\]/g);
        if (wikilinkMatches) {
          wikilinkMatches.forEach((w) => {
            const clean = w.replace(/\[\[|\]\]/g, '').trim();
            if (clean !== cleanWs && !clean.toLowerCase().includes('workstream') && !clean.toLowerCase().includes('project')) {
              if (clean.length < 30) peopleSet.add(clean);
            }
          });
        }
      } catch (e) {
        // Read fallback
      }

      tasks.push({
        id: file.path,
        file,
        title,
        type: 'task',
        status: (fm.status || 'todo') as TaskStatus,
        priority: (fm.priority || 'medium') as Priority,
        workstream: workstreamRef,
        due: fm.due || null,
        created: fm.created || undefined,
        tags,
        assigned_to: (fm.assigned_to || 'user') as Assignee,
        review_status: fm.review_status || null,
        subtaskTotal,
        subtaskCompleted,
        people: Array.from(peopleSet),
        department,
      });
    } else if (itemType === 'braindump') {
      braindumps.push({
        id: file.path,
        file,
        title,
        type: 'braindump',
        status: fm.status || 'unprocessed',
        source: fm.source || 'quick-capture',
        created: fm.created || undefined,
        tags,
      });
    } else if (itemType === 'workstream') {
      const folderPath = file.parent ? file.parent.path : file.path;
      const agentsFileExists = app.vault.getAbstractFileByPath(`${folderPath}/AGENTS.md`) !== null;

      rawWorkstreams.push({
        id: file.path,
        file,
        title,
        type: 'workstream',
        status: (fm.status || 'active') as WorkstreamStatus,
        priority: (fm.priority || 'medium') as Priority,
        target_date: fm.target_date || null,
        created: fm.created || undefined,
        lead: fm.lead || 'user',
        tags,
        hasAgentsDoc: agentsFileExists,
        folderPath,
      });
    } else if (itemType === 'note') {
      notes.push({
        id: file.path,
        file,
        title,
        type: 'note',
        category: fm.category || 'general',
        workstream: workstreamRef,
        created: fm.created || undefined,
        updated: fm.updated || undefined,
        tags,
      });
    }
  }

  // Calculate workstream statistics based on linked tasks and notes
  const workstreams: WorkstreamItem[] = rawWorkstreams.map(ws => {
    const wsSlug = ws.file.parent && ws.file.parent.name ? ws.file.parent.name : ws.file.basename;
    const wsTitle = ws.title;
    const wsPath = ws.file.path;

    const matchesWorkstream = (ref?: string | null, filePath?: string) => {
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

    const linkedTasks = tasks.filter(t => matchesWorkstream(t.workstream, t.file.path));
    const linkedNotes = notes.filter(n => matchesWorkstream(n.workstream, n.file.path));

    const totalTasks = linkedTasks.length;
    const completedTasks = linkedTasks.filter(t => t.status === 'done').length;
    const totalNotes = linkedNotes.length;

    return {
      ...ws,
      totalTasks,
      completedTasks,
      totalNotes,
    };
  });

  return {
    tasks,
    braindumps,
    workstreams,
    notes,
    isLoading: false,
  };
}
