<script lang="ts">
	export let c: { id?: string; name?: string; img?: string; desc?: string } = {};
	export let mm = (n: number) => `${n}mm`;
	export let cardW = 63;
	export let cardH = 88;
	export let nameBandHeight = 16;
	export let nameSize = 12;
	export let fitMode: 'cover' | 'contain' = 'cover';
	export let useParchment = true;
	export let parchmentCSS = (i: number) => '';
</script>

<div class="card" style="width:{mm(cardW)};height:{mm(cardH)};">
	{#if useParchment}<div class="parch" style="background:{parchmentCSS(0.35)};"></div>{/if}
	{#if c.img}<img class="art" alt="" src={c.img} style="object-fit:{fitMode};" />{/if}
	<div
		class="band"
		style="height:{mm(nameBandHeight)};background:{c.img
			? 'linear-gradient(to top, rgba(0,0,0,.65), rgba(0,0,0,0))'
			: 'rgba(0,0,0,.06)'}"
	>
		<div class="title" style="font-size:{nameSize}pt" title={c.name}>{c.name || '(empty)'}</div>
	</div>
</div>

<style>
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
</style>
