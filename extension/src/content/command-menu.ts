// SPDX-License-Identifier: GPL-3.0-only
import {
  COMMANDS,
  COMMAND_GROUPS,
  commandInsertText,
  commandLabel,
  type CommandSpec,
} from '../lib/commands';

/**
 * Slash-style command palette injected into Reddit's modmail / comment text
 * inputs. Trigger: type "!" at the start of a line (or after whitespace) in
 * any <textarea> or contenteditable region on reddit.com.
 *
 * Open via Ctrl+Shift+Space (or Cmd+Shift+Space) when focused on a text input.
 */

type TargetKind = 'textarea' | 'contenteditable';

type ActiveTarget = {
  el: HTMLElement;
  kind: TargetKind;
  /** Index into the text where the "!" trigger lives. -1 means "no trigger yet" (manual open). */
  triggerStart: number;
};

const MENU_ID = 'ae-cmd-menu';
let activeTarget: ActiveTarget | null = null;
let activeIndex = 0;
let filtered: CommandSpec[] = [];
let aeDebug = false;

function dbg(...args: unknown[]): void {
  if (!aeDebug) return;
  // eslint-disable-next-line no-console
  console.debug(...args);
}

function ctxLabel(c: CommandSpec): string {
  if (c.context === 'either') return 'modmail or post';
  if (c.context === 'post') return 'post comment';
  return 'modmail';
}

function ensureMenu(): HTMLDivElement {
  let menu = document.getElementById(MENU_ID) as HTMLDivElement | null;
  if (menu) return menu;
  menu = document.createElement('div');
  menu.id = MENU_ID;
  menu.className = 'ae-cmd-menu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', 'AutoEnforcer command palette');
  menu.style.display = 'none';
  document.documentElement.appendChild(menu);
  return menu;
}

function closeMenu(): void {
  const menu = document.getElementById(MENU_ID);
  if (menu) menu.style.display = 'none';
  activeTarget = null;
  activeIndex = 0;
  filtered = [];
}

function getCaretInTextarea(el: HTMLTextAreaElement | HTMLInputElement): number {
  return el.selectionStart ?? el.value.length;
}

// Reddit's composers live inside shadow roots; selections there are owned by the
// shadow root, not the document.
function getSelectionFor(el: Element): Selection | null {
  const root = el.getRootNode();
  if (root instanceof ShadowRoot) {
    const shadowGetSelection = (root as ShadowRoot & { getSelection?: () => Selection | null }).getSelection;
    if (typeof shadowGetSelection === 'function') return shadowGetSelection.call(root);
  }
  return window.getSelection();
}

function textBeforeCaret(target: ActiveTarget): string {
  if (target.kind === 'textarea') {
    const ta = target.el as HTMLTextAreaElement | HTMLInputElement;
    return (ta.value ?? '').slice(0, getCaretInTextarea(ta));
  }
  // contenteditable: walk selection
  const sel = getSelectionFor(target.el);
  if (!sel || sel.rangeCount === 0) return '';
  const range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(target.el);
  range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return range.toString();
}

function detectTrigger(target: ActiveTarget): { start: number; query: string } | null {
  const before = textBeforeCaret(target);
  // Find last "!" that is at start-of-string or preceded by whitespace.
  let i = before.length - 1;
  while (i >= 0) {
    const ch = before[i];
    if (ch === '!') {
      const prev = i === 0 ? '\n' : before[i - 1];
      if (prev === undefined || /\s/.test(prev)) {
        const query = before.slice(i + 1);
        if (/^[a-z0-9 ]*$/i.test(query)) return { start: i, query };
        return null;
      }
      return null;
    }
    if (/\s/.test(ch)) return null;
    i--;
  }
  return null;
}

function scoreMatch(c: CommandSpec, query: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const name = c.name.toLowerCase();
  const label = commandLabel(c).toLowerCase();
  const summary = c.summary.toLowerCase();
  if (name.startsWith(q)) return 100 - name.length;
  if (label.startsWith('!' + q)) return 90 - name.length;
  if (name.includes(q)) return 60;
  if (summary.includes(q)) return 30;
  return -1;
}

function applyFilter(query: string): CommandSpec[] {
  if (!query) return COMMANDS.slice();
  const scored = COMMANDS.map((c) => ({ c, s: scoreMatch(c, query) }))
    .filter((r) => r.s >= 0)
    .sort((a, b) => b.s - a.s)
    .map((r) => r.c);
  return scored;
}

