import { App, TFile, normalizePath } from 'obsidian';
import { ItemType, Priority, TaskStatus, Assignee, ReviewStatus, WorkstreamStatus } from './types';

function sanitizeFileName(title: string): string {
  return title
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
}

export async function openFileInObsidian(app: App, file: TFile, newLeaf = false) {
  const leaf = app.workspace.getLeaf(newLeaf);
  await leaf.openFile(file);
}

async function ensureDirectoryExists(app: App, dirPath: string): Promise<void> {
  const parts = normalizePath(dirPath).split('/');
  let current = '';
  for (const part of parts) {
    if (!part) continue;
    current = current ? `${current}/${part}` : part;
    if (!(await app.vault.adapter.exists(current))) {
      await app.vault.createFolder(current);
    }
  }
}

export async function updateTaskStatus(app: App, file: TFile, newStatus: TaskStatus): Promise<void> {
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm.status = newStatus;
    if (newStatus === 'done' && fm.review_status === 'pending') {
      fm.review_status = 'approved';
    }
  });
}

export async function updateTaskPriority(app: App, file: TFile, newPriority: Priority): Promise<void> {
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm.priority = newPriority;
  });
}

export async function updateTaskAssignee(app: App, file: TFile, newAssignee: Assignee): Promise<void> {
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm.assigned_to = newAssignee;
  });
}

export async function updateReviewStatus(app: App, file: TFile, reviewStatus: ReviewStatus): Promise<void> {
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm.review_status = reviewStatus;
    if (reviewStatus === 'approved') {
      fm.status = 'done';
    }
  });
}

export async function updateTaskWorkstream(app: App, file: TFile, newWorkstream: string | null): Promise<void> {
  const cleanWs = newWorkstream ? newWorkstream.replace(/[\[\]]/g, '').trim() : null;
  const formattedWs = cleanWs ? `[[${cleanWs}]]` : null;

  await app.fileManager.processFrontMatter(file, (fm) => {
    fm.workstream = formattedWs;
    delete fm.project;
  });

  let targetFolder = '10_Tasks';
  if (cleanWs) {
    targetFolder = `20_Workstreams/${cleanWs}/Tasks`;
  }

  await ensureDirectoryExists(app, targetFolder);
  const targetPath = normalizePath(`${targetFolder}/${file.name}`);
  if (file.path !== targetPath && !(await app.vault.adapter.exists(targetPath))) {
    await app.fileManager.renameFile(file, targetPath);
  }
}

