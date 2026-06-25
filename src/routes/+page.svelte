<script lang="ts">
	import { onMount } from 'svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import LayoutSettings from '$lib/components/LayoutSettings.svelte';
	import CardDialog from '$lib/components/CardDialog.svelte';
	import { browser } from '$app/environment';
	import { generatePdf } from '$lib/utils/pdfExport';
	import { fly, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Card } from '$lib/components/CardCell.svelte';

	// ---------- State ----------
	let cards: Card[] = [];

	// Dialog
	let dialogOpen = false;
	let editingCard: Card | null = null;

	// Layout
	let cardW = 63.5,
		cardH = 88.9,
		gap = 3,
		cols = 3,
		rows = 3;
	let showLayout = false;
	let showCrop = true;
	let nameSize = 12; // pt
	let descSize = 10; // pt
	let nameBandHeight = 16; // mm
	let fitMode: 'cover' | 'contain' = 'cover';
	let orientation: 'portrait' | 'landscape' = 'portrait';
	let generateBacks = true;

	// Visuals
	let useParchment = true;
	let parchmentIntensity = 0.35;
	let coverUrl = '';

	// State
	let pdfLoading = false;

	// Fonts
	let mookUrl = '';

	// BG removal (LOCAL chroma-key only)
	let removeBgEnabled = false;
	let bgColor = '#ffffff';
	let tolerance = 32;
	let autoRemoveOnAdd = true;


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

	function paginate<T>(arr: T[], size: number): T[][] {
		const out: T[][] = [];
		for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
		if (out.length === 0) out.push([]);
		return out;
	}
	function truncatePlain(html: string, n: number) {
		const plain = html.replace(/<[^>]*>/g, '');
		return plain.length <= n ? plain : plain.slice(0, n - 1) + '…';
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

	// ---------- Dialog ----------
	function openDialog(cardToEdit: Card | null = null) {
		editingCard = cardToEdit;
		dialogOpen = true;
	}

	function handleDialogSave(saved: Card) {
		dialogOpen = false;
		if (editingCard) {
			cards = cards.map((c) => (c.id === saved.id ? saved : c));
			editingCard = null;
		} else {
			cards = [...cards, saved];
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
		try { await generatePdf({ fitMode }); }
		finally { pdfLoading = false; }
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
	bind:showLayout
	sheetFootnote="a4 210×297mm"
	{pdfLoading}
	onMakePdf={makePdf}
	onClearAll={clearAll}
	onToggleLayout={() => (showLayout = !showLayout)}
	onOpenDialog={() => openDialog(null)}
/>

<CardDialog
	bind:open={dialogOpen}
	card={editingCard}
	{cardW}
	{cardH}
	{nameBandHeight}
	{nameSize}
	{descSize}
	{fitMode}
	{orientation}
	{useParchment}
	{parchmentIntensity}
	{mookUrl}
	{coverUrl}
	{removeBgEnabled}
	{bgColor}
	{tolerance}
	on:save={(e) => handleDialogSave(e.detail)}
	on:cancel={() => { dialogOpen = false; editingCard = null; }}
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
					bind:descSize
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
					bind:orientation
					sheetPaddingX={sheetPadding.padX}
					sheetPaddingY={sheetPadding.padY}
				/>
			</div>
		{/if}

		<!-- Printable region follows -->

		<!-- SHEETS: interleaved front/back so PDF page order is front1,back1,front2,back2,… -->
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
				{descSize}
				paddingX={sheetPadding.padX}
				paddingY={sheetPadding.padY}
				{showCrop}
				{fitMode}
				{useParchment}
				{parchmentIntensity}
				{mookUrl}
				{coverUrl}
				{orientation}
			/>
			{#if generateBacks && cards.length > 0}
				<Sheet
					mode="back"
					cards={pagesBack[idx]}
					{cardW}
					{cardH}
					{gap}
					{cols}
					{rows}
					{nameBandHeight}
					{nameSize}
					{descSize}
					paddingX={sheetPadding.padX}
					paddingY={sheetPadding.padY}
					{showCrop}
					{fitMode}
					{useParchment}
					{parchmentIntensity}
					{mookUrl}
					{coverUrl}
					{orientation}
				/>
			{/if}
		{/each}
	</div>

	<aside class="rightcol">
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
					No cards yet — click "Add Card" to begin.
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
						<div class="sub">{c.desc ? truncatePlain(c.desc, 72) : 'Back: fantasy cover'}</div>
					</div>
					<div class="item-actions">
						<button class="btn-icon edit-btn" title="Edit card" on:click={() => openDialog(c)}>
							<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13l-3 1 1-3 8.5-8.5z"/>
							</svg>
						</button>
						<button class="btn remove-btn" on:click={() => removeCard(c.id)}>Remove</button>
					</div>
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

	/* Freeze card animations during export so html2canvas captures the final state */
	:root[data-exporting='true'] :global(.card) {
		animation: none !important;
		opacity: 1 !important;
		transform: none !important;
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
		top: 100px;
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
		transition: border-color 0.15s, opacity 0.15s;
	}
	.item:hover .card-thumb {
		border-color: rgba(201, 168, 76, 0.5);
		opacity: 1;
	}
	.item-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}
	.btn-icon {
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-muted);
		border-radius: var(--radius-sm);
		width: 30px;
		height: 30px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s;
		padding: 0;
	}
	.btn-icon:hover {
		background: var(--surface-2);
		border-color: var(--gold);
		color: var(--gold);
	}
	.btn-icon:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
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
	.remove-btn:hover {
		background: rgba(224, 82, 82, 0.12);
		border-color: rgba(224, 82, 82, 0.4);
		color: #e05252;
	}
	.btn:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}
</style>
