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
		border: 1px solid #e5e7eb;
		background: white;
		border-radius: 14px;
		padding: 8px 14px;
		font-size: 14px;
		cursor: pointer;
	}
	.btn:hover {
		background: #f8fafc;
	}
	.btn.primary {
		background: #0f172a;
		color: white;
		border-color: #0f172a;
	}
	.btn.primary:hover {
		opacity: 0.95;
	}
	.btn.primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn.ghost {
		background: transparent;
	}
	.btn.small {
		padding: 6px 10px;
		font-size: 12px;
	}

	.card-thumb {
		width: 48px;
		height: 64px;
		object-fit: cover;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 20;
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 12px;
		padding: 10px 16px;
		border-bottom: 1px solid #e5e7eb;
		backdrop-filter: blur(6px);
		background: rgba(255, 255, 255, 0.8);
	}
	.left {
		display: flex;
		gap: 8px;
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
		font-size: 12px;
	}
	.field input,
	.field textarea {
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 8px 10px;
		font-size: 14px;
		min-width: 200px;
	}
	.field textarea {
		width: 320px;
		height: 96px;
	}
	.counter {
		margin-top: 4px;
		color: #64748b;
		font-size: 12px;
	}
	.counter[data-danger='true'] {
		color: #b91c1c;
	}

	.thumbRow {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 8px;
	}
</style>
