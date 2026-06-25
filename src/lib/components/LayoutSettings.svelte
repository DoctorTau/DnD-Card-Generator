<script lang="ts">
	import NumberField from './NumberField.svelte';

	// Props
	export let cardW = 63;
	export let cardH = 88;
	export let gap = 3;
	export let cols = 3;
	export let rows = 3;
	export let nameBandHeight = 16;
	export let nameSize = 12;
	export let descSize = 10;
	export let showCrop = true;
	export let fitMode: 'cover' | 'contain' = 'cover';
	export let generateBacks = true;
	export let useParchment = true;
	export let parchmentIntensity = 0.35;
	export let coverUrl = '';
	export let mookUrl = '';
	export let removeBgEnabled = false;
	export let bgColor = '#ffffff';
	export let tolerance = 32;
	export let autoRemoveOnAdd = true;
	export let sheetPaddingX = 0;
	export let sheetPaddingY = 0;
	export let orientation: 'portrait' | 'landscape' = 'portrait';

	function clamp(v: number, lo: number, hi: number) {
		return Math.min(hi, Math.max(lo, v));
	}

	// Standard poker-card aspect (width / height in portrait).
	const POKER = 63.5 / 88.9;
	const A4W = 210;
	const A4H = 297;
	const MARGIN = 6.5; // mm outer margin, kept consistent across grids

	$: gridPreset = cols === 2 && rows === 2 ? '2x2' : cols === 3 && rows === 3 ? '3x3' : 'custom';

	// Resize the cards to fill the A4 page for the given grid/orientation,
	// preserving the poker-card aspect so the margins stay symmetric.
	function fitCards(c = cols, r = rows, g = gap) {
		const aspect = POKER; // width / height — cards stay vertical on the page
		const availW = A4W - 2 * MARGIN - (c - 1) * g;
		const availH = A4H - 2 * MARGIN - (r - 1) * g;
		const w = Math.min(availW / c, (availH / r) * aspect);
		cardW = Math.round(w * 10) / 10;
		cardH = Math.round((w / aspect) * 10) / 10;
	}

	function setGrid(c: number, r: number) {
		cols = c;
		rows = r;
		fitCards(c, r);
	}

	function setOrientation(o: 'portrait' | 'landscape') {
		orientation = o;
	}
</script>

<div class="layout-panel">
	<div class="presets">
		<div class="seg-group">
			<span class="seg-label">Grid</span>
			<div class="seg" role="group" aria-label="Grid layout">
				<button
					type="button"
					class:active={gridPreset === '2x2'}
					on:click={() => setGrid(2, 2)}>2 × 2</button
				>
				<button
					type="button"
					class:active={gridPreset === '3x3'}
					on:click={() => setGrid(3, 3)}>3 × 3</button
				>
			</div>
		</div>

		<div class="seg-group">
			<span class="seg-label">Orientation</span>
			<div class="seg" role="group" aria-label="Card orientation">
				<button
					type="button"
					class:active={orientation === 'portrait'}
					on:click={() => setOrientation('portrait')}>Portrait</button
				>
				<button
					type="button"
					class:active={orientation === 'landscape'}
					on:click={() => setOrientation('landscape')}>Landscape</button
				>
			</div>
		</div>
	</div>

	<div class="layout">
		<NumberField
			label="Card width (mm)"
			value={cardW}
			setValue={(v) => (cardW = clamp(v, 40, 180))}
			min={40}
			max={180}
		/>

		<NumberField
			label="Card height (mm)"
			value={cardH}
			setValue={(v) => (cardH = clamp(v, 60, 180))}
			min={60}
			max={180}
		/>

		<NumberField
			label="Gap (mm)"
			value={gap}
			setValue={(v) => (gap = clamp(v, 0, 10))}
			min={0}
			max={10}
		/>

		<NumberField
			label="Columns"
			value={cols}
			setValue={(v) => (cols = clamp(v, 1, 4))}
			min={1}
			max={4}
		/>

		<NumberField
			label="Rows"
			value={rows}
			setValue={(v) => (rows = clamp(v, 1, 5))}
			min={1}
			max={5}
		/>

		<NumberField
			label="Name band height (mm)"
			value={nameBandHeight}
			setValue={(v) => (nameBandHeight = clamp(v, 8, 30))}
			min={8}
			max={30}
		/>

		<NumberField
			label="Title size (pt)"
			value={nameSize}
			setValue={(v) => (nameSize = clamp(v, 6, 36))}
			min={6}
			max={36}
		/>

		<NumberField
			label="Description size (pt)"
			value={descSize}
			setValue={(v) => (descSize = clamp(v, 5, 24))}
			min={5}
			max={24}
		/>

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
				><span>BG color (for chroma key)</span><input type="color" bind:value={bgColor} /></label
			>
			<NumberField
				label="Tolerance (0-255)"
				value={tolerance}
				setValue={(v) => (tolerance = clamp(v, 0, 255))}
				min={0}
				max={255}
			/>
			<label class="check"
				><input type="checkbox" bind:checked={autoRemoveOnAdd} />
				<span>Apply when adding cards</span></label
			>
		{/if}

		<div class="padinfo">
			A4 padding ≈ {sheetPaddingX.toFixed(1)}mm × {sheetPaddingY.toFixed(1)}mm
		</div>
	</div>
</div>

<style>
	.layout-panel {
		background: var(--surface);
		border: 1px solid var(--border);
		padding: 16px;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		display: block;
	}
	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		padding-bottom: 14px;
		margin-bottom: 14px;
		border-bottom: 1px solid var(--border);
	}
	.seg-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.seg-label {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
	}
	.seg {
		display: inline-flex;
		border: 1px solid var(--border-2);
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: var(--bg-mid);
	}
	.seg button {
		appearance: none;
		border: none;
		background: transparent;
		color: var(--text-muted);
		padding: 8px 16px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}
	.seg button + button {
		border-left: 1px solid var(--border-2);
	}
	.seg button:hover {
		color: var(--text);
		background: var(--surface-2);
	}
	.seg button.active {
		background: var(--gold-dim);
		color: var(--gold);
		font-weight: 600;
	}
	.seg button:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: -2px;
	}

	.layout {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: end;
	}

	.field,
	.check,
	.select {
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
	.select select {
		border: 1px solid var(--border-2);
		border-radius: var(--radius-sm);
		padding: 8px 12px;
		font-size: 13px;
		min-width: 190px;
		background: var(--bg-mid);
		color: var(--text);
		font-weight: 400;
		letter-spacing: 0;
		text-transform: none;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.field input:focus,
	.select select:focus {
		outline: none;
		border-color: var(--gold);
		box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
	}
	.field input[type='range'] {
		min-width: 160px;
		accent-color: var(--gold);
		padding: 4px 0;
		background: transparent;
		border: none;
		box-shadow: none;
	}
	.field input[type='color'] {
		min-width: 60px;
		height: 36px;
		padding: 2px;
		cursor: pointer;
	}
	.select select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23c9a84c' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 10px center;
		padding-right: 28px;
		cursor: pointer;
	}
	.check {
		flex-direction: row;
		gap: 8px;
		align-items: center;
		text-transform: none;
		letter-spacing: 0;
		font-size: 13px;
		font-weight: 400;
		color: var(--text);
		cursor: pointer;
	}
	.check input[type='checkbox'] {
		accent-color: var(--gold);
		width: 15px;
		height: 15px;
		cursor: pointer;
	}

	.padinfo {
		margin-left: auto;
		font-size: 11px;
		color: var(--text-dim);
		letter-spacing: 0;
		font-weight: 400;
		text-transform: none;
	}
</style>
