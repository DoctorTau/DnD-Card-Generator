<script lang="ts">
	import DropZone from '$lib/components/common/DropZone.svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import { createEventDispatcher } from 'svelte';

	export let name = '';
	export let desc = '';
	export let imageDataUrl: string | null = null;
	export let showLayout = false;
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

	const dispatch = createEventDispatcher<{ descFocus: void }>();

	const DESC_LIMIT = 500;

	function descTextLen(html: string): number {
		const tmp = document.createElement('div');
		tmp.innerHTML = html;
		return (tmp.textContent ?? '').length;
	}

	$: canAddCard = !flying && imageDataUrl && name.trim() && descTextLen(desc) <= DESC_LIMIT;

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

		<!-- ── Brand + actions ── -->
		<section class="block brand-block">
			<div class="brand" aria-label="Card Forge">
				<svg class="brand-gem" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
					<polygon points="10,1.5 18.5,10 10,18.5 1.5,10" fill="none" stroke="currentColor" stroke-width="1.4"/>
					<polygon points="10,5 15,10 10,15 5,10" fill="currentColor" opacity="0.3"/>
					<polygon points="10,7.5 12.5,10 10,12.5 7.5,10" fill="currentColor" opacity="0.6"/>
				</svg>
				<span class="brand-name">Card Forge</span>
			</div>

			<div class="action-row">
				<button
					class="btn pdf-btn"
					class:loading={pdfLoading}
					on:click={onMakePdf}
					disabled={pdfLoading}
					aria-label={pdfLoading ? 'Generating PDF…' : 'Make PDF'}
				>
					{#if pdfLoading}
						<span class="spinner" aria-hidden="true"></span>
					{:else}
						<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<rect x="2.5" y="1" width="11" height="14" rx="1.5"/>
							<line x1="5.5" y1="5.5" x2="10.5" y2="5.5"/>
							<line x1="5.5" y1="8.5" x2="10.5" y2="8.5"/>
							<line x1="5.5" y1="11.5" x2="8.5" y2="11.5"/>
						</svg>
					{/if}
					Make PDF
				</button>

				<button
					class="btn icon-btn"
					class:active={showLayout}
					type="button"
					aria-pressed={showLayout}
					aria-label="Layout settings"
					title="Layout settings"
					on:click={onToggleLayout}
				>
					<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
						<path fill="currentColor" d="M4 6h2v2H4V6zm4 0h14v2H8V6zM4 11h8v2H4v-2zm10 0h10v2H14v-2zM4 16h5v2H4v-2zm7 0h13v2H11v-2z"/>
					</svg>
				</button>

				<button class="btn ghost tiny" on:click={onClearAll}>Clear</button>
			</div>

			<p class="sheet-meta">
				<svg width="5" height="5" viewBox="0 0 6 6" aria-hidden="true" class="meta-gem">
					<polygon points="3,0 6,3 3,6 0,3" fill="currentColor"/>
				</svg>
				{sheetFootnote}
			</p>
		</section>

		<div class="rule" aria-hidden="true"><span>◆</span></div>

		<!-- ── Name ── -->
		<section class="block name-block">
			<h2 class="block-title">Name</h2>
			<div class="name-field">
				<input
					class="field-input"
					bind:value={name}
					type="text"
					placeholder="Card title"
					autocomplete="off"
				/>
			</div>
		</section>

		<div class="rule" aria-hidden="true"><span>◆</span></div>

		<!-- ── Image ── -->
		<section class="block image-block">
			<h2 class="block-title">Artwork</h2>
			<div class="image-field">
				{#if imageDataUrl}
					<div class="thumb-row">
						<img src={imageDataUrl} alt="Card artwork thumbnail" class="card-thumb" />
						<button class="btn ghost tiny" type="button" on:click={onRemoveImage}>Remove</button>
					</div>
				{:else}
					<div class="dz-wrap">
						<DropZone
							compact
							hideLine2
							line1="Drop or browse artwork"
							on:file={(e) => onHandleFile(e.detail.file)}
						/>
					</div>
				{/if}
				<p class="image-formats-hint">PNG · JPEG · WebP · max 50 MB</p>
			</div>
		</section>

		<div class="rule" aria-hidden="true"><span>◆</span></div>

		<!-- ── Description ── -->
		<section class="block desc-block">
			<h2 class="block-title">Back Side</h2>
			<div class="desc-field">
				<RichTextEditor
					value={desc}
					maxLength={DESC_LIMIT}
					on:change={(e) => { desc = e.detail; onLimitDesc(); }}
					on:focus={() => dispatch('descFocus')}
				/>
			</div>
		</section>

		<div class="rule" aria-hidden="true"><span>◆</span></div>

		<!-- ── Add Card CTA ── -->
		<section class="block action-block">
			<div class="action-title-gap" aria-hidden="true"></div>
			<button
				class="btn cta"
				bind:this={addBtnEl}
				type="button"
				on:click={onAddCard}
				disabled={!canAddCard}
				on:animationend={() => addBtnEl?.classList.remove('ready-pulse')}
			>
				<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
					<line x1="6" y1="1.5" x2="6" y2="10.5"/>
					<line x1="1.5" y1="6" x2="10.5" y2="6"/>
				</svg>
				Add Card
			</button>
		</section>

	</div>
</div>

<style>
	/* ── Topbar shell ── */
	.topbar {
		position: sticky;
		top: 0;
		z-index: 20;
		border-top: 1px solid rgba(201, 168, 76, 0.38);
		border-bottom: 1px solid var(--border);
		backdrop-filter: blur(24px) saturate(200%);
		background: var(--topbar-bg);
	}

	.topbar-inner {
		--toolbar-title-h: 1.375rem;
		--toolbar-label-gap: 8px;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 0;
		padding: 12px 20px 14px;
		max-width: 1400px;
		margin: 0 auto;
	}

	/* ── Blocks ── */
	.block {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--toolbar-label-gap);
		padding: 0 12px;
		min-width: 0;
	}
	.block:first-child { padding-left: 0; }
	.block:last-child  { padding-right: 0; }

	.brand-block { flex: 0 0 auto; gap: 9px; }
	.name-block  { flex: 0 1 160px; min-width: 130px; }
	.image-block { flex: 1 1 210px; min-width: 190px; max-width: 310px; }
	.desc-block  { flex: 2 1 260px; min-width: 200px; max-width: 390px; }
	.action-block {
		flex: 0 0 auto;
		align-items: stretch;
		gap: 0;
	}

	/* ── Block titles ── */
	.block-title {
		margin: 0;
		font-family: 'Alegreya SC', serif;
		font-size: 9.5px;
		font-weight: 400;
		letter-spacing: 0.14em;
		color: var(--gold);
		opacity: 0.72;
		line-height: 1.25;
		min-height: var(--toolbar-title-h);
		display: flex;
		align-items: flex-end;
	}

	/* ── Brand ── */
	.brand {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.brand-gem {
		color: var(--gold);
		flex-shrink: 0;
		filter: drop-shadow(0 0 4px rgba(201, 168, 76, 0.35));
	}

	.brand-name {
		font-family: 'Alegreya SC', serif;
		font-size: 14px;
		font-weight: 700;
		color: var(--gold);
		letter-spacing: 0.12em;
		line-height: 1;
		opacity: 0.9;
	}

	.action-row {
		display: flex;
		gap: 6px;
		align-items: center;
		flex-wrap: wrap;
	}

	.sheet-meta {
		margin: 0;
		font-size: 10px;
		color: var(--text-dim);
		display: flex;
		align-items: center;
		gap: 5px;
		line-height: 1.3;
		letter-spacing: 0.02em;
	}

	.meta-gem {
		color: var(--gold);
		opacity: 0.4;
		flex-shrink: 0;
	}

	/* ── Diamond separator ── */
	.rule {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 8px;
		align-self: stretch;
		flex-shrink: 0;
		user-select: none;
		pointer-events: none;
	}

	.rule span {
		font-size: 5px;
		color: var(--gold);
		opacity: 0.28;
	}

	/* ── Fields ── */
	.name-field,
	.desc-field,
	.image-field {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.image-field { gap: 0; }

	.image-formats-hint {
		margin: 3px 0 0;
		font-size: 9.5px;
		color: var(--text-dim);
		line-height: 1.4;
		letter-spacing: 0.02em;
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
		font-family: inherit;
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	.field-input::placeholder { color: var(--text-dim); }

	.field-input:focus {
		outline: none;
		border-color: var(--gold);
		box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.1);
	}

	/* ── Buttons — base ── */
	.btn {
		border: 1px solid var(--border-2);
		background: var(--surface);
		color: var(--text);
		border-radius: var(--radius-sm);
		height: 36px;
		padding: 0 13px;
		font-size: 12.5px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s,
			transform 0.08s,
			box-shadow 0.15s;
		white-space: nowrap;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		letter-spacing: 0.01em;
	}

	.btn:hover {
		background: var(--surface-2);
		border-color: var(--gold);
		color: var(--gold-bright);
	}

	.btn:active { transform: scale(0.96); }

	.btn:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}

	.btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		transform: none;
	}

	/* Ghost */
	.btn.ghost {
		background: transparent;
		border-color: var(--border);
		color: var(--text-muted);
	}

	.btn.ghost:hover {
		background: var(--surface);
		border-color: var(--border-2);
		color: var(--text);
	}

	/* Tiny */
	.btn.tiny {
		height: 30px;
		padding: 0 10px;
		font-size: 11.5px;
	}

	/* Icon-only (Layout Settings toggle) */
	.btn.icon-btn {
		width: 36px;
		height: 36px;
		padding: 0;
		background: transparent;
		border-color: var(--border);
		color: var(--text-muted);
	}

	.btn.icon-btn:hover {
		background: var(--surface-2);
		border-color: var(--gold);
		color: var(--gold-bright);
	}

	.btn.icon-btn.active {
		background: var(--gold-dim);
		border-color: var(--gold);
		color: var(--gold);
	}

	/* Make PDF — outlined gold */
	.btn.pdf-btn {
		background: var(--gold-dim);
		border-color: var(--border-2);
		color: var(--gold-bright);
		font-weight: 600;
	}

	.btn.pdf-btn:hover:not(:disabled) {
		background: rgba(201, 168, 76, 0.18);
		border-color: var(--gold);
		box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.07);
	}

	.btn.pdf-btn.loading { gap: 6px; }

	/* Add Card CTA */
	.btn.cta {
		background: linear-gradient(140deg, var(--gold) 0%, var(--gold-bright) 100%);
		color: var(--bg);
		border-color: transparent;
		font-weight: 700;
		font-size: 13px;
		letter-spacing: 0.03em;
		height: 40px;
		min-width: 116px;
		padding: 0 18px;
		position: relative;
		overflow: hidden;
	}

	.btn.cta::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(105deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
		transform: translateX(-120%);
		transition: transform 0s;
	}

	.btn.cta:not(:disabled):hover::after {
		transform: translateX(120%);
		transition: transform 560ms cubic-bezier(0.23, 1, 0.32, 1);
	}

	.btn.cta:not(:disabled):hover {
		background: linear-gradient(140deg, var(--gold-bright) 0%, var(--gold) 100%);
	}

	.btn.cta:disabled {
		opacity: 0.35;
		cursor: not-allowed;
		transform: none;
	}

	/* ── Spinner ── */
	.spinner {
		width: 12px;
		height: 12px;
		border: 1.5px solid rgba(201, 168, 76, 0.25);
		border-top-color: var(--gold);
		border-radius: 50%;
		animation: spin 600ms linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin { to { transform: rotate(360deg); } }

	@media (prefers-reduced-motion: reduce) {
		.spinner { animation: none; }
	}

	/* ── Ready pulse (Add Card becomes available) ── */
	.topbar :global(button.ready-pulse) {
		animation: readyPulse 420ms cubic-bezier(0.23, 1, 0.32, 1) both;
	}

	@keyframes readyPulse {
		0%   { box-shadow: 0 0 0 0   rgba(201, 168, 76, 0.55); }
		50%  { box-shadow: 0 0 0 10px rgba(201, 168, 76, 0); }
		100% { box-shadow: 0 0 0 0   rgba(201, 168, 76, 0); }
	}

	@media (prefers-reduced-motion: reduce) {
		.topbar :global(button.ready-pulse) { animation: none; }
	}

	/* ── action-title-gap — keeps CTA aligned with field row ── */
	.action-title-gap {
		min-height: calc(var(--toolbar-title-h) + var(--toolbar-label-gap));
		flex-shrink: 0;
	}

	/* ── Image section ── */
	.thumb-row {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 40px;
	}

	.card-thumb {
		height: 34px;
		width: auto;
		max-width: 110px;
		object-fit: cover;
		border-radius: 6px;
		border: 1px solid rgba(201, 168, 76, 0.45);
		opacity: 0.9;
		transition: opacity 0.15s, border-color 0.15s;
	}

	.card-thumb:hover { opacity: 1; border-color: var(--gold); }

	.dz-wrap { width: 100%; min-width: 0; }
	.dz-wrap :global(.dz) { min-width: unset; }

	/* ── Responsive ── */
	@media (max-width: 900px) {
		.rule { display: none; }

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

		.action-title-gap { display: none; }
	}
</style>
