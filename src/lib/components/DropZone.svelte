<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{ file: File }>();

  const { accept = 'image/*', label = 'Drag & drop image here or click to choose' } = $props();
  let hovering = $state(false);
  let fileInput: HTMLInputElement;

  function onDrop(e: DragEvent) {
    e.preventDefault();
    hovering = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) dispatch('file', f);
  }
  function onDragOver(e: DragEvent) { e.preventDefault(); hovering = true; }
  function onDragLeave() { hovering = false; }
  function onPick(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) dispatch('file', f);
  }
  function openPicker() { fileInput.click(); }
</script>

<div
  class="dz"
  data-hovering={hovering}
  on:dragover={onDragOver}
  on:dragleave={onDragLeave}
  on:drop={onDrop}
  on:click={openPicker}
  role="button"
  tabindex="0"
  on:keydown={(e)=> (e.key==='Enter'||e.key===' ') && openPicker()}
  aria-label="Upload image"
>
  <div class="hint">
    <div class="title">{label}</div>
    <div class="sub">PNG/JPEG. Max ~50 MB (зависит от браузера).</div>
  </div>
  <input bind:this={fileInput} class="hidden" type="file" {accept} on:change={onPick} />
</div>

<style>
  .dz {
    display:flex; align-items:center; justify-content:center;
    min-width: 260px; min-height: 120px;
    border:2px dashed #cbd5e1; border-radius: 14px;
    background: #ffffff; cursor: pointer; user-select:none;
    transition: background .15s, border-color .15s, transform .08s;
  }
  .dz:hover { background:#f8fafc; }
  .dz[data-hovering="true"] {
    background: #eef2ff; border-color:#6366f1; transform: scale(0.998);
  }
  .hidden { display:none; }
  .hint { text-align:center; padding: 12px; }
  .title { font-size: 14px; font-weight: 600; color:#0f172a; }
  .sub { font-size: 12px; color:#64748b; margin-top: 2px; }
</style>