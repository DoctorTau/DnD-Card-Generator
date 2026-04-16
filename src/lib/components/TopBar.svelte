<script lang="ts">
	import DropZone from '$lib/components/common/DropZone.svelte';

	export let name = '';
	export let desc = '';
	export let imageDataUrl: string | null = null;
	export let showLayout = false;
	/** Shown under General actions, e.g. a4 210×297mm (front) */
	export let sheetFootnote = 'a4 210×297mm';
	export let onMakePdf: () => void;
	export let onClearAll: () => void;
	export let onToggleLayout: () => void;
	export let onAddCard: () => void;
	export let onRemoveImage: () => void;
	export let onLimitDesc: () => void;
	export let onHandleFile: (file: File) => void;
	export let flying = false;
	export let pdfLoading = false;

	const DESC_LIMIT = 500;

	$: canAddCard = !flying && imageDataUrl && name.trim() && desc.length <= DESC_LIMIT;

	let addBtnEl: HTMLButtonElement | undefined;
	let _prevCanAddCard = false;
	$: {
		if (canAddCard && !_prevCanAddCard && addBtnEl) {
			addBtnEl.classList.remove('ready-pulse');
			void addBtnEl.offsetWidth;
			addBtnEl.classList.add('ready-pulse');
		}
		_prevCanAddCard = !!canAddCard;
	}
</script>

