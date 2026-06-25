<script lang="ts">
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import DropZone from '$lib/components/common/DropZone.svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import CardPreview from '$lib/components/CardPreview.svelte';
	import ImageCropper from '$lib/components/ImageCropper.svelte';
	import type { Card } from '$lib/components/CardCell.svelte';

	export let open = false;
	export let card: Card | null = null;

	// Layout settings forwarded to preview
	export let cardW: number;
	export let cardH: number;
	export let nameBandHeight: number;
	export let nameSize: number;
	export let descSize: number = 10;
	export let fitMode: 'cover' | 'contain' = 'cover';
	export let useParchment = true;
	export let parchmentIntensity = 0.35;
	export let mookUrl = '';
	export let coverUrl = '';
	export let orientation: 'portrait' | 'landscape' = 'portrait';

	// BG removal (passed through for handleFile)
	export let removeBgEnabled = false;
	export let bgColor = '#ffffff';
	export let tolerance = 32;

	const dispatch = createEventDispatcher<{
		save: Card;
		cancel: void;
	}>();

	let name = '';
	let desc = '';
	let rawImg: string | null = null; // uncropped source for the cropper
	let imgDataUrl: string | null = null; // cropped result used by preview / save
	let previewMode: 'front' | 'back' = 'front';
	let previewCardEl: HTMLElement | undefined;
	let pvEl: HTMLElement | undefined;
	let nameInputEl: HTMLInputElement | undefined;

	$: isEdit = card !== null;
	$: isLandscape = orientation === 'landscape';
	$: cropAspect = isLandscape ? cardH / cardW : cardW / cardH;
	$: canSave = name.trim().length > 0 && imgDataUrl !== null;
	$: previewCard = {
		id: card?.id ?? 'preview',
		name: name || '(empty)',
		img: imgDataUrl || '',
		desc: desc || undefined
	} as Card;

	// Populate fields when dialog opens
	$: if (open) {
		name = card?.name ?? '';
		desc = card?.desc ?? '';
		rawImg = card?.img ?? null;
		imgDataUrl = card?.img ?? null;
		previewMode = 'front';
	}

	async function switchPreview(mode: 'front' | 'back') {
		if (mode === previewMode) return;
		if (!pvEl || typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			previewMode = mode;
			return;
		}
		const out = pvEl.animate(
			[{ opacity: 1, transform: 'rotateY(0deg)' }, { opacity: 0, transform: 'rotateY(90deg)' }],
			{ duration: 130, easing: 'cubic-bezier(0.55,0,1,0.45)', fill: 'forwards' }
		);
		await out.finished;
		previewMode = mode;
		await tick();
		pvEl.animate(
			[{ opacity: 0, transform: 'rotateY(-90deg)' }, { opacity: 1, transform: 'rotateY(0deg)' }],
			{ duration: 130, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards' }
		);
	}

	function fileToDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	function hexToRgb(hex: string): [number, number, number] {
		const s = hex.replace('#', '');
		const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
		return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	}

	async function chromaKey(dataUrl: string, hex: string, tol: number): Promise<string> {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(img, 0, 0);
				const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const [tr, tg, tb] = hexToRgb(hex);
				const t2 = tol * tol;
				for (let i = 0; i < imgData.data.length; i += 4) {
					const dr = imgData.data[i] - tr;
					const dg = imgData.data[i + 1] - tg;
					const db = imgData.data[i + 2] - tb;
					if (dr * dr + dg * dg + db * db <= t2) imgData.data[i + 3] = 0;
				}
				ctx.putImageData(imgData, 0, 0);
				resolve(canvas.toDataURL('image/png'));
			};
			img.src = dataUrl;
		});
	}

	async function handleFile(file: File) {
		let dataUrl = await fileToDataUrl(file);
		if (removeBgEnabled) dataUrl = await chromaKey(dataUrl, bgColor, tolerance);
		rawImg = dataUrl;
		imgDataUrl = dataUrl; // replaced by the cropper's first emit
	}

	function handleCancel() {
		dispatch('cancel');
	}

	function handleSave() {
		if (!canSave) return;
		dispatch('save', {
			id: card?.id ?? crypto.randomUUID(),
			name: name.trim(),
			img: imgDataUrl!,
			desc: desc
		});
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') handleCancel();
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});

	// Focus name input when dialog opens
	$: if (open && nameInputEl) {
		tick().then(() => nameInputEl?.focus());
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="overlay"
		role="dialog"
		aria-modal="true"
		aria-label={isEdit ? 'Edit card' : 'Add card'}
		tabindex="-1"
		transition:fade={{ duration: 200 }}
		on:click|self={handleCancel}
		on:keydown={() => {}}
	>
		<!-- Panel -->
		<div
			class="panel"
			class:landscape={isLandscape}
			transition:scale={{ duration: 220, easing: cubicOut, start: 0.94 }}
		>
			<!-- Header -->
			<div class="dialog-header">
				<div class="dialog-title">
					<svg class="title-gem" width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
						<polygon points="10,1.5 18.5,10 10,18.5 1.5,10" fill="none" stroke="currentColor" stroke-width="1.5"/>
						<polygon points="10,5 15,10 10,15 5,10" fill="currentColor" opacity="0.35"/>
						<polygon points="10,7.5 12.5,10 10,12.5 7.5,10" fill="currentColor" opacity="0.65"/>
					</svg>
					<span>{isEdit ? 'Edit Card' : 'Add Card'}</span>
				</div>
				<button class="close-btn" type="button" aria-label="Close" on:click={handleCancel}>
					<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
						<line x1="2" y1="2" x2="14" y2="14"/>
						<line x1="14" y1="2" x2="2" y2="14"/>
					</svg>
				</button>
			</div>

			<!-- Body -->
			<div class="dialog-body">
				<!-- Left: form -->
				<div class="form-col">
					<!-- Name -->
					<div class="field-group">
						<label class="field-label" for="card-name">Card Name</label>
						<input
							id="card-name"
							bind:this={nameInputEl}
							class="field-input"
							bind:value={name}
							type="text"
							placeholder="Enter card title…"
							autocomplete="off"
						/>
					</div>

					<!-- Artwork -->
					<div class="field-group">
						<span class="field-label" aria-hidden="true">Artwork</span>
						{#if rawImg}
							<div class="crop-wrap">
								<ImageCropper
									src={rawImg}
									aspect={cropAspect}
									on:crop={(e) => (imgDataUrl = e.detail)}
								/>
								<button
									class="link-btn replace"
									type="button"
									on:click={() => {
										rawImg = null;
										imgDataUrl = null;
									}}
								>
									Replace image
								</button>
							</div>
						{:else}
							<DropZone
								line1="Drop artwork here or click to browse"
								line2="PNG · JPEG · WebP · max 50 MB"
								on:file={(e) => handleFile(e.detail.file)}
							/>
						{/if}
					</div>

					<!-- Description -->
					<div class="field-group desc-group">
						<span class="field-label" aria-hidden="true">
							Back Side
							<span class="field-hint">optional — leave blank for fantasy cover</span>
						</span>
						<RichTextEditor
							value={desc}
							on:change={(e) => { desc = e.detail; previewMode = 'back'; }}
							on:focus={() => switchPreview('back')}
						/>
					</div>
				</div>

				<!-- Right: preview -->
				<div class="preview-col">
					<div class="preview-header">
						<span class="preview-label">Preview</span>
						<div class="switch" role="group" aria-label="Preview side">
							<button
								type="button"
								class="sw-btn"
								class:active={previewMode === 'front'}
								on:click={() => switchPreview('front')}
							>Front</button>
							<button
								type="button"
								class="sw-btn"
								class:active={previewMode === 'back'}
								on:click={() => switchPreview('back')}
							>Back</button>
						</div>
					</div>
					<div class="pv" bind:this={pvEl}>
						<CardPreview
							mode={previewMode}
							card={previewCard}
							{cardW}
							{cardH}
							{nameBandHeight}
							{nameSize}
							{descSize}
							showCrop={false}
							{fitMode}
							{useParchment}
							{parchmentIntensity}
							{mookUrl}
							{coverUrl}
							{orientation}
							maxW={isLandscape ? 340 : 200}
							bind:el={previewCardEl}
						/>
					</div>
					<p class="preview-note">Live preview — changes update instantly</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="dialog-footer">
				<button class="btn ghost" type="button" on:click={handleCancel}>Cancel</button>
				<button
					class="btn cta"
					type="button"
					disabled={!canSave}
					on:click={handleSave}
				>
					{#if isEdit}
						<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M13.5 2.5a1.414 1.414 0 0 1 0 2L5 13l-3 1 1-3 8.5-8.5a1.414 1.414 0 0 1 2 0z"/>
						</svg>
						Save Changes
					{:else}
						<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
							<line x1="7" y1="1.5" x2="7" y2="12.5"/>
							<line x1="1.5" y1="7" x2="12.5" y2="7"/>
						</svg>
						Add Card
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ── Overlay ── */
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		background: rgba(0, 0, 0, 0.72);
		backdrop-filter: blur(8px) saturate(140%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}

	/* ── Panel ── */
	.panel {
		background: var(--surface);
		border: 1px solid var(--border-2);
		border-top: 1px solid rgba(201, 168, 76, 0.4);
		border-radius: var(--radius-lg);
		width: 100%;
		max-width: 760px;
		max-height: 90vh;
		transition: max-width 0.22s cubic-bezier(0.23, 1, 0.32, 1);
		display: flex;
		flex-direction: column;
		box-shadow:
			0 32px 80px rgba(0, 0, 0, 0.6),
			0 0 0 1px rgba(201, 168, 76, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.04);
		overflow: hidden;
	}

	/* Wider dialog + preview column when the card is landscape */
	.panel.landscape {
		max-width: 920px;
	}
	.panel.landscape .dialog-body {
		grid-template-columns: 1fr 380px;
	}

	/* ── Header ── */
	.dialog-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px 14px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	.dialog-title {
		display: flex;
		align-items: center;
		gap: 9px;
		font-family: 'Alegreya SC', serif;
		font-size: 15px;
		font-weight: 700;
		color: var(--gold);
		letter-spacing: 0.1em;
	}

	.title-gem {
		color: var(--gold);
		filter: drop-shadow(0 0 5px rgba(201, 168, 76, 0.4));
		flex-shrink: 0;
	}

	.close-btn {
		width: 30px;
		height: 30px;
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-muted);
		border-radius: var(--radius-sm);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s;
		padding: 0;
		flex-shrink: 0;
	}
	.close-btn:hover {
		background: var(--surface-2);
		border-color: var(--border-2);
		color: var(--text);
	}
	.close-btn:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}

	/* ── Body ── */
	.dialog-body {
		display: grid;
		grid-template-columns: 1fr 240px;
		gap: 0;
		overflow-y: auto;
		flex: 1;
		min-height: 0;
	}

	/* ── Form column ── */
	.form-col {
		padding: 20px 20px 20px 20px;
		display: flex;
		flex-direction: column;
		gap: 18px;
		border-right: 1px solid var(--border);
		overflow-y: auto;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 7px;
	}

	.desc-group {
		flex: 1;
	}

	.field-label {
		font-family: 'Alegreya SC', serif;
		font-size: 9.5px;
		font-weight: 400;
		letter-spacing: 0.14em;
		color: var(--gold);
		opacity: 0.8;
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.field-hint {
		font-family: inherit;
		font-size: 10px;
		color: var(--text-dim);
		opacity: 1;
		letter-spacing: 0.02em;
		font-style: italic;
	}

	.field-input {
		box-sizing: border-box;
		border: 1px solid var(--border-2);
		border-radius: var(--radius-sm);
		padding: 0 12px;
		height: 42px;
		font-size: 14px;
		background: var(--surface-2);
		color: var(--text);
		width: 100%;
		font-family: inherit;
		transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
	}
	.field-input::placeholder { color: var(--text-dim); }
	.field-input:focus {
		outline: none;
		border-color: var(--gold);
		background: var(--surface);
		box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.1);
	}

	.link-btn {
		background: none;
		border: none;
		padding: 0;
		font-size: 12px;
		color: var(--gold);
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
		font-family: inherit;
	}
	.link-btn:hover { color: var(--gold-bright); }

	/* Crop editor */
	.crop-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 12px;
		border: 1px solid var(--border-2);
		border-radius: var(--radius-sm);
		background: var(--surface-2);
	}
	.link-btn.replace {
		align-self: center;
	}

	/* ── Preview column ── */
	.preview-col {
		padding: 20px 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		background: var(--bg-mid);
	}

	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.preview-label {
		font-family: 'Alegreya SC', serif;
		font-size: 9px;
		letter-spacing: 0.14em;
		color: var(--gold);
		opacity: 0.7;
	}

	.switch {
		display: flex;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 2px;
		gap: 2px;
	}

	.sw-btn {
		background: transparent;
		border: none;
		padding: 3px 10px;
		font-size: 11px;
		font-weight: 500;
		color: var(--text-muted);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s;
		font-family: inherit;
	}
	.sw-btn:hover { color: var(--text); }
	.sw-btn.active {
		background: var(--surface-2);
		color: var(--gold);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
	}

	.pv {
		display: flex;
		justify-content: center;
		width: 100%;
	}

	.preview-note {
		margin: 0;
		font-size: 10px;
		color: var(--text-dim);
		text-align: center;
		line-height: 1.4;
	}

	/* ── Footer ── */
	.dialog-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 10px;
		padding: 14px 20px;
		border-top: 1px solid var(--border);
		flex-shrink: 0;
		background: var(--bg-mid);
	}

	/* ── Buttons ── */
	.btn {
		border: 1px solid var(--border-2);
		background: var(--surface);
		color: var(--text);
		border-radius: var(--radius-sm);
		height: 38px;
		padding: 0 16px;
		font-size: 13px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 7px;
		transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.08s;
		white-space: nowrap;
	}
	.btn:hover { background: var(--surface-2); border-color: var(--gold); }
	.btn:active { transform: scale(0.97); }
	.btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

	.btn.ghost {
		background: transparent;
		border-color: var(--border);
		color: var(--text-muted);
	}
	.btn.ghost:hover { background: var(--surface); border-color: var(--border-2); color: var(--text); }

	.btn.cta {
		background: linear-gradient(140deg, var(--gold) 0%, var(--gold-bright) 100%);
		color: var(--bg);
		border-color: transparent;
		font-weight: 700;
		letter-spacing: 0.03em;
		padding: 0 20px;
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
		opacity: 0.38;
		cursor: not-allowed;
		transform: none;
	}

	/* ── Responsive ── */
	@media (max-width: 600px) {
		.dialog-body {
			grid-template-columns: 1fr;
		}
		.preview-col {
			border-right: none;
			border-top: 1px solid var(--border);
		}
		.form-col { border-right: none; }
	}
</style>
