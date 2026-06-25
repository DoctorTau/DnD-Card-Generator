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
	export let descSize: number = 10;
	export let showCrop: boolean;
	export let fitMode: 'cover' | 'contain';
	export let useParchment: boolean;
	export let parchmentIntensity: number;
	export let mookUrl: string;
	export let coverUrl: string;
	export let orientation: 'portrait' | 'landscape' = 'portrait';
	// On a real print sheet, the back must rotate the opposite way (270°) so it
	// aligns with the front after duplex flipping. The dialog preview leaves
	// this false so the back stays upright/readable while editing.
	export let duplexBack = false;

	$: hasImg = Boolean(card?.img && card.img.trim());
	$: isFront = mode === 'front';
	$: isBlank = Boolean(card?.id && card.id.startsWith('blank-'));

	// In landscape, the content frame is rotated 90° inside the (still vertical)
	// card, so its box is sized to the card's height × width before rotating.
	// Use a top-left origin + explicit translate (instead of the 50%/50%
	// centering trick) because html2canvas mis-renders the percentage-translate
	// + rotate combo during PDF export.
	// The duplex back rotates -90° (270°) so it prints correctly on the reverse.
	$: rotateBack = !isFront && duplexBack;
	$: contentStyle =
		orientation === 'landscape'
			? rotateBack
				? `width:${mm(cardH)};height:${mm(cardW)};left:0;top:0;transform-origin:top left;transform:translate(0,${mm(cardH)}) rotate(-90deg);`
				: `width:${mm(cardH)};height:${mm(cardW)};left:0;top:0;transform-origin:top left;transform:translate(${mm(cardW)},0) rotate(90deg);`
			: 'inset:0;';
</script>

<div class="cell">
	<div class="card" class:blank-slot={isBlank} style="width:{mm(cardW)};height:{mm(cardH)};">
		{#if isBlank}
			<div class="blank-placeholder">
				<span class="blank-label">Empty</span>
			</div>
		{:else}
			{#if useParchment}
				<div class="parch" style="background:{parchmentCSS(parchmentIntensity)}"></div>
			{/if}

			<div class="content" style={contentStyle}>
				{#if isFront}
					{#if hasImg}
						<img class="art" src={card.img} alt="" style="object-fit:{fitMode}" />
					{/if}
					<div
						class="band"
						style="height:{mm(nameBandHeight)}; background:{hasImg
							? 'linear-gradient(to top, rgba(0,0,0,.65), rgba(0,0,0,0))'
							: 'rgba(0,0,0,.06)'}"
					>
						<div class="title" style="font-size:{nameSize}pt">{card.name || '(empty)'}</div>
					</div>
				{:else if card.desc && card.desc.length > 0}
					<div class="back">
						<div class="backTitle" style="font-size:{nameSize}pt">{card.name || '(empty)'}</div>
						<div class="hr"></div>
						<div
							class="desc"
							style="font-size:{descSize}pt; font-family:{mookUrl ? `'Mookmania', serif` : 'serif'}"
						>
							{@html card.desc}
						</div>
					</div>
				{:else}
					<FantasyCover {coverUrl} name={card.name} />
				{/if}
			</div>
		{/if}
	</div>
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
	.card:not(.blank-slot) {
		animation: cardReveal 360ms cubic-bezier(0.23, 1, 0.32, 1) both;
	}
	@keyframes cardReveal {
		from {
			opacity: 0;
			transform: scale(0.86) translateY(12px);
		}
	}
	.card.blank-slot {
		border: 1.5px dashed #c4c4c4 !important;
		background: rgba(255, 255, 255, 0.04) !important;
		box-shadow: none !important;
	}
	.blank-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.blank-label {
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #c4c4c4;
		user-select: none;
	}
	.parch {
		position: absolute;
		inset: 0;
	}
	.content {
		position: absolute;
		/* No overflow:hidden here — the rotated frame fills the card exactly and
		   .card already clips to the rounded bounds. html2canvas mis-clips a
		   transformed element that has its own overflow:hidden. */
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
		word-break: break-word;
		overflow-wrap: break-word;
	}
	.desc :global(b), .desc :global(strong) { font-weight: 700; }
	.desc :global(i), .desc :global(em) { font-style: italic; }
	.desc :global(u) { text-decoration: underline; }
	.desc :global(p) { margin: 0 0 0.3em 0; }
	.desc :global(div) { margin: 0; }
</style>