function renderMenu(query: string): void {
  const menu = ensureMenu();
  filtered = applyFilter(query);
  if (filtered.length === 0) {
    menu.innerHTML = `
      <div class="ae-cmd-header">
        <span>AutoEnforcer commands</span>
        <span class="ae-cmd-hint">Esc to close</span>
      </div>
      <div class="ae-cmd-empty">No commands match "${escapeHtml(query)}"</div>
    `;
    activeIndex = 0;
    return;
  }

  // Group entries by their CommandGroup, preserving filter order within each group.
  const byGroup = new Map<string, CommandSpec[]>();
  for (const c of filtered) {
    const arr = byGroup.get(c.group) ?? [];
    arr.push(c);
    byGroup.set(c.group, arr);
  }
  const groupOrder = Array.from(byGroup.keys()).sort(
    (a, b) => COMMAND_GROUPS[a as keyof typeof COMMAND_GROUPS].order - COMMAND_GROUPS[b as keyof typeof COMMAND_GROUPS].order,
  );

  if (activeIndex >= filtered.length) activeIndex = 0;
  if (activeIndex < 0) activeIndex = filtered.length - 1;

  const flatIndex = new Map<CommandSpec, number>();
  filtered.forEach((c, i) => flatIndex.set(c, i));

  let html = `
    <div class="ae-cmd-header">
      <span>AutoEnforcer commands</span>
      <span class="ae-cmd-hint">↑↓ navigate · Enter insert · Esc close</span>
    </div>
    <div class="ae-cmd-scroll">
  `;
  for (const g of groupOrder) {
    const meta = COMMAND_GROUPS[g as keyof typeof COMMAND_GROUPS];
    html += `<div class="ae-cmd-group-label">${escapeHtml(meta.label)}</div>`;
    const list = byGroup.get(g) ?? [];
    for (const c of list) {
      const idx = flatIndex.get(c) ?? -1;
      const active = idx === activeIndex ? ' ae-cmd-row--active' : '';
      html += `
        <div class="ae-cmd-row${active}" data-idx="${idx}" role="option" aria-selected="${idx === activeIndex}">
          <div class="ae-cmd-row-main">
            <span class="ae-cmd-name">!${escapeHtml(c.name)}</span>
            ${c.args ? `<span class="ae-cmd-args">${escapeHtml(c.args)}</span>` : ''}
            <span class="ae-cmd-ctx">${escapeHtml(ctxLabel(c))}</span>
          </div>
          <div class="ae-cmd-summary">${escapeHtml(c.summary)}</div>
          ${idx === activeIndex && c.detail ? `<div class="ae-cmd-detail">${escapeHtml(c.detail)}</div>` : ''}
        </div>
      `;
    }
  }
  html += `</div>`;
  menu.innerHTML = html;

  for (const row of menu.querySelectorAll<HTMLDivElement>('.ae-cmd-row')) {
    row.addEventListener('mouseenter', () => {
      const i = Number(row.dataset.idx ?? '-1');
      if (Number.isFinite(i) && i >= 0) {
        activeIndex = i;
        updateActive();
      }
    });
    row.addEventListener('mousedown', (ev) => {
      ev.preventDefault();
      const i = Number(row.dataset.idx ?? '-1');
      if (Number.isFinite(i) && i >= 0) {
        activeIndex = i;
        commitSelection();
      }
    });
  }
}

