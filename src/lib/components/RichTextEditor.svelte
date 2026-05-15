<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy, tick } from 'svelte';

  export let value: string = '';
  export let maxLength: number = 500;

  const dispatch = createEventDispatcher<{
    change: string;
    focus: void;
    blur: void;
  }>();

  let editorEl: HTMLDivElement;
  let textLen = 0;
  let lastValidHtml = '';

  let activeBold = false;
  let activeItalic = false;
  let activeUnderline = false;
  let activeAlign: 'left' | 'center' | 'right' = 'left';

  function updateTextLen() {
    if (!editorEl) return;
    textLen = (editorEl.textContent ?? '').length;
  }

  function updateActiveStates() {
    if (typeof document === 'undefined') return;
    try {
      activeBold = document.queryCommandState('bold');
      activeItalic = document.queryCommandState('italic');
      activeUnderline = document.queryCommandState('underline');
      if (document.queryCommandState('justifyCenter')) activeAlign = 'center';
      else if (document.queryCommandState('justifyRight')) activeAlign = 'right';
      else activeAlign = 'left';
    } catch {
      // ignore
    }
  }

  function isEditorSelectionActive(): boolean {
    if (!editorEl) return false;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const node = sel.anchorNode;
    return !!node && editorEl.contains(node);
  }

  function onSelectionChange() {
    if (isEditorSelectionActive()) {
      updateActiveStates();
    }
  }

  function placeCaretAtEnd() {
    if (!editorEl) return;
    editorEl.focus();
    const range = document.createRange();
    range.selectNodeContents(editorEl);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  function exec(cmd: string) {
    if (!editorEl) return;
    if (!isEditorSelectionActive()) {
      editorEl.focus();
    }
    document.execCommand(cmd, false);
    updateActiveStates();
    handleInput();
  }

  function handleInput() {
    if (!editorEl) return;
    const text = editorEl.textContent ?? '';
    if (text.length > maxLength) {
      editorEl.innerHTML = lastValidHtml;
      placeCaretAtEnd();
      updateTextLen();
      return;
    }
    lastValidHtml = editorEl.innerHTML;
    updateTextLen();
    dispatch('change', editorEl.innerHTML);
  }

  function handleFocus() {
    updateActiveStates();
    dispatch('focus');
  }

  function handleBlur() {
    dispatch('blur');
  }

  // Convert clipboard HTML → clean markup with only <strong>/<em>/<u>/<br>
  // Uses DOMParser so the full HTML structure (including <body>) is handled correctly,
  // and detects formatting via both semantic tags AND inline styles (Word, Google Docs, etc.)
  function sanitizeHtml(raw: string): string {
    const doc = new DOMParser().parseFromString(raw, 'text/html');

    const BLOCK = new Set(['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TR', 'TD', 'TH']);

    function escapeText(s: string) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function walk(node: Node): string {
      if (node.nodeType === Node.TEXT_NODE) return escapeText(node.textContent ?? '');
      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const el = node as HTMLElement;
      const tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'HEAD') return '';

      const inner = Array.from(el.childNodes).map(walk).join('');

      const style = el.style ?? {};
      const fw = style.fontWeight ?? '';
      const fs = style.fontStyle ?? '';
      const td = (style.textDecoration ?? '') + (style.textDecorationLine ?? '');

      const bold = tag === 'B' || tag === 'STRONG' || fw === 'bold' || fw === 'bolder' || parseInt(fw) >= 600;
      const italic = tag === 'I' || tag === 'EM' || fs === 'italic' || fs === 'oblique';
      const underline = tag === 'U' || td.includes('underline');

      let result = inner;
      if (underline) result = `<u>${result}</u>`;
      if (italic)    result = `<em>${result}</em>`;
      if (bold)      result = `<strong>${result}</strong>`;

      if (BLOCK.has(tag) && inner.trim()) result += '<br>';

      return result;
    }

    const html = Array.from(doc.body.childNodes).map(walk).join('');
    // Collapse runs of <br> at the very end
    return html.replace(/(<br\s*\/?>)+$/, '');
  }

  function insertHtmlAtCursor(html: string) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const frag = document.createDocumentFragment();
    let last: Node | undefined;
    while (tmp.firstChild) { last = tmp.firstChild; frag.appendChild(last); }
    range.insertNode(frag);
    if (last) {
      const r = document.createRange();
      r.setStartAfter(last);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const currentText = editorEl.textContent ?? '';
    const remaining = Math.max(0, maxLength - currentText.length);
    if (remaining <= 0) return;

    const htmlData = e.clipboardData?.getData('text/html') ?? '';
    if (htmlData) {
      const sanitized = sanitizeHtml(htmlData);
      const tmpCheck = document.createElement('div');
      tmpCheck.innerHTML = sanitized;
      const plainLen = (tmpCheck.textContent ?? '').length;
      if (plainLen <= remaining) {
        insertHtmlAtCursor(sanitized);
      } else {
        document.execCommand('insertText', false, (tmpCheck.textContent ?? '').slice(0, remaining));
      }
    } else {
      const text = e.clipboardData?.getData('text/plain') ?? '';
      if (!text) return;
      document.execCommand('insertText', false, text.slice(0, remaining));
    }
    handleInput();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!e.ctrlKey && !e.metaKey) return;
    const k = e.key.toLowerCase();
    if (k === 'b') { e.preventDefault(); exec('bold'); }
    else if (k === 'i') { e.preventDefault(); exec('italic'); }
    else if (k === 'u') { e.preventDefault(); exec('underline'); }
  }

  onMount(async () => {
    await tick();
    if (editorEl && value) {
      editorEl.innerHTML = value;
    }
    lastValidHtml = editorEl?.innerHTML ?? '';
    updateTextLen();
    document.addEventListener('selectionchange', onSelectionChange);
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('selectionchange', onSelectionChange);
    }
  });

  // Keep external value -> editor in sync when value changes externally
  $: if (editorEl && value !== editorEl.innerHTML && document.activeElement !== editorEl) {
    editorEl.innerHTML = value ?? '';
    lastValidHtml = editorEl.innerHTML;
    updateTextLen();
  }

  $: overLimit = textLen >= maxLength;
  $: isEmpty = textLen === 0;
