<script lang="ts">
	import { onMount, tick } from 'svelte';
	import DropZone from '$lib/components/common/DropZone.svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import LayoutSettings from '$lib/components/LayoutSettings.svelte';
	import CardPreview from '$lib/components/CardPreview.svelte';
	import { browser } from '$app/environment';
	import { generatePdf } from '$lib/utils/pdfExport';
	import { fly, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	// ---------- Types ----------
	type Card = { id: string; name: string; img: string; desc?: string };

	// ---------- State ----------
	let name = '';
	let desc = '';
	let imageDataUrl: string | null = null;
	let cards: Card[] = [];

	// Layout
	let cardW = 63.5,
		cardH = 88.9,
		gap = 3,
		cols = 3,
		rows = 3;
	let showLayout = false;
	let showCrop = true;
	let nameSize = 12; // pt
	let nameBandHeight = 16; // mm
	let fitMode: 'cover' | 'contain' = 'cover';
	let generateBacks = true;

	// Visuals
	let useParchment = true;
	let parchmentIntensity = 0.35;
	let coverUrl = '';

	// Preview
	let previewMode: 'front' | 'back' = 'front';
	let previewCardEl: HTMLElement | undefined;
	let pvEl: HTMLElement | undefined;
	let flying = false;
	let pdfLoading = false;

	// Fonts
	let mookUrl = '';

	// BG removal (LOCAL chroma-key only)
	let removeBgEnabled = false;
	let bgColor = '#ffffff';
	let tolerance = 32;
	let autoRemoveOnAdd = true;

	// Drag & drop
	let dzHover = false;
	let fileInput: HTMLInputElement | null = null;

	// Limits
	const DESC_LIMIT = 500;

	// ---------- Head (fonts) ----------
	// Alegreya SC is in <svelte:head> below; Mookmania is injected dynamically
	onMount(() => {
		applyMookFace();
	});

	$: applyMookFace(); // re-apply if URL changes

	function applyMookFace() {
		if (!browser) return;
		const id = 'mookmania-face';
		const old = document.getElementById(id);
		if (old) old.remove();
		if (mookUrl) {
			const style = document.createElement('style');
			style.id = id;
			style.textContent = `@font-face{font-family:"Mookmania";src:url(${JSON.stringify(
				mookUrl
			)}) format("woff2");font-weight:400 700;font-style:normal;font-display:swap}`;
			document.head.appendChild(style);
		}
	}

	// ---------- Derived ----------
	$: sheetPadding = (() => {
		const A4W = 210,
			A4H = 297;
		const totalW = cols * cardW + (cols - 1) * gap;
		const totalH = rows * cardH + (rows - 1) * gap;
		const padX = Math.max(0, (A4W - totalW) / 2);
		const padY = Math.max(0, (A4H - totalH) / 2);
		return { padX, padY };
	})();

	$: slots = rows * cols;
	$: pagesFront = paginate(cards, slots);
	$: pagesBack = paginate(cards, slots);
	$: previewCard = {
		id: 'preview',
		name: name || '(empty)',
		img: imageDataUrl || '',
		desc: desc.trim() || undefined
	} as Card;

	function paginate<T>(arr: T[], size: number): T[][] {
		const out: T[][] = [];
		for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
		if (out.length === 0) out.push([]);
		return out;
	}
	function truncate(s: string, n: number) {
		return s.length <= n ? s : s.slice(0, n - 1) + '…';
	}
	function clamp(v: number, lo: number, hi: number) {
		return Math.min(hi, Math.max(lo, v));
	}
	function setNum(e: Event, set: (v: number) => void) {
		const v = Number((e.target as HTMLInputElement).value) || 0;
		set(v);
	}
	function mm(n: number) {
		return `${n}mm`;
	}
	function limitDesc() {
		if (desc.length > DESC_LIMIT) desc = desc.slice(0, DESC_LIMIT);
	}

	// ---------- Parchment & Fantasy cover ----------
	function parchmentCSS(intensity: number) {
		const i = Math.max(0, Math.min(1, intensity));
		const a = 0.25 * i,
			b = 0.35 * i;
		return `
      radial-gradient(120% 100% at 10% 0%, rgba(80,60,20,${a}) 0%, rgba(0,0,0,0) 50%),
      radial-gradient(140% 120% at 90% 10%, rgba(60,40,15,${a}) 0%, rgba(0,0,0,0) 55%),
      radial-gradient(140% 130% at 50% 100%, rgba(90,70,30,${b}) 0%, rgba(0,0,0,0) 60%),
      linear-gradient(180deg, rgba(255,245,220,1) 0%, rgba(244,232,200,1) 50%, rgba(236,221,190,1) 100%),
      repeating-linear-gradient(180deg, rgba(0,0,0,${0.03 * i}) 0 1px, transparent 1px 3px)
    `;
	}
	function fancyCoverFallback() {
		return `
      radial-gradient(60% 80% at 20% 20%, rgba(255, 230, 180, .7), rgba(0,0,0,0) 60%),
      radial-gradient(50% 70% at 80% 30%, rgba(255, 210, 140, .6), rgba(0,0,0,0) 60%),
      radial-gradient(120% 140% at 50% 100%, rgba(140, 90, 20, .35), rgba(0,0,0,0) 60%),
      linear-gradient(135deg, #654321 0%, #3b2716 50%, #1c120a 100%)
    `;
	}

	// ---------- Local chroma-key ----------
	function hexToRgb(hex: string): [number, number, number] {
		const s = hex.replace('#', '');
		const n = parseInt(
			s.length === 3
				? s
						.split('')
						.map((c) => c + c)
						.join('')
				: s,
			16
		);
		return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	}
	function loadImage(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const im = new Image();
			im.crossOrigin = 'anonymous';
			im.onload = () => resolve(im);
			im.onerror = reject;
			im.src = src;
		});
	}
	async function chromaKey(dataUrl: string, hex: string, tol: number): Promise<string> {
		const img = await loadImage(dataUrl);
		const canvas = document.createElement('canvas');
		canvas.width = img.width;
		canvas.height = img.height;
		const ctx = canvas.getContext('2d')!;
		ctx.drawImage(img, 0, 0);
		const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const [tr, tg, tb] = hexToRgb(hex);
		const t2 = tol * tol;
		for (let i = 0; i < imgData.data.length; i += 4) {
			const r = imgData.data[i],
				g = imgData.data[i + 1],
				b = imgData.data[i + 2];
			const dr = r - tr,
				dg = g - tg,
				db = b - tb;
			const dist2 = dr * dr + dg * dg + db * db;
			if (dist2 <= t2) imgData.data[i + 3] = 0;
		}
		ctx.putImageData(imgData, 0, 0);
		return canvas.toDataURL('image/png');
	}

	// ---------- IO ----------
	function fileToDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}
	async function tryRemoveBg(dataUrl: string): Promise<string> {
		return await chromaKey(dataUrl, bgColor, tolerance);
	}
	async function handleFile(file: File) {
		const base64 = await fileToDataUrl(file);
		imageDataUrl = base64;
		if (removeBgEnabled && autoRemoveOnAdd) {
			imageDataUrl = await tryRemoveBg(imageDataUrl);
		}
	}
	async function onPickFile(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		await handleFile(file);
	}
	async function onDrop(e: DragEvent) {
		dzHover = false;
		const f = e.dataTransfer?.files?.[0];
		if (f) await handleFile(f);
	}

	async function applyRemovalToPreview() {
		if (!imageDataUrl) return;
		imageDataUrl = await tryRemoveBg(imageDataUrl);
	}

	async function addCard() {
		if (!imageDataUrl || !name.trim() || flying) return;
		if (desc.length > DESC_LIMIT) return;
		flying = true;
		let finalImg = imageDataUrl;
		if (removeBgEnabled && autoRemoveOnAdd) finalImg = await tryRemoveBg(finalImg);

		// flyCardToSheet resolves early (at ~68% of animation) so card appears as ghost lands
		await flyCardToSheet(finalImg);

		cards = [
			...cards,
			{ id: crypto.randomUUID(), name: name.trim(), img: finalImg, desc: desc.trim() || undefined }
		];
		name = '';
		desc = '';
		imageDataUrl = null; // clear drop zone
		flying = false;

		// Sheet landing glow fires in sync with card appearance
		requestAnimationFrame(() => {
			const a4 = document.querySelector<HTMLElement>('.a4');
			if (a4) {
				a4.classList.remove('sheet-land');
				void a4.offsetWidth;
				a4.classList.add('sheet-land');
				a4.addEventListener('animationend', () => a4.classList.remove('sheet-land'), { once: true });
			}
		});
	}

	async function flyCardToSheet(imgSrc: string): Promise<void> {
		if (!previewCardEl || !browser) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		// getBoundingClientRect accounts for the 0.8 scale on CardPreview
		const from = previewCardEl.getBoundingClientRect();
		if (from.width === 0) return;

		// Target: first blank slot = exact future position of this card
		const targetEl =
			document.querySelector<HTMLElement>('.a4 .card.blank-slot') ??
			document.querySelector<HTMLElement>('.a4');
		const to = targetEl?.getBoundingClientRect();
		if (!to) return;

		const dx = to.left - from.left;
		const dy = to.top - from.top;
		// Scale ghost to match the actual card slot size so it "snaps" in place
		const finalScale = to.width / from.width;

		const DURATION = 380;
		const LAND_AT = Math.round(DURATION * 0.6); // resolve here → card appears while ghost fades

		return new Promise((resolve) => {
			const ghost = document.createElement('div');
			Object.assign(ghost.style, {
				position: 'fixed',
				top: `${from.top}px`,
				left: `${from.left}px`,
				width: `${from.width}px`,
				height: `${from.height}px`,
				pointerEvents: 'none',
				zIndex: '9999',
				borderRadius: '3mm',
				overflow: 'hidden',
				willChange: 'transform, opacity',
				boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.35)'
			});
			const img = document.createElement('img');
			img.src = imgSrc;
			Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover', display: 'block' });
			ghost.appendChild(img);
			document.body.appendChild(ghost);

			const anim = ghost.animate(
				[
					{ transform: 'translate(0,0) scale(1) rotate(-4deg)', opacity: 1 },
					{ transform: `translate(${dx}px,${dy}px) scale(${finalScale}) rotate(0deg)`, opacity: 0 }
				],
				{ duration: DURATION, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards' }
			);

			// Resolve early so card is added and starts its own animation
			setTimeout(resolve, LAND_AT);

			const cleanup = () => ghost.remove();
			anim.onfinish = cleanup;
			anim.oncancel = cleanup;
		});
	}
	function removeCard(id: string) {
		cards = cards.filter((c) => c.id !== id);
	}
	function clearAll() {
		cards = [];
	}

	// ---------- PDF export ----------
	async function makePdf() {
		if (!browser || pdfLoading) return;
		pdfLoading = true;
		try { await generatePdf({ cardW, cardH, fitMode }); }
		finally { pdfLoading = false; }
	}

	// ---------- Preview flip ----------
	async function switchPreviewMode(newMode: 'front' | 'back') {
		if (newMode === previewMode) return;
		if (!browser || !pvEl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			previewMode = newMode;
			return;
		}
		const out = pvEl.animate(
			[{ opacity: 1, transform: 'rotateY(0deg)' }, { opacity: 0, transform: 'rotateY(90deg)' }],
			{ duration: 140, easing: 'cubic-bezier(0.55,0,1,0.45)', fill: 'forwards' }
		);
		await out.finished;
		previewMode = newMode;
		await tick();
		pvEl.animate(
			[{ opacity: 0, transform: 'rotateY(-90deg)' }, { opacity: 1, transform: 'rotateY(0deg)' }],
			{ duration: 140, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards' }
		);
	}
</script>

<svelte:head>
	<!-- Alegreya SC for name ribbons -->
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Alegreya+SC:wght@400;700&display=swap"
	/>
</svelte:head>

<!-- ========== UI ========== -->
<TopBar
	bind:name
	bind:desc
	bind:imageDataUrl
	bind:showLayout
	{flying}
	{pdfLoading}
	onMakePdf={makePdf}
	onClearAll={clearAll}
	onToggleLayout={() => (showLayout = !showLayout)}
	onAddCard={addCard}
	onRemoveImage={() => (imageDataUrl = null)}
	onLimitDesc={limitDesc}
	onHandleFile={handleFile}
/>

<!-- WORKSPACE -->

<div class="workspace">
	<!-- Left column: layout controls + printable region -->
	<div class="leftcol" id="print-area">
		{#if showLayout}
			<div transition:slide={{ duration: 280, easing: cubicOut }}>
				<LayoutSettings
					bind:cardW
					bind:cardH
					bind:gap
					bind:cols
					bind:rows
					bind:nameBandHeight
					bind:nameSize
					bind:showCrop
					bind:fitMode
					bind:generateBacks
					bind:useParchment
					bind:parchmentIntensity
					bind:coverUrl
					bind:mookUrl
					bind:removeBgEnabled
					bind:bgColor
					bind:tolerance
					bind:autoRemoveOnAdd
					bind:imageDataUrl
					sheetPaddingX={sheetPadding.padX}
					sheetPaddingY={sheetPadding.padY}
					onApplyRemovalToPreview={applyRemovalToPreview}
				/>
			</div>
		{/if}

		<!-- Printable region follows -->

		<!-- FRONT SHEETS -->
		{#each pagesFront as page, idx (idx)}
			<Sheet
				mode="front"
				cards={page}
				{cardW}
				{cardH}
				{gap}
				{cols}
				{rows}
				{nameBandHeight}
				{nameSize}
				paddingX={sheetPadding.padX}
				paddingY={sheetPadding.padY}
				{showCrop}
				{fitMode}
				{useParchment}
				{parchmentIntensity}
				{mookUrl}
				{coverUrl}
			/>
		{/each}

		<!-- BACK SHEETS -->
		{#if generateBacks && cards.length > 0}
			{#each pagesBack as page, idx (idx)}
				<Sheet
					mode="back"
					cards={page}
					{cardW}
					{cardH}
					{gap}
					{cols}
					{rows}
					{nameBandHeight}
					{nameSize}
					paddingX={sheetPadding.padX}
					paddingY={sheetPadding.padY}
					{showCrop}
					{fitMode}
					{useParchment}
					{parchmentIntensity}
					{mookUrl}
					{coverUrl}
				/>
			{/each}
		{/if}
	</div>

	<aside class="rightcol">
		<div class="preview">
			<div class="head">
				<h3>Live Preview</h3>
				<div class="switch">
					<label>
						<input type="radio" name="pmode" value="front" checked={previewMode === 'front'} on:change={() => switchPreviewMode('front')} />
						<span>Front</span>
					</label>
					<label>
						<input type="radio" name="pmode" value="back" checked={previewMode === 'back'} on:change={() => switchPreviewMode('back')} />
						<span>Back</span>
					</label>
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
					showCrop={false}
					{fitMode}
					{useParchment}
					{parchmentIntensity}
					{mookUrl}
					{coverUrl}
					bind:el={previewCardEl}
				/>
			</div>
			<div class="muted">Preview only — click "Add Card" to save.</div>
		</div>

		<div class="section-header">
			<h2>Cards in project</h2>
			{#key cards.length}
				<span class="count-badge">{cards.length}</span>
			{/key}
		</div>

		<div class="cards-list">
			{#if cards.length === 0}
				<div class="empty-state" in:fly={{ y: 6, duration: 200, easing: cubicOut }}>
					<div class="empty-icon">🃏</div>
					No cards yet — add the first one above.
				</div>
			{/if}

			{#each cards as c (c.id)}
				<div
					class="item"
					in:fly={{ x: 18, duration: 240, easing: cubicOut }}
					out:fly={{ x: 18, duration: 160, easing: cubicOut }}
				>
					<img src={c.img} alt="" class="card-thumb" />
					<div class="meta">
						<div class="title" style="font-family:'Alegreya SC', serif">{c.name}</div>
						<div class="sub">{c.desc ? truncate(c.desc, 72) : 'Back: fantasy cover'}</div>
					</div>
					<button class="btn" on:click={() => removeCard(c.id)}>Remove</button>
				</div>
			{/each}
		</div>
	</aside>
</div>

<!-- Helper tips -->
<div class="tips-wrap noprint">
	<div class="tips">
		<b>Printing tips:</b>
		<ul>
			<li>A4, Margins: None, Scale: 100%.</li>
			<li>Enable Background graphics.</li>
			<li>For fronts+backs: Duplex, Flip on long edge.</li>
		</ul>
	</div>
</div>

<style>
	/* Sheet landing glow */
	:global(.a4.sheet-land) {
		animation: sheetLandGlow 720ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
	}
	@keyframes sheetLandGlow {
		0% {
			box-shadow: 0 10px 36px rgba(0, 0, 0, 0.18);
		}
		22% {
			box-shadow:
				0 10px 36px rgba(0, 0, 0, 0.18),
				0 0 60px 14px rgba(201, 168, 76, 0.28),
				inset 0 0 24px rgba(201, 168, 76, 0.07);
		}
		100% {
			box-shadow: 0 10px 36px rgba(0, 0, 0, 0.18);
		}
	}

	/* Count badge pop on change */
	.count-badge {
		animation: badgePop 340ms cubic-bezier(0.23, 1, 0.32, 1) both;
	}
	@keyframes badgePop {
		from {
			transform: scale(1.55);
			opacity: 0.6;
		}
	}

	/* Hide screen UI during PDF export */
	:root[data-exporting='true'] :global(.topbar),
	:root[data-exporting='true'] .rightcol,
	:root[data-exporting='true'] .tips-wrap,
	:root[data-exporting='true'] :global(.layout-panel) {
		display: none !important;
	}

	/* Hide blank slots during export — keep grid position intact (visibility vs display) */
	:root[data-exporting='true'] :global(.card.blank-slot) {
		visibility: hidden !important;
		border: none !important;
	}

	.tips-wrap {
		margin: 0 auto;
		max-width: 52rem;
		padding: 0 1.5rem 5rem;
	}
	.tips {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 14px 18px;
		font-size: 13px;
		color: var(--text-muted);
	}
	.tips b {
		color: var(--gold);
		font-weight: 600;
	}
	.tips ul {
		margin: 6px 0;
		padding-left: 20px;
		line-height: 1.7;
	}

	@page {
		size: A4;
		margin: 0;
	}
	@media print {
		.noprint {
			display: none !important;
		}
		:global(body) {
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
	}

	.workspace {
		max-width: 1120px;
		margin: 0 auto;
		padding: 16px;
		display: grid;
		grid-template-columns: 1fr 340px;
		gap: 16px;
	}
	@media (max-width: 900px) {
		.workspace {
			grid-template-columns: 1fr;
		}
		.rightcol {
			position: static;
		}
	}
	.leftcol {
		display: grid;
		gap: 16px;
		animation: colEnter 500ms cubic-bezier(0.23, 1, 0.32, 1) both;
	}
	.rightcol {
		position: sticky;
		top: 76px;
		height: fit-content;
		display: flex;
		flex-direction: column;
		gap: 14px;
		animation: colEnter 500ms cubic-bezier(0.23, 1, 0.32, 1) 100ms both;
	}
	@keyframes colEnter {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.leftcol, .rightcol { animation: none; }
	}

	/* Preview panel */
	.preview {
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface);
		padding: 14px;
		box-shadow: var(--shadow-md);
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}
	.head h3 {
		margin: 0;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--gold);
	}
	.switch {
		display: flex;
		gap: 4px;
		background: var(--bg-mid);
		padding: 3px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}
	.switch label {
		display: flex;
		align-items: center;
		cursor: pointer;
	}
	.switch input[type='radio'] {
		display: none;
	}
	.switch label span {
		padding: 4px 12px;
		font-size: 12px;
		font-weight: 500;
		border-radius: 5px;
		color: var(--text-muted);
		transition: all 0.15s;
		cursor: pointer;
		user-select: none;
	}
	.switch input[type='radio']:checked + span {
		background: var(--surface-2);
		color: var(--gold);
		box-shadow: 0 1px 4px rgba(0,0,0,0.3);
	}
	.pv {
		display: flex;
		justify-content: center;
		padding: 8px 0;
	}
	.muted {
		color: var(--text-muted);
		font-size: 12px;
		margin: 4px 0;
	}

	/* Card list section */
	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.section-header h2 {
		margin: 0;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--gold);
	}
	.count-badge {
		background: var(--gold-dim);
		border: 1px solid var(--border-2);
		color: var(--gold);
		font-size: 11px;
		font-weight: 700;
		padding: 2px 9px;
		border-radius: 999px;
	}
	.cards-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.empty-state {
		text-align: center;
		padding: 28px 16px;
		color: var(--text-dim);
		font-size: 13px;
		border: 1px dashed var(--border);
		border-radius: var(--radius-md);
		background: var(--surface);
	}
	.empty-state .empty-icon {
		font-size: 28px;
		margin-bottom: 8px;
		opacity: 0.5;
	}

	.item {
		display: flex;
		gap: 10px;
		align-items: center;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 10px;
		background: var(--surface);
		transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
	}
	.item:hover {
		border-color: var(--border-2);
		background: var(--surface-2);
		box-shadow: var(--shadow-sm);
	}
	.item .meta {
		min-width: 0;
		flex: 1;
	}
	.item .title {
		font-weight: 600;
		font-size: 14px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--text);
	}
	.item .sub {
		color: var(--text-muted);
		font-size: 11px;
		margin-top: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.card-thumb {
		width: 44px;
		height: 60px;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-2);
		flex-shrink: 0;
	}
	.btn {
		border: 1px solid var(--border-2);
		background: transparent;
		color: var(--text-muted);
		border-radius: var(--radius-sm);
		padding: 5px 10px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.15s;
		flex-shrink: 0;
	}
	.btn:hover {
		background: rgba(224,82,82,0.12);
		border-color: rgba(224,82,82,0.4);
		color: #e05252;
	}
	.btn:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}
</style>
