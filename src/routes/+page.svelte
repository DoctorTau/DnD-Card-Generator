<script lang="ts">
	import { onMount } from 'svelte';
	import DropZone from '$lib/components/common/DropZone.svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import { browser } from '$app/environment';

	// ---------- Types ----------
	type Card = { id: string; name: string; img: string; desc?: string };

	// ---------- State ----------
	let name = '';
	let desc = '';
	let imageDataUrl: string | null = null;
	let cards: Card[] = [];

	// Layout
	let cardW = 63,
		cardH = 88,
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
		const [{ jsPDF }, html2canvas] = await Promise.all([import('jspdf'), import('html2canvas')]);

		document.documentElement.setAttribute('data-exporting', 'true');
		try {
			const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
			const sheets = Array.from(document.querySelectorAll<HTMLElement>('#print-area .a4'));

			if (!sheets.length) {
				alert('No sheets to export.');
				return;
			}

			for (let i = 0; i < sheets.length; i++) {
				const node = sheets[i];
				const canvas = await html2canvas.default(node, {
					scale: Math.max(2, window.devicePixelRatio || 1),
					useCORS: true,
					backgroundColor: '#ffffff',
					logging: false
				});
				const imgData = canvas.toDataURL('image/jpeg', 0.95);
				if (i > 0) pdf.addPage('a4', 'portrait');
				pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
			}

			pdf.save('dnd-cards.pdf');
		} finally {
			document.documentElement.removeAttribute('data-exporting');
		}
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
<div class="topbar">
	<div class="left">
		<button class="btn" on:click={makePdf}>Make PDF</button>
		<button class="btn ghost" on:click={clearAll}>Clear all</button>
		<button class="btn" on:click={() => (showLayout = !showLayout)}>
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
					<DropZone on:file={(e) => handleFile(e.detail.file)} />
				</div>

				{#if imageDataUrl}
					<div class="thumbRow" style="align-items:center">
						<img
							src={imageDataUrl}
							alt="preview"
							class="card-thumb"
							style="height: 120px;width: 100%;"
						/>
						<button class="btn small ghost" on:click={() => (imageDataUrl = null)}>Remove</button>
					</div>
				{/if}
			</div>
		</label>

		<label class="field">
			<span>Description (back)</span>
			<textarea bind:value={desc} on:input={limitDesc} placeholder="Charges: 3. As an action..."
			></textarea>
			<div class="counter" data-danger={desc.length >= DESC_LIMIT}>
				{desc.length}/{DESC_LIMIT}
				{desc.length >= DESC_LIMIT ? '— limit reached' : ''}
			</div>
		</label>

		<button
			class="btn primary"
			on:click={addCard}
			disabled={!imageDataUrl || !name.trim() || desc.length > DESC_LIMIT}
		>
			Add Card
		</button>
	</div>
</div>

<!-- WORKSPACE -->

<div class="workspace">
	<!-- Left column: layout controls + printable region -->
	<div class="leftcol" id="print-area">
		{#if showLayout}
			<div class="layout-panel">
				<div class="layout">
					<div class="nf">
						<label class="lbl"
							>Card width (mm)
							<input
								type="number"
								value={cardW}
								on:input={(e) => setNum(e, (v) => (cardW = clamp(v, 40, 80)))}
							/>
						</label>
					</div>

					<div class="nf">
						<label class="lbl"
							>Card height (mm)
							<input
								type="number"
								value={cardH}
								on:input={(e) => setNum(e, (v) => (cardH = clamp(v, 60, 110)))}
							/>
						</label>
					</div>
					<div class="nf">
						<label class="lbl"
							>Gap (mm)
							<input
								type="number"
								value={gap}
								on:input={(e) => setNum(e, (v) => (gap = clamp(v, 0, 10)))}
							/>
						</label>
					</div>
					<div class="nf">
						<label class="lbl"
							>Columns
							<input
								type="number"
								value={cols}
								on:input={(e) => setNum(e, (v) => (cols = clamp(v, 1, 4)))}
							/>
						</label>
					</div>
					<div class="nf">
						<label class="lbl"
							>Rows
							<input
								type="number"
								value={rows}
								on:input={(e) => setNum(e, (v) => (rows = clamp(v, 1, 5)))}
							/>
						</label>
					</div>
					<div class="nf">
						<label class="lbl"
							>Name band height (mm)
							<input
								type="number"
								value={nameBandHeight}
								on:input={(e) => setNum(e, (v) => (nameBandHeight = clamp(v, 8, 30)))}
							/>
						</label>
					</div>
					<div class="nf">
						<label class="lbl"
							>Name font size (pt)
							<input
								type="number"
								value={nameSize}
								on:input={(e) => setNum(e, (v) => (nameSize = clamp(v, 8, 28)))}
							/>
						</label>
					</div>

					<label class="check"
						><input type="checkbox" bind:checked={showCrop} /> <span>Crop marks</span></label
					>

					<label class="select">
						<span>Image fit</span>
						<select bind:value={fitMode}
							><option value="cover">Cover</option><option value="contain">Contain</option></select
						>
					</label>

					<label class="check"
						><input type="checkbox" bind:checked={generateBacks} />
						<span>Generate backs</span></label
					>
					<label class="check"
						><input type="checkbox" bind:checked={useParchment} /> <span>Fantasy paper</span></label
					>

					<label class="field"
						><span>Parchment intensity</span><input
							type="range"
							min="0"
							max="1"
							step="0.05"
							bind:value={parchmentIntensity}
						/></label
					>

					<label class="field"
						><span>Cover image URL (optional)</span><input
							bind:value={coverUrl}
							placeholder="https://.../fantasy-cover.png"
						/></label
					>

					<label class="field"
						><span>Mookmania font URL (.woff2)</span><input
							bind:value={mookUrl}
							placeholder="https://.../Mookmania.woff2"
						/></label
					>

					<label class="check"
						><input type="checkbox" bind:checked={removeBgEnabled} />
						<span>Auto remove image background</span></label
					>

					{#if removeBgEnabled}
						<label class="field"
							><span>BG color (for chroma key)</span><input
								type="color"
								bind:value={bgColor}
							/></label
						>
						<div class="nf">
							<label class="lbl"
								>Tolerance (0-255)<input
									type="number"
									value={tolerance}
									on:input={(e) => setNum(e, (v) => (tolerance = clamp(v, 0, 255)))}
								/></label
							>
						</div>
						<button class="btn" on:click={applyRemovalToPreview} disabled={!imageDataUrl}
							>Apply to preview</button
						>
						<label class="check"
							><input type="checkbox" bind:checked={autoRemoveOnAdd} />
							<span>Apply when adding cards</span></label
						>
					{/if}

					<div class="padinfo">
						A4 padding ≈ {sheetPadding.padX.toFixed(1)}mm × {sheetPadding.padY.toFixed(1)}mm
					</div>
				</div>
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

	<!-- Sidebar -->
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
				<div class="preview-wrap" style="width:{cardW}mm;height:{cardH}mm;transform:scale(0.8);">
					{#if previewMode === 'front'}
						<div class="card" style="width:{mm(cardW)};height:{mm(cardH)};">
							{#if useParchment}<div
									class="parch"
									style="background:{parchmentCSS(parchmentIntensity)};"
								></div>{/if}
							{#if previewCard.img}
								<img
									class="art"
									src={previewCard.img}
									alt={previewCard.name || 'Card preview image'}
									style="object-fit:{fitMode}"
								/>
							{/if}
							<div
								class="band"
								style="height:{mm(nameBandHeight)};background:{previewCard.img
									? 'linear-gradient(to top, rgba(0,0,0,.65), rgba(0,0,0,0))'
									: 'rgba(0,0,0,.06)'}"
							>
								<div class="title" style="font-size:{nameSize}pt" title={previewCard.name}>
									{previewCard.name}
								</div>
							</div>
						</div>
					{:else}
						<div class="card" style="width:{mm(cardW)};height:{mm(cardH)};">
							{#if useParchment}<div
									class="parch"
									style="background:{parchmentCSS(parchmentIntensity)};"
								></div>{/if}
							{#if previewCard.desc}
								<div class="back">
									<div class="backTitle" style="font-size:{nameSize}pt">{previewCard.name}</div>
									<div class="hr"></div>
									<div class="desc" style="font-family:{mookUrl ? `'Mookmania', serif` : 'serif'}">
										{previewCard.desc}
									</div>
								</div>
							{:else}
								<div class="cover-root">
									{#if coverUrl}
										<img class="bg" alt="cover" src={coverUrl} />
									{:else}
										<div class="bg" style="background:{fancyCoverFallback()}"></div>
									{/if}
									<div class="frame"></div>
									<div class="gem"></div>
									<div class="ribbon">
										<div class="title" title={previewCard.name}>{previewCard.name}</div>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
			<div class="muted">This is just a preview — the card is added after “Add Card”.</div>
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
	:root {
		color-scheme: light;
	}
	* {
		box-sizing: border-box;
	}
	body {
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

	/* Hide “screen-only” bits while exporting to PDF (html2canvas time) */
	:root[data-exporting='true'] .topbar,
	:root[data-exporting='true'] .rightcol,
	:root[data-exporting='true'] .tips,
	:root[data-exporting='true'] .label {
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
		body {
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
		.a4 {
			box-shadow: none !important;
			border: none !important;
		}
	}

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
	.layout {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: end;
	}
	.grow {
		flex: 1;
	}

	.field,
	.check,
	.select {
		display: flex;
		flex-direction: column;
		font-size: 12px;
	}
	.field input,
	.field textarea,
	.select select {
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
	.check {
		flex-direction: row;
		gap: 8px;
		align-items: center;
	}
	.counter {
		margin-top: 4px;
		color: #64748b;
		font-size: 12px;
	}
	.counter[data-danger='true'] {
		color: #b91c1c;
	}
	.padinfo {
		margin-left: auto;
		font-size: 12px;
		color: #64748b;
	}

	.nf {
		display: flex;
		flex-direction: column;
	}
	.nf .lbl {
		font-size: 12px;
	}
	.nf input {
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 8px 10px;
		font-size: 14px;
		width: 120px;
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

	.layout-panel {
		background: white;
		border: 1px solid #e5e7eb;
		padding: 12px;
		border-radius: 12px;
		box-shadow: 0 6px 14px rgba(0, 0, 0, 0.04);
		display: block;
	}
	.layout-panel .layout {
		gap: 8px;
	}
	.rightcol {
		position: sticky;
		top: 70px;
		height: fit-content;
	}

	.sheet-wrap {
		margin-bottom: 32px;
		display: flex;
		justify-content: center;
	}
	.a4 {
		position: relative;
		width: 210mm;
		height: 297mm;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}
	.grid {
		width: 100%;
		height: 100%;
		display: grid;
	}
	.label {
		position: absolute;
		right: 8px;
		top: 8px;
		font-size: 10px;
		color: #94a3b8;
		user-select: none;
	}

	.cell {
		position: relative;
	}
	.card {
		position: relative;
		border: 1px solid #e5e7eb;
		border-radius: 3mm;
		overflow: hidden;
		background: white;
	}
	.parch {
		position: absolute;
		inset: 0;
	}
	.art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
	.band {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 3mm;
	}
	.title {
		font-family: 'Alegreya SC', serif;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.back {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 3mm;
	}
	.backTitle {
		font-family: 'Alegreya SC', serif;
		line-height: 1.1;
		margin-bottom: 2mm;
		text-align: center;
	}
	.hr {
		width: 100%;
		height: 1px;
		background: #d6d3d1;
		margin-bottom: 2mm;
		opacity: 0.8;
	}
	.desc {
		white-space: pre-wrap;
		font-size: 10pt;
		line-height: 1.3;
		color: #1f2937;
		overflow: hidden;
	}

	.cover-root {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
	}
	.bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.frame {
		position: absolute;
		inset: 3mm;
		border-radius: 3mm;
		box-shadow:
			inset 0 0 0 2px rgba(255, 255, 255, 0.7),
			inset 0 0 0 4px rgba(0, 0, 0, 0.15);
	}
	.gem {
		width: 18mm;
		height: 18mm;
		border-radius: 50%;
		background: radial-gradient(circle at 30% 30%, #fff, #9dd7ff 30%, #1e90ff 70%, #003c8f 100%);
		box-shadow:
			0 4px 10px rgba(0, 0, 0, 0.35),
			inset 0 0 10px rgba(255, 255, 255, 0.6);
	}
	.ribbon {
		position: absolute;
		bottom: 6mm;
		left: 6mm;
		right: 6mm;
		display: flex;
		justify-content: center;
	}
	.ribbon .title {
		padding: 2mm 4mm;
		border-radius: 2mm;
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.2));
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		font-family: 'Alegreya SC', serif;
		font-size: 12pt;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.crop {
		position: absolute;
		width: 5mm;
		height: 5mm;
		stroke: #000;
		stroke-width: 0.3;
		fill: none;
		pointer-events: none;
	}
	.tl {
		left: -1mm;
		top: -1mm;
	}
	.tr {
		right: -1mm;
		top: -1mm;
		transform: scaleX(-1);
	}
	.bl {
		left: -1mm;
		bottom: -1mm;
		transform: scaleY(-1);
	}
	.br {
		right: -1mm;
		bottom: -1mm;
		transform: scale(-1);
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
	.preview-wrap {
		transform-origin: top center;
	}
	.muted {
		color: #64748b;
		font-size: 13px;
		margin: 6px 0;
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

	.dz {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 260px;
		min-height: 120px;
		border: 2px dashed #cbd5e1;
		border-radius: 14px;
		background: #fff;
		cursor: pointer;
		user-select: none;
		transition:
			background 0.15s,
			border-color 0.15s,
			transform 0.08s;
	}
	.dz:hover {
		background: #f8fafc;
	}
	.dz[data-hovering='true'] {
		background: #eef2ff;
		border-color: #6366f1;
		transform: scale(0.998);
	}
	.hidden {
		display: none;
	}
	.hint {
		text-align: center;
		padding: 12px;
	}
	.hint .title {
		font-size: 14px;
		font-weight: 600;
		color: #0f172a;
	}
	.hint .sub {
		font-size: 12px;
		color: #64748b;
		margin-top: 2px;
	}
	.thumbRow {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 8px;
	}
	.tips ul {
		margin: 6px 0;
		padding-left: 18px;
	}
</style>