<div class="topbar">
	<div class="topbar-inner">
		<section class="block general">
			<h2 class="block-title">General</h2>
			<div class="btn-row">
				<button class="btn pill" class:loading={pdfLoading} on:click={onMakePdf} disabled={pdfLoading}>
					{#if pdfLoading}<span class="spinner"></span>{/if}Make PDF
				</button>
				<button class="btn pill ghost" on:click={onClearAll}>Clear all</button>
				<button
					class="btn pill"
					type="button"
					aria-pressed={showLayout}
					on:click={onToggleLayout}
				>
					<svg class="sliders-ico" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
						<path
							fill="currentColor"
							d="M4 6h2v2H4V6zm4 0h14v2H8V6zM4 11h8v2H4v-2zm10 0h10v2H14v-2zM4 16h5v2H4v-2zm7 0h13v2H11v-2z"
						/>
					</svg>
					Layout settings
				</button>
			</div>
			<p class="sheet-meta">{sheetFootnote}</p>
		</section>

		<div class="rule"></div>

		<section class="block name-block">
			<h2 class="block-title">Name</h2>
			<div class="name-field">
				<input
					class="field-input"
					bind:value={name}
					type="text"
					placeholder="Enter Name"
					autocomplete="off"
				/>
				<div class="field-foot-spacer" aria-hidden="true"></div>
			</div>
		</section>

		<div class="rule"></div>

		<section class="block image-block">
			<h2 class="block-title">Image</h2>
			<div class="image-field">
				{#if imageDataUrl}
					<div class="thumb-row">
						<img src={imageDataUrl} alt="" class="card-thumb" />
						<button class="btn pill small ghost" type="button" on:click={onRemoveImage}>Remove</button>
					</div>
				{:else}
					<div class="dz-wrap">
						<DropZone
							compact
							hideLine2
							line1="Click to drop or browse image"
							on:file={(e) => onHandleFile(e.detail.file)}
						/>
					</div>
				{/if}
				<p class="image-formats-hint">PNG, JPEG, WebP — up to 50 MB</p>
			</div>
		</section>

		<div class="rule"></div>

		<section class="block desc-block">
			<h2 class="block-title">Description (back)</h2>
			<div class="desc-field">
				<input
					class="field-input desc-input"
					bind:value={desc}
					type="text"
					maxlength={DESC_LIMIT}
					placeholder="Enter Here"
					autocomplete="off"
					on:input={onLimitDesc}
				/>
				<div class="counter" data-danger={desc.length >= DESC_LIMIT}>
					{desc.length}/{DESC_LIMIT}{desc.length >= DESC_LIMIT ? ' — Limit reached' : ''}
				</div>
			</div>
		</section>

		<div class="rule"></div>

		<section class="block action-block">
			<div class="action-title-gap" aria-hidden="true"></div>
			<button
				class="btn pill primary"
				bind:this={addBtnEl}
				type="button"
				on:click={onAddCard}
				disabled={!canAddCard}
				on:animationend={() => addBtnEl?.classList.remove('ready-pulse')}>Add Card</button>
		</section>
	</div>
</div>

<style>
	.btn {
		border: 1px solid var(--border-2);
		background: var(--surface);
		color: var(--text);
		border-radius: var(--radius-sm);
		height: 40px;
		padding: 0 14px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s, transform 0.08s;
		white-space: nowrap;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}
	.btn.pill {
		border-radius: var(--radius-sm);
	}
	.btn:hover {
		background: var(--surface-2);
		border-color: var(--gold);
	}
	.btn:active {
		transform: scale(0.97);
	}
	.sliders-ico {
		opacity: 0.85;
		flex-shrink: 0;
	}
	.btn.primary {
		background: linear-gradient(135deg, var(--gold) 0%, var(--gold-bright) 100%);
		color: var(--bg);
		border-color: transparent;
		font-weight: 700;
		letter-spacing: 0.02em;
		position: relative;
		overflow: hidden;
	}
	.btn.primary::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			105deg,
			transparent 30%,
			rgba(255, 255, 255, 0.28) 50%,
			transparent 70%
		);
		transform: translateX(-120%);
		transition: transform 0s;
	}
	.btn.primary:not(:disabled):hover::after {
		transform: translateX(120%);
		transition: transform 560ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.btn.primary:hover {
		background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%);
	}
	.btn.primary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		transform: none;
	}
	.action-block .btn.primary {
		min-width: 112px;
		padding: 0 20px;
	}
	.btn:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}
	.btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
		transform: none;
	}
	.btn.loading {
		gap: 6px;
	}
	.spinner {
		width: 13px;
		height: 13px;
		border: 2px solid var(--border-2);
		border-top-color: var(--gold);
		border-radius: 50%;
		animation: spin 600ms linear infinite;
		flex-shrink: 0;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes readyPulse {
		0% {
			box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.55);
		}
		50% {
			box-shadow: 0 0 0 10px rgba(201, 168, 76, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(201, 168, 76, 0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}

	/* class toggled from script on Add Card */
	.topbar :global(button.ready-pulse) {
		animation: readyPulse 420ms cubic-bezier(0.23, 1, 0.32, 1) both;
	}
	@media (prefers-reduced-motion: reduce) {
		.topbar :global(button.ready-pulse) {
			animation: none;
		}
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
		height: auto;
		padding: 5px 10px;
		font-size: 12px;
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 20;
		border-bottom: 1px solid var(--border);
		backdrop-filter: blur(20px) saturate(180%);
		background: var(--topbar-bg);
	}
	.topbar-inner {
		--toolbar-title-h: 1.375rem;
		--toolbar-label-gap: 6px;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 0;
		padding: 12px 18px 14px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.block {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--toolbar-label-gap);
		padding: 0 14px;
		min-width: 0;
	}
	.block:first-child {
		padding-left: 0;
	}
	.block:last-child {
		padding-right: 0;
	}
	.general {
		flex: 0 0 auto;
		max-width: 100%;
	}
	.name-block {
		flex: 0 1 160px;
		min-width: 140px;
	}
	.image-block {
		flex: 1 1 220px;
		min-width: 200px;
		max-width: 320px;
	}
	.desc-block {
		flex: 1 1 200px;
		min-width: 160px;
		max-width: 280px;
	}
	.action-block {
		flex: 0 0 auto;
		align-items: stretch;
		/* Spacer already equals title row + gap; avoid double gap before button */
		gap: 0;
	}
	/* Same label row height in every column so controls share one horizontal line */
	.general .block-title,
	.name-block .block-title,
	.image-block .block-title,
	.desc-block .block-title {
		min-height: var(--toolbar-title-h);
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}
	.block-title {
		margin: 0;
		font-size: 13px;
		font-weight: 700;
		color: var(--text);
		letter-spacing: 0.01em;
		line-height: 1.25;
	}
	.name-field,
	.desc-field,
	.image-field {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.field-foot-spacer {
		margin-top: 2px;
		min-height: 14px;
		flex-shrink: 0;
	}
	.image-field {
		gap: 0;
	}
	.image-formats-hint {
		margin: 2px 0 0;
		font-size: 10px;
		font-weight: 500;
		color: var(--text-dim);
		line-height: 1.3;
		min-height: 14px;
	}
	.btn-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}
	.sheet-meta {
		margin: 2px 0 0;
		font-size: 11px;
		color: var(--text-dim);
		line-height: 1.3;
	}

	.action-title-gap {
		min-height: calc(var(--toolbar-title-h) + var(--toolbar-label-gap));
		flex-shrink: 0;
	}
	.rule {
		width: 1px;
		align-self: stretch;
		min-height: 4rem;
		background: var(--border);
		margin: 0 10px;
		flex-shrink: 0;
	}
	@media (max-width: 900px) {
		.rule {
			display: none;
		}
		.block {
			padding: 0;
			border-bottom: 1px solid var(--border);
			padding-bottom: 12px;
			margin-bottom: 4px;
			width: 100%;
			max-width: none;
		}
		.action-block {
			border-bottom: none;
			align-items: stretch;
			padding-top: calc(var(--toolbar-title-h) + var(--toolbar-label-gap));
		}
		.action-title-gap {
			display: none;
		}
	}

	.field-input {
		box-sizing: border-box;
		border: 1px solid var(--border-2);
		border-radius: var(--radius-sm);
		padding: 0 12px;
		height: 40px;
		font-size: 14px;
		line-height: 1.25;
		background: var(--surface);
		color: var(--text);
		width: 100%;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.field-input::placeholder {
		color: var(--text-dim);
	}
	.field-input:focus {
		outline: none;
		border-color: var(--gold);
		box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.12);
	}

	.desc-field .counter {
		margin-top: 2px;
		color: var(--text-dim);
		font-size: 10px;
		font-weight: 400;
		line-height: 1.3;
		min-height: 14px;
	}
	.desc-field .counter[data-danger='true'] {
		color: #e05252;
	}

	.dz-wrap {
		width: 100%;
		min-width: 0;
	}
	.dz-wrap :global(.dz) {
		min-width: unset;
	}

	.thumb-row {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 40px;
	}
	.card-thumb {
		height: 34px;
		width: auto;
		max-width: 120px;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-2);
	}
</style>
