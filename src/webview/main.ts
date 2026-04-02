import { SizeNode, ExtensionToWebviewMessage, WebviewToExtensionMessage } from '../types';
import { hexToHsl, heatColor } from './color';
import { formatSize, pct, escHtml } from './helpers';

declare function acquireVsCodeApi(): {
  postMessage(msg: WebviewToExtensionMessage): void;
};

const vscode = acquireVsCodeApi();

// Signal to the extension host that the webview JS is loaded and ready
vscode.postMessage({ type: 'ready' });

/**
 * Safely retrieve a DOM element by ID, throwing if not found.
 * @param id - The element ID to look up.
 * @returns The matching HTMLElement.
 * @throws Error if the element does not exist in the DOM.
 */
function getRequiredElement(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Required element #${id} not found`);
  }
  return el;
}

// ── DOM refs ──
const loadingEl = getRequiredElement('loading');
const errorEl   = getRequiredElement('error');
const splitEl   = getRequiredElement('split');
const treePaneEl = getRequiredElement('tree-pane');
const detailPlaceholderEl = getRequiredElement('detail-placeholder');
const detailContentEl = getRequiredElement('detail-content');
const expandAllBtn = getRequiredElement('expand-all-btn');
const collapseAllBtn = getRequiredElement('collapse-all-btn');

// ── State ──
let selectedNode: SizeNode | null = null;
let colorState: { h: number; s: number; l: number; isDark: boolean } | null = null;

// ── Toolbar ──
/**
 * Disables toolbar buttons, shows a busy label, executes the given work function,
 * then re-enables the buttons after the browser has painted the result.
 * @param btn - The toolbar button that triggered the action.
 * @param label - Temporary label to display while the work is in progress.
 * @param work - Synchronous function to execute (e.g. expand/collapse all nodes).
 */
function withToolbarBusy(btn: HTMLElement, label: string, work: () => void): void {
  const original = btn.textContent ?? '';
  expandAllBtn.setAttribute('disabled', '');
  collapseAllBtn.setAttribute('disabled', '');
  btn.textContent = label;
  // setTimeout yields one frame so the browser paints the busy state before the
  // synchronous DOM work begins. The inner rAF fires after the browser has painted
  // the completed tree, so buttons are only re-enabled once the UI is actually ready.
  setTimeout(() => {
    work();
    requestAnimationFrame(() => {
      btn.textContent = original;
      expandAllBtn.removeAttribute('disabled');
      collapseAllBtn.removeAttribute('disabled');
    });
  }, 0);
}

expandAllBtn.addEventListener('click', () => {
  withToolbarBusy(expandAllBtn, 'Expanding…', () => {
    treePaneEl.querySelectorAll<HTMLElement>('.tree-children').forEach(el => {
      el.classList.remove('hidden');
    });
    treePaneEl.querySelectorAll<HTMLElement>('.tree-toggle').forEach(el => {
      if (el.textContent === '▶') el.textContent = '▼';
    });
  });
});

collapseAllBtn.addEventListener('click', () => {
  withToolbarBusy(collapseAllBtn, 'Collapsing…', () => {
    treePaneEl.querySelectorAll<HTMLElement>('.tree-children').forEach((el, i) => {
      if (i > 0) el.classList.add('hidden'); // keep root's children visible
    });
    treePaneEl.querySelectorAll<HTMLElement>('.tree-toggle').forEach((el, i) => {
      if (i > 0 && el.textContent === '▼') el.textContent = '▶';
    });
  });
});

// ── Message handler ──
window.addEventListener('message', (event: MessageEvent<ExtensionToWebviewMessage>) => { // NOSONAR — origin not checked; VS Code webview messages are trusted from the extension host
  const msg = event.data;
  // Validate message structure (VS Code webview messages are trusted from the extension host)
  if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
    return;
  }
  if (msg.type === 'loading') {
    show(loadingEl); hide(splitEl); hide(errorEl);
  } else if (msg.type === 'error') {
    hide(loadingEl); hide(splitEl);
    show(errorEl);
    errorEl.textContent = `Error: ${msg.message}`;
  } else if (msg.type === 'tree') {
    hide(loadingEl); hide(errorEl);
    show(splitEl);
    const { h, s, l } = hexToHsl(msg.baseColor);
    colorState = { h, s, l, isDark: msg.isDark };
    renderTree(msg.data);
  }
});

