<script lang="ts">
	import { onMount } from 'svelte';
	import DropZone from '$lib/components/common/DropZone.svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import LayoutSettings from '$lib/components/LayoutSettings.svelte';
	import CardPreview from '$lib/components/CardPreview.svelte';
	import { browser } from '$app/environment';
	import { generatePdf } from '$lib/utils/pdfExport';

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
		if (!imageDataUrl || !name.trim()) return;
		if (desc.length > DESC_LIMIT) return;
		let finalImg = imageDataUrl;
		if (removeBgEnabled && autoRemoveOnAdd) finalImg = await tryRemoveBg(finalImg);
		cards = [
			...cards,
			{ id: crypto.randomUUID(), name: name.trim(), img: finalImg, desc: desc.trim() || undefined }
		];
		name = '';
		desc = '';
	}
	function removeCard(id: string) {
		cards = cards.filter((c) => c.id !== id);
	}
	function clearAll() {
		cards = [];
	}

	// ---------- PDF export ----------
	async function makePdf() {
		if (!browser) return;
		await generatePdf({ cardW, cardH, fitMode });
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
				<h3>Live preview</h3>
				<div class="switch">
					<label
						><input type="radio" name="pmode" value="front" bind:group={previewMode} /> Front</label
					>
					<label
						><input type="radio" name="pmode" value="back" bind:group={previewMode} /> Back</label
					>
				</div>
			</div>
			<div class="pv">
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
				/>
			</div>
			<div class="muted">This is just a preview — the card is added after "Add Card".</div>
		</div>

		<h2>Cards in project ({cards.length})</h2>
		<p class="muted">Front and back sheets keep the same order for duplex printing.</p>
		{#if cards.length === 0}
			<div class="muted">No cards yet — add the first one.</div>
		{/if}

		{#each cards as c (c.id)}
			<div class="item">
				<img src={c.img} alt="" class="card-thumb" />
				<div class="meta">
					<div class="title" style="font-family:'Alegreya SC', serif">{c.name}</div>
					<div class="sub">{c.desc ? truncate(c.desc, 80) : 'Back: fantasy cover'}</div>
				</div>
				<button class="btn small ghost" on:click={() => removeCard(c.id)}>Remove</button>
			</div>
		{/each}
	</aside>
</div>

<!-- Helper tips -->
<div class="mx auto max-w-3xl px-4 pb-20 noprint">
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
	:global(:root) {
		color-scheme: light;
	}
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		margin: 0;
		font-family:
			system-ui,
			-apple-system,
			Segoe UI,
			Roboto,
			Arial,
			sans-serif;
		background: radial-gradient(120% 100% at 50% -20%, #fff 0%, #f8fafc 60%, #eef2f7 100%);
	}

	/* Hide "screen-only" bits while exporting to PDF (html2canvas time) */
	:root[data-exporting='true'] :global(.topbar),
	:root[data-exporting='true'] .rightcol,
	:root[data-exporting='true'] .tips {
		display: none !important;
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
		/* Constrain layout for frontend to 1100px for simpler rendering */
		max-width: 1100px;
		margin: 0 auto;
		padding: 12px;
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 14px;
	}
	.leftcol {
		display: grid;
		gap: 16px;
	}
	.rightcol {
		position: sticky;
		top: 70px;
		height: fit-content;
	}

	.preview {
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		background: white;
		padding: 10px;
		margin-bottom: 12px;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 6px;
	}
	.switch {
		display: flex;
		gap: 10px;
		font-size: 13px;
	}
	.pv {
		display: flex;
		justify-content: center;
	}
	.muted {
		color: #64748b;
		font-size: 13px;
		margin: 6px 0;
	}
	.card-thumb {
		width: 48px;
		height: 64px;
		object-fit: cover;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.item {
		display: flex;
		gap: 10px;
		align-items: center;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 8px;
		background: white;
		margin-bottom: 8px;
	}
	.item .meta {
		min-width: 0;
		flex: 1;
	}
	.item .title {
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.item .sub {
		color: #94a3b8;
		font-size: 12px;
	}

	.tips ul {
		margin: 6px 0;
		padding-left: 18px;
	}
</style>
