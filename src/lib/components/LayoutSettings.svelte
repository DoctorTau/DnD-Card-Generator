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
	export let imageDataUrl: string | null = null;
	export let sheetPaddingX = 0;
	export let sheetPaddingY = 0;
	export let onApplyRemovalToPreview: () => void;

	function clamp(v: number, lo: number, hi: number) {
		return Math.min(hi, Math.max(lo, v));
	}
</script>

<div class="layout-panel">
	<div class="layout">
		<NumberField
			label="Card width (mm)"
			value={cardW}
			setValue={(v) => (cardW = clamp(v, 40, 80))}
			min={40}
			max={80}
		/>

		<NumberField
			label="Card height (mm)"
			value={cardH}
			setValue={(v) => (cardH = clamp(v, 60, 110))}
			min={60}
			max={110}
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
			label="Name font size (pt)"
			value={nameSize}
			setValue={(v) => (nameSize = clamp(v, 8, 28))}
			min={8}
			max={28}
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
			<button class="btn" on:click={onApplyRemovalToPreview} disabled={!imageDataUrl}
				>Apply to preview</button
			>
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
	.btn {
		border: 1px solid var(--border-2);
		background: var(--surface);
		color: var(--text);
		border-radius: var(--radius-md);
		padding: 8px 16px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}
	.btn:hover {
		background: var(--surface-2);
		border-color: var(--gold);
	}
	.btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.layout-panel {
		background: var(--surface);
		border: 1px solid var(--border);
		padding: 16px;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		display: block;
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
