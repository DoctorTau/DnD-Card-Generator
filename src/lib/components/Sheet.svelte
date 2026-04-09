<script lang="ts">
	import CardCell, { type Card } from './CardCell.svelte';

	export let mode: 'front' | 'back';
	export let cards: Card[];
	export let cardW: number;
	export let cardH: number;
	export let gap: number;
	export let cols: number;
	export let rows: number;
	export let nameBandHeight: number;
	export let nameSize: number;
	export let paddingX: number;
	export let paddingY: number;
	export let showCrop: boolean;
	export let fitMode: 'cover' | 'contain';
	export let useParchment: boolean;
	export let parchmentIntensity: number;
	export let mookUrl: string;
	export let coverUrl: string;

	const total = () => rows * cols;
	$: filled = cards.slice(0, total());
	$: blanks = Array.from({ length: total() - filled.length }, (_, i) => ({
		id: `blank-${i}`,
		name: '',
		img: '',
		desc: ''
	}));
	$: cells = [...filled, ...blanks];

	function mirrorRows(arr: Card[], cols: number, rows: number): Card[] {
		const total = cols * rows;
		const out = new Array(total) as Card[];
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const src = r * cols + c;
				const dest = r * cols + (cols - 1 - c);
				out[dest] = arr[src];
			}
		}
		return out;
	}

	$: cellsForRender = mode === 'back' ? mirrorRows(cells, cols, rows) : cells;
</script>

<div class="wrap" class:sheet-back={mode === 'back'}>
	<div class="a4">
		<div
			class="grid"
			style="
      padding: {paddingY}mm {paddingX}mm;
      grid-template-columns: repeat({cols}, {cardW}mm);
      grid-template-rows: repeat({rows}, {cardH}mm);
      gap: {gap}mm;
    "
		>
			{#each cellsForRender as card, i}
				<CardCell
					{mode}
					{card}
					{cardW}
					{cardH}
					{nameBandHeight}
					{nameSize}
					{showCrop}
					{fitMode}
					{useParchment}
					{parchmentIntensity}
					{mookUrl}
					{coverUrl}
				/>
			{/each}
		</div>

		<div class="label">A4 210×297mm ({mode.toUpperCase()})</div>
	</div>
</div>

<style>
	.wrap {
		margin-bottom: 32px;
		display: flex;
		justify-content: center;
	}
	.a4 {
		position: relative;
		width: 210mm;
		height: 297mm;
		background: white;
		border: 1px solid var(--border, #e5e7eb);
		border-radius: 12px;
		box-shadow: 0 10px 36px rgba(0, 0, 0, 0.18);
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
		color: var(--sheet-label);
		user-select: none;
	}
</style>