function updateActive(): void {
  const menu = document.getElementById(MENU_ID);
  if (!menu) return;
  const rows = menu.querySelectorAll<HTMLDivElement>('.ae-cmd-row');
  rows.forEach((row) => {
    const i = Number(row.dataset.idx ?? '-1');
    const active = i === activeIndex;
    row.classList.toggle('ae-cmd-row--active', active);
    row.setAttribute('aria-selected', active ? 'true' : 'false');
    // Strip+restore detail line.
    row.querySelector('.ae-cmd-detail')?.remove();
    if (active) {
      const c = filtered[i];
      if (c?.detail) {
        const d = document.createElement('div');
        d.className = 'ae-cmd-detail';
        d.textContent = c.detail;
        row.appendChild(d);
      }
      row.scrollIntoView({ block: 'nearest' });
    }
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function positionMenu(): void {
  const menu = document.getElementById(MENU_ID) as HTMLDivElement | null;
  if (!menu || !activeTarget) return;
  const rect = activeTarget.el.getBoundingClientRect();
  const menuWidth = Math.min(420, Math.max(280, rect.width));
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = rect.left;
  if (left + menuWidth > vw - 12) left = Math.max(12, vw - menuWidth - 12);
  // Prefer below the input, but flip above if it would clip the viewport bottom.
  const estHeight = 360;
  let top = rect.bottom + 6;
  if (top + estHeight > vh - 12 && rect.top > estHeight + 12) {
    top = rect.top - estHeight - 6;
  }
  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
  menu.style.width = `${Math.round(menuWidth)}px`;
}

function openMenuFor(target: ActiveTarget, query: string): void {
  activeTarget = target;
  activeIndex = 0;
  const menu = ensureMenu();
  menu.style.display = 'block';
  renderMenu(query);
  positionMenu();
}

function commitSelection(): void {
  if (!activeTarget) return;
  const c = filtered[activeIndex];
  if (!c) {
    closeMenu();
    return;
  }
  const text = commandInsertText(c);
  insertIntoTarget(activeTarget, text);
  closeMenu();
}

function insertIntoTarget(target: ActiveTarget, text: string): void {
  if (target.kind === 'textarea') {
    const ta = target.el as HTMLTextAreaElement;
    const value = ta.value ?? '';
    const caret = ta.selectionStart ?? value.length;
    const start = target.triggerStart >= 0 ? target.triggerStart : caret;
    const before = value.slice(0, start);
    const after = value.slice(caret);
    const next = before + text + after;
    // Use native setter so React-controlled inputs update their state.
    const proto = Object.getPrototypeOf(ta) as { constructor: new () => HTMLTextAreaElement };
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc?.set) desc.set.call(ta, next);
    else ta.value = next;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    const newCaret = before.length + text.length;
    ta.setSelectionRange(newCaret, newCaret);
    ta.focus();
    return;
  }
  // contenteditable: Reddit's modern composers are Lexical-based and live
  // inside shadow roots. Range.deleteContents() + document.execCommand(
  // 'insertText') corrupts Lexical's internal model and is often a no-op in
  // shadow DOM. Instead, extend the selection to cover the trigger range and
  // dispatch a native beforeinput event -- Lexical (and plain contenteditable)
  // both honor insertText by replacing the current selection with `data`.
  const root = target.el;
  root.focus();
  const sel = getSelectionFor(root);
  if (!sel || sel.rangeCount === 0) return;
  if (target.triggerStart >= 0) {
    const fullText = textBeforeCaret(target);
    const charsToRemove = fullText.length - target.triggerStart;
    sel.collapseToEnd();
    for (let i = 0; i < charsToRemove; i++) {
      sel.modify('extend', 'backward', 'character');
    }
  }
  const beforeInput = new InputEvent('beforeinput', {
    inputType: 'insertText',
    data: text,
    bubbles: true,
    cancelable: true,
    composed: true,
  });
  const accepted = root.dispatchEvent(beforeInput);
  if (accepted) {
    // Editor did not preventDefault -- fall back so plain contenteditables
    // (no Lexical) still get the text inserted.
    const ok = document.execCommand('insertText', false, text);
    if (!ok) {
      // Last-ditch: replace the selection range directly.
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
    }
  }
  root.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

function classifyTarget(el: EventTarget | null): ActiveTarget | null {
  if (!(el instanceof HTMLElement)) return null;
  if (el instanceof HTMLTextAreaElement) {
    return { el, kind: 'textarea', triggerStart: -1 };
  }
  if (el.isContentEditable) {
    return { el, kind: 'contenteditable', triggerStart: -1 };
  }
  // Custom elements (e.g. <shreddit-composer>) wrap a real editable inside a
  // shadow root. Drill in and find it so the host element isn't a dead end.
  if (el.shadowRoot) {
    const inner = el.shadowRoot.querySelector<HTMLElement>(
      'textarea, [contenteditable="true"], [contenteditable=""]',
    );
    if (inner instanceof HTMLTextAreaElement) {
      return { el: inner, kind: 'textarea', triggerStart: -1 };
    }
    if (inner && inner.isContentEditable) {
      return { el: inner, kind: 'contenteditable', triggerStart: -1 };
    }
  }
  return null;
}

// Composed events are retargeted to the shadow host as they bubble; the real
// editable is the first node in composedPath.
function realEventTarget(ev: Event): EventTarget | null {
  const path = typeof ev.composedPath === 'function' ? ev.composedPath() : [];
  return path.length > 0 ? path[0] : ev.target;
}

// document.activeElement is also retargeted to the host when focus is inside a
// shadow root. Walk down through every nested shadow root to find the real one.
function deepActiveElement(): Element | null {
  let el: Element | null = document.activeElement;
  while (el) {
    const shadow = (el as HTMLElement).shadowRoot;
    if (!shadow || !shadow.activeElement) break;
    el = shadow.activeElement;
  }
  return el;
}

function onInput(ev: Event): void {
  const raw = realEventTarget(ev);
  const target = classifyTarget(raw);
  dbg('[AE] input', { rawTag: (raw as HTMLElement | null)?.tagName, classified: !!target, kind: target?.kind });
  if (!target) return;
  const det = detectTrigger(target);
  dbg('[AE] detect', det, 'textBefore=', JSON.stringify(textBeforeCaret(target).slice(-40)));
  if (!det) {
    if (activeTarget && activeTarget.el === target.el) closeMenu();
    return;
  }
  target.triggerStart = det.start;
  openMenuFor(target, det.query);
}

function onKeydown(ev: KeyboardEvent): void {
  const menu = document.getElementById(MENU_ID);
  const visible = !!menu && menu.style.display !== 'none' && !!activeTarget;

  // Manual open shortcut: Ctrl/Cmd+Shift+Space inside a text input.
  if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.code === 'Space') {
    const target = classifyTarget(deepActiveElement());
    if (target) {
      ev.preventDefault();
      target.triggerStart = -1;
      openMenuFor(target, '');
      return;
    }
  }

  if (!visible) return;

  if (ev.key === 'Escape') {
    ev.preventDefault();
    closeMenu();
    return;
  }
  if (ev.key === 'ArrowDown') {
    ev.preventDefault();
    activeIndex = (activeIndex + 1) % Math.max(1, filtered.length);
    updateActive();
    return;
  }
  if (ev.key === 'ArrowUp') {
    ev.preventDefault();
    activeIndex = (activeIndex - 1 + Math.max(1, filtered.length)) % Math.max(1, filtered.length);
    updateActive();
    return;
  }
  if (ev.key === 'Enter' || ev.key === 'Tab') {
    if (filtered.length === 0) return;
    ev.preventDefault();
    commitSelection();
    return;
  }
}

function onDocClick(ev: MouseEvent): void {
  const menu = document.getElementById(MENU_ID);
  if (!menu) return;
  if (menu.style.display === 'none') return;
  const path = typeof ev.composedPath === 'function' ? ev.composedPath() : [];
  for (const node of path) {
    if (node === menu) return;
    if (activeTarget && node === activeTarget.el) return;
  }
  closeMenu();
}

function init(): void {
  document.addEventListener('input', onInput, true);
  document.addEventListener('keydown', onKeydown, true);
  document.addEventListener('mousedown', onDocClick, true);
  window.addEventListener('resize', positionMenu);
  window.addEventListener('scroll', positionMenu, true);
}

if (document.body) {
  const w = window as Window & { __aeCommandMenuLoaded?: boolean };
  if (w.__aeCommandMenuLoaded) {
    dbg('[AE] command-menu already loaded, skipping');
  } else {
    w.__aeCommandMenuLoaded = true;
    void (async () => {
      const stored = await chrome.storage.local.get({
        enabledOnReddit: true,
        subs: [] as Array<{ subreddit: string }>,
        debug: false,
      });
      aeDebug = stored.debug === true;
      const configured: string[] = Array.isArray(stored.subs)
        ? stored.subs.map((s) => (s.subreddit ?? '').toLowerCase()).filter(Boolean)
        : [];
      const path = location.pathname;
      const subMatch = path.match(/^\/r\/([^/]+)/i);
      const currentSub = subMatch ? subMatch[1].toLowerCase() : null;
      const onModmail = /^\/mail\//i.test(path);
      const allowed =
        configured.length > 0 &&
        ((currentSub !== null && configured.includes(currentSub)) || onModmail);
      dbg('[AE] command-menu boot', {
        enabled: stored.enabledOnReddit,
        url: location.href,
        configured,
        currentSub,
        onModmail,
        allowed,
      });
      if (stored.enabledOnReddit !== false && allowed) init();
      // Refresh debug flag live so toggling it in the popup affects the page
      // without a reload.
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.debug) {
          aeDebug = changes.debug.newValue === true;
        }
      });
    })();
  }
}
