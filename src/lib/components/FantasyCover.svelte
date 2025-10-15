<script lang="ts">
	import { fancyCoverFallback } from '$lib/utils/parchment';
	export let name: string;
	export let coverUrl: string;
</script>

<div class="root">
	{#if coverUrl}
		<img src={coverUrl} alt="cover" class="bg" />
	{:else}
		<div class="bg" style="background:{fancyCoverFallback()}"></div>
	{/if}

	<div class="frame"></div>
	<div class="gem"></div>

	<div class="ribbon">
		<div class="title" title={name}>{name}</div>
	</div>
</div>

<style>
	.root {
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
	.title {
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
</style>
