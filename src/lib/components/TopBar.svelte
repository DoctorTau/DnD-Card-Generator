<script lang="ts">
	import DropZone from '$lib/components/common/DropZone.svelte';

	// Props
	export let name = '';
	export let desc = '';
	export let imageDataUrl: string | null = null;
	export let showLayout = false;
	export let onMakePdf: () => void;
	export let onClearAll: () => void;
	export let onToggleLayout: () => void;
	export let onAddCard: () => void;
	export let onRemoveImage: () => void;
	export let onLimitDesc: () => void;
	export let onHandleFile: (file: File) => void;

	const DESC_LIMIT = 500;

	$: canAddCard = imageDataUrl && name.trim() && desc.length <= DESC_LIMIT;
</script>

<div class="topbar">
	<div class="left">
		<button class="btn" on:click={onMakePdf}>Make PDF</button>
		<button class="btn ghost" on:click={onClearAll}>Clear all</button>
		<button class="btn" on:click={onToggleLayout}>
			{showLayout ? 'Hide' : 'Layout Settings'}
		</button>
	</div>

	<div class="sep"></div>

	<div class="controls">
		<label class="field">
			<span>Name</span>
			<input bind:value={name} placeholder="e.g., Sunforged Amulet / Lady Seraphine" />
		</label>

		<label class="field">
			<span>Image</span>
			{#if imageDataUrl}
				<div class="thumb-row">
					<img src={imageDataUrl} alt="preview" class="card-thumb" />
					<button class="btn small ghost" on:click={onRemoveImage}>Remove</button>
				</div>
			{:else}
				<div class="dz-wrap">
					<DropZone on:file={(e) => onHandleFile(e.detail.file)} />
				</div>
			{/if}
		</label>

		<label class="field">
			<span>Description (back)</span>
			<textarea bind:value={desc} on:input={onLimitDesc} placeholder="Charges: 3. As an action..."
			></textarea>
			<div class="counter" data-danger={desc.length >= DESC_LIMIT}>
				{desc.length}/{DESC_LIMIT}
				{desc.length >= DESC_LIMIT ? '— limit reached' : ''}
			</div>
		</label>

		<button class="btn primary" on:click={onAddCard} disabled={!canAddCard}>Add Card</button>
	</div>
</div>

<style>
	.btn {
		border: 1px solid var(--border-2);
		background: var(--surface);
		color: var(--text);
		border-radius: var(--radius-md);
		padding: 8px 16px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s, transform 0.08s;
		white-space: nowrap;
	}
	.btn:hover {
		background: var(--surface-2);
		border-color: var(--gold);
	}
	.btn:active {
		transform: scale(0.97);
	}
	.btn.primary {
		background: linear-gradient(135deg, var(--gold) 0%, var(--gold-bright) 100%);
		color: var(--bg);
		border-color: transparent;
		font-weight: 700;
		letter-spacing: 0.02em;
	}
	.btn.primary:hover {
		background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%);
	}
	.btn.primary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		transform: none;
	}
	.btn:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}
	.btn.ghost {
		background: transparent;
		border-color: var(--border);
		color: var(--text-muted);
	}
	.btn.ghost:hover {
		color: var(--text);
		border-color: var(--border-2);
		background: var(--surface);
	}
	.btn.small {
		padding: 5px 10px;
		font-size: 12px;
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0;
		padding: 10px 20px;
		border-bottom: 1px solid var(--border);
		backdrop-filter: blur(20px) saturate(180%);
		background: var(--topbar-bg);
	}
	.left {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-shrink: 0;
	}
	.sep {
		width: 1px;
		height: 32px;
		background: var(--border-2);
		margin: 0 16px;
		flex-shrink: 0;
	}
	.controls {
		display: flex;
		flex-wrap: nowrap;
		gap: 10px;
		align-items: center;
		flex: 1;
		min-width: 0;
	}

	.field {
		display: flex;
		flex-direction: column;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
		gap: 4px;
		flex-shrink: 0;
	}
	.field input,
	.field textarea {
		border: 1px solid var(--border-2);
		border-radius: var(--radius-sm);
		padding: 8px 12px;
		font-size: 14px;
		background: var(--surface);
		color: var(--text);
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.field input {
		width: 220px;
	}
	.field input:focus,
	.field textarea:focus {
		outline: none;
		border-color: var(--gold);
		box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
	}
	.field textarea {
		width: 240px;
		height: 56px;
		resize: none;
		font-family: inherit;
	}
	.counter {
		margin-top: 2px;
		color: var(--text-dim);
		font-size: 11px;
		font-weight: 400;
		text-transform: none;
		letter-spacing: 0;
	}
	.counter[data-danger='true'] {
		color: #e05252;
	}

	.dz-wrap {
		width: 200px;
	}
	.dz-wrap :global(.dz) {
		min-width: unset;
		min-height: 56px;
		border-radius: 8px;
	}
	.dz-wrap :global(.hint) {
		padding: 8px 12px;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8px;
		text-align: left;
	}
	.dz-wrap :global(.icon) {
		font-size: 18px;
		margin-bottom: 0;
	}
	.dz-wrap :global(.title) {
		font-size: 11px;
	}
	.dz-wrap :global(.sub) {
		font-size: 10px;
		margin-top: 1px;
	}

	.thumb-row {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 56px;
	}
	.card-thumb {
		height: 48px;
		width: auto;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-2);
	}
</style>
