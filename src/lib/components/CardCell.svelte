<script context="module" lang="ts">
	export type Card = { id: string; name: string; img: string; desc?: string };
</script>

<script lang="ts">
	import FantasyCover from './FantasyCover.svelte';
	import { parchmentCSS, mm } from '$lib/utils/parchment';

	export let mode: 'front' | 'back';
	export let card: Card;
	export let cardW: number;
	export let cardH: number;
	export let nameBandHeight: number;
	export let nameSize: number;
	export let showCrop: boolean;
	export let fitMode: 'cover' | 'contain';
	export let useParchment: boolean;
	export let parchmentIntensity: number;
	export let mookUrl: string;
	export let coverUrl: string;

	const hasImg = () => Boolean(card?.img);
	const isFront = () => mode === 'front';
</script>

<div class="cell">
	<div class="card" style="width:{mm(cardW)};height:{mm(cardH)};">
		{#if useParchment}
			<div class="parch" style="background:{parchmentCSS(parchmentIntensity)}"></div>
		{/if}

		{#if isFront()}
			{#if hasImg()}
				<img class="art" src={card.img} alt="" style="object-fit:{fitMode}" />
			{/if}
			<div
				class="band"
				style="height:{mm(nameBandHeight)}; background:{hasImg()
					? 'linear-gradient(to top, rgba(0,0,0,.65), rgba(0,0,0,0))'
					: 'rgba(0,0,0,.06)'}"
			>
				<div class="title" style="font-size:{nameSize}pt">{card.name || '(empty)'}</div>
			</div>
		{:else if card.desc && card.desc.length > 0}
			<div class="back">
				<div class="backTitle" style="font-size:{nameSize}pt">{card.name || '(empty)'}</div>
				<div class="hr"></div>
				<div class="desc" style="font-family:{mookUrl ? `'Mookmania', serif` : 'serif'}">
					{card.desc}
				</div>
			</div>
		{:else}
			<FantasyCover {coverUrl} name={card.name} />
		{/if}
	</div>

	{#if showCrop}
		<svg class="crop tl" viewBox="0 0 5 5"
			><line x1="0" y1="1" x2="5" y2="1" /><line x1="1" y1="0" x2="1" y2="5" /></svg
		>
		<svg class="crop tr" viewBox="0 0 5 5"
			><line x1="0" y1="1" x2="5" y2="1" /><line x1="4" y1="0" x2="4" y2="5" /></svg
		>
		<svg class="crop bl" viewBox="0 0 5 5"
			><line x1="0" y1="4" x2="5" y2="4" /><line x1="1" y1="0" x2="1" y2="5" /></svg
		>
		<svg class="crop br" viewBox="0 0 5 5"
			><line x1="0" y1="4" x2="5" y2="4" /><line x1="4" y1="0" x2="4" y2="5" /></svg
		>
	{/if}
</div>

<style>
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
</style>
