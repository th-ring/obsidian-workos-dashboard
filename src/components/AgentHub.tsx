import React, { useState, useEffect } from "react";
import { App, Notice } from "obsidian";
import { TaskItem } from "../types";
import { updateReviewStatus, openFileInObsidian } from "../mutator";
import {
  Bot,
  CheckCheck,
  Clock,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Terminal,
  ShieldCheck,
  FileCode,
  Zap,
  Cpu,
} from "lucide-react";

interface AgentHubProps {
  tasks: TaskItem[];
  app: App;
  onRefresh: () => void;
}

export const AgentHub: React.FC<AgentHubProps> = ({ tasks, app, onRefresh }) => {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [hasAgentSuite, setHasAgentSuite] = useState<boolean>(false);

  useEffect(() => {
    // Check if WorkOS Agent Suite plugin is loaded and registered
    const isSuiteAvailable = !!(window as any).WorkOSAgentSuite;
    setHasAgentSuite(isSuiteAvailable);
  }, []);

  const agentTasks = tasks.filter(
    (t) => t.assigned_to === "agent" || t.assigned_to === "hybrid"
  );
  const reviewQueue = tasks.filter((t) => t.review_status === "pending");

  const handleApprove = async (task: TaskItem) => {
    await updateReviewStatus(app, task.file, "approved");
    onRefresh();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(id);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const triggerInboxTriage = () => {
    if ((window as any).WorkOSAgentSuite?.triageInbox) {
      (window as any).WorkOSAgentSuite.triageInbox();
    } else {
      new Notice("WorkOS Agent Suite Plugin ist nicht aktiv.");
    }
  };

  const triageAgentPrompt = `Lies alle unverarbeiteten Notizen in "00_Inbox/" und führe die Triage gemäß ".agents/triage_workflow.md" durch. Erstelle für handlungsrelevante Ideen atomare Tasks in "10_Tasks/" oder im zugehörigen Workstream-Ordner in "20_Workstreams/" mit passendem YAML-Frontmatter.`;

  const decompositionPrompt = `Analysiere die Tasks in "10_Tasks/" und den Workstream-Ordnern mit status "todo" oder "in_progress". Ergänze im Notiz-Body strukturierte Subtasks (- [ ]) gemäß ".agents/task_decomposition.md".`;

  return (
    <div className="flex flex-col h-full overflow-y-auto workos-custom-scroll space-y-5 pb-6">
      {/* Header Info */}
      <div className="flex items-center justify-between p-4 bg-obsidian-bgSecondary rounded-xl border border-obsidian-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/15 text-purple-400 rounded-lg">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-obsidian-textNormal">
                Agent Hub & KI-Steuerzentrale
              </h2>
              {hasAgentSuite ? (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Suite Verbunden
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-zinc-500/10 text-zinc-400 text-[10px] rounded-full border border-zinc-500/20">
                  Prompt-Modus
                </span>
              )}
            </div>
            <p className="text-xs text-obsidian-textMuted">
              Verwalte 1-Klick KI-Aktionen, die menschliche Review Queue und Agent-Aufgaben.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 text-xs font-semibold rounded-lg border border-purple-500/20">
            {agentTasks.length} Agent-Tasks
          </span>
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/20">
            {reviewQueue.length} Reviews
          </span>
        </div>
      </div>

      {/* 1-Click AI Actions Bar (When Suite is available) */}
      <div className="p-4 bg-gradient-to-r from-purple-950/30 to-indigo-950/30 rounded-xl border border-purple-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 text-purple-300 rounded-lg">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-purple-200">
              Autonome KI-Aktionen (WorkOS Agent Suite)
            </h3>
            <p className="text-[11px] text-purple-300/70">
              Starte Triage und Analysen mit 1 Klick über deine konfigurierte Engine.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerInboxTriage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Inbox jetzt triagieren
          </button>
        </div>
      </div>

      {/* Section 1: Review Queue */}
      {reviewQueue.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-300">
              Menschliche Freigabe erforderlich (Review Queue)
            </h3>
          </div>

          <div className="space-y-2">
            {reviewQueue.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-obsidian-bgPrimary/80 rounded-lg border border-obsidian-border"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Bot className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="truncate">
                    <span
                      onClick={() => openFileInObsidian(app, task.file)}
                      className="text-xs font-medium text-obsidian-textNormal hover:text-obsidian-accent cursor-pointer truncate block"
                    >
                      {task.title}
                    </span>
                    <span className="text-[10px] text-obsidian-textMuted font-mono">
                      Status: {task.status} | Priorität: {task.priority}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openFileInObsidian(app, task.file)}
                    className="p-1.5 text-obsidian-textMuted hover:text-obsidian-textNormal text-xs rounded hover:bg-obsidian-hover transition-colors"
                    title="Notiz prüfen"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleApprove(task)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Freigeben & Done
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Agent Assigned Tasks */}
      <div className="bg-obsidian-bgSecondary rounded-xl border border-obsidian-border p-4">
        <h3 className="text-sm font-semibold text-obsidian-textNormal mb-3 flex items-center gap-2">
          <Bot className="w-4 h-4 text-purple-400" />
          Alle KI-zugewiesenen Aufgaben
        </h3>

        {agentTasks.length === 0 ? (
          <div className="p-6 text-center text-xs text-obsidian-textMuted">
            Aktuell sind keine Tasks mit <span className="font-mono">assigned_to: agent</span> markiert.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agentTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 bg-obsidian-bgPrimary rounded-lg border border-obsidian-border flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      onClick={() => openFileInObsidian(app, task.file)}
                      className="text-xs font-semibold text-obsidian-textNormal hover:text-obsidian-accent cursor-pointer"
                    >
                      {task.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-obsidian-bgSecondaryAlt text-obsidian-textMuted">
                      {task.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-obsidian-border/50 text-[11px] text-obsidian-textMuted">
                  <span className="capitalize">{task.priority} Priority</span>
                  <button
                    onClick={() => openFileInObsidian(app, task.file)}
                    className="text-obsidian-accent hover:underline inline-flex items-center gap-0.5"
                  >
                    Öffnen <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Agent Command & Workflow Prompts */}
      <div className="bg-obsidian-bgSecondary rounded-xl border border-obsidian-border p-4">
        <h3 className="text-sm font-semibold text-obsidian-textNormal mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          Agentic Playbook Prompts (Manuelle Zwischenablage)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Prompt 1 */}
          <div className="p-3 bg-obsidian-bgPrimary rounded-lg border border-obsidian-border flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold text-obsidian-textNormal mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Inbox Triage Prompt
              </h4>
              <p className="text-[11px] text-obsidian-textMuted font-mono bg-obsidian-bgSecondary p-2 rounded border border-obsidian-border/50 mb-3">
                {triageAgentPrompt}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(triageAgentPrompt, "triage")}
              className="flex items-center justify-center gap-1.5 py-1.5 bg-obsidian-bgSecondary hover:bg-obsidian-hover border border-obsidian-border rounded text-xs font-medium text-obsidian-textNormal transition-colors"
            >
              {copiedPrompt === "triage" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Prompt kopieren
                </>
              )}
            </button>
          </div>

          {/* Prompt 2 */}
          <div className="p-3 bg-obsidian-bgPrimary rounded-lg border border-obsidian-border flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold text-obsidian-textNormal mb-1 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" /> Task Decomposition Prompt
              </h4>
              <p className="text-[11px] text-obsidian-textMuted font-mono bg-obsidian-bgSecondary p-2 rounded border border-obsidian-border/50 mb-3">
                {decompositionPrompt}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(decompositionPrompt, "decomp")}
              className="flex items-center justify-center gap-1.5 py-1.5 bg-obsidian-bgSecondary hover:bg-obsidian-hover border border-obsidian-border rounded text-xs font-medium text-obsidian-textNormal transition-colors"
            >
              {copiedPrompt === "decomp" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Prompt kopieren
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
