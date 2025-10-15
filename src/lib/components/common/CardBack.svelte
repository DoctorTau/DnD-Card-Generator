<script lang="ts">
	export let c: { id?: string; name?: string; img?: string; desc?: string } = {};
	export let mm = (n: number) => `${n}mm`;
	export let cardW = 63;
	export let cardH = 88;
	export let nameSize = 12;
	export let useParchment = true;
	export let parchmentCSS = (i: number) => '';
	export let coverUrl = '';
	export let mookUrl = '';
	export let fancyCoverFallback = () => '';
</script>

<div class="card" style="width:{mm(cardW)};height:{mm(cardH)};">
	{#if useParchment}<div class="parch" style="background:{parchmentCSS(0.35)};"></div>{/if}

	{#if c.desc && c.desc.length}
		<div class="back">
			<div class="backTitle" style="font-size:{nameSize}pt">{c.name || '(empty)'}</div>
			<div class="hr"></div>
			<div class="desc" style={`font-family: ${mookUrl ? "'Mookmania', serif" : 'serif'}`}>
				{c.desc}
			</div>
		</div>
	{:else}
		<div class="cover-root">
			{#if coverUrl}
				<img class="bg" alt="cover" src={coverUrl} />
			{:else}
				<div class="bg" style="background:{fancyCoverFallback()}"></div>
			{/if}
			<div class="frame"></div>
			<div class="gem"></div>
			<div class="ribbon">
				<div class="title" title={c.name}>{c.name}</div>
			</div>
		</div>
	{/if}
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
	.cover-root {
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
	.ribbon .title {
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
