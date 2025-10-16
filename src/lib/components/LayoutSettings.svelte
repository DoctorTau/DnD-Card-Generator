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
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.layout-panel {
		background: white;
		border: 1px solid #e5e7eb;
		padding: 12px;
		border-radius: 12px;
		box-shadow: 0 6px 14px rgba(0, 0, 0, 0.04);
		display: block;
	}
	.layout {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: end;
	}

	.field,
	.check,
	.select {
		display: flex;
		flex-direction: column;
		font-size: 12px;
	}
	.field input,
	.select select {
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 8px 10px;
		font-size: 14px;
		min-width: 200px;
	}
	.check {
		flex-direction: row;
		gap: 8px;
		align-items: center;
	}

	.padinfo {
		margin-left: auto;
		font-size: 12px;
		color: #64748b;
	}
</style>