export async function createWorkstreamScaffold(
  app: App,
  title: string,
  options: {
    priority?: Priority;
    target_date?: string | null;
    lead?: string;
    tags?: string[];
  } = {}
): Promise<TFile> {
  const cleanTitle = title.trim();
  const safeName = sanitizeFileName(cleanTitle) || 'Untitled-Workstream';
  const today = new Date().toISOString().split('T')[0];
  const workstreamDir = `20_Workstreams/${safeName}`;

  await ensureDirectoryExists(app, `${workstreamDir}/Tasks`);
  await ensureDirectoryExists(app, `${workstreamDir}/Notes`);

  // Create AGENTS.md
  const agentsPath = normalizePath(`${workstreamDir}/AGENTS.md`);
  if (!(await app.vault.adapter.exists(agentsPath))) {
    const agentsContent = `# 🤖 Agent Directives: ${cleanTitle}

## 🎭 Rolle & Persona
Du agierst in diesem Workstream als **Fachexperte & leitender Assistent** für: **${cleanTitle}**.

## 🎯 Hauptziele & Kontext
- **Primärziel:** 
- **Wichtige Qualitätskriterien & Leitplanken:** 

## 📋 Arbeitsregeln für KI-Agenten in diesem Ordner
1. **Task-Erstellung:** Speichere neue Tasks vorrangig in \`./Tasks/\` mit \`workstream: "[[${safeName}]]"\`.
2. **Wissensdokumentation:** Halte Mitschriften, Konzepte und Architekturentscheidungen in \`./Notes/\` fest.
3. **Review Queue:** Setze bei KI-erledigten Aufgaben \`assigned_to: agent\` und \`review_status: pending\`.
4. **Kontexttreue:** Beziehe dich vorrangig auf \`README.md\` und \`./Notes/\`.
`;
    await app.vault.create(agentsPath, agentsContent);
  }

  // Create README.md (Primary Workstream file)
  const readmePath = normalizePath(`${workstreamDir}/README.md`);
  const frontmatter = {
    type: 'workstream',
    title: cleanTitle,
    status: 'active',
    priority: options.priority || 'medium',
    target_date: options.target_date || null,
    created: today,
    lead: options.lead || 'user',
    tags: options.tags || [],
  };

  let yamlStr = '---\n';
  for (const [k, v] of Object.entries(frontmatter)) {
    if (Array.isArray(v)) {
      yamlStr += v.length === 0 ? `${k}: []\n` : `${k}:\n${v.map((item) => `  - ${item}`).join('\n')}\n`;
    } else if (v === null) {
      yamlStr += `${k}: null\n`;
    } else {
      yamlStr += `${k}: ${typeof v === 'string' && v.includes(':') ? `"${v}"` : v}\n`;
    }
  }
  yamlStr += '---\n\n';

  const bodyContent = `# 🏛️ ${cleanTitle}

## 🎯 Strategischer Kontext & Vision
Was soll mit diesem Workstream erreicht werden?

## 👥 Stakeholder & Rollen
- **Lead:** @${options.lead || 'user'}

## 🗺️ Meilensteine & Kernphasen
- [ ] Phase 1: Vorbereitung & Analyse
- [ ] Phase 2: Umsetzung
- [ ] Phase 3: Review & Rollout

## 📚 Verknüpfte Notizen & Ressourcen
- [[./Notes/]]

## ⚡ Aktive Tasks
- [[./Tasks/]]
`;

  if (await app.vault.adapter.exists(readmePath)) {
    return app.vault.getAbstractFileByPath(readmePath) as TFile;
  }
  return await app.vault.create(readmePath, yamlStr + bodyContent);
}

export async function createItem(
  app: App,
  type: ItemType,
  data: {
    title: string;
    priority?: Priority;
    workstream?: string | null;
    tags?: string[];
    category?: string;
    due?: string | null;
    assigned_to?: Assignee;
    content?: string;
  }
): Promise<TFile> {
  const today = new Date().toISOString().split('T')[0];
  const cleanTitle = data.title.trim();
  const safeName = sanitizeFileName(cleanTitle) || 'Untitled';

  if (type === 'workstream') {
    return await createWorkstreamScaffold(app, cleanTitle, {
      priority: data.priority,
      target_date: data.due,
      tags: data.tags,
    });
  }

  let folder = '00_Inbox';
  let frontmatterObj: Record<string, any> = {};
  let body = data.content || '';

  const cleanWs = data.workstream ? data.workstream.replace(/[\[\]]/g, '').trim() : null;
  const formattedWs = cleanWs ? `[[${cleanWs}]]` : null;

  if (type === 'task') {
    folder = cleanWs ? `20_Workstreams/${cleanWs}/Tasks` : '10_Tasks';
    frontmatterObj = {
      type: 'task',
      title: cleanTitle,
      status: 'todo',
      priority: data.priority || 'medium',
      workstream: formattedWs,
      due: data.due || null,
      created: today,
      tags: data.tags || [],
      assigned_to: data.assigned_to || 'user',
      review_status: null,
      agent_state: 'idle',
    };
    if (!body) {
      body = `\n## Subtasks\n- [ ] Erste Teilaufgabe\n`;
    }
  } else if (type === 'braindump') {
    folder = '00_Inbox';
    frontmatterObj = {
      type: 'braindump',
      title: cleanTitle,
      status: 'unprocessed',
      source: 'quick-capture',
      created: today,
      tags: data.tags || [],
      agent_state: 'idle',
    };
    if (!body) {
      body = `\n## Gedanken\n`;
    }
  } else if (type === 'note') {
    folder = cleanWs ? `20_Workstreams/${cleanWs}/Notes` : '30_Notes';
    frontmatterObj = {
      type: 'note',
      title: cleanTitle,
      category: data.category || 'general',
      workstream: formattedWs,
      created: today,
      updated: today,
      tags: data.tags || [],
      agent_state: 'idle',
    };
  }

  await ensureDirectoryExists(app, folder);

  // Check unique path
  let targetPath = normalizePath(`${folder}/${safeName}.md`);
  let counter = 1;
  while (await app.vault.adapter.exists(targetPath)) {
    targetPath = normalizePath(`${folder}/${safeName}-${counter}.md`);
    counter++;
  }

  // Build markdown string
  let yamlStr = '---\n';
  for (const [key, value] of Object.entries(frontmatterObj)) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        yamlStr += `${key}: []\n`;
      } else {
        yamlStr += `${key}:\n${value.map(v => `  - ${v}`).join('\n')}\n`;
      }
    } else if (value === null) {
      yamlStr += `${key}: null\n`;
    } else {
      yamlStr += `${key}: ${typeof value === 'string' && value.includes(':') ? `"${value}"` : value}\n`;
    }
  }
  yamlStr += '---\n\n' + body.trim() + '\n';

  return await app.vault.create(targetPath, yamlStr);
}

