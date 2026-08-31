import { App, ItemView, Plugin, WorkspaceLeaf, addIcon } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { DashboardApp } from './components/DashboardApp';
import { WORKOS_LOGO_SVG_STRING } from './components/WorkOSLogo';

export const VIEW_TYPE_WORKOS_DASHBOARD = 'workos-dashboard-view';

export class WorkOSDashboardView extends ItemView {
  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_WORKOS_DASHBOARD;
  }

  getDisplayText(): string {
    return 'WorkOS Dashboard';
  }

  getIcon(): string {
    return 'workos-logo';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    
    // Create root for React 18
    this.root = createRoot(container);
    this.root.render(React.createElement(DashboardApp, { app: this.app }));
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

export default class WorkOSPlugin extends Plugin {
  async onload(): Promise<void> {
    console.log('Loading Obsidian WorkOS Dashboard Plugin...');

    // Register custom WorkOS Vector Icon
    addIcon('workos-logo', WORKOS_LOGO_SVG_STRING);

    // Register custom ItemView
    this.registerView(
      VIEW_TYPE_WORKOS_DASHBOARD,
      (leaf) => new WorkOSDashboardView(leaf)
    );

    // Add ribbon icon
    this.addRibbonIcon('workos-logo', 'WorkOS Dashboard öffnen', () => {
      this.activateView();
    });

    // Add command to open dashboard
    this.addCommand({
      id: 'open-workos-dashboard',
      name: 'WorkOS Dashboard öffnen',
      callback: () => {
        this.activateView();
      },
    });

    // Add command for quick braindump
    this.addCommand({
      id: 'quick-capture-braindump',
      name: 'Quick Capture Braindump',
      callback: () => {
        this.activateView();
      },
    });
  }

  async onunload(): Promise<void> {
    console.log('Unloading Obsidian WorkOS Dashboard Plugin...');
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_WORKOS_DASHBOARD);
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_WORKOS_DASHBOARD);

    if (leaves.length > 0) {
      // Leaf already exists, reveal it
      leaf = leaves[0];
    } else {
      // Create new leaf in main area
      leaf = workspace.getLeaf(false);
      await leaf.setViewState({
        type: VIEW_TYPE_WORKOS_DASHBOARD,
        active: true,
      });
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
}