// ── Tree rendering ──
/**
 * Clears the tree pane and renders the root node of the size tree.
 * @param root - The root {@link SizeNode} returned by the parser.
 */
function renderTree(root: SizeNode): void {
  treePaneEl.innerHTML = '';
  treePaneEl.appendChild(buildTreeRow(root, root.size, true));
}

/**
 * Recursively builds the DOM elements for a single tree row and its children.
 * @param node - The {@link SizeNode} to render.
 * @param rootSize - Total byte size of the root node (used for percentage calculations).
 * @param expanded - Whether this node's children should be initially visible.
 * @param parentSize - Byte size of the parent node (used for sibling-relative mini bar widths).
 * @returns A wrapper `HTMLElement` containing the row and its children container.
 */
function buildTreeRow(node: SizeNode, rootSize: number, expanded: boolean, parentSize?: number): HTMLElement {
  const wrapper = document.createElement('div');

  const row = document.createElement('div');
  row.className = 'tree-row';
  row.dataset.line = String(node.line);
  row.dataset.col  = String(node.col);

  // Top line: toggle + key + size
  const top = document.createElement('div');
  top.className = 'tree-row-top';

  const toggle = document.createElement('span');
  toggle.className = 'tree-toggle';
  const hasChildren = node.children.length > 0;
  if (hasChildren) {
    toggle.textContent = expanded ? '▼' : '▶';
  } else {
    toggle.textContent = '';
  }

  const keyEl = document.createElement('span');
  keyEl.className = 'tree-key';
  keyEl.textContent = node.key;

  const sizeEl = document.createElement('span');
  sizeEl.className = 'tree-size';
  sizeEl.textContent = formatSize(node.size);

  top.append(toggle, keyEl, sizeEl);

  // Mini bar — width and color relative to parent size (so siblings are comparable)
  const effectiveParent = parentSize ?? rootSize;
  const miniBarWidth = pct(node.size, effectiveParent);
  const miniBarPct = effectiveParent > 0 ? (node.size / effectiveParent * 100).toFixed(1) + '%' : '';
  const barTrack = document.createElement('div');
  barTrack.className = 'tree-mini-bar-track';
  const barFill = document.createElement('div');
  barFill.className = 'tree-mini-bar-fill';
  barFill.style.width = miniBarWidth + '%';
  if (colorState) { // colorState is null until the first tree message is received
    // Mini-bars use a fixed vivid lightness so they stay bold regardless of the chosen color's own lightness
    const miniL = colorState.isDark ? 75 : 30;
    barFill.style.background = `hsl(${colorState.h},${colorState.s}%,${miniL}%)`;
  }
  barTrack.appendChild(barFill);

  const barRow = document.createElement('div');
  barRow.className = 'tree-bar-row';
  const pctLabel = document.createElement('span');
  pctLabel.className = 'tree-pct';
  pctLabel.textContent = miniBarPct;
  barRow.append(barTrack, pctLabel);

  row.append(top, barRow);

  // Children container
  const childrenEl = document.createElement('div');
  childrenEl.className = 'tree-children';
  if (!expanded) childrenEl.classList.add('hidden');

  if (hasChildren) {
    node.children.forEach(child => {
      childrenEl.appendChild(buildTreeRow(child, rootSize, false, node.size));
    });
  }

  // Click: select node + toggle expand
  row.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.tree-row.selected').forEach(el => el.classList.remove('selected'));
    row.classList.add('selected');
    selectedNode = node;
    renderDetail(node);

    if (hasChildren) {
      const open = !childrenEl.classList.contains('hidden');
      childrenEl.classList.toggle('hidden', open);
      toggle.textContent = open ? '▶' : '▼';
    }
  });

  wrapper.append(row, childrenEl);
  return wrapper;
}