export async function convertBraindumpToTask(
  app: App,
  file: TFile,
  options: {
    title?: string;
    priority?: Priority;
    workstream?: string | null;
    due?: string | null;
  } = {}
): Promise<TFile> {
  const today = new Date().toISOString().split('T')[0];
  const cleanWs = options.workstream ? options.workstream.replace(/[\[\]]/g, '').trim() : null;
  const formattedWs = cleanWs ? `[[${cleanWs}]]` : null;

  await app.fileManager.processFrontMatter(file, (fm) => {
    fm.type = 'task';
    fm.status = 'todo';
    fm.priority = options.priority || 'medium';
    fm.workstream = formattedWs;
    delete fm.project;
    fm.due = options.due || null;
    fm.assigned_to = 'user';
    fm.review_status = null;
    fm.agent_state = 'idle';
    if (options.title) fm.title = options.title;
    if (!fm.created) fm.created = today;
  });

  let targetFolder = cleanWs ? `20_Workstreams/${cleanWs}/Tasks` : '10_Tasks';
  await ensureDirectoryExists(app, targetFolder);

  const targetPath = normalizePath(`${targetFolder}/${file.name}`);
  if (file.path !== targetPath && !(await app.vault.adapter.exists(targetPath))) {
    await app.fileManager.renameFile(file, targetPath);
  }
  return file;
}

export async function convertBraindumpToNote(
  app: App,
  file: TFile,
  options: {
    title?: string;
    category?: string;
    workstream?: string | null;
  } = {}
): Promise<TFile> {
  const today = new Date().toISOString().split('T')[0];
  const cleanWs = options.workstream ? options.workstream.replace(/[\[\]]/g, '').trim() : null;
  const formattedWs = cleanWs ? `[[${cleanWs}]]` : null;

  await app.fileManager.processFrontMatter(file, (fm) => {
    fm.type = 'note';
    fm.category = options.category || 'general';
    fm.workstream = formattedWs;
    delete fm.project;
    fm.updated = today;
    fm.agent_state = 'idle';
    if (options.title) fm.title = options.title;
    if (!fm.created) fm.created = today;
  });

  let targetFolder = cleanWs ? `20_Workstreams/${cleanWs}/Notes` : '30_Notes';
  await ensureDirectoryExists(app, targetFolder);

  const targetPath = normalizePath(`${targetFolder}/${file.name}`);
  if (file.path !== targetPath && !(await app.vault.adapter.exists(targetPath))) {
    await app.fileManager.renameFile(file, targetPath);
  }
  return file;
}

export async function archiveItem(app: App, file: TFile): Promise<void> {
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm.status = 'archived';
  });

  await ensureDirectoryExists(app, '40_Archive');
  const targetPath = normalizePath(`40_Archive/${file.name}`);
  if (file.path !== targetPath && !(await app.vault.adapter.exists(targetPath))) {
    await app.fileManager.renameFile(file, targetPath);
  }
}
