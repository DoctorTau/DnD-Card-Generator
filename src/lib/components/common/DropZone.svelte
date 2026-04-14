<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	let dzHover = false;
	let fileInput: HTMLInputElement | null = null;

	function onPick(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (f) dispatch('file', { file: f });
	}

	function onDrop(e: DragEvent) {
		dzHover = false;
		const f = e.dataTransfer?.files?.[0];
		if (f) dispatch('file', { file: f });
	}
</script>

<div
	class="dz"
	data-hovering={dzHover}
	on:dragover|preventDefault={() => (dzHover = true)}
	on:dragleave={() => (dzHover = false)}
	on:drop|preventDefault={onDrop}
	on:click={() => fileInput?.click()}
	role="button"
	tabindex="0"
	on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInput?.click()}
	aria-label="Upload image"
>
	<div class="hint">
		<div class="icon">🖼</div>
		<div class="title">Drop image or click to browse</div>
		<div class="sub">PNG · JPEG · WebP — up to 50 MB</div>
	</div>

	<input class="hidden" type="file" accept="image/*" bind:this={fileInput} on:change={onPick} on:click|stopPropagation />
</div>

<style>
	.dz {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 260px;
		min-height: 120px;
		border: 2px dashed var(--border-2);
		border-radius: 14px;
		background: var(--dz-bg);
		cursor: pointer;
		user-select: none;
		transition:
			background 0.15s,
			border-color 0.2s,
			box-shadow 0.2s,
			transform 0.08s;
		position: relative;
		overflow: hidden;
	}
	.dz::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse 70% 60% at 50% 50%, var(--gold-dim) 0%, transparent 70%);
		pointer-events: none;
	}
	.dz:hover {
		background: var(--dz-bg-hover);
		border-color: var(--border-2);
		box-shadow: 0 0 20px var(--gold-dim);
	}
	.dz[data-hovering='true'] {
		background: var(--gold-dim);
		border-color: var(--gold);
		box-shadow: 0 0 30px var(--gold-dim);
		transform: scale(0.999);
	}
	.dz:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}
	.hidden {
		display: none;
	}
	.hint {
		text-align: center;
		padding: 16px;
		position: relative;
	}
	.icon {
		font-size: 28px;
		margin-bottom: 8px;
		opacity: 0.7;
	}
	.hint .title {
		font-size: 13px;
		font-weight: 600;
		color: var(--gold);
		letter-spacing: 0.02em;
	}
	.hint .sub {
		font-size: 11px;
		color: var(--dz-sub);
		margin-top: 3px;
	}
</style>