// ── Detail pane ──
/**
 * Renders the detail pane for the selected node, showing a header with
 * metadata and a bar chart of its immediate children sorted by size.
 * @param node - The {@link SizeNode} whose details to display.
 */
function renderDetail(node: SizeNode): void {
  show(detailContentEl);
  hide(detailPlaceholderEl);
  detailContentEl.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'detail-header';
  header.innerHTML = `
    <h2>${escHtml(node.key)}</h2>
    <div class="detail-meta">
      ${formatSize(node.size)} total
      · ${node.children.length} ${node.type === 'array' ? 'items' : 'keys'}
      · ${node.type}
    </div>`;
  detailContentEl.appendChild(header);

  // Bar chart — bars are proportional to the largest sibling (largest = 100%)
  const maxChildSize = node.children.length > 0
    ? Math.max(...node.children.map(c => c.size))
    : 1;

  node.children.forEach(child => {
    const ofParent = node.size > 0 ? child.size / node.size : 0;
    const ofMax = maxChildSize > 0 ? child.size / maxChildSize : 0;
    const percentage = (ofParent * 100).toFixed(1);
    const barWidth = Math.max(ofMax * 100, 0.5);

    const row = document.createElement('div');
    row.className = 'bar-row';
    row.style.cursor = 'pointer';

    const rowTop = document.createElement('div');
    rowTop.className = 'bar-row-top';
    const keySpan = document.createElement('span');
    keySpan.className = 'bar-key';
    keySpan.textContent = child.key;
    const metaSpan = document.createElement('span');
    metaSpan.className = 'bar-meta';
    metaSpan.textContent = `${formatSize(child.size)} · ${percentage}%`;
    rowTop.append(keySpan, metaSpan);

    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.style.width = barWidth + '%';
    if (colorState) { // colorState is null until the first tree message is received
      fill.style.background = heatColor(ofMax, colorState.h, colorState.s, colorState.l, colorState.isDark);
    }
    track.appendChild(fill);

    row.append(rowTop, track);
    row.addEventListener('click', () => {
      renderDetail(child);
      selectTreeNode(child);
    });

    detailContentEl.appendChild(row);
  });

  // Go to editor button
  const btn = document.createElement('button');
  btn.className = 'goto-btn';
  btn.textContent = 'Go to in editor ↗';
  btn.addEventListener('click', () => {
    vscode.postMessage({ type: 'goToEditor', line: node.line, col: node.col });
  });
  detailContentEl.appendChild(btn);
}

// ── Tree sync ──
/**
 * Selects and scrolls to the tree row that corresponds to the given node.
 * Expands any collapsed ancestor containers along the way.
 * @param node - The {@link SizeNode} to highlight in the tree pane.
 */
function selectTreeNode(node: SizeNode): void {
  const target = treePaneEl.querySelector<HTMLElement>(
    `.tree-row[data-line="${node.line}"][data-col="${node.col}"]`
  );
  if (!target) return;

  // Expand all collapsed ancestor .tree-children containers
  let el: HTMLElement | null = target.parentElement;
  while (el && el !== treePaneEl) {
    if (el.classList.contains('tree-children') && el.classList.contains('hidden')) {
      el.classList.remove('hidden');
      // Update the toggle arrow on the parent row
      const parentRow = el.previousElementSibling;
      if (parentRow instanceof HTMLElement && parentRow.classList.contains('tree-row')) {
        const toggle = parentRow.querySelector<HTMLElement>('.tree-toggle');
        if (toggle) toggle.textContent = '▼';
      }
    }
    el = el.parentElement;
  }

  // Select the row
  document.querySelectorAll('.tree-row.selected').forEach(r => r.classList.remove('selected'));
  target.classList.add('selected');
  target.scrollIntoView({ block: 'nearest' });
}

// ── Helpers ──
/**
 * Shows an element by removing the `hidden` CSS class.
 * @param el - The element to show.
 */
function show(el: HTMLElement): void { el.classList.remove('hidden'); }

/**
 * Hides an element by adding the `hidden` CSS class.
 * @param el - The element to hide.
 */
function hide(el: HTMLElement): void { el.classList.add('hidden'); }
