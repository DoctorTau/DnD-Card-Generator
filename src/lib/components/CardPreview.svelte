<script lang="ts">
	import CardCell, { type Card } from './CardCell.svelte';
	export let mode: 'front' | 'back';
	export let card: Card;
	export let cardW: number;
	export let cardH: number;
	export let nameBandHeight: number;
	export let nameSize: number;
	export let descSize: number = 10;
	export let showCrop: boolean = false;
	export let fitMode: 'cover' | 'contain';
	export let useParchment: boolean;
	export let parchmentIntensity: number;
	export let mookUrl: string;
	export let coverUrl: string;
	export let orientation: 'portrait' | 'landscape' = 'portrait';
	export let maxW = 220; // px — available preview width
	export let maxH = 300; // px — available preview height
	export let el: HTMLElement | undefined = undefined;

	// Fit the card into the preview column. In landscape we turn the whole
	// card 90° so it reads as a wide card with upright content (as if you
	// physically rotated the printed card), and fit its rotated bounding box.
	const MM_PX = 96 / 25.4;
	$: isLandscape = orientation === 'landscape';
	$: pxW = cardW * MM_PX;
	$: pxH = cardH * MM_PX;
	$: boxW = isLandscape ? pxH : pxW; // bounding box after rotation
	$: boxH = isLandscape ? pxW : pxH;
	$: scale = Math.min(maxW / boxW, maxH / boxH, 1);
	$: rotate = isLandscape ? -90 : 0;
</script>

<div class="outer" style="width:{boxW * scale}px;height:{boxH * scale}px">
	<div
		class="wrap"
		bind:this={el}
		style="width:{cardW}mm;height:{cardH}mm;transform:scale({scale}) rotate({rotate}deg)"
	>
		<CardCell
			{mode}
			{card}
			{cardW}
			{cardH}
			{nameBandHeight}
			{nameSize}
			{descSize}
			{showCrop}
			{fitMode}
			{useParchment}
			{parchmentIntensity}
			{mookUrl}
			{coverUrl}
			{orientation}
		/>
	</div>
</div>

<style>
	.outer {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.wrap {
		flex: none;
		transform-origin: center center;
	}
</style>
