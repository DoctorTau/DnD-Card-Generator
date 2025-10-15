<script lang="ts">
	export let show = true;
</script>

{#if show}
	<svg class="crop tl" viewBox="0 0 5 5"
		><line x1="0" y1="1" x2="5" y2="1" /><line x1="1" y1="0" x2="1" y2="5" /></svg
	>
	<svg class="crop tr" viewBox="0 0 5 5" style="transform: rotate(0deg)">
		<line x1="0" y1="1" x2="5" y2="1" /><line x1="4" y1="0" x2="4" y2="5" /></svg
	>
	<svg class="crop bl" viewBox="0 0 5 5" style="transform: rotate(0deg);"
		><line x1="0" y1="4" x2="5" y2="4" /><line x1="1" y1="0" x2="1" y2="5" /></svg
	>
	<svg class="crop br" viewBox="0 0 5 5" style="transform: rotate(0deg);"
		><line x1="0" y1="4" x2="5" y2="4" /><line x1="4" y1="0" x2="4" y2="5" /></svg
	>
{/if}

<style>
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
