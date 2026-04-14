<script lang="ts">
	import CardCell, { type Card } from './CardCell.svelte';
	export let mode: 'front' | 'back';
	export let card: Card;
	export let cardW: number;
	export let cardH: number;
	export let nameBandHeight: number;
	export let nameSize: number;
	export let showCrop: boolean = false;
	export let fitMode: 'cover' | 'contain';
	export let useParchment: boolean;
	export let parchmentIntensity: number;
	export let mookUrl: string;
	export let coverUrl: string;
	export let el: HTMLElement | undefined = undefined;

	const scale = 0.8;
</script>

<div class="wrap" bind:this={el} style="width:{cardW}mm;height:{cardH}mm;transform:scale({scale})">
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
</div>

<style>
	.wrap {
		transform-origin: top center;
	}
</style>
