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

	<div class="grow"></div>

	<div class="controls">
		<label class="field">
			<span>Name</span>
			<input bind:value={name} placeholder="e.g., Sunforged Amulet / Lady Seraphine" />
		</label>

		<label class="field">
			<span>Image</span>

			<div style="display:flex;align-items:center;gap:12px">
				<div style="flex:1;min-width:200px;min-height:120px;display:flex;align-items:center">
					<!-- Drag & drop zone -->
					<DropZone on:file={(e) => onHandleFile(e.detail.file)} />
				</div>

				{#if imageDataUrl}
					<div class="thumbRow" style="align-items:center">
						<img
							src={imageDataUrl}
							alt="preview"
							class="card-thumb"
							style="height: 120px;width: 100%;"
						/>
						<button class="btn small ghost" on:click={onRemoveImage}>Remove</button>
					</div>
				{/if}
			</div>
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

		<button class="btn primary" on:click={onAddCard} disabled={!canAddCard}> Add Card </button>
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

	.card-thumb {
		width: 52px;
		height: 72px;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-2);
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 20;
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 16px;
		padding: 12px 20px;
		border-bottom: 1px solid var(--border);
		backdrop-filter: blur(20px) saturate(180%);
		background: var(--topbar-bg);
	}
	.left {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: end;
	}
	.grow {
		flex: 1;
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
	}
	.field input,
	.field textarea {
		border: 1px solid var(--border-2);
		border-radius: var(--radius-sm);
		padding: 8px 12px;
		font-size: 14px;
		min-width: 200px;
		background: var(--surface);
		color: var(--text);
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.field input:focus,
	.field textarea:focus {
		outline: none;
		border-color: var(--gold);
		box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
	}
	.field textarea {
		width: 320px;
		height: 88px;
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

	.thumbRow {
		display: flex;
		align-items: center;
		gap: 8px;
	}
</style>