</script>

<div class="rte">
  <div class="toolbar" role="toolbar" aria-label="Text formatting">
    <button
      type="button"
      class="tb-btn"
      class:active={activeBold}
      title="Bold (Ctrl+B)"
      aria-label="Bold"
      aria-pressed={activeBold}
      on:mousedown|preventDefault={() => exec('bold')}
    >
      <strong>B</strong>
    </button>
    <button
      type="button"
      class="tb-btn"
      class:active={activeItalic}
      title="Italic (Ctrl+I)"
      aria-label="Italic"
      aria-pressed={activeItalic}
      on:mousedown|preventDefault={() => exec('italic')}
    >
      <em>I</em>
    </button>
    <button
      type="button"
      class="tb-btn"
      class:active={activeUnderline}
      title="Underline (Ctrl+U)"
      aria-label="Underline"
      aria-pressed={activeUnderline}
      on:mousedown|preventDefault={() => exec('underline')}
    >
      <span style="text-decoration: underline;">U</span>
    </button>

    <span class="separator" aria-hidden="true"></span>

    <button
      type="button"
      class="tb-btn"
      class:active={activeAlign === 'left'}
      title="Align left"
      aria-label="Align left"
      aria-pressed={activeAlign === 'left'}
      on:mousedown|preventDefault={() => exec('justifyLeft')}
    >
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <line x1="2" y1="4" x2="14" y2="4" />
        <line x1="2" y1="8" x2="10" y2="8" />
        <line x1="2" y1="12" x2="12" y2="12" />
      </svg>
    </button>
    <button
      type="button"
      class="tb-btn"
      class:active={activeAlign === 'center'}
      title="Align center"
      aria-label="Align center"
      aria-pressed={activeAlign === 'center'}
      on:mousedown|preventDefault={() => exec('justifyCenter')}
    >
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <line x1="2" y1="4" x2="14" y2="4" />
        <line x1="4" y1="8" x2="12" y2="8" />
        <line x1="3" y1="12" x2="13" y2="12" />
      </svg>
    </button>
    <button
      type="button"
      class="tb-btn"
      class:active={activeAlign === 'right'}
      title="Align right"
      aria-label="Align right"
      aria-pressed={activeAlign === 'right'}
      on:mousedown|preventDefault={() => exec('justifyRight')}
    >
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <line x1="2" y1="4" x2="14" y2="4" />
        <line x1="6" y1="8" x2="14" y2="8" />
        <line x1="4" y1="12" x2="14" y2="12" />
      </svg>
    </button>
  </div>

  <div
    bind:this={editorEl}
    class="editor"
    class:is-empty={isEmpty}
    contenteditable="true"
    role="textbox"
    aria-multiline="true"
    aria-label="Description editor"
    data-placeholder="Enter description..."
    on:input={handleInput}
    on:focus={handleFocus}
    on:blur={handleBlur}
    on:paste={handlePaste}
    on:keydown={handleKeydown}
  ></div>

</div>

<style>
  .rte {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 3px 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    border-bottom: none;
  }

  .tb-btn {
    appearance: none;
    background: transparent;
    color: var(--text-muted);
    border: 1px solid transparent;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    line-height: 1;
    font-family: inherit;
    padding: 0;
    transition: background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease;
  }

  .tb-btn:hover {
    background: var(--surface-2);
    color: var(--text);
    border-color: var(--border);
  }

  .tb-btn.active {
    background: var(--gold-dim);
    color: var(--gold-bright);
    border-color: var(--border-2);
  }

  .tb-btn:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 1px;
  }

  .tb-btn strong,
  .tb-btn em {
    font-size: 12px;
    line-height: 1;
  }

  .separator {
    width: 1px;
    height: 16px;
    background: var(--border);
    margin: 0 4px;
  }

  .editor {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 0 0 var(--radius-sm) var(--radius-sm);
    color: var(--text);
    padding: 8px 10px;
    min-height: 72px;
    max-height: 120px;
    overflow-y: auto;
    font-size: 13px;
    line-height: 1.45;
    outline: none;
    transition: border-color 0.12s ease, background-color 0.12s ease;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .editor:focus {
    border-color: var(--gold);
    background: var(--surface);
  }

  .editor.is-empty::before {
    content: attr(data-placeholder);
    color: var(--text-dim);
    pointer-events: none;
    display: block;
  }

  .editor :global(b),
  .editor :global(strong) {
    font-weight: 700;
  }

  .editor :global(i),
  .editor :global(em) {
    font-style: italic;
  }

  .editor :global(u) {
    text-decoration: underline;
  }


</style>
